import nodemailer from 'nodemailer';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');
import { config } from './config.js';
import { query } from './db.js';

function mailTransport() {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) return null;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
}

export async function sendStaffEmail({ to, subject, text }) {
  const transporter = mailTransport();
  if (!transporter) throw new Error('SMTP is not configured.');
  return transporter.sendMail({
    from: { name: 'Ledge Roofing Workspace', address: config.smtpUser },
    to,
    subject,
    text,
  });
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
  if (email) {
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
