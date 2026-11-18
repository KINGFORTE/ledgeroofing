import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { config } from '../config.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, kind, title, body, href, read_at, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 40`,
      [req.auth.sub]
    );
    res.json({ notifications: rows, unread: rows.filter((item) => !item.read_at).length });
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

router.post('/:id/read', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.sub]);
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
