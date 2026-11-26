import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';
import { requireUuid } from '../validation.js';
import { hydrateNotification } from '../notifications.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [list, unread] = await Promise.all([
      query(
        `SELECT id FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 60`,
        [req.auth.sub]
      ),
      query(
        `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL`,
        [req.auth.sub]
      ),
    ]);
    const notifications = await Promise.all(list.rows.map((row) => hydrateNotification(row)));
    res.json({
      notifications: notifications.filter(Boolean),
      unread: unread.rows[0]?.count || 0,
    });
  } catch (error) { next(error); }
});

router.get('/push/public-key', requireAuth, (_req, res) => {
  if (!config.vapidPublicKey) return res.status(503).json({ error: 'Browser push is not configured.' });
  res.json({ publicKey: config.vapidPublicKey });
});

router.post('/push/subscriptions', requireAuth, async (req, res, next) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    const p256dh = String(req.body?.keys?.p256dh || '').trim();
    const auth = String(req.body?.keys?.auth || '').trim();
    if (!endpoint.startsWith('https://') || !p256dh || !auth) {
      return res.status(400).json({ error: 'A valid browser push subscription is required.' });
    }
    await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, updated_at = NOW()`,
      [req.auth.sub, endpoint, p256dh, auth]
    );
    res.status(201).json({ ok: true });
  } catch (error) { next(error); }
});

router.delete('/push/subscriptions', requireAuth, async (req, res, next) => {
  try {
    const endpoint = String(req.body?.endpoint || '').trim();
    await query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.auth.sub, endpoint]);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

// Marks message alerts for one conversation, including legacy rows created
// before conversation_id was added to the notifications table.
async function readConversation(userId, conversationId) {
  await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE user_id = $1 AND kind = 'new_message' AND read_at IS NULL
       AND (
         conversation_id = $2
         OR href = ('/staff/messages/' || $2)
         OR href = ('/staff/workspace?conversation=' || $2)
       )`,
    [userId, conversationId]
  );
}

router.post('/read-conversation/:conversationId', requireAuth, async (req, res, next) => {
  try {
    await readConversation(req.auth.sub, requireUuid(req.params.conversationId, 'conversation'));
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/read-messages', requireAuth, async (req, res, next) => {
  try {
    if (req.body?.conversationId) {
      await readConversation(req.auth.sub, requireUuid(req.body.conversationId, 'conversation'));
    } else {
      await query("UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND kind = 'new_message' AND read_at IS NULL", [req.auth.sub]);
    }
    res.status(204).end();
  } catch (error) { next(error); }
});

router.delete('/', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM notifications WHERE user_id = $1', [req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'notification');
    await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'notification');
    await query('UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2', [id, req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
