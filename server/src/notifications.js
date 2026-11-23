import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const webpush = require('web-push');
import { config } from './config.js';
import { query } from './db.js';
import { sendAlertPush } from './fcm.js';

function hasActiveNativeSocket(io, userId) {
  for (const socket of io?.sockets?.sockets?.values() || []) {
    if (socket.user?.id === userId && ['android', 'ios'].includes(socket.user?.platform)) return true;
  }
  return false;
}

function recipientsFor(to) {
  const values = Array.isArray(to) ? to : String(to || '').split(',');
  return values.map((value) => typeof value === 'string' ? { email: value.trim() } : value).filter((value) => value.email);
}

export function brandedEmailHtml({ title, intro = '', bodyLines = [], ctaLabel = '', ctaUrl = '', footerNote = '' }) {
  const esc = (v = '') => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const brand = config.mailFromName || 'Ledge Roofing';
  const logo = 'https://ledgeroofing.org/images/logo.png';
  const site = config.frontendOrigin.split(',')[0].trim().replace(/\/$/, '') || 'https://ledgeroofing.org';
  const bodyHtml = bodyLines.filter(Boolean).map((line) => `<p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.7;">${esc(line)}</p>`).join('');
  const cta = ctaLabel && ctaUrl ? `<p style="margin:24px 0 0;"><a href="${esc(ctaUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px;">${esc(ctaLabel)}</a></p>` : '';
  const note = footerNote ? `<p style="margin:16px 0 0;color:#64748b;font-size:13px;line-height:1.6;">${esc(footerNote)}</p>` : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <tr><td style="background:#123d2d;padding:24px 28px;">
        <img src="${logo}" alt="${esc(brand)}" width="44" height="44" style="display:block;border-radius:10px;background:#ffffff;padding:4px;margin-bottom:14px;" />
        <p style="margin:0;color:#86efac;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${esc(brand)}</p>
        <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.25;">${esc(title)}</h1>
      </td></tr>
      <tr><td style="padding:28px;">
        ${intro ? `<p style="margin:0 0 16px;color:#0f172a;font-size:16px;line-height:1.7;">${esc(intro)}</p>` : ''}
        ${bodyHtml}
        ${cta}
        ${note}
      </td></tr>
      <tr><td style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0 0 6px;color:#334155;font-size:13px;font-weight:700;">${esc(brand)}</p>
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">Professional roofing services you can trust.<br/>
        <a href="${site}" style="color:#15803d;text-decoration:none;">${esc(site.replace(/^https?:\/\//, ''))}</a></p>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;line-height:1.6;">This email was sent by ${esc(brand)}. If you did not expect this message, you can safely ignore it.</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendStaffEmail({ to, subject, text, html, replyTo }) {
  if (!config.resendApiKey) throw new Error('RESEND_API_KEY is not configured.');
  if (!config.mailFrom) throw new Error('MAIL_FROM is not configured.');
  const recipients = recipientsFor(to).map((recipient) => recipient.email);
  if (!recipients.length) throw new Error('No email recipients were configured.');
  const payload = {
    from: `${config.mailFromName} <${config.mailFrom}>`,
    to: recipients,
    subject,
    text,
    ...(html ? { html } : {}),
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
  const text = [
    `Hello ${name},`,
    '',
    'Your Ledge Roofing staff workspace account is ready.',
    `Sign in: ${loginUrl}`,
    `Work email: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    '',
    'You will be required to set a new password the first time you sign in.',
    'If you were not expecting this invitation, contact your workspace owner.',
  ].join('\n');
  return sendStaffEmail({
    to: email,
    subject: 'Your Ledge Roofing staff workspace invitation',
    text,
    html: brandedEmailHtml({
      title: 'Staff Workspace Invitation',
      intro: `Hello ${name}, your Ledge Roofing staff workspace account is ready.`,
      bodyLines: [
        `Work email: ${email}`,
        `Temporary password: ${temporaryPassword}`,
        'You will be required to set a new password the first time you sign in.',
      ],
      ctaLabel: 'Sign in to Workspace',
      ctaUrl: loginUrl,
      footerNote: 'If you were not expecting this invitation, contact your workspace owner.',
    }),
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
  if (!hasActiveNativeSocket(io, userId)) {
    void sendAlertPush([userId], {
      id: saved.id,
      kind: saved.kind,
      title: saved.title,
      body: saved.body,
      href: saved.href,
    }).then((result) => {
      if (result.sent > 0) console.log('FCM alert sent for notification', saved.id);
    }).catch((error) => console.error('FCM alert push failed:', error.message));
  }

  return saved;
}

export async function notifyUsers(io, userIds, notification) {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.allSettled(unique.map((userId) => notifyUser(io, userId, notification)));
}
