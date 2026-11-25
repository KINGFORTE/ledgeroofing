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

function startsWith(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte);
}

// Reject files whose declared extension does not match their actual content.
// This stops HTML/SVG payloads disguised as images from being served publicly.
export function validateUploadedFile(file, { allowCad = false } = {}) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowCad && ['.dwg', '.dxf'].includes(ext)) return file;
  let header = Buffer.alloc(16);
  let bytesRead = 0;
  const handle = fs.openSync(file.path, 'r');
  try { bytesRead = fs.readSync(handle, header, 0, 16, 0); } finally { fs.closeSync(handle); }
  header = header.subarray(0, bytesRead);

  let valid = false;
  if (ext === '.jpg' || ext === '.jpeg') valid = startsWith(header, [0xff, 0xd8, 0xff]);
  else if (ext === '.png') valid = startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  else if (ext === '.gif') valid = header.subarray(0, 4).toString('ascii') === 'GIF8';
  else if (ext === '.webp') valid = header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  else if (ext === '.pdf') valid = header.subarray(0, 5).toString('ascii') === '%PDF-';
  else if (ext === '.mp4') valid = header.subarray(4, 8).toString('ascii') === 'ftyp';
  else if (ext === '.webm') valid = startsWith(header, [0x1a, 0x45, 0xdf, 0xa3]);

  if (!valid) throw new Error('A file did not match its declared type.');
  return file;
}

export function removeUploadedFile(file) {
  try { fs.unlinkSync(file.path); } catch {}
}

router.post('/', requireAuth, (req, res) => {
  upload.array('files', 5)(req, res, (error) => {
    if (error) return res.status(400).json({ error: error.message });
    if (req.body.scope && !['chat', 'public'].includes(req.body.scope)) return res.status(400).json({ error: 'Invalid upload scope.' });
    const files = req.files || [];
    for (const file of files) {
      try { validateUploadedFile(file); } catch (validationError) {
        files.forEach(removeUploadedFile);
        return res.status(400).json({ error: validationError.message });
      }
    }
    const isPrivate = req.body.scope === 'chat';
    const responseFiles = files.map((file) => ({
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: isPrivate ? null : `/uploads/${file.filename}`,
      storedName: file.filename,
      scope: isPrivate ? 'chat' : 'public',
    }));
    res.status(201).json({ files: responseFiles });
  });
});

export { publicUploadPath, privateUploadPath };
export default router;
