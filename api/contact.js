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

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

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
      ].join('\n'),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to send email:', err);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
}
