import { query } from './db.js';
import { notifyUsers } from './notifications.js';

const QUARTER_COPY = {
  1: { title: 'Task timer: 25% of time used', body: (task) => `"${task.title}" is 1/4 through its time window. Keep the pace up.` },
  2: { title: 'Task timer: halfway point reached', body: (task) => `"${task.title}" is halfway to its due time. Stay on track.` },
  3: { title: 'Task timer: final quarter', body: (task) => `"${task.title}" has used 75% of its time. Push to finish strong.` },
  4: { title: 'Task timer: due time reached', body: (task) => `"${task.title}" has reached its due time. Wrap it up or update the deadline.` },
};

export async function checkTaskDeadlineReminders(io) {
  const { rows: tasks } = await query(
    `SELECT t.id, t.title, t.created_at, t.due_at, t.assigned_to, t.created_by
     FROM tasks t
     WHERE t.due_at IS NOT NULL
       AND t.status <> 'done'
       AND t.due_at > t.created_at
       AND t.due_at > NOW() - INTERVAL '2 days'`
  );
  for (const task of tasks) {
    const start = new Date(task.created_at).getTime();
    const due = new Date(task.due_at).getTime();
    const windowMs = due - start;
    if (!(windowMs > 0)) continue;
    const { rows: sent } = await query('SELECT quarter FROM task_deadline_reminders WHERE task_id = $1', [task.id]);
    const sentSet = new Set(sent.map((row) => Number(row.quarter)));
    const recipients = [...new Set([task.assigned_to, task.created_by].filter(Boolean))];
    if (!recipients.length) continue;
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      if (sentSet.has(quarter)) continue;
      const threshold = start + (windowMs * quarter) / 4;
      if (Date.now() < threshold) continue;
      const copy = QUARTER_COPY[quarter];
      try {
        await notifyUsers(io, recipients, {
          kind: 'task_deadline_quarter',
          title: copy.title,
          body: copy.body(task),
          href: '/staff/tasks',
          eventKey: `task-deadline:${task.id}:${quarter}`,
        });
        await query(
          'INSERT INTO task_deadline_reminders (task_id, quarter) VALUES ($1, $2) ON CONFLICT (task_id, quarter) DO NOTHING',
          [task.id, quarter]
        );
        sentSet.add(quarter);
      } catch (error) {
        console.error('Task deadline reminder failed:', task.id, quarter, error.message);
      }
    }
  }
}

export function startTaskDeadlineReminderScheduler(io) {
  const run = () => { checkTaskDeadlineReminders(io).catch((error) => console.error('Task deadline reminder check failed:', error.message)); };
  run();
  const timer = setInterval(run, 60 * 1000);
  timer.unref?.();
  return timer;
}
