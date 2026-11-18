import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { Server as SocketServer } from 'socket.io';
import { config } from './config.js';
import { pool, query } from './db.js';
import { COOKIE_NAME, getUserFromToken } from './auth.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import workspaceRoutes, { canReadConversation, createMessage } from './routes/workspace.js';
import uploadRoutes, { publicUploadPath } from './routes/uploads.js';

const app = express();
const server = http.createServer(app);
const allowedOrigins = config.frontendOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
const io = new SocketServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
  maxHttpBufferSize: 1e6,
});

app.set('trust proxy', 1);
app.set('io', io);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
}));
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Request origin is not allowed.' });
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(publicUploadPath, { maxAge: '7d', immutable: true, dotfiles: 'deny' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/uploads', uploadRoutes);

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  console.error(error);
  const status = Number(error.status) || 500;
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : error.message });
});

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

io.use(async (socket, next) => {
  try {
    const origin = socket.handshake.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) return next(new Error('Origin is not allowed.'));
    const token = parseCookies(socket.handshake.headers.cookie)[COOKIE_NAME];
    if (!token) return next(new Error('Sign in required.'));
    const session = getUserFromToken(token);
    const { rows } = await query('SELECT id, name, role FROM staff_users WHERE id = $1 AND active = TRUE', [session.sub]);
    if (!rows[0]) return next(new Error('Staff account is inactive.'));
    socket.user = rows[0];
    next();
  } catch {
    next(new Error('Session expired. Sign in again.'));
  }
});

const online = new Map();
io.on('connection', (socket) => {
  const { id, name } = socket.user;
  online.set(id, { name, sockets: (online.get(id)?.sockets || 0) + 1 });
  socket.emit('presence:list', [...online.entries()].map(([userId, presence]) => ({ userId, name: presence.name, online: true })));
  io.emit('presence:update', { userId: id, name, online: true });

  socket.on('conversation:join', async (conversationId, callback = () => {}) => {
    try {
      if (typeof conversationId !== 'string' || !(await canReadConversation(conversationId, id))) {
        return callback({ error: 'You are not a member of this conversation.' });
      }
      socket.join(`conversation:${conversationId}`);
      callback({ ok: true });
    } catch {
      callback({ error: 'Could not join that conversation.' });
    }
  });

  socket.on('typing:start', async (conversationId) => {
    if (typeof conversationId === 'string' && await canReadConversation(conversationId, id)) {
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId: id, name, typing: true });
    }
  });
  socket.on('typing:stop', async (conversationId) => {
    if (typeof conversationId === 'string' && await canReadConversation(conversationId, id)) {
      socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId: id, name, typing: false });
    }
  });

  socket.on('message:send', async (payload, callback = () => {}) => {
    try {
      if (!payload || typeof payload.conversationId !== 'string' || !(await canReadConversation(payload.conversationId, id))) {
        return callback({ error: 'You are not a member of this conversation.' });
      }
      const body = String(payload.body || '').trim();
      if (!body || body.length > 10000) return callback({ error: 'Message must be between 1 and 10,000 characters.' });
      const message = await createMessage({ conversationId: payload.conversationId, senderId: id, body });
      io.to(`conversation:${payload.conversationId}`).emit('message:new', message);
      callback({ ok: true, message });
    } catch (error) {
      console.error(error);
      callback({ error: 'Message could not be sent.' });
    }
  });

  socket.on('disconnect', async () => {
    const current = online.get(id);
    if (!current) return;
    if (current.sockets > 1) {
      online.set(id, { ...current, sockets: current.sockets - 1 });
      return;
    }
    online.delete(id);
    io.emit('presence:update', { userId: id, name, online: false });
    try {
      await query('UPDATE staff_users SET last_seen_at = NOW() WHERE id = $1', [id]);
    } catch (error) {
      console.error(error);
    }
  });
});

fs.mkdirSync(uploadPath, { recursive: true });
server.listen(config.port, () => console.log(`Ledge Roofing API listening on port ${config.port}`));

async function shutdown() {
  io.close();
  server.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
