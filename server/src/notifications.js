import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');
import { config } from './config.js';
import { query } from './db.js';

function recipientsFor(to) {
  const values = Array.isArray(to) ? to : String(to || '').split(',');
  return values.map((value) => typeof value === 'string' ? { email: value.trim() } : value).filter((value) => value.email);
}

export async function sendStaffEmail({ to, subject, text, replyTo }) {
  if (!config.resendApiKey) throw new Error('RESEND_API_KEY is not configured.');
  if (!config.mailFrom) throw new Error('MAIL_FROM is not configured.');
  const recipients = recipientsFor(to).map((recipient) => recipient.email);
  if (!recipients.length) throw new Error('No email recipients were configured.');
  const payload = {
    from: `${config.mailFromName} <${config.mailFrom}>`,
    to: recipients,
    subject,
    text,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || result.name || `Resend rejected the email (${response.status}).`);
  return result;
}

export async function sendStaffInvite({ name, email, temporaryPassword }) {
  const loginUrl = `${config.frontendOrigin.split(',')[0].trim().replace(/\/$/, '')}/staff`;
  return sendStaffEmail({
    to: email,
    subject: 'Your Ledge Roofing staff workspace invitation',
    text: [
      `Hello ${name},`,
      '',
      'Your Ledge Roofing staff workspace account is ready.',
      `Sign in: ${loginUrl}`,
      `Work email: ${email}`,
      `Temporary password: ${temporaryPassword}`,
      '',
      'You will be required to set a new password the first time you sign in.',
      'If you were not expecting this invitation, contact your workspace owner.',
    ].join('\n'),
  });
}

export async function notifyUser(io, userId, notification) {
  const { rows } = await query(
    `INSERT INTO notifications (user_id, kind, title, body, href)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, kind, title, body, href, read_at, created_at`,
    [userId, notification.kind, notification.title, notification.body || '', notification.href || '/staff']
  );
  const saved = rows[0];
  io?.to(`user:${userId}`).emit('notification:new', saved);

  const recipients = await query('SELECT email FROM staff_users WHERE id = $1 AND active = TRUE', [userId]);
  const email = recipients.rows[0]?.email;
  if (email && notification.email !== false) {
    try {
      await sendStaffEmail({
        to: email,
        subject: notification.title,
        text: `${notification.body || notification.title}\n\nOpen your staff workspace: ${config.frontendOrigin.split(',')[0].trim()}${notification.href || '/staff'}`,
      });
    } catch (error) {
      console.error('Staff notification email failed:', error.message);
    }
  }

  if (config.vapidPublicKey && config.vapidPrivateKey) {
    webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
    const subscriptions = await query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [userId]);
    await Promise.allSettled(subscriptions.rows.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify({ title: notification.title, body: notification.body || '', url: notification.href || '/staff', tag: saved.id })
        );
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          await query('DELETE FROM push_subscriptions WHERE id = $1', [subscription.id]);
        } else {
          console.error('Browser push failed:', error.statusCode || error.message);
        }
      }
    }));
  }
  return saved;
}

export async function notifyUsers(io, userIds, notification) {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.allSettled(unique.map((userId) => notifyUser(io, userId, notification)));
}
