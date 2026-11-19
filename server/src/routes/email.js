import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { query } from '../db.js';
import { requireAuth } from '../auth.js';
import { sendStaffEmail } from '../notifications.js';

const router = Router();
const sendLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', requireAuth, sendLimit, async (req, res) => {
  const recipients = [...new Set(String(req.body?.to || '').split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const subject = String(req.body?.subject || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
  const text = String(req.body?.text || '').trim().slice(0, 10000);
  if (!recipients.length || recipients.length > 5 || recipients.some((email) => !EMAIL.test(email))) {
    return res.status(400).json({ error: 'Enter up to five valid email addresses, separated by commas or new lines.' });
  }
  if (!subject) return res.status(400).json({ error: 'An email subject is required.' });
  if (!text) return res.status(400).json({ error: 'An email message is required.' });

  try {
    const { rows } = await query('SELECT name, email FROM staff_users WHERE id = $1 AND active = TRUE', [req.auth.sub]);
    if (!rows[0]) return res.status(401).json({ error: 'Your staff account is inactive.' });
    const results = await Promise.allSettled(recipients.map((to) => sendStaffEmail({
      to,
      subject,
      text,
      replyTo: rows[0].email,
    })));
    const sent = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.length - sent;
    if (failed) {
      console.error(`Dashboard email send had ${failed} failed recipient(s).`);
      return res.status(502).json({ error: `Mail provider accepted ${sent} of ${recipients.length} recipient(s). Check delivery logs before retrying.` });
    }
    res.status(202).json({ ok: true, accepted: sent });
  } catch (error) {
    console.error('Dashboard email send failed:', error.message);
    res.status(502).json({ error: 'Email could not be sent. Check provider status and try again later.' });
  }
});

export default router;
