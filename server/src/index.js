import http from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createLimiter } from './rateLimit.js';
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
import profileRoutes from './routes/profile.js';
import attendanceRoutes from './routes/attendance.js';
import emailRoutes from './routes/email.js';
import auditRoutes from './routes/audit.js';
import searchRoutes from './routes/search.js';
import drawingsRoutes from './routes/drawings.js';
import { notifyUsers } from './notifications.js';
import { startTaskDeadlineReminderScheduler } from './taskReminders.js';

const app = express();
const server = http.createServer(app);
const allowedOrigins = config.frontendOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
if (!config.production) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost', 'capacitor://localhost', 'ionic://localhost');
}
function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== 'https:') return false;
    // Preview origins are opt-in so a wildcard project pattern cannot be abused.
    if (config.allowVercelPreviews) {
      if (hostname === 'ledgeroofing.vercel.app') return true;
      if (hostname.startsWith('ledgeroofing-') && hostname.endsWith('-kingfortes-projects.vercel.app')) return true;
    }
  } catch {}
  return false;
}
const io = new SocketServer(server, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.warn('Socket CORS rejected origin:', origin);
      callback(new Error('Origin is not allowed.'));
    },
    credentials: true,
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 20000,
  pingInterval: 25000,
});

app.set('trust proxy', 1);
app.set('io', io);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn('CORS rejected origin:', origin);
    callback(null, false);
  },
  credentials: true,
}));
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ error: 'Request origin is not allowed.' });
  const origin = req.get('origin');
  if (origin && !isAllowedOrigin(origin)) return res.status(403).json({ error: 'Request origin is not allowed.' });
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(publicUploadPath, { maxAge: '7d', immutable: true, dotfiles: 'deny' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', createLimiter('api', { windowMs: 15 * 60 * 1000, limit: 800 }));
app.use('/api/auth/login', createLimiter('login', { windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true }));
app.use('/api/auth/refresh', createLimiter('refresh', { windowMs: 15 * 60 * 1000, limit: 30 }));
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/workspace/tasks', taskRoutes);
app.use('/api/workspace/meetings', meetingRoutes);
app.use('/api/workspace/notifications', notificationRoutes);
app.use('/api/workspace/profile', profileRoutes);
app.use('/api/workspace/attendance', attendanceRoutes);
app.use('/api/workspace/email', emailRoutes);
app.use('/api/workspace/audit', auditRoutes);
app.use('/api/workspace/search', searchRoutes);
app.use('/api/workspace/drawings', drawingsRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/uploads', createLimiter('uploads', { windowMs: 15 * 60 * 1000, limit: 60 }), uploadRoutes);
app.use('/api/contact', contactRoutes);

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (config.production) console.error('Request failed:', error?.message || 'Unknown error');
  else console.error(error);
  const status = Number(error.status) || 500;
  if (status >= 500) return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  res.status(status).json({ error: String(error.message || 'Request failed.').slice(0, 300) });
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
    if (!isAllowedOrigin(origin)) { console.warn('Socket auth rejected origin:', origin); return next(new Error('Origin is not allowed.')); }
    const token = parseCookies(socket.handshake.headers.cookie)[COOKIE_NAME];
    if (token) {
      const session = getUserFromToken(token);
      const { rows } = await query(
        'SELECT id, name, role, avatar_url, active, must_change_password, session_version FROM staff_users WHERE id = $1',
        [session.sub]
      );
      const user = rows[0];
      if (!user || !user.active) return next(new Error('Staff account is inactive.'));
      if (Number(session.ver || 0) !== Number(user.session_version || 0)) return next(new Error('Session expired. Sign in again.'));
      if (!session.sid) return next(new Error('Session expired. Sign in again.'));
      const { rows: sessions } = await query(
        'SELECT id FROM refresh_tokens WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL AND expires_at > NOW()',
        [session.sid, user.id]
      );
      if (!sessions[0]) return next(new Error('Session expired. Sign in again.'));
      if (user.must_change_password) return next(new Error('Change your password to continue.'));
      socket.user = {
        ...user,
        isGuest: false,
        platform: ['android', 'ios', 'web'].includes(socket.handshake.auth?.platform) ? socket.handshake.auth.platform : 'web',
        avatarUrl: user.avatar_url ? `/api/workspace/profile/avatar/${user.id}` : null,
      };
      return next();
    }

    const guestToken = String(socket.handshake.auth?.guestToken || '');
    const guestName = String(socket.handshake.auth?.guestName || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const guestRole = String(socket.handshake.auth?.guestRole || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (!guestToken || !guestName) return next(new Error('Sign in required.'));
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guestToken)) {
      return next(new Error('Invalid meeting link.'));
    }
    const { rows } = await query('SELECT id, guest_access, status, guest_expires_at FROM meetings WHERE guest_token = $1', [guestToken]);
    const meeting = rows[0];
    if (!meeting || !meeting.guest_access || ['ended', 'cancelled'].includes(meeting.status) || (meeting.guest_expires_at && new Date(meeting.guest_expires_at).getTime() < Date.now())) {
      return next(new Error('This meeting link is not available.'));
    }
    socket.user = {
      id: `guest:${randomUUID()}`,
      name: guestName,
      role: 'guest',
      guestRole: guestRole || 'Guest',
      guestToken,
      meetingId: meeting.id,
      isGuest: true,
      avatarUrl: null,
    };
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
    if (!socket.user.isGuest) {
      await query('UPDATE meeting_members SET left_at = NOW() WHERE meeting_id = $1 AND user_id = $2', [meetingId, socket.user.id]);
    }
  }
  if (participants && !participants.size) meetingParticipants.delete(meetingId);
}

io.on('connection', (socket) => {
  const { id, name } = socket.user;
  socket.data.meetingIds = new Set();
  if (!socket.user.isGuest) {
    socket.join(`user:${id}`);
    online.set(id, { name, sockets: (online.get(id)?.sockets || 0) + 1 });
    socket.emit('presence:list', [...online.entries()].map(([userId, presence]) => ({ userId, name: presence.name, online: true })));
    io.emit('presence:update', { userId: id, name, online: true });
  }

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
      if (socket.user.isGuest) {
        if (socket.user.meetingId !== meetingId) return callback({ error: 'This meeting link is not valid for that meeting.' });
        const { rows } = await query(
          `SELECT id, status, guest_access, guest_expires_at FROM meetings WHERE id = $1 AND status IN ('scheduled', 'active')`,
          [meetingId]
        );
        if (!rows[0] || !rows[0].guest_access) return callback({ error: 'This meeting link is not available.' });
        if (rows[0].guest_expires_at && new Date(rows[0].guest_expires_at).getTime() < Date.now()) return callback({ error: 'This meeting link has expired.' });
      } else {
        const { rows } = await query(
          `SELECT m.id, m.status FROM meetings m
           JOIN meeting_members mm ON mm.meeting_id = m.id
           WHERE m.id = $1 AND mm.user_id = $2 AND m.status IN ('scheduled', 'active')`,
          [meetingId, id]
        );
        if (!rows[0]) return callback({ error: 'Meeting not found or you are not invited.' });
      }

      let participants = meetingParticipants.get(meetingId);
      if (!participants) {
        participants = new Map();
        meetingParticipants.set(meetingId, participants);
      }
      const existing = participants.get(id);
      const isNewParticipant = !existing;
      const maxParticipants = 30;
      if (isNewParticipant && participants.size >= maxParticipants) {
        console.warn(`Meeting full: ${meetingId} has ${participants.size} participants, rejecting ${id}`);
        return callback({ error: 'This meeting is full (30 people max).' });
      }
      const peers = [...participants.entries()]
        .filter(([userId, peer]) => userId !== id && peer.sockets.size > 0)
        .map(([userId, peer]) => ({ userId, name: peer.name, avatarUrl: peer.avatarUrl || null, cameraOff: peer.cameraOff === true, isGuest: peer.isGuest === true, guestRole: peer.guestRole || '' }));
      const participant = existing || { name, avatarUrl: socket.user.avatarUrl || null, cameraOff: false, sockets: new Set(), isGuest: socket.user.isGuest === true, guestRole: socket.user.guestRole || '' };
      participant.name = name;
      participant.avatarUrl = socket.user.avatarUrl || null;
      participant.isGuest = socket.user.isGuest === true;
      participant.guestRole = socket.user.guestRole || '';
      participant.sockets.add(socket.id);
      participants.set(id, participant);
      socket.data.meetingIds.add(meetingId);
      await socket.join(`meeting:${meetingId}`);

      // Respond immediately so clients see each other fast; persist DB state in background.
      socket.to(`meeting:${meetingId}`).emit('meeting:peer-joined', { userId: id, name, avatarUrl: socket.user.avatarUrl || null, cameraOff: participant.cameraOff === true, isGuest: participant.isGuest === true, guestRole: participant.guestRole || '' });
      callback({ ok: true, peers });

      void (async () => {
        try {
          if (!socket.user.isGuest) {
            await query(
              `UPDATE meeting_members SET joined_at = COALESCE(joined_at, NOW()), left_at = NULL
               WHERE meeting_id = $1 AND user_id = $2`,
              [meetingId, id]
            );
          }
          const activated = await query("UPDATE meetings SET status = 'active', updated_at = NOW() WHERE id = $1 AND status = 'scheduled' RETURNING id", [meetingId]);
          if (activated.rowCount > 0) io.emit('meeting:updated', { meetingId });
        } catch (bgError) {
          console.error('Meeting join background update failed:', bgError.message);
        }
      })();
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
      io.to(targetSocketId).emit('meeting:signal', { meetingId, from: { userId: id, name, avatarUrl: socket.user.avatarUrl || null, isGuest: socket.user.isGuest === true, guestRole: socket.user.guestRole || '' }, signal });
    }
    callback({ ok: true });
  });

  socket.on('meeting:screen-share', (payload) => {
    const meetingId = payload?.meetingId;
    if (typeof meetingId !== 'string' || !socket.data.meetingIds?.has(meetingId)) return;
    socket.to(`meeting:${meetingId}`).emit('meeting:screen-share', { userId: id, sharing: payload.sharing === true });
  });

  socket.on('meeting:camera-state', (payload) => {
    const meetingId = payload?.meetingId;
    if (typeof meetingId !== 'string' || !socket.data.meetingIds?.has(meetingId)) return;
    const participant = meetingParticipants.get(meetingId)?.get(id);
    if (participant) participant.cameraOff = payload.cameraOff === true;
    socket.to(`meeting:${meetingId}`).emit('meeting:camera-state', { userId: id, cameraOff: payload.cameraOff === true });
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
      const { rows: conversationRows } = await query('SELECT type, name FROM conversations WHERE id = $1', [payload.conversationId]);
      const conversation = conversationRows[0];
      if (!conversation) return callback({ error: 'Conversation not found.' });
      const message = await createMessage({ conversationId: payload.conversationId, senderId: id, body });
      io.to(`conversation:${payload.conversationId}`).emit('message:new', message);
      const { rows: recipients } = await query(
        `SELECT DISTINCT m.user_id FROM conversation_members m
         JOIN staff_users u ON u.id = m.user_id
         WHERE m.conversation_id = $1 AND m.user_id <> $2 AND u.active = TRUE`,
        [payload.conversationId, id]
      );
      void notifyUsers(io, recipients.map((row) => row.user_id), {
        kind: 'new_message',
        title: conversation.type === 'dm' ? `Direct message from ${name}` : `New message in #${conversation.name}`,
        body: `${name}: ${body.slice(0, 180)}`,
        href: `/staff/messages/${payload.conversationId}`,
        email: conversation.type === 'dm',
      }).catch((error) => console.error('Message notifications failed:', error.message));
      callback({ ok: true, message });
    } catch (error) {
      console.error(error);
      callback({ error: 'Message could not be sent.' });
    }
  });

  socket.on('disconnect', async () => {
    for (const meetingId of socket.data.meetingIds || []) {
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

server.listen(config.port, '127.0.0.1', () => {
  console.log(`Ledge Roofing API listening on 127.0.0.1:${config.port}`);
  startTaskDeadlineReminderScheduler(io);
});

async function shutdown() {
  io.close();
  server.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
