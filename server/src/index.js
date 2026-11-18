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
import contactRoutes from './routes/contact.js';
import taskRoutes from './routes/tasks.js';
import meetingRoutes from './routes/meetings.js';
import notificationRoutes from './routes/notifications.js';

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
app.use('/api/workspace/tasks', taskRoutes);
app.use('/api/workspace/meetings', meetingRoutes);
app.use('/api/workspace/notifications', notificationRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/contact', contactRoutes);

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
const meetingParticipants = new Map();

async function leaveMeeting(socket, meetingId) {
  const participants = meetingParticipants.get(meetingId);
  const participant = participants?.get(socket.user.id);
  if (!participant?.sockets.has(socket.id)) return;
  participant.sockets.delete(socket.id);
  socket.data.meetingIds?.delete(meetingId);
  await socket.leave(`meeting:${meetingId}`);
  if (participant.sockets.size === 0) {
    participants.delete(socket.user.id);
    socket.to(`meeting:${meetingId}`).emit('meeting:peer-left', { userId: socket.user.id });
    await query('UPDATE meeting_members SET left_at = NOW() WHERE meeting_id = $1 AND user_id = $2', [meetingId, socket.user.id]);
  }
  if (!participants.size) meetingParticipants.delete(meetingId);
}

io.on('connection', (socket) => {
  const { id, name } = socket.user;
  socket.data.meetingIds = new Set();
  socket.join(`user:${id}`);
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

  socket.on('meeting:join', async (payload, callback = () => {}) => {
    const meetingId = typeof payload === 'string' ? payload : payload?.meetingId;
    if (typeof meetingId !== 'string') return callback({ error: 'Invalid meeting.' });
    try {
      const { rows } = await query(
        `SELECT m.id, m.status FROM meetings m
         JOIN meeting_members mm ON mm.meeting_id = m.id
         WHERE m.id = $1 AND mm.user_id = $2 AND m.status IN ('scheduled', 'active')`,
        [meetingId, id]
      );
      if (!rows[0]) return callback({ error: 'Meeting not found or you are not invited.' });
      let participants = meetingParticipants.get(meetingId);
      if (!participants) {
        participants = new Map();
        meetingParticipants.set(meetingId, participants);
      }
      const existing = participants.get(id);
      const isNewParticipant = !existing;
      if (isNewParticipant && participants.size >= 6) return callback({ error: 'This meeting is full.' });
      const peers = [...participants.entries()]
        .filter(([userId, peer]) => userId !== id && peer.sockets.size > 0)
        .map(([userId, peer]) => ({ userId, name: peer.name }));
      const participant = existing || { name, sockets: new Set() };
      participant.sockets.add(socket.id);
      participants.set(id, participant);
      socket.data.meetingIds.add(meetingId);
      await socket.join(`meeting:${meetingId}`);
      await query(
        `UPDATE meeting_members SET joined_at = COALESCE(joined_at, NOW()), left_at = NULL
         WHERE meeting_id = $1 AND user_id = $2`,
        [meetingId, id]
      );
      await query("UPDATE meetings SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'scheduled'", [meetingId]);
      if (isNewParticipant) socket.to(`meeting:${meetingId}`).emit('meeting:peer-joined', { userId: id, name });
      callback({ ok: true, peers });
    } catch (error) {
      console.error('Meeting join failed:', error.message);
      callback({ error: 'Could not join this meeting.' });
    }
  });

  socket.on('meeting:signal', (payload, callback = () => {}) => {
    const { meetingId, targetUserId, signal } = payload || {};
    if (typeof meetingId !== 'string' || typeof targetUserId !== 'string' || !signal || !['offer', 'answer', 'candidate'].includes(signal.type)) {
      return callback({ error: 'Invalid call signal.' });
    }
    if (!socket.data.meetingIds?.has(meetingId)) return callback({ error: 'Join the meeting before sending call signals.' });
    const target = meetingParticipants.get(meetingId)?.get(targetUserId);
    if (!target?.sockets.size) return callback({ error: 'That participant is no longer in the meeting.' });
    for (const targetSocketId of target.sockets) {
      io.to(targetSocketId).emit('meeting:signal', { meetingId, from: { userId: id, name }, signal });
    }
    callback({ ok: true });
  });

  socket.on('meeting:leave', async (meetingId) => {
    if (typeof meetingId === 'string') {
      try { await leaveMeeting(socket, meetingId); } catch (error) { console.error('Meeting leave failed:', error.message); }
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
    for (const meetingId of [...(socket.data.meetingIds || [])]) {
      try { await leaveMeeting(socket, meetingId); } catch (error) { console.error('Meeting disconnect cleanup failed:', error.message); }
    }
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

server.listen(config.port, '127.0.0.1', () => console.log(`Ledge Roofing API listening on 127.0.0.1:${config.port}`));

async function shutdown() {
  io.close();
  server.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
