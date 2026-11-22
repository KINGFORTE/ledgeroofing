import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { privateUploadPath } from './uploads.js';
import { sendStaffEmail, brandedEmailHtml } from '../notifications.js';
import { config } from '../config.js';

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

router.post('/:id/send', requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Invalid submission.' });
    const toEmailRaw = String(req.body?.email || '').trim().toLowerCase();
    const toUserId = String(req.body?.userId || '').trim();
    const note = String(req.body?.message || '').trim().slice(0, 2000);
    let toEmail = toEmailRaw;
    let recipientName = toEmailRaw;
    if (toUserId) {
      if (!/^[0-9a-f-]{36}$/i.test(toUserId)) return res.status(400).json({ error: 'Invalid recipient.' });
      const { rows } = await query('SELECT name, email FROM staff_users WHERE id = $1 AND active = TRUE', [toUserId]);
      if (!rows[0]?.email) return res.status(404).json({ error: 'Recipient not found.' });
      toEmail = rows[0].email.toLowerCase();
      recipientName = rows[0].name;
    }
    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) return res.status(400).json({ error: 'A valid recipient email is required.' });

    const { rows: subs } = await query('SELECT id, name, email, phone, service, message, created_at FROM drawing_submissions WHERE id = $1', [id]);
    const sub = subs[0];
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });
    const { rows: files } = await query('SELECT original_name, stored_name, mime_type, size_bytes FROM drawing_submission_files WHERE submission_id = $1 ORDER BY created_at ASC', [id]);

    const attachments = [];
    let totalBytes = 0;
    for (const f of files) {
      const full = path.join(drawingsDir, f.stored_name);
      if (!full.startsWith(drawingsDir) || !fs.existsSync(full)) continue;
      const size = Number(f.size_bytes || 0);
      if (totalBytes + size > 35 * 1024 * 1024) continue;
      const buf = fs.readFileSync(full);
      totalBytes += buf.length;
      attachments.push({ filename: f.original_name, content: buf.toString('base64'), type: f.mime_type || 'application/octet-stream' });
    }

    const dashboardBase = config.frontendOrigin.split(',')[0].trim().replace(/\/$/, '');
    const sender = await query('SELECT name, email FROM staff_users WHERE id = $1', [req.auth.sub]);
    const senderName = sender.rows[0]?.name || 'Ledge Roofing Staff';
    const fileLines = files.map((f, i) => `${i + 1}. ${f.original_name} (${Math.round((Number(f.size_bytes)||0)/1024)} KB)`);
    const text = [
      `Hello ${recipientName || ''},`.trim(),
      '',
      `${senderName} shared drawing submission files from Ledge Roofing.`,
      '',
      `Submission: ${sub.name}`,
      `Service: ${sub.service || 'General inquiry'}`,
      `Submitted: ${new Date(sub.created_at).toLocaleString()}`,
      sub.email ? `Customer email: ${sub.email}` : '',
      sub.phone ? `Customer phone: ${sub.phone}` : '',
      note ? '' : null,
      note ? `Message: ${note}` : null,
      '',
      files.length ? 'Files:' : 'No files attached.',
      ...fileLines,
      '',
      `Dashboard: ${dashboardBase}/staff/drawings`,
    ].filter((l) => l !== null).join('\n');

    const html = brandedEmailHtml({
      title: 'Drawing Submission Shared',
      intro: `${senderName} shared drawing submission files with you.`,
      bodyLines: [
        `Submission: ${sub.name}${sub.service ? ` • ${sub.service}` : ''}`,
        `Submitted: ${new Date(sub.created_at).toLocaleString()}`,
        sub.email ? `Customer email: ${sub.email}` : '',
        sub.phone ? `Customer phone: ${sub.phone}` : '',
        note ? `Message: ${note}` : '',
        files.length ? `Files: ${fileLines.join(' • ')}` : 'No files attached.',
      ].filter(Boolean),
      ctaLabel: 'Open Dashboard',
      ctaUrl: `${dashboardBase}/staff/drawings`,
      footerNote: 'Shared securely from the Ledge Roofing staff dashboard.',
    });

    // Resend supports attachments in sendStaffEmail payload; pass through.
    if (!config.resendApiKey) throw new Error('RESEND_API_KEY is not configured.');
    if (!config.mailFrom) throw new Error('MAIL_FROM is not configured.');
    const payload = {
      from: `${config.mailFromName} <${config.mailFrom}>`,
      to: [toEmail],
      subject: `Drawing submission shared: ${sub.name}`,
      text,
      html,
      ...(attachments.length ? { attachments } : {}),
    };
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || result.name || `Resend rejected the email (${response.status}).`);

    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
