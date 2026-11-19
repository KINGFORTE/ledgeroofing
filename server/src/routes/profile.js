import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { privateUploadPath } from './uploads.js';

const router = Router();
const profileDir = path.join(privateUploadPath, 'profiles');
await fs.mkdir(profileDir, { recursive: true });
const allowed = new Map([['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp']]);
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, profileDir),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${allowed.get(file.mimetype) || '.img'}`),
  }),
  limits: { files: 1, fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) return callback(new Error('Use a JPG, PNG, or WebP profile photo.'));
    callback(null, true);
  },
});

function formatUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role, bio: row.bio || '', avatarUrl: row.avatar_url ? `/api/workspace/profile/avatar/${row.id}` : null };
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email, role, bio, avatar_url FROM staff_users WHERE id = $1 AND active = TRUE', [req.auth.sub]);
    if (!rows[0]) return res.status(404).json({ error: 'Staff profile not found.' });
    res.json({ profile: formatUser(rows[0]) });
  } catch (error) { next(error); }
});


router.get('/avatar/:userId', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT avatar_url FROM staff_users WHERE id = $1 AND active = TRUE', [req.params.userId]);
    const filename = path.basename(rows[0]?.avatar_url || '');
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename)) return res.status(404).end();
    res.set('Cache-Control', 'private, max-age=300');
    res.sendFile(path.join(profileDir, filename), { dotfiles: 'deny' }, (error) => {
      if (error && !res.headersSent) res.status(error.statusCode || 404).end();
    });
  } catch (error) { next(error); }
});

router.patch('/', requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 80);
    const bio = String(req.body?.bio || '').trim().slice(0, 800);
    if (!name) return res.status(400).json({ error: 'Your display name is required.' });
    const { rows } = await query(
      'UPDATE staff_users SET name = $1, bio = $2 WHERE id = $3 AND active = TRUE RETURNING id, name, email, role, bio, avatar_url',
      [name, bio, req.auth.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Staff profile not found.' });
    res.json({ profile: formatUser(rows[0]) });
  } catch (error) { next(error); }
});

router.post('/avatar', requireAuth, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, async (uploadError) => {
    if (uploadError) return res.status(400).json({ error: uploadError.message });
    if (!req.file) return res.status(400).json({ error: 'Choose a profile photo first.' });
    try {
      const previous = await query('SELECT avatar_url FROM staff_users WHERE id = $1 AND active = TRUE', [req.auth.sub]);
      if (!previous.rows[0]) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({ error: 'Staff profile not found.' });
      }
      const { rows } = await query('UPDATE staff_users SET avatar_url = $1 WHERE id = $2 RETURNING id, name, email, role, bio, avatar_url', [req.file.filename, req.auth.sub]);
      const previousUrl = previous.rows[0].avatar_url;
      if (previousUrl) {
        const oldName = path.basename(previousUrl);
        if (oldName !== req.file.filename) await fs.unlink(path.join(profileDir, oldName)).catch(() => {});
      }
      res.status(201).json({ profile: formatUser(rows[0]) });
    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {});
      next(error);
    }
  });
});

export default router;
