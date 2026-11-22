import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { privateUploadPath } from './uploads.js';

const router = Router();
const drawingsDir = path.join(privateUploadPath, 'drawings');

router.get('/', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.id, s.name, s.email, s.phone, s.service, s.message, s.created_at,
              COALESCE(json_agg(json_build_object(
                'id', f.id, 'originalName', f.original_name, 'storedName', f.stored_name,
                'mimeType', f.mime_type, 'sizeBytes', f.size_bytes, 'createdAt', f.created_at
              ) ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL), '[]'::json) AS files
       FROM drawing_submissions s
       LEFT JOIN drawing_submission_files f ON f.submission_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT 100`
    );
    res.json({ submissions: rows });
  } catch (error) { next(error); }
});

router.get('/files/:storedName', requireAuth, async (req, res, next) => {
  try {
    const storedName = String(req.params.storedName || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(storedName)) return res.status(400).json({ error: 'Invalid file.' });
    const { rows } = await query('SELECT original_name, mime_type FROM drawing_submission_files WHERE stored_name = $1 LIMIT 1', [storedName]);
    const file = rows[0];
    if (!file) return res.status(404).json({ error: 'File not found.' });
    const full = path.join(drawingsDir, storedName);
    if (!full.startsWith(drawingsDir) || !fs.existsSync(full)) return res.status(404).json({ error: 'File not found.' });
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${String(file.original_name).replace(/"/g, '')}"`);
    res.sendFile(full);
  } catch (error) { next(error); }
});

export default router;
