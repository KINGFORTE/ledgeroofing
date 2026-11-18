import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { query } from './db.js';

export const COOKIE_NAME = 'ledge_staff_session';

export function signSession(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '12h' });
}

export function getUserFromToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Sign in required.' });
    const session = getUserFromToken(token);
    const { rows } = await query('SELECT id, role FROM staff_users WHERE id = $1 AND active = TRUE', [session.sub]);
    if (!rows[0]) {
      res.clearCookie(COOKIE_NAME);
      return res.status(401).json({ error: 'Staff account is inactive.' });
    }
    req.auth = { sub: rows[0].id, role: rows[0].role };
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired. Sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.' });
    }
    next();
  };
}
