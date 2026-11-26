import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { logAudit } from '../audit.js';
import { requireUuid, safeText } from '../validation.js';
import { privateUploadPath } from './uploads.js';

const router = Router();
const profileDir = path.join(privateUploadPath, 'profiles');
await fs.mkdir(profileDir, { recursive: true });

const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp']]);
const profileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) return callback(new Error('Use a JPG, PNG, or WebP image.'));
    callback(null, true);
  },
});

const AVAILABILITY = new Set(['available', 'busy', 'away', 'dnd', 'offline']);
const PREFERRED_CONTACT = new Set(['message', 'email', 'phone']);
const ACHIEVEMENT_TYPES = new Set(['milestone', 'training', 'certification', 'award', 'recognition', 'accomplishment']);
const SELF_ACHIEVEMENT_TYPES = new Set(['training', 'certification']);
const FILENAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;

const PROFILE_COLUMNS = `id, name, email, role, bio, avatar_url, cover_image,
  preferred_name, job_title, department, employee_id, employment_status, availability_status,
  work_phone, office_location, working_hours, preferred_contact,
  skills, qualifications, languages, interests, experience, created_at`;

function isManager(role) {
  return role === 'owner' || role === 'admin';
}

function parseList(value, maxItems = 20, maxLength = 140) {
  if (value === undefined) return undefined;
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\n,;]+/) : [];
  return raw.map((item) => safeText(item, maxLength)).filter(Boolean).slice(0, maxItems);
}

function formatUser(row, permissions = {}) {
  const canEdit = Boolean(permissions.canEdit);
  const canManage = Boolean(permissions.canManage);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    bio: row.bio || '',
    avatarUrl: row.avatar_url ? `/api/workspace/profile/avatar/${row.id}` : null,
    coverUrl: row.cover_image ? `/api/workspace/profile/cover/${row.id}` : null,
    preferredName: row.preferred_name || '',
    jobTitle: row.job_title || '',
    department: row.department || '',
    employeeId: row.employee_id || '',
    employmentStatus: row.employment_status || 'active',
    availabilityStatus: row.availability_status || 'available',
    workPhone: row.work_phone || '',
    officeLocation: row.office_location || '',
    workingHours: row.working_hours || '',
    preferredContact: row.preferred_contact || 'message',
    skills: row.skills || [],
    qualifications: row.qualifications || [],
    languages: row.languages || [],
    interests: row.interests || [],
    experience: row.experience || [],
    dateJoined: row.created_at,
    canEdit,
    canManage,
  };
}

async function loadAchievements(userId, viewerId, manager) {
  const { rows } = await query(
    `SELECT a.id, a.user_id, a.created_by, a.type, a.title, a.description, a.occurred_on, a.created_at,
            creator.name AS created_by_name,
            (a.created_by = $2 OR $3 = TRUE) AS can_delete
     FROM staff_achievements a
     LEFT JOIN staff_users creator ON creator.id = a.created_by
     WHERE a.user_id = $1
     ORDER BY a.occurred_on DESC NULLS LAST, a.created_at DESC
     LIMIT 50`,
    [userId, viewerId, manager]
  );
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    description: row.description || '',
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
    createdById: row.created_by,
    createdByName: row.created_by_name || 'Workspace',
    canDelete: Boolean(row.can_delete) || row.created_by === viewerId,
  }));
}

async function loadWork(userId, viewerId, manager) {
  const canSeeTasks = viewerId === userId || manager;
  const [projectRows, noteRows, taskRows, completedRows, upcomingRows, commentRows] = await Promise.all([
    query(
      `SELECT id, title, excerpt, category, cover_image, published_at
       FROM content_items
       WHERE type = 'project' AND status = 'published' AND author_id = $1
       ORDER BY published_at DESC NULLS LAST, updated_at DESC LIMIT 4`,
      [userId]
    ),
    query(
      `SELECT id, body, created_at FROM team_notes WHERE author_id = $1 ORDER BY created_at DESC LIMIT 4`,
      [userId]
    ),
    canSeeTasks ? query(
      `SELECT id, title, status, priority, due_at, updated_at FROM tasks
       WHERE assigned_to = $1 AND status <> 'done'
       ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'approval_requested' THEN 1 ELSE 2 END,
                due_at ASC NULLS LAST, updated_at DESC LIMIT 5`,
      [userId]
    ) : Promise.resolve({ rows: [] }),
    canSeeTasks ? query(
      `SELECT id, title, status, due_at, updated_at FROM tasks
       WHERE assigned_to = $1 AND status = 'done' ORDER BY updated_at DESC LIMIT 3`,
      [userId]
    ) : Promise.resolve({ rows: [] }),
    canSeeTasks ? query(
      `SELECT id, title, status, priority, due_at FROM tasks
       WHERE assigned_to = $1 AND status <> 'done' AND due_at >= NOW() AND due_at <= NOW() + INTERVAL '30 days'
       ORDER BY due_at ASC LIMIT 4`,
      [userId]
    ) : Promise.resolve({ rows: [] }),
    canSeeTasks ? query(
      `SELECT c.id, c.body, c.created_at, t.title AS task_title
       FROM task_comments c JOIN tasks t ON t.id = c.task_id
       WHERE c.author_id = $1 ORDER BY c.created_at DESC LIMIT 4`,
      [userId]
    ) : Promise.resolve({ rows: [] }),
  ]);

  const noteUpdates = noteRows.rows.map((row) => ({ id: `note-${row.id}`, kind: 'note', body: row.body, createdAt: row.created_at }));
  const commentUpdates = commentRows.rows.map((row) => ({ id: `comment-${row.id}`, kind: 'task_comment', body: row.body, taskTitle: row.task_title, createdAt: row.created_at }));
  const recentUpdates = [...noteUpdates, ...commentUpdates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return {
    projects: projectRows.rows,
    responsibilities: taskRows.rows,
    completedTasks: completedRows.rows,
    upcomingTasks: upcomingRows.rows,
    recentUpdates,
    tasksRestricted: !canSeeTasks,
  };
}

async function profileResponse(userId, viewerId, viewerRole) {
  const { rows } = await query(`SELECT ${PROFILE_COLUMNS} FROM staff_users WHERE id = $1 AND active = TRUE`, [userId]);
  if (!rows[0]) return null;
  const manager = isManager(viewerRole);
  return {
    profile: formatUser(rows[0], { canEdit: viewerId === userId, canManage: manager }),
    achievements: await loadAchievements(userId, viewerId, manager),
    work: await loadWork(userId, viewerId, manager),
  };
}

function imageUpload(field) {
  return (req, res, next) => profileUpload.single(field)(req, res, (uploadError) => {
    if (uploadError) return res.status(400).json({ error: uploadError.message });
    next();
  });
}

async function saveProfileImage(req, res, next, { column, width, height, fit, label }) {
  if (!req.file) return res.status(400).json({ error: `Choose a ${label} first.` });
  const filename = `${randomUUID()}.webp`;
  const destination = path.join(profileDir, filename);
  try {
    await sharp(req.file.buffer)
      .rotate()
      .resize(width, height, { fit, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(destination);
    const previous = await query(`SELECT ${column} FROM staff_users WHERE id = $1 AND active = TRUE`, [req.auth.sub]);
    if (!previous.rows[0]) {
      await fs.unlink(destination).catch(() => {});
      return res.status(404).json({ error: 'Staff profile not found.' });
    }
    const { rows } = await query(
      `UPDATE staff_users SET ${column} = $1 WHERE id = $2 RETURNING ${PROFILE_COLUMNS}`,
      [filename, req.auth.sub]
    );
    const oldName = path.basename(previous.rows[0][column] || '');
    if (oldName && oldName !== filename && FILENAME_RE.test(oldName)) {
      await fs.unlink(path.join(profileDir, oldName)).catch(() => {});
    }
    res.status(201).json({ profile: formatUser(rows[0], { canEdit: true, canManage: isManager(req.auth.role) }) });
  } catch (error) {
    await fs.unlink(destination).catch(() => {});
    if (error.message?.includes('Input buffer') || error.message?.includes('unsupported image')) {
      return res.status(400).json({ error: 'The selected file is not a valid image.' });
    }
    next(error);
  }
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await profileResponse(req.auth.sub, req.auth.sub, req.auth.role);
    if (!result) return res.status(404).json({ error: 'Staff profile not found.' });
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/avatar/:userId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT avatar_url FROM staff_users WHERE id = $1 AND active = TRUE', [req.params.userId]);
    const filename = path.basename(rows[0]?.avatar_url || '');
    if (!FILENAME_RE.test(filename)) return res.status(404).end();
    res.set('Cache-Control', 'private, max-age=300');
    res.sendFile(path.join(profileDir, filename), { dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).end();
    });
  } catch (error) { next(error); }
});

router.get('/cover/:userId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT cover_image FROM staff_users WHERE id = $1 AND active = TRUE', [req.params.userId]);
    const filename = path.basename(rows[0]?.cover_image || '');
    if (!FILENAME_RE.test(filename)) return res.status(404).end();
    res.set('Cache-Control', 'private, max-age=300');
    res.sendFile(path.join(profileDir, filename), { dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).end();
    });
  } catch (error) { next(error); }
});

router.patch('/', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const updates = {};
    if (Object.hasOwn(body, 'name')) {
      const name = safeText(body.name, 80);
      if (!name) return res.status(400).json({ error: 'Your display name is required.' });
      updates.name = name;
    }
    if (Object.hasOwn(body, 'bio')) updates.bio = safeText(body.bio, 1500);
    if (Object.hasOwn(body, 'preferredName')) updates.preferred_name = safeText(body.preferredName, 60);
    if (Object.hasOwn(body, 'workPhone')) updates.work_phone = safeText(body.workPhone, 40);
    if (Object.hasOwn(body, 'officeLocation')) updates.office_location = safeText(body.officeLocation, 120);
    if (Object.hasOwn(body, 'workingHours')) updates.working_hours = safeText(body.workingHours, 120);
    if (Object.hasOwn(body, 'preferredContact')) {
      const value = safeText(body.preferredContact, 20);
      if (!PREFERRED_CONTACT.has(value)) return res.status(400).json({ error: 'Choose a valid preferred contact method.' });
      updates.preferred_contact = value;
    }
    if (Object.hasOwn(body, 'availabilityStatus')) {
      const value = safeText(body.availabilityStatus, 20);
      if (!AVAILABILITY.has(value)) return res.status(400).json({ error: 'Choose a valid availability status.' });
      updates.availability_status = value;
    }
    for (const [key, column] of [['skills', 'skills'], ['qualifications', 'qualifications'], ['languages', 'languages'], ['interests', 'interests'], ['experience', 'experience']]) {
      const parsed = parseList(body[key]);
      if (parsed !== undefined) updates[column] = parsed;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No profile changes were provided.' });

    const keys = Object.keys(updates);
    const values = keys.map((key) => updates[key]);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const { rows } = await query(
      `UPDATE staff_users SET ${setClause} WHERE id = $${keys.length + 1} AND active = TRUE RETURNING ${PROFILE_COLUMNS}`,
      [...values, req.auth.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Staff profile not found.' });
    void logAudit({ actorId: req.auth.sub, action: 'profile.update', entityType: 'staff_user', entityId: req.auth.sub, details: { fields: keys } });
    res.json({ profile: formatUser(rows[0], { canEdit: true, canManage: isManager(req.auth.role) }) });
  } catch (error) { next(error); }
});

router.post('/avatar', requireAuth, imageUpload('avatar'), (req, res, next) => {
  saveProfileImage(req, res, next, { column: 'avatar_url', width: 512, height: 512, fit: 'inside', label: 'profile photo' });
});

router.post('/cover', requireAuth, imageUpload('cover'), (req, res, next) => {
  saveProfileImage(req, res, next, { column: 'cover_image', width: 1600, height: 600, fit: 'cover', label: 'cover image' });
});

router.post('/achievements', requireAuth, async (req, res, next) => {
  try {
    const manager = isManager(req.auth.role);
    const userId = req.body?.userId ? requireUuid(req.body.userId, 'staff member') : req.auth.sub;
    if (userId !== req.auth.sub && !manager) return res.status(403).json({ error: 'Only admins can add recognition for another employee.' });
    const type = safeText(req.body?.type, 40);
    if (!ACHIEVEMENT_TYPES.has(type)) return res.status(400).json({ error: 'Choose a valid achievement type.' });
    if (!manager && !SELF_ACHIEVEMENT_TYPES.has(type)) return res.status(403).json({ error: 'You can add your own training and certifications.' });
    const title = safeText(req.body?.title, 140);
    if (!title) return res.status(400).json({ error: 'Give this achievement a title.' });
    const description = safeText(req.body?.description, 500);
    const occurredOn = req.body?.occurredOn ? safeText(req.body.occurredOn, 10) : null;
    if (occurredOn && !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return res.status(400).json({ error: 'Enter a valid date.' });
    const { rows: targets } = await query('SELECT id FROM staff_users WHERE id = $1 AND active = TRUE', [userId]);
    if (!targets[0]) return res.status(404).json({ error: 'Staff member not found.' });
    const { rows } = await query(
      `INSERT INTO staff_achievements (user_id, created_by, type, title, description, occurred_on)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, created_by, type, title, description, occurred_on, created_at`,
      [userId, req.auth.sub, type, title, description, occurredOn]
    );
    void logAudit({ actorId: req.auth.sub, action: 'profile.achievement_add', entityType: 'staff_achievement', entityId: rows[0].id, details: { userId, type, title } });
    res.status(201).json({ achievement: { ...rows[0], canDelete: true, createdByName: 'You' } });
  } catch (error) { next(error); }
});

router.delete('/achievements/:id', requireAuth, async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'achievement');
    const { rows } = await query('SELECT user_id, created_by FROM staff_achievements WHERE id = $1', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Achievement not found.' });
    if (!isManager(req.auth.role) && rows[0].created_by !== req.auth.sub) {
      return res.status(403).json({ error: 'You can only remove achievements you added.' });
    }
    await query('DELETE FROM staff_achievements WHERE id = $1', [id]);
    void logAudit({ actorId: req.auth.sub, action: 'profile.achievement_delete', entityType: 'staff_achievement', entityId: id });
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const userId = requireUuid(req.params.userId, 'staff member');
    const result = await profileResponse(userId, req.auth.sub, req.auth.role);
    if (!result) return res.status(404).json({ error: 'Staff profile not found.' });
    res.json(result);
  } catch (error) { next(error); }
});

export default router;
