import { createHmac, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query, pool } from '../db.js';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { notifyUsers } from '../notifications.js';
import { logAudit } from '../audit.js';

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

function meetingIceServers(userId) {
  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (config.turnHost && config.turnSecret) {
    const expires = Math.floor(Date.now() / 1000) + 60 * 60;
    const username = `${expires}:${userId}`;
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
  return iceServers;
}

router.get('/guest/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token || '');
    if (!validUuid(token)) return res.status(404).json({ error: 'Meeting link is invalid.' });
    const { rows } = await query(
      `SELECT m.id, m.title, m.description, m.starts_at, m.ends_at, m.status, m.guest_access, m.guest_expires_at, host.name AS host_name
       FROM meetings m JOIN staff_users host ON host.id = m.created_by
       WHERE m.guest_token = $1`,
      [token]
    );
    const meeting = rows[0];
    if (!meeting || !meeting.guest_access) return res.status(404).json({ error: 'This meeting link is not available.' });
    if (meeting.guest_expires_at && new Date(meeting.guest_expires_at).getTime() < Date.now()) return res.status(410).json({ error: 'This meeting link has expired.' });
    if (['ended', 'cancelled'].includes(meeting.status)) return res.status(410).json({ error: 'This meeting has ended.' });
    res.json({ meeting: { id: meeting.id, title: meeting.title, description: meeting.description, startsAt: meeting.starts_at, endsAt: meeting.ends_at, status: meeting.status, hostName: meeting.host_name, guestToken: token } });
  } catch (error) { next(error); }
});

router.get('/guest/:token/ice-servers', async (req, res, next) => {
  try {
    const token = String(req.params.token || '');
    if (!validUuid(token)) return res.status(404).json({ error: 'Meeting link is invalid.' });
    const { rows } = await query('SELECT id, guest_access, status, guest_expires_at FROM meetings WHERE guest_token = $1', [token]);
    const meeting = rows[0];
    if (!meeting || !meeting.guest_access || ['ended', 'cancelled'].includes(meeting.status)) return res.status(404).json({ error: 'This meeting link is not available.' });
    if (meeting.guest_expires_at && new Date(meeting.guest_expires_at).getTime() < Date.now()) return res.status(410).json({ error: 'This meeting link has expired.' });
    res.json({ iceServers: meetingIceServers(`guest:${token}`) });
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
  void logAudit({ actorId: req.auth.sub, action: 'meeting.create', entityType: 'meeting', entityId: meetingId, details: { title, participantCount: participantIds.length } });
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
    void logAudit({ actorId: req.auth.sub, action: 'meeting.cancel', entityType: 'meeting', entityId: req.params.id, details: { title: meeting.title } });
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
    void logAudit({ actorId: req.auth.sub, action: 'meeting.end', entityType: 'meeting', entityId: req.params.id, details: { title: meeting.title } });
    res.status(204).end();
  } catch (error) { next(error); }
});


router.post('/:id/ring', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Only the meeting host or a workspace admin can ring people.' });
    }

    const requested = Array.isArray(req.body?.participantIds) ? req.body.participantIds : [];
    const ids = [...new Set(requested.filter(validUuid))].filter((id) => id !== req.auth.sub).slice(0, 30);
    if (!ids.length) return res.status(400).json({ error: 'Select at least one person to ring.' });

    const { rows: recipients } = await query(
      'SELECT id, name, email FROM staff_users WHERE active = TRUE AND id = ANY($1::uuid[]) AND id <> $2',
      [ids, req.auth.sub]
    );
    if (!recipients.length) return res.status(400).json({ error: 'None of the selected people are available.' });

    for (const recipient of recipients) {
      await query(
        "INSERT INTO meeting_members (meeting_id, user_id, role) VALUES ($1, $2, 'attendee') ON CONFLICT (meeting_id, user_id) DO NOTHING",
        [meeting.id, recipient.id]
      );
    }

    const io = req.app.get('io');
    const ringId = randomUUID();
    const { rows: callerRows } = await query(
      'SELECT id, name, avatar_url FROM staff_users WHERE id = $1',
      [req.auth.sub]
    );
    const caller = callerRows[0] || { id: req.auth.sub, name: 'A teammate', avatar_url: null };
    const payload = {
      id: ringId,
      meetingId: meeting.id,
      title: meeting.title,
      hostName: meeting.host_name,
      callerId: caller.id,
      callerName: caller.name || 'A teammate',
      callerAvatarUrl: caller.avatar_url ? `/api/workspace/profile/avatar/${caller.id}` : null,
      startsAt: meeting.starts_at,
      href: `/staff/meetings?join=${meeting.id}&ring=${ringId}`,
    };
    for (const recipient of recipients) io?.to(`user:${recipient.id}`).emit('meeting:ring', payload);
    void logAudit({ actorId: req.auth.sub, action: 'meeting.ring', entityType: 'meeting', entityId: meeting.id, details: { recipientIds: recipients.map((recipient) => recipient.id), title: meeting.title } });
    res.json({ ringed: recipients.length, recipients: recipients.map(({ id, name, email }) => ({ id, name, email })) });
  } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Only the meeting host or a workspace admin can delete it.' });
    }
    const io = req.app.get('io');
    await query('DELETE FROM meetings WHERE id = $1', [req.params.id]);
    io?.to(`meeting:${req.params.id}`).emit('meeting:ended');
    io?.emit('meeting:updated', { meetingId: req.params.id, deleted: true });
    const recipients = meeting.participants.map((person) => person.id).filter((id) => id !== req.auth.sub);
    await notifyUsers(io, recipients, {
      kind: 'meeting_deleted', title: 'A video meeting was deleted', body: meeting.title, href: '/staff/meetings',
    });
    void logAudit({ actorId: req.auth.sub, action: 'meeting.delete', entityType: 'meeting', entityId: req.params.id, details: { title: meeting.title } });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/:id/attendance', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      // allow any invited member to view attendance
      const member = meeting.participants.some((p) => p.id === req.auth.sub);
      if (!member) return res.status(403).json({ error: 'You do not have access to this meeting.' });
    }
    const { rows } = await query(
      `SELECT mm.user_id, u.name, u.email, mm.role, mm.invited_at, mm.joined_at, mm.left_at
       FROM meeting_members mm
       JOIN staff_users u ON u.id = mm.user_id
       WHERE mm.meeting_id = $1
       ORDER BY mm.joined_at DESC NULLS LAST, u.name ASC`,
      [req.params.id]
    );
    res.json({ attendance: rows });
  } catch (error) { next(error); }
});

router.post('/:id/guest-access', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Meeting not found.' });
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    if (meeting.created_by !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'Only the meeting host or a workspace admin can change guest access.' });
    }
    const enabled = req.body?.enabled === true;
    const expiresAtRaw = req.body?.expiresAt;
    let expiresAt = null;
    if (enabled && expiresAtRaw) {
      const parsed = new Date(expiresAtRaw);
      if (!Number.isNaN(parsed.getTime())) expiresAt = parsed.toISOString();
    }
    const { rows } = await query(
      'UPDATE meetings SET guest_access = $2, guest_expires_at = $3, updated_at = NOW() WHERE id = $1 RETURNING guest_access, guest_token, guest_expires_at',
      [req.params.id, enabled, expiresAt]
    );
    req.app.get('io')?.emit('meeting:updated', { meetingId: req.params.id });
    void logAudit({ actorId: req.auth.sub, action: 'meeting.guest_access', entityType: 'meeting', entityId: req.params.id, details: { title: meeting.title, enabled, expiresAt } });
    res.json({ guestAccess: rows[0].guest_access, guestToken: rows[0].guest_token, guestExpiresAt: rows[0].guest_expires_at });
  } catch (error) { next(error); }
});

router.get('/:id/ice-servers', requireAuth, async (req, res, next) => {
  try {
    const meeting = await loadMeeting(req.auth.sub, req.params.id);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found.' });
    res.json({ iceServers: meetingIceServers(req.auth.sub) });
  } catch (error) { next(error); }
});

export default router;
