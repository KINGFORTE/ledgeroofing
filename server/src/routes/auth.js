import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { COOKIE_NAME, requireAuth, signSession } from '../auth.js';
import { config } from '../config.js';

const router = Router();
const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: config.production ? 'none' : 'lax',
  maxAge: 12 * 60 * 60 * 1000,
  path: '/',
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    bio: user.bio || '',
    avatarUrl: user.avatar_url ? `/api/workspace/profile/avatar/${user.id}` : null,
    mustChangePassword: user.must_change_password,
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
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password || password.length > 200) {
      return res.status(400).json({ error: 'Enter your work email and password.' });
    }

    const { rows } = await query(
      'SELECT id, name, email, password_hash, role, bio, avatar_url, must_change_password FROM staff_users WHERE email = $1 AND active = TRUE',
      [email]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    await query('UPDATE staff_users SET last_seen_at = NOW() WHERE id = $1', [user.id]);
    await markAttendance(user.id);
    await markAttendance(user.id);
    res.cookie(COOKIE_NAME, signSession(user), cookieOptions);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, bio, avatar_url, must_change_password FROM staff_users WHERE id = $1 AND active = TRUE',
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
