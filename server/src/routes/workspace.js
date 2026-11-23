import { Router } from 'express';
import { query, pool } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { privateUploadPath } from './uploads.js';
import { sendStaffInvite, notifyUsers } from '../notifications.js';
import { logAudit } from '../audit.js';

const router = Router();

router.post('/push-token', requireAuth, async (req, res, next) => {
  try {
    const token = String(req.body?.token || '').trim();
    const platform = ['android', 'ios'].includes(req.body?.platform) ? req.body.platform : 'android';
    if (!token || token.length > 2048) return res.status(400).json({ error: 'A valid push token is required.' });
    await query(
      `INSERT INTO push_tokens (token, user_id, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
      [token, req.auth.sub, platform]
    );
    console.log('Push token registered for user', req.auth.sub);
    res.status(201).json({ ok: true });
  } catch (error) { next(error); }
});

router.delete('/push-token', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM push_tokens WHERE token = $1 AND user_id = $2', [String(req.body?.token || ''), req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

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
    const { rows } = await query('SELECT id, name, email, role, bio, avatar_url, can_manage_email, last_seen_at FROM staff_users WHERE active = TRUE ORDER BY name');
    res.json({ staff: rows.map((member) => ({ ...member, canManageEmail: Boolean(member.can_manage_email || member.role === 'owner' || member.role === 'admin'), avatarUrl: member.avatar_url ? `/api/workspace/profile/avatar/${member.id}` : null })) });
  } catch (error) {
    next(error);
  }
});

router.get('/direct-messages', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id AS conversation_id, u.id AS user_id, u.name, u.email,
         (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) AS last_message_at,
         (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_body,
         (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
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
    const canManageEmail = Boolean(req.body.canManageEmail);
    if (req.auth.role !== 'owner' && role === 'admin') return res.status(403).json({ error: 'Only the owner can create another admin.' });
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a name and valid work email.' });
    }
    const temporaryPassword = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);
    const { rows } = await query(
      `INSERT INTO staff_users (name, email, password_hash, role, can_manage_email, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, name, email, role, can_manage_email`,
      [name, email, passwordHash, role, canManageEmail]
    );
    try {
      await sendStaffInvite({ name, email, temporaryPassword });
    } catch (mailError) {
      await query('DELETE FROM staff_users WHERE id = $1', [rows[0].id]);
      console.error('Staff invitation email failed:', mailError.message);
      return res.status(502).json({ error: 'The invitation email could not be sent. No account was created.' });
    }
    const created = rows[0];
    void logAudit({ actorId: req.auth.sub, action: 'staff.invite', entityType: 'staff_user', entityId: created.id, details: { email: created.email, role: created.role } });
    res.status(201).json({ user: { id: created.id, name: created.name, email: created.email, role: created.role, canManageEmail: Boolean(created.can_manage_email || created.role === 'owner' || created.role === 'admin') }, invitationSent: true });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'That email already has an account.' });
    next(error);
  }
});

router.patch('/staff/:id', requireAuth, requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const targetId = String(req.params.id || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }
    const { rows } = await query('SELECT id, name, email, role, can_manage_email FROM staff_users WHERE id = $1 AND active = TRUE', [targetId]);
    const target = rows[0];
    if (!target) return res.status(404).json({ error: 'Staff member not found.' });
    if (target.role === 'owner') return res.status(403).json({ error: 'The owner account cannot be changed here.' });

    const previousRole = target.role;
    let role = target.role;
    if (Object.hasOwn(req.body, 'role')) {
      role = ['admin', 'editor', 'staff'].includes(req.body.role) ? req.body.role : target.role;
      if (req.auth.role !== 'owner' && (role === 'admin' || target.role === 'admin')) {
        return res.status(403).json({ error: 'Only the owner can change admin roles.' });
      }
    }
    const canManageEmail = Object.hasOwn(req.body, 'canManageEmail') ? Boolean(req.body.canManageEmail) : Boolean(target.can_manage_email);
    await query('UPDATE staff_users SET role = $1, can_manage_email = $2 WHERE id = $3', [role, canManageEmail, targetId]);

    if (role !== previousRole) {
      const rank = { staff: 1, editor: 2, admin: 3, owner: 4 };
      const pretty = { staff: 'Staff', editor: 'Editor', admin: 'Admin', owner: 'Owner' };
      const promoted = (rank[role] || 0) > (rank[previousRole] || 0);
      const demoted = (rank[role] || 0) < (rank[previousRole] || 0);
      const roleLabel = pretty[role] || role;
      const fromLabel = pretty[previousRole] || previousRole;
      let body = `Your role was updated from ${fromLabel} to ${roleLabel}.`;
      if (promoted && role === 'admin') body = `Promotion unlocked: you're now an Admin! With great power comes great spreadsheet responsibility.`;
      else if (promoted && role === 'editor') body = `Level up! You've been promoted to Editor — your words now carry extra roofing-certified authority.`;
      else if (promoted) body = `Congrats, you've been promoted from ${fromLabel} to ${roleLabel}! Time to update your imaginary business cards.`;
      else if (demoted) body = `Plot twist: you've moved from ${fromLabel} to ${roleLabel}. New title, same MVP — keep building great things.`;
      try {
        await notifyUsers(req.app.get('io'), [targetId], {
          kind: 'role_changed',
          title: promoted ? 'You got promoted!' : demoted ? 'Role update (a humble plot twist)' : 'Your role was updated',
          body,
          href: '/staff/profile',
        });
      } catch (notifyError) {
        console.error('Role change notification failed:', notifyError.message);
      }
    }

    void logAudit({ actorId: req.auth.sub, action: 'staff.update', entityType: 'staff_user', entityId: targetId, details: { previousRole, role, canManageEmail: Boolean(canManageEmail) } });
    res.json({ user: { id: target.id, name: target.name, email: target.email, role, canManageEmail: Boolean(canManageEmail || role === 'owner' || role === 'admin') } });
  } catch (error) {
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
    await query('DELETE FROM push_tokens WHERE user_id = $1', [targetId]);
    await query('UPDATE meeting_members SET left_at = NOW() WHERE user_id = $1 AND left_at IS NULL', [targetId]);
    req.app.get('io')?.in(`user:${targetId}`).disconnectSockets(true);
    void logAudit({ actorId: req.auth.sub, action: 'staff.remove', entityType: 'staff_user', entityId: targetId, details: { email: target.email, role: target.role } });
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

    const { rows: conversationRows } = await query('SELECT type, name FROM conversations WHERE id = $1', [req.params.id]);
    const conversation = conversationRows[0] || { type: 'dm', name: 'workspace' };
    const { rows: senderRows } = await query('SELECT name FROM staff_users WHERE id = $1', [req.auth.sub]);
    const senderName = senderRows[0]?.name || 'A teammate';
    const { rows: recipients } = await query(
      `SELECT DISTINCT m.user_id FROM conversation_members m
       JOIN staff_users u ON u.id = m.user_id
       WHERE m.conversation_id = $1 AND m.user_id <> $2 AND u.active = TRUE`,
      [req.params.id, req.auth.sub]
    );
    void notifyUsers(req.app.get('io'), recipients.map((row) => row.user_id), {
      kind: 'new_message',
      title: conversation.type === 'dm' ? `Direct message from ${senderName}` : `New message in #${conversation.name}`,
      body: `${senderName}: ${body ? body.slice(0, 180) : 'Sent an attachment'}`,
      href: '/staff/messages',
      email: conversation.type === 'dm',
    }).catch((error) => console.error('Message notifications failed:', error.message));

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
