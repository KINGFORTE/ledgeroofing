import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import {
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  requireAuth,
  clearSessionCookies,
  getUserFromToken,
  issueSession,
  revokeRefreshToken,
  rotateRefreshToken,
  signSession,
} from '../auth.js';
import { config } from '../config.js';
import { logAudit } from '../audit.js';
import { isEmail, normalizeEmail } from '../validation.js';

const router = Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    avatarUrl: user.avatar_url ? `/api/workspace/profile/avatar/${user.id}` : null,
    coverUrl: user.cover_image ? `/api/workspace/profile/cover/${user.id}` : null,
    preferredName: user.preferred_name || '',
    jobTitle: user.job_title || '',
    department: user.department || '',
    employeeId: user.employee_id || '',
    employmentStatus: user.employment_status || 'active',
    availabilityStatus: user.availability_status || 'available',
    mustChangePassword: Boolean(user.must_change_password),
    canManageEmail: Boolean(user.can_manage_email || user.role === 'owner' || user.role === 'admin'),
  };
}

async function markAttendance(userId) {
  try {
    await query(
      `INSERT INTO attendance_days (user_id, attendance_date, first_seen_at, last_seen_at)
       VALUES ($1, (NOW() AT TIME ZONE $2)::date, NOW(), NOW())
       ON CONFLICT (user_id, attendance_date)
       DO UPDATE SET last_seen_at = GREATEST(attendance_days.last_seen_at, EXCLUDED.last_seen_at)`,
      [userId, config.attendanceTimeZone]
    );
  } catch (error) {
    // Attendance is supplementary; do not prevent a staff member from signing in.
    console.error('Attendance mark failed:', error.message);
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!isEmail(email) || !password || password.length > 200) {
      return res.status(400).json({ error: 'Enter your work email and password.' });
    }

    const { rows } = await query(
      `SELECT id, name, email, password_hash, role, bio, avatar_url, cover_image, preferred_name,
              job_title, department, employee_id, employment_status, availability_status,
              must_change_password, can_manage_email
       FROM staff_users WHERE email = $1 AND active = TRUE`,
      [email]
    );
    const user = rows[0];
    // Always run a bcrypt comparison to reduce user-enumeration timing differences.
    const matches = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, '$2b$12$K9I//Rc8Ht3bio7AO.bWj.BCSFOLyzK3xb9xLbcW7r5tD4815hi/a');
    if (!user || !matches) {
      void logAudit({ actorName: email, action: 'auth.login_failed', entityType: 'staff_user', details: { email } });
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await query('UPDATE staff_users SET last_seen_at = NOW() WHERE id = $1', [user.id]);
    await markAttendance(user.id);
    await issueSession(res, user);
    void logAudit({ actorId: user.id, actorName: user.name, action: 'auth.login', entityType: 'staff_user', entityId: user.id });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const rotated = await rotateRefreshToken(res, req.cookies?.[REFRESH_COOKIE_NAME]);
    if (!rotated) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'Session expired. Sign in again.', code: 'REFRESH_EXPIRED' });
    }
    res.cookie(COOKIE_NAME, signSession(rotated.user, rotated.sessionId), {
      httpOnly: true,
      secure: config.production,
      sameSite: config.production ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.json({ ok: true, user: publicUser(rotated.user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    let sub = null;
    let sid = null;
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      try {
        const session = getUserFromToken(token);
        sub = session.sub;
        sid = session.sid;
      } catch {}
    }
    await revokeRefreshToken(req.cookies?.[REFRESH_COOKIE_NAME]);
    if (sub && sid) {
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL', [sid, sub]);
    }
    clearSessionCookies(res);
    if (sub) void logAudit({ actorId: sub, action: 'auth.logout', entityType: 'staff_user', entityId: sub });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, bio, avatar_url, cover_image, preferred_name,
              job_title, department, employee_id, employment_status, availability_status,
              must_change_password, can_manage_email
       FROM staff_users WHERE id = $1 AND active = TRUE`,
      [req.auth.sub]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Staff account is inactive.' });
    await markAttendance(rows[0].id);
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

export default router;
