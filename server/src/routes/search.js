import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 120);
    if (q.length < 2) return res.json({ results: [] });
    const like = `%${q}%`;
    const isManager = ['owner', 'admin'].includes(req.auth.role);

    const staffPromise = query(
      `SELECT id, name, email, role FROM staff_users WHERE active = TRUE AND (name ILIKE $1 OR email ILIKE $1) ORDER BY name LIMIT 6`,
      [like]
    );
    const taskPromise = isManager
      ? query(`SELECT id, title, status, priority, due_at FROM tasks WHERE title ILIKE $1 OR description ILIKE $1 ORDER BY updated_at DESC LIMIT 8`, [like])
      : query(`SELECT id, title, status, priority, due_at FROM tasks WHERE (created_by = $2 OR assigned_to = $2) AND (title ILIKE $1 OR description ILIKE $1) ORDER BY updated_at DESC LIMIT 8`, [like, req.auth.sub]);
    const meetingPromise = query(
      `SELECT m.id, m.title, m.status, m.starts_at FROM meetings m
       JOIN meeting_members mm ON mm.meeting_id = m.id AND mm.user_id = $2
       WHERE m.title ILIKE $1 OR m.description ILIKE $1
       ORDER BY m.starts_at DESC LIMIT 6`,
      [like, req.auth.sub]
    );

    const [staff, tasks, meetings] = await Promise.all([staffPromise, taskPromise, meetingPromise]);
    const results = [
      ...staff.rows.map((r) => ({ type: 'staff', id: r.id, title: r.name, subtitle: `${r.email} · ${r.role}`, href: '/staff/people' })),
      ...tasks.rows.map((r) => ({ type: 'task', id: r.id, title: r.title, subtitle: `${r.status.replace(/_/g, ' ')} · ${r.priority}`, href: '/staff/tasks' })),
      ...meetings.rows.map((r) => ({ type: 'meeting', id: r.id, title: r.title, subtitle: `${r.status} · ${new Date(r.starts_at).toLocaleString()}`, href: '/staff/meetings' })),
    ];
    res.json({ results });
  } catch (error) { next(error); }
});

export default router;
