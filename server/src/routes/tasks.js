import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { notifyUsers } from '../notifications.js';

const router = Router();
const TASK_STATES = new Set(['todo', 'in_progress', 'done']);
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);
const TASK_SELECT = `SELECT t.*, creator.name AS creator_name, assignee.name AS assignee_name
  FROM tasks t
  JOIN staff_users creator ON creator.id = t.created_by
  LEFT JOIN staff_users assignee ON assignee.id = t.assigned_to`;

function validUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseDueAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid due date.');
  return date.toISOString();
}

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `${TASK_SELECT} ORDER BY CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
       t.due_at ASC NULLS LAST, t.updated_at DESC`
    );
    res.json({ tasks: rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 180);
    const description = String(req.body.description || '').trim().slice(0, 5000);
    const priority = PRIORITIES.has(req.body.priority) ? req.body.priority : 'normal';
    const assignedTo = req.body.assignedTo || null;
    const dueAt = parseDueAt(req.body.dueAt);
    if (!title) return res.status(400).json({ error: 'A task title is required.' });
    if (assignedTo && !validUuid(assignedTo)) return res.status(400).json({ error: 'Choose a valid staff member.' });
    if (assignedTo) {
      const member = await query('SELECT id FROM staff_users WHERE id = $1 AND active = TRUE', [assignedTo]);
      if (!member.rows[0]) return res.status(404).json({ error: 'That staff member is unavailable.' });
    }
    const { rows } = await query(
      `INSERT INTO tasks (title, description, priority, due_at, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [title, description, priority, dueAt, assignedTo, req.auth.sub]
    );
    const task = await query(`${TASK_SELECT} WHERE t.id = $1`, [rows[0].id]);
    req.app.get('io')?.emit('task:updated', { taskId: rows[0].id });
    if (assignedTo && assignedTo !== req.auth.sub) {
      await notifyUsers(req.app.get('io'), [assignedTo], {
        kind: 'task_assigned', title: 'A task was assigned to you',
        body: title, href: '/staff/tasks',
      });
    }
    res.status(201).json({ task: task.rows[0] });
  } catch (error) { next(error); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const currentResult = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const current = currentResult.rows[0];
    if (!current) return res.status(404).json({ error: 'Task not found.' });
    const manager = ['owner', 'admin'].includes(req.auth.role);
    const canEditDetails = manager || current.created_by === req.auth.sub;
    const canUpdateStatus = manager || current.created_by === req.auth.sub || current.assigned_to === req.auth.sub;
    const detailsRequested = ['title', 'description', 'priority', 'dueAt', 'assignedTo'].some((key) => Object.hasOwn(req.body, key));
    if (detailsRequested && !canEditDetails) return res.status(403).json({ error: 'Only the task creator or a workspace admin can edit task details.' });
    if (Object.hasOwn(req.body, 'status') && !canUpdateStatus) return res.status(403).json({ error: 'Only the assignee, creator, or a workspace admin can update this task.' });

    const title = Object.hasOwn(req.body, 'title') ? String(req.body.title || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 180) : current.title;
    const description = Object.hasOwn(req.body, 'description') ? String(req.body.description || '').trim().slice(0, 5000) : current.description;
    const priority = Object.hasOwn(req.body, 'priority') ? req.body.priority : current.priority;
    const status = Object.hasOwn(req.body, 'status') ? req.body.status : current.status;
    const assignedTo = Object.hasOwn(req.body, 'assignedTo') ? (req.body.assignedTo || null) : current.assigned_to;
    const dueAt = Object.hasOwn(req.body, 'dueAt') ? parseDueAt(req.body.dueAt) : current.due_at;
    if (!title) return res.status(400).json({ error: 'A task title is required.' });
    if (!PRIORITIES.has(priority)) return res.status(400).json({ error: 'Invalid task priority.' });
    if (!TASK_STATES.has(status)) return res.status(400).json({ error: 'Invalid task status.' });
    if (assignedTo && !validUuid(assignedTo)) return res.status(400).json({ error: 'Choose a valid staff member.' });
    if (assignedTo) {
      const member = await query('SELECT id FROM staff_users WHERE id = $1 AND active = TRUE', [assignedTo]);
      if (!member.rows[0]) return res.status(404).json({ error: 'That staff member is unavailable.' });
    }

    await query(
      `UPDATE tasks SET title = $1, description = $2, priority = $3, status = $4,
       due_at = $5, assigned_to = $6, updated_at = NOW() WHERE id = $7`,
      [title, description, priority, status, dueAt, assignedTo, req.params.id]
    );
    const updated = await query(`${TASK_SELECT} WHERE t.id = $1`, [req.params.id]);
    const io = req.app.get('io');
    io?.emit('task:updated', { taskId: req.params.id });
    const notify = [];
    if (assignedTo && assignedTo !== current.assigned_to && assignedTo !== req.auth.sub) {
      notify.push({ id: assignedTo, kind: 'task_assigned', title: 'A task was assigned to you', body: title });
    }
    if (status !== current.status) {
      for (const id of [current.created_by, current.assigned_to]) {
        if (id && id !== req.auth.sub) notify.push({ id, kind: 'task_updated', title: 'Task status updated', body: `${title}: ${status.replace('_', ' ')}` });
      }
    }
    for (const item of notify) {
      await notifyUsers(io, [item.id], { ...item, href: '/staff/tasks' });
    }
    res.json({ task: updated.rows[0] });
  } catch (error) { next(error); }
});

router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT c.id, c.task_id, c.body, c.created_at, u.id AS author_id, u.name AS author_name
       FROM task_comments c JOIN staff_users u ON u.id = c.author_id
       WHERE c.task_id = $1 ORDER BY c.created_at`,
      [req.params.id]
    );
    res.json({ comments: rows });
  } catch (error) { next(error); }
});

router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const body = String(req.body.body || '').trim();
    if (!body || body.length > 5000) return res.status(400).json({ error: 'Comment must be between 1 and 5,000 characters.' });
    const taskResult = await query('SELECT id, title, created_by, assigned_to FROM tasks WHERE id = $1', [req.params.id]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const { rows } = await query(
      'INSERT INTO task_comments (task_id, author_id, body) VALUES ($1, $2, $3) RETURNING id, task_id, body, created_at',
      [task.id, req.auth.sub, body]
    );
    const { rows: author } = await query('SELECT name FROM staff_users WHERE id = $1', [req.auth.sub]);
    req.app.get('io')?.emit('task:updated', { taskId: task.id });
    const recipients = [task.created_by, task.assigned_to].filter((id) => id && id !== req.auth.sub);
    await notifyUsers(req.app.get('io'), recipients, {
      kind: 'task_comment', title: 'New comment on a task', body: `${author[0]?.name || 'A teammate'}: ${body.slice(0, 180)}`, href: '/staff/tasks',
    });
    res.status(201).json({ comment: { ...rows[0], author_id: req.auth.sub, author_name: author[0]?.name } });
  } catch (error) { next(error); }
});

export default router;
