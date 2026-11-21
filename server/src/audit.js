import { query } from './db.js';

export async function logAudit({ actorId = null, actorName = '', action, entityType = '', entityId = '', details = {} }) {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, actor_name, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [actorId, String(actorName || '').slice(0, 120), String(action || '').slice(0, 120), String(entityType || '').slice(0, 80), String(entityId || '').slice(0, 120), JSON.stringify(details || {})]
    );
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}
