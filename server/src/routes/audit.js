import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    if (!['owner', 'admin'].includes(req.auth.role)) return res.status(403).json({ error: 'Only workspace admins can view the audit log.' });
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const action = String(req.query.action || '').trim();
    const entityType = String(req.query.entityType || '').trim();
    const params = [];
    const where = [];
    if (action) { params.push(action); where.push(`action = $${params.length}`); }
    if (entityType) { params.push(entityType); where.push(`entity_type = $${params.length}`); }
    params.push(limit);
    params.push(offset);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const { rows } = await query(
      `SELECT id, actor_id, actor_name, action, entity_type, entity_id, details, created_at
       FROM audit_log ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ entries: rows });
  } catch (error) { next(error); }
});

export default router;
