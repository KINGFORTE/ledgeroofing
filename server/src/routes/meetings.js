import { createHmac } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query, pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { notifyUsers } from '../notifications.js';

const router = Router();
const createLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const MEETING_SELECT = `SELECT m.*, host.name AS host_name,
  COALESCE(json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'role', mm.role)
    ORDER BY u.name) FILTER (WHERE u.id IS NOT NULL), '[]') AS participants
  FROM meetings m
  JOIN staff_users host ON host.id = m.created_by
  JOIN meeting_members own ON own.meeting_id = m.id AND own.user_id = $1
  LEFT JOIN meeting_members mm ON mm.meeting_id = m.id
  LEFT JOIN staff_users u ON u.id = mm.user_id`;

function validUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadMeeting(userId, meetingId) {
  const { rows } = await query(`${MEETING_SELECT} WHERE m.id = $2 GROUP BY m.id, host.name`, [userId, meetingId]);
  return rows[0];
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `${MEETING_SELECT}
       WHERE m.status IN ('scheduled', 'active') OR (m.status = 'ended' AND m.ends_at > NOW() - INTERVAL '7 days')
       GROUP BY m.id, host.name
       ORDER BY CASE WHEN m.status = 'active' THEN 0 ELSE 1 END, m.starts_at ASC`,
      [req.auth.sub]
    );
    res.json({ meetings: rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, createLimit, async (req, res, next) => {
  const title = String(req.body.title || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 160);
  const description = String(req.body.description || '').trim().slice(0, 2000);
  const start = req.body.startsAt ? new Date(req.body.startsAt) : new Date();
  if (!title) return res.status(400).json({ error: 'A meeting title is required.' });
  if (Number.isNaN(start.getTime())) return res.status(400).json({ error: 'Choose a valid meeting time.' });
  const requested = Array.isArray(req.body.participantIds) ? req.body.participantIds : [];
  if (requested.some((id) => !validUuid(id))) return res.status(400).json({ error: 'One or more participants are invalid.' });
  const participantIds = [...new Set([req.auth.sub, ...requested])];
  if (participantIds.length > 6) return res.status(400).json({ error: 'Meetings support up to six staff members.' });
  const members = await query('SELECT id FROM staff_users WHERE active = TRUE AND id = ANY($1::uuid[])', [participantIds]);
  if (members.rows.length !== participantIds.length) return res.status(400).json({ error: 'A selected staff member is unavailable.' });

  const client = await pool.connect();
  let meetingId;
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO meetings (title, description, starts_at, ends_at, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, description, start.toISOString(), new Date(start.getTime() + 60 * 60 * 1000).toISOString(), start <= new Date() ? 'active' : 'scheduled', req.auth.sub]
    );
    meetingId = rows[0].id;
    for (const userId of participantIds) {
      await client.query(
        `INSERT INTO meeting_members (meeting_id, user_id, role) VALUES ($1, $2, $3)`,
        [meetingId, userId, userId === req.auth.sub ? 'host' : 'attendee']
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally { client.release(); }

  const invited = participantIds.filter((id) => id !== req.auth.sub);
  req.app.get('io')?.emit('meeting:updated', { meetingId });
  await notifyUsers(req.app.get('io'), invited, {
    kind: 'meeting_invite', title: 'You were invited to a video meeting',
    body: title, href: '/staff/meetings',
  });
  res.status(201).json({ meeting: await loadMeeting(req.auth.sub, meetingId) });
});

router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Only the meeting host or a workspace admin can cancel it.' });
    }
    if (meeting.status === 'active') return res.status(409).json({ error: 'End an active meeting instead of cancelling it.' });
    await query("UPDATE meetings SET status = 'cancelled', updated_at = NOW() WHERE id = $1", [req.params.id]);
    req.app.get('io')?.emit('meeting:updated', { meetingId: req.params.id });
    const recipients = meeting.participants.map((person) => person.id).filter((id) => id !== req.auth.sub);
    await notifyUsers(req.app.get('io'), recipients, {
      kind: 'meeting_cancelled', title: 'A video meeting was cancelled', body: meeting.title, href: '/staff/meetings',
    });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/:id/end', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Only the meeting host or a workspace admin can end it.' });
    }
    await query("UPDATE meetings SET status = 'ended', ends_at = NOW(), updated_at = NOW() WHERE id = $1", [req.params.id]);
    req.app.get('io').to(`meeting:${req.params.id}`).emit('meeting:ended');
    req.app.get('io')?.emit('meeting:updated', { meetingId: req.params.id });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/:id/ice-servers', requireAuth, async (req, res, next) => {
  try {
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
    if (config.turnHost && config.turnSecret) {
      const expires = Math.floor(Date.now() / 1000) + 60 * 60;
      const username = `${expires}:${req.auth.sub}`;
      const credential = createHmac('sha1', config.turnSecret).update(username).digest('base64');
      iceServers.push({
        urls: [
          `turn:${config.turnHost}:${config.turnPort}?transport=udp`,
          `turn:${config.turnHost}:${config.turnPort}?transport=tcp`,
        ],
        username,
        credential,
      });
    }
    res.json({ iceServers });
  } catch (error) { next(error); }
});

export default router;
