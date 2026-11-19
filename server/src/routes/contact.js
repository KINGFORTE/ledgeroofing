import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { sendStaffEmail } from '../notifications.js';
import { config } from '../config.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

function sanitize(value, maxLength = 500) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, maxLength);
}

function sanitizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return files.filter((file) => file && typeof file === 'object').slice(0, 20).map((file) => ({
    name: sanitize(file.name, 200),
    size: Number(file.size) || 0,
    type: sanitize(file.type, 120),
  }));
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

router.post('/', limiter, async (req, res) => {
  if (!config.resendApiKey || !config.mailFrom || !config.contactToEmail) {
    return res.status(503).json({ error: 'Email service is not configured.' });
  }

  const name = sanitize(req.body?.name, 120);
  const phone = sanitize(req.body?.phone, 80);
  const email = sanitize(req.body?.email, 254);
  const service = sanitize(req.body?.service, 160);
  const message = sanitize(req.body?.message, 5000);
  const files = sanitizeFiles(req.body?.files);

  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const fileSection = files.length > 0
    ? [
        '',
        'Attached Drawings:',
        ...files.map((file, index) => `  ${index + 1}. ${file.name} (${file.type || 'unknown type'}, ${formatFileSize(file.size)})`),
        '',
        'Note: The customer selected these drawing files during submission.',
        'Please ask the customer to send the actual files via WhatsApp or email for review.',
      ].join('\n')
    : '';

  try {
    await sendStaffEmail({
      to: config.contactToEmail,
      replyTo: email || undefined,
      subject: `New ${service ? `${service} ` : ''}inquiry from ${name}`,
      text: [
        `New website inquiry from ${name}:`,
        '',
        `Name: ${name}`,
        `Phone: ${phone}`,
        email ? `Email: ${email}` : 'Email: not provided',
        `Service: ${service || 'General inquiry'}`,
        '',
        'Message:',
        message || '(no message)',
        fileSection,
      ].join('\n'),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Failed to send contact inquiry:', error.message);
    return res.status(502).json({ error: 'Failed to send inquiry. Please try again later.' });
  }
});

export default router;
