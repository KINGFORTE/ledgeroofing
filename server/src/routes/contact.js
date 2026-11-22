import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { sendStaffEmail, brandedEmailHtml } from '../notifications.js';
import { config } from '../config.js';
import { query } from '../db.js';
import { privateUploadPath } from './uploads.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false });
const drawingsDir = path.join(privateUploadPath, 'drawings');
fs.mkdirSync(drawingsDir, { recursive: true });

const allowedTypes = new Set(['application/pdf','image/jpeg','image/jpg','image/png','image/webp','application/dwg','application/dxf','application/acad','application/x-dwg','application/x-dxf','image/vnd.dwg','image/x-dwg']);
const allowedExt = new Set(['.pdf','.jpg','.jpeg','.png','.webp','.dwg','.dxf']);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, drawingsDir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { files: 20, fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.has(ext) && !allowedTypes.has(file.mimetype)) return cb(new Error('One or more files are not an accepted drawing type.'));
    cb(null, true);
  },
});

function sanitize(value, maxLength = 500) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

router.post('/', limiter, (req, res) => {
  upload.array('files', 20)(req, res, async (uploadError) => {
    if (uploadError) return res.status(400).json({ error: uploadError.message || 'Could not upload files.' });
    if (!config.resendApiKey || !config.mailFrom || !config.contactToEmail) {
      return res.status(503).json({ error: 'Email service is not configured.' });
    }

    const name = sanitize(req.body?.name, 120);
    const phone = sanitize(req.body?.phone, 80);
    const email = sanitize(req.body?.email, 254).toLowerCase();
    const service = sanitize(req.body?.service, 160);
    const message = sanitize(req.body?.message, 5000);
    const files = req.files || [];

    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    try {
      const sub = await query(
        `INSERT INTO drawing_submissions (name, email, phone, service, message)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, created_at`,
        [name, email, phone, service, message]
      );
      const submission = sub.rows[0];

      const storedFiles = [];
      for (const file of files) {
        const saved = await query(
          `INSERT INTO drawing_submission_files (submission_id, original_name, stored_name, mime_type, size_bytes)
           VALUES ($1,$2,$3,$4,$5) RETURNING id, original_name, stored_name, mime_type, size_bytes`,
          [submission.id, file.originalname, file.filename, file.mimetype || '', file.size || 0]
        );
        storedFiles.push(saved.rows[0]);
      }

      const dashboardBase = config.frontendOrigin.split(',')[0].trim().replace(/\/$/, '');
      const fileLines = storedFiles.length
        ? ['', 'Drawings received:', ...storedFiles.map((f, i) => `  ${i + 1}. ${f.original_name} (${f.mime_type || 'unknown type'}, ${formatFileSize(Number(f.size_bytes))})`), '', `View in dashboard: ${dashboardBase}/staff/drawings`]
        : [];

      await sendStaffEmail({
        to: config.contactToEmail,
        replyTo: email || undefined,
        subject: `New ${service ? `${service} ` : ''}${storedFiles.length ? 'drawing submission' : 'inquiry'} from ${name}`,
        text: [
          `New website submission from ${name}:`,
          '',
          `Name: ${name}`,
          `Phone: ${phone}`,
          `Email: ${email || 'not provided'}`,
          `Service: ${service || 'General inquiry'}`,
          '',
          'Message:',
          message || '(no message)',
          ...fileLines,
        ].join('\n'),
      });

      if (email && storedFiles.length) {
        const fileLines = storedFiles.map((f, i) => `${i + 1}. ${f.original_name}`);
        await sendStaffEmail({
          to: email,
          subject: 'We received your drawings - Ledge Roofing',
          text: [
            `Hello ${name},`,
            '',
            'Thank you for sending your drawings to Ledge Roofing. We have received your files and our team will review them shortly.',
            '',
            'Files received:',
            ...fileLines,
            '',
            'If we need any additional information, we will reach out to you.',
            '',
            'Best regards,',
            'Ledge Roofing Team',
          ].join('\n'),
          html: brandedEmailHtml({
            title: 'We Received Your Drawings',
            intro: `Hello ${name}, thank you for sending your drawings to Ledge Roofing.`,
            bodyLines: [
              'We have received your files and our team will review them shortly. If we need any additional information, we will reach out to you.',
              storedFiles.length ? `Files received: ${fileLines.join(' • ')}` : '',
            ].filter(Boolean),
            footerNote: 'Need help? Just reply to this email and our team will assist you.',
          }),
        });
      }

      return res.status(200).json({ ok: true, submissionId: submission.id, files: storedFiles.length });
    } catch (error) {
      console.error('Failed to handle contact inquiry:', error);
      return res.status(502).json({ error: 'Failed to send inquiry. Please try again later.' });
    }
  });
});

export default router;
