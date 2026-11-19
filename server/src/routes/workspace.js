import { Router } from 'express';
import { query, pool } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { privateUploadPath } from './uploads.js';
import { sendStaffInvite } from '../notifications.js';

const router = Router();

async function canReadConversation(conversationId, userId) {
  const { rows } = await query(
    `SELECT c.id FROM conversations c
     LEFT JOIN conversation_members m ON m.conversation_id = c.id AND m.user_id = $2
     WHERE c.id = $1 AND (m.user_id IS NOT NULL OR (c.type = 'channel' AND c.is_private = FALSE))`,
    [conversationId, userId]
  );
  return Boolean(rows[0]);
}

export async function createMessage({ conversationId, senderId, body, files = [], replyToId = null }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, body, reply_to_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, conversation_id, sender_id, body, reply_to_id, created_at, edited_at`,
      [conversationId, senderId, String(body || '').trim(), replyToId]
    );
    const message = rows[0];
    for (const file of files) {
      await client.query(
        `INSERT INTO message_attachments (message_id, original_name, stored_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5)`,
        [message.id, file.originalname, file.filename, file.mimetype, file.size]
      );
    }
    await client.query('COMMIT');
    const result = await query(
      `SELECT m.*, u.name AS sender_name,
         COALESCE(json_agg(json_build_object('id', a.id, 'name', a.original_name, 'mimeType', a.mime_type, 'size', a.size_bytes, 'url', '/api/workspace/files/' || a.stored_name)) FILTER (WHERE a.id IS NOT NULL), '[]') AS attachments,
         COALESCE((SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.reaction_count, 'reacted', r.reacted)) FROM (
           SELECT emoji, COUNT(*)::int AS reaction_count, BOOL_OR(user_id = $2) AS reacted
           FROM message_reactions WHERE message_id = m.id GROUP BY emoji
         ) r), '[]') AS reactions
       FROM messages m JOIN staff_users u ON u.id = m.sender_id
       LEFT JOIN message_attachments a ON a.message_id = m.id
       WHERE m.id = $1 GROUP BY m.id, m.conversation_id, m.sender_id, m.body, m.reply_to_id, m.created_at, m.edited_at, m.deleted_at, u.name`,
      [message.id, senderId]
    );
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

router.get('/channels', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.name, c.is_private,
         EXISTS (SELECT 1 FROM conversation_members m WHERE m.conversation_id = c.id AND m.user_id = $1) AS joined,
         (SELECT COUNT(*)::int FROM conversation_members m WHERE m.conversation_id = c.id) AS member_count
       FROM conversations c
       WHERE c.type = 'channel' AND (c.is_private = FALSE OR EXISTS (
         SELECT 1 FROM conversation_members m WHERE m.conversation_id = c.id AND m.user_id = $1
       )) ORDER BY c.name`,
      [req.auth.sub]
    );
    res.json({ channels: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/channels', requireAuth, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (!name) return res.status(400).json({ error: 'A channel name is required.' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO conversations (type, name, is_private, created_by) VALUES ('channel', $1, $2, $3) RETURNING id, name, is_private`,
        [name, Boolean(req.body.isPrivate), req.auth.sub]
      );
      await client.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)', [rows[0].id, req.auth.sub]);
      await client.query('COMMIT');
      res.status(201).json({ channel: { ...rows[0], joined: true, member_count: 1 } });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') return res.status(409).json({ error: 'That channel already exists.' });
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

router.post('/channels/:id/join', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT id FROM conversations WHERE id = $1 AND type = 'channel' AND is_private = FALSE", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Public channel not found.' });
    await query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, req.auth.sub]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/staff', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, role, bio, avatar_url, last_seen_at FROM staff_users WHERE active = TRUE ORDER BY name');
    res.json({ staff: rows.map((member) => ({ ...member, avatarUrl: member.avatar_url ? `/api/workspace/profile/avatar/${member.id}` : null })) });
  } catch (error) {
    next(error);
  }
});

router.get('/direct-messages', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id AS conversation_id, u.id AS user_id, u.name, u.email,
         (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) AS last_message_at
       FROM conversations c
       JOIN conversation_members own ON own.conversation_id = c.id AND own.user_id = $1
       JOIN conversation_members other ON other.conversation_id = c.id AND other.user_id <> $1
       JOIN staff_users u ON u.id = other.user_id
       WHERE c.type = 'dm' AND u.active = TRUE ORDER BY last_message_at DESC NULLS LAST, u.name`,
      [req.auth.sub]
    );
    res.json({ conversations: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/staff', requireAuth, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = ['admin', 'editor', 'staff'].includes(req.body.role) ? req.body.role : 'staff';
    if (req.auth.role !== 'owner' && role === 'admin') return res.status(403).json({ error: 'Only the owner can create another admin.' });
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a name and valid work email.' });
    }
    const temporaryPassword = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const { rows } = await query(
      `INSERT INTO staff_users (name, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );
    try {
      await sendStaffInvite({ name, email, temporaryPassword });
    } catch (mailError) {
      await query('DELETE FROM staff_users WHERE id = $1', [rows[0].id]);
      console.error('Staff invitation email failed:', mailError.message);
      return res.status(502).json({ error: 'The invitation email could not be sent. No account was created.' });
    }
    res.status(201).json({ user: rows[0], invitationSent: true });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That email already has an account.' });
    next(error);
  }
});

router.delete('/staff/:id', requireAuth, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const targetId = String(req.params.id || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    if (targetId === req.auth.sub) return res.status(400).json({ error: 'You cannot remove your own account.' });
    const { rows } = await query('SELECT id, name, email, role FROM staff_users WHERE id = $1 AND active = TRUE', [targetId]);
    const target = rows[0];
    if (!target) return res.status(404).json({ error: 'Staff member not found.' });
    if (target.role === 'owner') return res.status(403).json({ error: 'The owner account cannot be removed from the dashboard.' });
    if (req.auth.role !== 'owner' && target.role === 'admin') {
      return res.status(403).json({ error: 'Only the owner can remove an admin.' });
    }
    await query('UPDATE staff_users SET active = FALSE WHERE id = $1', [targetId]);
    await query('DELETE FROM push_subscriptions WHERE user_id = $1', [targetId]);
    await query('UPDATE meeting_members SET left_at = NOW() WHERE user_id = $1 AND left_at IS NULL', [targetId]);
    req.app.get('io')?.in(`user:${targetId}`).disconnectSockets(true);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/staff/password', requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body.currentPassword || '');
    const nextPassword = String(req.body.newPassword || '');
    if (nextPassword.length < 12 || nextPassword.length > 200) {
      return res.status(400).json({ error: 'Use a new password of at least 12 characters.' });
    }
    const { rows } = await query('SELECT password_hash FROM staff_users WHERE id = $1 AND active = TRUE', [req.auth.sub]);
    if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const passwordHash = await bcrypt.hash(nextPassword, 12);
    await query('UPDATE staff_users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [passwordHash, req.auth.sub]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/direct-messages', requireAuth, async (req, res, next) => {
  const targetId = String(req.body.userId || '');
  const currentId = req.auth.sub;
  if (!targetId || targetId === currentId) return res.status(400).json({ error: 'Choose another staff member.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      `SELECT c.id FROM conversations c
       WHERE c.type = 'dm'
         AND EXISTS (SELECT 1 FROM conversation_members m WHERE m.conversation_id = c.id AND m.user_id = $1)
         AND EXISTS (SELECT 1 FROM conversation_members m WHERE m.conversation_id = c.id AND m.user_id = $2)
         AND (SELECT COUNT(*) FROM conversation_members m WHERE m.conversation_id = c.id) = 2
       LIMIT 1`,
      [currentId, targetId]
    );
    if (existing[0]) {
      await client.query('COMMIT');
      return res.json({ conversationId: existing[0].id });
    }
    const { rows: target } = await client.query('SELECT id FROM staff_users WHERE id = $1 AND active = TRUE', [targetId]);
    if (!target[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    const { rows } = await client.query("INSERT INTO conversations (type, created_by) VALUES ('dm', $1) RETURNING id", [currentId]);
    await client.query('INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)', [rows[0].id, currentId, targetId]);
    await client.query('COMMIT');
    res.status(201).json({ conversationId: rows[0].id });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

router.get('/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    if (!(await canReadConversation(req.params.id, req.auth.sub))) return res.status(403).json({ error: 'You are not a member of this conversation.' });
    const { rows } = await query(
      `SELECT m.*, u.name AS sender_name,
         COALESCE(json_agg(json_build_object('id', a.id, 'name', a.original_name, 'mimeType', a.mime_type, 'size', a.size_bytes, 'url', '/api/workspace/files/' || a.stored_name)) FILTER (WHERE a.id IS NOT NULL), '[]') AS attachments,
         COALESCE((SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.reaction_count, 'reacted', r.reacted)) FROM (
           SELECT emoji, COUNT(*)::int AS reaction_count, BOOL_OR(user_id = $2) AS reacted
           FROM message_reactions WHERE message_id = m.id GROUP BY emoji
         ) r), '[]') AS reactions
       FROM (SELECT * FROM messages WHERE conversation_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100) m
       JOIN staff_users u ON u.id = m.sender_id
       LEFT JOIN message_attachments a ON a.message_id = m.id
       GROUP BY m.id, m.conversation_id, m.sender_id, m.body, m.reply_to_id, m.created_at, m.edited_at, m.deleted_at, u.name ORDER BY m.created_at ASC`,
      [req.params.id, req.auth.sub]
    );
    res.json({ messages: rows });
  } catch (error) {
    next(error);
  }
});

router.get('/files/:name', requireAuth, async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i.test(req.params.name)) return res.status(404).end();
    const { rows } = await query(
      `SELECT m.conversation_id FROM message_attachments a
       JOIN messages m ON m.id = a.message_id WHERE a.stored_name = $1`,
      [req.params.name]
    );
    if (!rows[0] || !(await canReadConversation(rows[0].conversation_id, req.auth.sub))) return res.status(404).end();
    res.sendFile(path.join(privateUploadPath, req.params.name), { dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).end();
    });
  } catch (error) {
    next(error);
  }
});

router.post('/conversations/:id/messages', requireAuth, async (req, res, next) => {
  try {
    if (!(await canReadConversation(req.params.id, req.auth.sub))) return res.status(403).json({ error: 'You are not a member of this conversation.' });
    const body = String(req.body.body || '').trim();
    const attachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    if (!body && attachments.length === 0) return res.status(400).json({ error: 'Write a message or attach a file.' });
    if (body.length > 10000 || attachments.length > 5) return res.status(400).json({ error: 'Message or attachment limit exceeded.' });
    const client = await pool.connect();
    let message;
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, body, reply_to_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [req.params.id, req.auth.sub, body, req.body.replyToId || null]
      );
      message = rows[0];
      for (const file of attachments) {
        if (file.scope !== 'chat' || !file?.storedName || !/^[0-9a-f-]{36}\.[a-z0-9]{1,8}$/i.test(file.storedName) || !file?.name || !file?.mimeType || !Number.isFinite(Number(file.size))) continue;
        if (Number(file.size) > 25 * 1024 * 1024 || Number(file.size) < 0) continue;
        await client.query(
          `INSERT INTO message_attachments (message_id, original_name, stored_name, mime_type, size_bytes)
           VALUES ($1, $2, $3, $4, $5)`,
          [message.id, String(file.name).slice(0, 255), String(file.storedName), String(file.mimeType), Number(file.size)]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    const { rows } = await query(
      `SELECT m.*, u.name AS sender_name,
         COALESCE(json_agg(json_build_object('id', a.id, 'name', a.original_name, 'mimeType', a.mime_type, 'size', a.size_bytes, 'url', '/api/workspace/files/' || a.stored_name)) FILTER (WHERE a.id IS NOT NULL), '[]') AS attachments,
         COALESCE((SELECT json_agg(json_build_object('emoji', r.emoji, 'count', r.reaction_count, 'reacted', r.reacted)) FROM (
           SELECT emoji, COUNT(*)::int AS reaction_count, BOOL_OR(user_id = $2) AS reacted
           FROM message_reactions WHERE message_id = m.id GROUP BY emoji
         ) r), '[]') AS reactions
       FROM messages m JOIN staff_users u ON u.id = m.sender_id
       LEFT JOIN message_attachments a ON a.message_id = m.id
       WHERE m.id = $1 GROUP BY m.id, m.conversation_id, m.sender_id, m.body, m.reply_to_id, m.created_at, m.edited_at, m.deleted_at, u.name`,
      [message.id, req.auth.sub]
    );
    const saved = rows[0];
    req.app.get('io').to(`conversation:${req.params.id}`).emit('message:new', saved);
    res.status(201).json({ message: saved });
  } catch (error) {
    next(error);
  }
});

router.put('/messages/:id', requireAuth, async (req, res, next) => {
  try {
    const body = String(req.body.body || '').trim();
    if (!body || body.length > 10000) return res.status(400).json({ error: 'Message must be between 1 and 10,000 characters.' });
    const { rows } = await query(
      `UPDATE messages SET body = $2, edited_at = NOW()
       WHERE id = $1 AND sender_id = $3 AND deleted_at IS NULL
       RETURNING id, conversation_id, sender_id, body, created_at, edited_at`,
      [req.params.id, body, req.auth.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Message not found or it is not yours.' });
    req.app.get('io').to(`conversation:${rows[0].conversation_id}`).emit('message:updated', rows[0]);
    res.json({ message: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/messages/:id/reactions', requireAuth, async (req, res, next) => {
  try {
    const emoji = String(req.body.emoji || '');
    if (!/^.{1,8}$/u.test(emoji)) return res.status(400).json({ error: 'Choose a valid reaction.' });
    const { rows } = await query('SELECT conversation_id FROM messages WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
    if (!rows[0] || !(await canReadConversation(rows[0].conversation_id, req.auth.sub))) return res.status(404).json({ error: 'Message not found.' });
    const { rowCount } = await query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3', [req.params.id, req.auth.sub, emoji]);
    if (!rowCount) await query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)', [req.params.id, req.auth.sub, emoji]);
    req.app.get('io').to(`conversation:${rows[0].conversation_id}`).emit('reaction:changed', { messageId: req.params.id });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post('/conversations/:id/read', requireAuth, async (req, res, next) => {
  try {
    if (!(await canReadConversation(req.params.id, req.auth.sub))) return res.status(403).json({ error: 'You are not a member of this conversation.' });
    await query(
      'INSERT INTO conversation_members (conversation_id, user_id, last_read_at) VALUES ($1, $2, NOW()) ON CONFLICT (conversation_id, user_id) DO UPDATE SET last_read_at = NOW()',
      [req.params.id, req.auth.sub]
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export { canReadConversation };
export default router;
