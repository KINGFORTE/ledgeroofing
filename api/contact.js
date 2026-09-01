import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function sanitize(value) {
  return String(value ?? '').trim().slice(0, 500);
}

function sanitizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .filter((f) => f && typeof f === 'object')
    .slice(0, 20)
    .map((f) => ({
      name: sanitize(f.name),
      size: Number(f.size) || 0,
      type: sanitize(f.type),
    }));
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};

  const name = sanitize(body.name);
  const phone = sanitize(body.phone);
  const email = sanitize(body.email);
  const service = sanitize(body.service);
  const message = sanitize(body.message);
  const files = sanitizeFiles(body.files);

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const fileSection = files.length > 0
    ? [
        '',
        'Attached Drawings:',
        ...files.map((f, i) => `  ${i + 1}. ${f.name} (${f.type || 'unknown type'}, ${formatFileSize(f.size)})`),
        '',
        'Note: The customer selected these drawing files during submission.',
        'Please ask the customer to send the actual files via WhatsApp or email for review.',
      ].join('\n')
    : '';

  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO_EMAIL,
      replyTo: email || process.env.SMTP_USER,
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
  } catch (err) {
    console.error('Failed to send email:', err);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
}
