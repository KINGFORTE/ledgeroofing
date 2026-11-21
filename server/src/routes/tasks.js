import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { notifyUsers } from '../notifications.js';
import { logAudit } from '../audit.js';

const router = Router();
const TASK_STATES = new Set(['todo', 'in_progress', 'approval_requested', 'done']);
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

function isManager(role) {
  return role === 'owner' || role === 'admin';
}

function taskSelect(userIdRef = '$1') {
  return `SELECT t.*, creator.name AS creator_name, assignee.name AS assignee_name,
    COALESCE((SELECT FLOOR(SUM(EXTRACT(EPOCH FROM (e.ended_at - e.started_at))))::int FROM task_time_entries e WHERE e.task_id = t.id AND e.ended_at IS NOT NULL), 0) AS total_tracked_seconds,
    COALESCE((SELECT FLOOR(SUM(EXTRACT(EPOCH FROM (e.ended_at - e.started_at))))::int FROM task_time_entries e WHERE e.task_id = t.id AND e.user_id = ${userIdRef} AND e.ended_at IS NOT NULL), 0) AS my_tracked_seconds,
    (SELECT e.started_at FROM task_time_entries e WHERE e.task_id = t.id AND e.user_id = ${userIdRef} AND e.ended_at IS NULL LIMIT 1) AS my_timer_started_at,
    (SELECT e.task_id FROM task_time_entries e WHERE e.user_id = ${userIdRef} AND e.ended_at IS NULL LIMIT 1) AS my_running_task_id
  FROM tasks t
  JOIN staff_users creator ON creator.id = t.created_by
  LEFT JOIN staff_users assignee ON assignee.id = t.assigned_to`;
}

function validUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseDueAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid due date.');
  return date.toISOString();
}

async function getTaskForUser(taskId, userId, role) {
  const { rows } = await query(`${taskSelect('$2')} WHERE t.id = $1`, [taskId, userId]);
  const task = rows[0];
  if (!task) return null;
  if (isManager(role) || task.created_by === userId || task.assigned_to === userId) return task;
  return null;
}

async function managerIds() {
  const { rows } = await query("SELECT id FROM staff_users WHERE active = TRUE AND role IN ('owner','admin')");
  return rows.map((r) => r.id);
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const scope = isManager(req.auth.role) ? '' : 'WHERE (t.created_by = $1 OR t.assigned_to = $1)';
    const { rows } = await query(
      `${taskSelect('$1')} ${scope} ORDER BY CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'approval_requested' THEN 2 ELSE 3 END,
       t.due_at ASC NULLS LAST, t.updated_at DESC`,
      [req.auth.sub]
    );
    res.json({ tasks: rows });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const manager = isManager(req.auth.role);
    const title = String(req.body.title || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 180);
    const description = String(req.body.description || '').trim().slice(0, 5000);
    const priority = PRIORITIES.has(req.body.priority) ? req.body.priority : 'normal';
    let assignedTo = req.body.assignedTo || null;
    const dueAt = parseDueAt(req.body.dueAt);
    if (!title) return res.status(400).json({ error: 'A task title is required.' });
    if (!manager) assignedTo = req.auth.sub;
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
    const task = await query(`${taskSelect('$2')} WHERE t.id = $1`, [rows[0].id, req.auth.sub]);
    req.app.get('io')?.emit('task:updated', { taskId: rows[0].id });
    if (assignedTo && assignedTo !== req.auth.sub) {
      await notifyUsers(req.app.get('io'), [assignedTo], {
        kind: 'task_assigned', title: 'A task was assigned to you',
        body: title, href: '/staff/tasks',
      });
    }
    void logAudit({ actorId: req.auth.sub, action: 'task.create', entityType: 'task', entityId: rows[0].id, details: { title, assignedTo, priority } });
    res.status(201).json({ task: task.rows[0] });
  } catch (error) { next(error); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const manager = isManager(req.auth.role);
    const current = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    if (!current) return res.status(404).json({ error: 'Task not found.' });

    const canEditDetails = manager || current.created_by === req.auth.sub;
    const canRequestApproval = !manager && (current.assigned_to === req.auth.sub || current.created_by === req.auth.sub);
    const detailsRequested = ['title', 'description', 'priority', 'dueAt', 'assignedTo'].some((key) => Object.hasOwn(req.body, key));
    if (detailsRequested && !canEditDetails) return res.status(403).json({ error: 'You do not have permission to edit this task.' });

    const title = Object.hasOwn(req.body, 'title') ? String(req.body.title || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 180) : current.title;
    const description = Object.hasOwn(req.body, 'description') ? String(req.body.description || '').trim().slice(0, 5000) : current.description;
    const priority = Object.hasOwn(req.body, 'priority') ? req.body.priority : current.priority;
    let assignedTo = Object.hasOwn(req.body, 'assignedTo') ? (req.body.assignedTo || null) : current.assigned_to;
    const dueAt = Object.hasOwn(req.body, 'dueAt') ? parseDueAt(req.body.dueAt) : current.due_at;
    const requestedStatus = Object.hasOwn(req.body, 'status') ? req.body.status : null;

    if (!title) return res.status(400).json({ error: 'A task title is required.' });
    if (!PRIORITIES.has(priority)) return res.status(400).json({ error: 'Invalid task priority.' });

    if (!manager) {
      // Regular users keep tasks self-owned/assigned and cannot reassign to others.
      assignedTo = req.auth.sub;
    }
    if (assignedTo && !validUuid(assignedTo)) return res.status(400).json({ error: 'Choose a valid staff member.' });
    if (assignedTo) {
      const member = await query('SELECT id FROM staff_users WHERE id = $1 AND active = TRUE', [assignedTo]);
      if (!member.rows[0]) return res.status(404).json({ error: 'That staff member is unavailable.' });
    }

    let status = current.status;
    if (requestedStatus) {
      if (!TASK_STATES.has(requestedStatus)) return res.status(400).json({ error: 'Invalid task status.' });
      if (manager) {
        status = requestedStatus;
      } else {
        if (!canRequestApproval) return res.status(403).json({ error: 'You do not have permission to update this task.' });
        if (requestedStatus === 'approval_requested' && current.status !== 'done') {
          status = 'approval_requested';
        } else if (requestedStatus === 'in_progress' && current.status !== 'done' && current.status !== 'approval_requested') {
          // allow moving back to in_progress if they want, but not bypassing approval
          status = 'in_progress';
        } else if (requestedStatus === 'todo' && current.status !== 'done' && current.status !== 'approval_requested') {
          status = 'todo';
        } else if (requestedStatus === current.status) {
          status = current.status;
        } else {
          return res.status(403).json({ error: 'You can request completion approval, but only an admin can mark this task as done.' });
        }
      }
    }

    await query(
      `UPDATE tasks SET title = $1, description = $2, priority = $3, status = $4,
       due_at = $5, assigned_to = $6, updated_at = NOW() WHERE id = $7`,
      [title, description, priority, status, dueAt, assignedTo, req.params.id]
    );
    const updated = await query(`${taskSelect('$2')} WHERE t.id = $1`, [req.params.id, req.auth.sub]);
    const io = req.app.get('io');
    io?.emit('task:updated', { taskId: req.params.id });

    if (assignedTo && assignedTo !== current.assigned_to && assignedTo !== req.auth.sub) {
      await notifyUsers(io, [assignedTo], { kind: 'task_assigned', title: 'A task was assigned to you', body: title, href: '/staff/tasks' });
    }

    if (status !== current.status) {
      if (status === 'approval_requested') {
        const admins = (await managerIds()).filter((id) => id !== req.auth.sub);
        await notifyUsers(io, admins, {
          kind: 'task_approval_requested',
          title: 'Task completion approval requested',
          body: `${title} is ready for review and approval.`,
          href: '/staff/tasks',
        });
      } else if (current.status === 'approval_requested' && status === 'done') {
        const recipients = [current.created_by, current.assigned_to].filter((id) => id && id !== req.auth.sub);
        await notifyUsers(io, recipients, {
          kind: 'task_approved',
          title: 'Task approved and completed',
          body: `${title} was approved by an admin.`,
          href: '/staff/tasks',
        });
      } else if (current.status === 'approval_requested' && (status === 'todo' || status === 'in_progress')) {
        const recipients = [current.created_by, current.assigned_to].filter((id) => id && id !== req.auth.sub);
        await notifyUsers(io, recipients, {
          kind: 'task_approval_rejected',
          title: 'Task approval needs changes',
          body: `${title} was sent back by an admin. Please review and continue.`,
          href: '/staff/tasks',
        });
      } else {
        const recipients = [current.created_by, current.assigned_to].filter((id) => id && id !== req.auth.sub);
        await notifyUsers(io, recipients, {
          kind: 'task_updated',
          title: 'Task status updated',
          body: `${title}: ${status.replace(/_/g, ' ')}`,
          href: '/staff/tasks',
        });
      }
    }

    void logAudit({ actorId: req.auth.sub, action: 'task.update', entityType: 'task', entityId: req.params.id, details: { status, assignedTo, title } });
    res.json({ task: updated.rows[0] });
  } catch (error) { next(error); }
});

router.post('/:id/timer/start', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const task = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const running = await query('SELECT id, task_id FROM task_time_entries WHERE user_id = $1 AND ended_at IS NULL LIMIT 1', [req.auth.sub]);
    const io = req.app.get('io');
    if (running.rows[0]?.task_id === req.params.id) {
      return res.json({ task });
    }
    if (running.rows[0]) {
      await query('UPDATE task_time_entries SET ended_at = NOW() WHERE id = $1', [running.rows[0].id]);
      io?.emit('task:updated', { taskId: running.rows[0].task_id });
    }
    await query('INSERT INTO task_time_entries (task_id, user_id) VALUES ($1, $2)', [req.params.id, req.auth.sub]);
    io?.emit('task:updated', { taskId: req.params.id });
    const updated = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    res.json({ task: updated });
  } catch (error) { next(error); }
});

router.post('/:id/timer/stop', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const task = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    await query('UPDATE task_time_entries SET ended_at = NOW() WHERE task_id = $1 AND user_id = $2 AND ended_at IS NULL', [req.params.id, req.auth.sub]);
    req.app.get('io')?.emit('task:updated', { taskId: req.params.id });
    const updated = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    res.json({ task: updated });
  } catch (error) { next(error); }
});

router.get('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const task = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
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
    if (!validUuid(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
    const body = String(req.body.body || '').trim();
    if (!body || body.length > 5000) return res.status(400).json({ error: 'Comment must be between 1 and 5,000 characters.' });
    const task = await getTaskForUser(req.params.id, req.auth.sub, req.auth.role);
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
