import { Router } from 'express';
import { createLimiter } from '../rateLimit.js';
import path from 'node:path';
import fs from 'node:fs';
import { query, withTransaction } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';
import { privateUploadPath } from './uploads.js';
import { brandedEmailHtml } from '../notifications.js';
import { config } from '../config.js';
import { logAudit } from '../audit.js';
import { isEmail, isUuid, normalizeEmail, requireUuid } from '../validation.js';

const router = Router();
const drawingsDir = path.join(privateUploadPath, 'drawings');
const sendLimiter = createLimiter('drawing-share', { windowMs: 15 * 60 * 1000, limit: 20 });

// Drawing submissions are private. Owners/admins manage all submissions; other
// staff can only see submissions assigned to them.
router.use(requireAuth);

async function canAccessSubmission(req, submissionId) {
  if (['owner', 'admin'].includes(req.auth.role)) return true;
  const { rows } = await query(
    'SELECT 1 FROM drawing_submission_assignments WHERE submission_id = $1 AND user_id = $2',
    [submissionId, req.auth.sub]
  );
  return Boolean(rows[0]);
}

router.get('/', async (req, res, next) => {
  try {
    const isManager = ['owner', 'admin'].includes(req.auth.role);
    const { rows } = await query(
      `SELECT s.id, s.name, s.email, s.phone, s.service, s.message, s.created_at,
              COALESCE(json_agg(json_build_object(
                'id', f.id, 'originalName', f.original_name, 'storedName', f.stored_name,
                'mimeType', f.mime_type, 'sizeBytes', f.size_bytes, 'createdAt', f.created_at
              ) ORDER BY f.created_at) FILTER (WHERE f.id IS NOT NULL), '[]'::json) AS files,
              COALESCE((
                SELECT json_agg(json_build_object('id', su.id, 'name', su.name) ORDER BY su.name)
                FROM drawing_submission_assignments da
                JOIN staff_users su ON su.id = da.user_id
                WHERE da.submission_id = s.id
              ), '[]'::json) AS assignees
       FROM drawing_submissions s
       LEFT JOIN drawing_submission_files f ON f.submission_id = s.id
       WHERE $1::boolean OR EXISTS (
         SELECT 1 FROM drawing_submission_assignments a
         WHERE a.submission_id = s.id AND a.user_id = $2
       )
       GROUP BY s.id
       ORDER BY s.created_at DESC
       LIMIT 100`,
      [isManager, req.auth.sub]
    );
    res.json({ submissions: rows });
  } catch (error) { next(error); }
});

router.get('/files/:storedName', async (req, res, next) => {
  try {
    const storedName = String(req.params.storedName || '');
    if (!/^[a-zA-Z0-9._-]+$/.test(storedName) || storedName.includes('..')) return res.status(400).json({ error: 'Invalid file.' });
    const { rows } = await query(
      'SELECT id, submission_id, original_name, mime_type FROM drawing_submission_files WHERE stored_name = $1 LIMIT 1',
      [storedName]
    );
    const file = rows[0];
    if (!file) return res.status(404).json({ error: 'File not found.' });
    if (!(await canAccessSubmission(req, file.submission_id))) return res.status(403).json({ error: 'You are not assigned to this submission.', code: 'FORBIDDEN' });
    const full = path.join(drawingsDir, storedName);
    if (!full.startsWith(`${drawingsDir}${path.sep}`) || !fs.existsSync(full)) return res.status(404).json({ error: 'File not found.' });
    void logAudit({ actorId: req.auth.sub, action: 'drawing.file_view', entityType: 'drawing_submission', entityId: file.submission_id, details: { storedName } });
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${String(file.original_name).replace(/["\r\n]/g, '')}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(full);
  } catch (error) { next(error); }
});

router.get('/:id/assignees', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'submission');
    const { rows } = await query(
      `SELECT su.id, su.name, su.role
       FROM drawing_submission_assignments da
       JOIN staff_users su ON su.id = da.user_id
       WHERE da.submission_id = $1 AND su.active = TRUE
       ORDER BY su.name`,
      [id]
    );
    res.json({ assignees: rows });
  } catch (error) { next(error); }
});

router.put('/:id/assignees', requireRole('owner', 'admin'), async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'submission');
    const raw = Array.isArray(req.body?.userIds) ? req.body.userIds : [];
    const userIds = [...new Set(raw.filter(isUuid))];
    if (raw.length && userIds.length !== raw.length) return res.status(400).json({ error: 'Invalid staff selection.' });
    const exists = await query('SELECT id FROM drawing_submissions WHERE id = $1', [id]);
    if (!exists.rows[0]) return res.status(404).json({ error: 'Submission not found.' });

    const assignees = await withTransaction(async (client) => {
      await client.query('DELETE FROM drawing_submission_assignments WHERE submission_id = $1', [id]);
      for (const userId of userIds) {
        await client.query(
          `INSERT INTO drawing_submission_assignments (submission_id, user_id, assigned_by)
           SELECT $1, id, $3 FROM staff_users WHERE id = $2 AND active = TRUE`,
          [id, userId, req.auth.sub]
        );
      }
      const { rows } = await client.query(
        `SELECT su.id, su.name, su.role FROM drawing_submission_assignments da
         JOIN staff_users su ON su.id = da.user_id
         WHERE da.submission_id = $1 AND su.active = TRUE ORDER BY su.name`,
        [id]
      );
      return rows;
    });
    void logAudit({ actorId: req.auth.sub, action: 'drawing.assignees_updated', entityType: 'drawing_submission', entityId: id, details: { userIds } });
    res.json({ assignees });
  } catch (error) { next(error); }
});

router.post('/:id/send', requireRole('owner', 'admin'), sendLimiter, async (req, res, next) => {
  try {
    const id = requireUuid(req.params.id, 'submission');
    const toEmailRaw = normalizeEmail(req.body?.email);
    const toUserId = String(req.body?.userId || '').trim();
    const note = String(req.body?.message || '').trim().slice(0, 2000);
    let toEmail = toEmailRaw;
    let recipientName = toEmailRaw;
    if (toUserId) {
      if (!isUuid(toUserId)) return res.status(400).json({ error: 'Invalid recipient.' });
      const { rows } = await query('SELECT name, email FROM staff_users WHERE id = $1 AND active = TRUE', [toUserId]);
      if (!rows[0]?.email) return res.status(404).json({ error: 'Recipient not found.' });
      toEmail = rows[0].email.toLowerCase();
      recipientName = rows[0].name;
    }
    if (!isEmail(toEmail)) return res.status(400).json({ error: 'A valid recipient email is required.' });

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

    void logAudit({ actorId: req.auth.sub, action: 'drawing.share', entityType: 'drawing_submission', entityId: id, details: { recipient: toEmail, files: files.length } });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

export default router;
