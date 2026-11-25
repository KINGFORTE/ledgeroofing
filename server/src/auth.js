import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { pool, query } from './db.js';

export const COOKIE_NAME = 'ledge_staff_session';
export const REFRESH_COOKIE_NAME = 'ledge_staff_refresh';

const JWT_ISSUER = 'ledge-roofing-api';
const JWT_AUDIENCE = 'ledge-roofing-dashboard';
const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_DAYS = 7;

export const accessCookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: config.production ? 'none' : 'lax',
  maxAge: ACCESS_TTL_SECONDS * 1000,
  path: '/',
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: config.production ? 'none' : 'lax',
  maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, ver: Number(user.session_version || 0) },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: ACCESS_TTL_SECONDS,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: randomUUID(),
    }
  );
}

export function getUserFromToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

export function hashToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}

function isPasswordChangeFlow(req) {
  const path = req.originalUrl || req.path || '';
  return (
    path.startsWith('/api/auth/me') ||
    path.startsWith('/api/auth/logout') ||
    path.startsWith('/api/auth/refresh') ||
    path.startsWith('/api/workspace/staff/password') ||
    path.startsWith('/api/workspace/profile/avatar')
  );
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Sign in required.', code: 'AUTH_REQUIRED' });
    const session = getUserFromToken(token);
    const { rows } = await query(
      'SELECT id, role, active, must_change_password, session_version FROM staff_users WHERE id = $1',
      [session.sub]
    );
    const user = rows[0];
    if (!user || !user.active) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Staff account is inactive.', code: 'ACCOUNT_INACTIVE' });
    }
    if (Number(session.ver || 0) !== Number(user.session_version || 0)) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Session expired. Sign in again.', code: 'SESSION_REVOKED' });
    }
    req.auth = { sub: user.id, role: user.role, mustChangePassword: Boolean(user.must_change_password) };
    if (user.must_change_password && !isPasswordChangeFlow(req)) {
      return res.status(403).json({
        error: 'Change your temporary password to continue.',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }
    next();
  } catch (error) {
    const expired = error?.name === 'TokenExpiredError' || error?.name === 'JsonWebTokenError' || error?.name === 'NotBeforeError';
    clearSessionCookies(res);
    return res.status(401).json({
      error: expired ? 'Session expired. Sign in again.' : 'Sign in required.',
      code: expired ? 'SESSION_EXPIRED' : 'AUTH_FAILED',
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.', code: 'FORBIDDEN' });
    }
    next();
  };
}

export function clearSessionCookies(res) {
  res.clearCookie(COOKIE_NAME, { ...accessCookieOptions, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
}

export async function revokeAllSessions(userId) {
  await query('UPDATE staff_users SET session_version = session_version + 1 WHERE id = $1', [userId]);
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [hashToken(token)]
  );
}

export async function issueSession(res, user) {
  const { rows } = await query(
    `SELECT id, name, email, role, bio, avatar_url, must_change_password, can_manage_email, session_version
     FROM staff_users WHERE id = $1 AND active = TRUE`,
    [user.id]
  );
  const fresh = rows[0];
  if (!fresh) throw new Error('Staff account is inactive.');
  const refreshToken = randomBytes(32).toString('base64url');
  const { rows: inserted } = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' days')::interval) RETURNING id`,
    [fresh.id, hashToken(refreshToken), String(REFRESH_TTL_DAYS)]
  );
  res.cookie(COOKIE_NAME, signSession(fresh), accessCookieOptions);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);
  return { user: fresh, refreshId: inserted[0].id };
}

export async function rotateRefreshToken(res, token) {
  if (!token) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id, user_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = $1 FOR UPDATE',
      [hashToken(token)]
    );
    const current = rows[0];
    if (!current || current.revoked_at || new Date(current.expires_at).getTime() <= Date.now()) {
      await client.query('ROLLBACK');
      if (current?.user_id) await revokeAllSessions(current.user_id);
      return null;
    }

    const nextToken = randomBytes(32).toString('base64url');
    const inserted = await client.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' days')::interval) RETURNING id`,
      [current.user_id, hashToken(nextToken), String(REFRESH_TTL_DAYS)]
    );
    await client.query(
      'UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by = $1 WHERE id = $2',
      [inserted.rows[0].id, current.id]
    );
    await client.query('COMMIT');

    const fresh = await query('SELECT * FROM staff_users WHERE id = $1 AND active = TRUE', [current.user_id]);
    if (!fresh.rows[0]) return null;
    res.cookie(REFRESH_COOKIE_NAME, nextToken, refreshCookieOptions);
    return fresh.rows[0];
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
  }
}
