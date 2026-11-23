import fs from 'node:fs';
import { JWT } from 'google-auth-library';
import { config } from './config.js';
import { query } from './db.js';

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];
let authClient;

function absoluteUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${config.apiPublicOrigin.replace(/\/$/, '')}${value.startsWith('/') ? '' : '/'}${value}`;
}

function client() {
  if (!config.fcmProjectId || !config.fcmServiceAccountPath) return null;
  if (!authClient) {
    const serviceAccount = JSON.parse(fs.readFileSync(config.fcmServiceAccountPath, 'utf8'));
    authClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: SCOPES,
    });
  }
  return authClient;
}

async function accessToken() {
  const googleAuth = client();
  if (!googleAuth) return null;
  const { token } = await googleAuth.getAccessToken();
  return token;
}

async function removeToken(token) {
  await query('DELETE FROM push_tokens WHERE token = $1', [token]);
}

async function sendToToken(token, message) {
  const tokenString = String(token || '').trim();
  if (!tokenString) return { ok: false };
  const bearer = await accessToken();
  if (!bearer) return { ok: false };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(config.fcmProjectId)}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { ...message, token: tokenString } }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, name: data.name };

  const detail = data?.error?.message || `FCM request failed (${response.status}).`;
  const staleToken = /unregistered|not found|invalid.*token|registration-token-not-registered/i.test(detail);
  if (staleToken) {
    await removeToken(tokenString);
    return { ok: false, staleToken: true, error: detail };
  }
  return { ok: false, error: detail };
}

export async function sendMeetingRingPush(userIds, ring) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length || !client()) return { sent: 0, failed: 0 };

  const { rows: tokens } = await query(
    `SELECT pt.token, pt.user_id
     FROM push_tokens pt
     JOIN staff_users u ON u.id = pt.user_id
     WHERE pt.user_id = ANY($1::uuid[]) AND pt.platform = 'android' AND u.active = TRUE`,
    [ids]
  );
  if (!tokens.length) return { sent: 0, failed: 0 };

  const avatarUrl = absoluteUrl(ring.callerAvatarUrl);
  const data = {
    type: 'meeting_ring',
    id: String(ring.id || ''),
    meetingId: String(ring.meetingId || ''),
    title: String(ring.title || 'Meeting'),
    hostName: String(ring.hostName || ''),
    callerId: String(ring.callerId || ''),
    callerName: String(ring.callerName || 'A teammate'),
    callerAvatarUrl: String(ring.callerAvatarUrl || ''),
    href: String(ring.href || '/staff/meetings'),
  };
  const message = {
    notification: {
      title: `${data.callerName} is calling you`,
      body: `Tap to join ${data.title}`,
      ...(avatarUrl ? { image: avatarUrl } : {}),
    },
    data,
    android: {
      priority: 'HIGH',
      ttl: '60s',
      collapse_key: `meeting-ring-${ring.id}`,
      restricted_package_name: 'org.ledgeroofing.dashboard',
      notification: {
        channel_id: 'meeting_calls',
        sound: 'default',
        default_sound: true,
        default_vibrate_timings: true,
        notification_priority: 'PRIORITY_MAX',
        visibility: 'PUBLIC',
        tag: `meeting-ring-${ring.id}`,
        ...(avatarUrl ? { image: avatarUrl } : {}),
      },
    },
  };

  let sent = 0;
  let failed = 0;
  const results = await Promise.allSettled(tokens.map((entry) => sendToToken(entry.token, message)));
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.ok) sent += 1;
    else failed += 1;
  }
  return { sent, failed };
}
