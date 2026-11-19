import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const requestedUserId = String(req.query.userId || req.auth.sub);
    const year = Number(req.query.year || new Date().getFullYear());
    if (!UUID.test(requestedUserId)) return res.status(400).json({ error: 'Invalid staff member.' });
    if (!Number.isInteger(year) || year < 2020 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Choose a valid year.' });
    }
    if (requestedUserId !== req.auth.sub && !['owner', 'admin'].includes(req.auth.role)) {
      return res.status(403).json({ error: 'You can only view your own attendance.' });
    }
    const { rows: staff } = await query(
      'SELECT id, name, email FROM staff_users WHERE id = $1 AND active = TRUE',
      [requestedUserId]
    );
    if (!staff[0]) return res.status(404).json({ error: 'Staff member not found.' });
    const { rows } = await query(
      `SELECT attendance_date::text AS date, first_seen_at, last_seen_at
       FROM attendance_days WHERE user_id = $1 AND attendance_date >= $2::date AND attendance_date < $3::date
       ORDER BY attendance_date`,
      [requestedUserId, `${year}-01-01`, `${year + 1}-01-01`]
    );
    res.json({ staff: staff[0], year, days: rows, totalDays: rows.length });
  } catch (error) { next(error); }
});

router.get('/staff', requireAuth, requireRole('owner', 'admin'), async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email FROM staff_users WHERE active = TRUE ORDER BY name');
    res.json({ staff: rows });
  } catch (error) { next(error); }
});

export default router;
