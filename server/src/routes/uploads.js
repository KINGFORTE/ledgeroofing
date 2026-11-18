import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { requireAuth } from '../auth.js';

const router = Router();
const uploadPath = path.resolve(config.uploadDir);
const publicUploadPath = path.join(uploadPath, 'public');
const privateUploadPath = path.join(uploadPath, 'private');
fs.mkdirSync(publicUploadPath, { recursive: true });
fs.mkdirSync(privateUploadPath, { recursive: true });

const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'application/pdf',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.pdf']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, callback) => callback(null, req.body.scope === 'chat' ? privateUploadPath : publicUploadPath),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { files: 5, fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (req.body.scope && !['chat', 'public'].includes(req.body.scope)) return callback(new Error('Invalid upload scope.'));
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      return callback(new Error('That file type is not supported.'));
    }
    callback(null, true);
  },
});

router.post('/', requireAuth, (req, res) => {
  upload.array('files', 5)(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message });
    if (req.body.scope && !['chat', 'public'].includes(req.body.scope)) return res.status(400).json({ error: 'Invalid upload scope.' });
    const isPrivate = req.body.scope === 'chat';
    const files = (req.files || []).map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: isPrivate ? null : `/uploads/${file.filename}`,
      storedName: file.filename,
      scope: isPrivate ? 'chat' : 'public',
    }));
    res.status(201).json({ files });
  });
});

export { publicUploadPath, privateUploadPath };
export default router;
