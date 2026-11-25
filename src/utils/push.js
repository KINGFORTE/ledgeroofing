import { apiRequest } from './api';
import { isNativeApp } from './notifications';

const TOKEN_KEY = 'ledge-fcm-token';
let listenersReady = false;

async function withPush() {
  if (!isNativeApp()) return null;
  try {
    const module = await import('@capacitor/push-notifications');
    // Return a plain wrapper. The Capacitor plugin proxy looks thenable, so
    // resolving a promise directly with it would hang forever.
    return { PushNotifications: module.PushNotifications };
  } catch {
    return null;
  }
}

async function postToken(token) {
  if (!token) return;
  try {
    await apiRequest('/workspace/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'android' }),
    });
    window.dispatchEvent(new CustomEvent('ledge:push-token-ready'));
  } catch {
    // The token is retried on next app open or login.
  }
}

export async function syncPushToken() {
  const push = await withPush();
  if (!push) return;
  const { PushNotifications } = push;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // No token yet: force a fresh FCM registration. The registration listener
    // stores the token and posts it to the server.
    try { await PushNotifications.register(); } catch { /* retry on next open */ }
    return;
  }
  await postToken(token);
}

export async function enableAppPush() {
  const push = await withPush();
  if (!push) return { ok: false, granted: false, message: 'Call alerts are only available in the Android app.' };
  const { PushNotifications } = push;

  // Register first. FCM token retrieval does not require notification
  // permission, and a permission prompt must never block it.
  try { await PushNotifications.register(); } catch { /* retry on next open */ }

  let granted = false;
  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    granted = permission.receive === 'granted';
  } catch { /* permission can be granted later in Android settings */ }

  await syncPushToken();
  return {
    ok: true,
    granted,
    message: granted
      ? 'Call alerts are enabled on this device.'
      : 'Device registered. Allow notifications in Android settings to hear rings.',
  };
}

export async function initAppPush() {
  try {
    const push = await withPush();
    if (!push) return;
    const { PushNotifications } = push;

    try {
      await PushNotifications.createChannel({
        id: 'meeting_calls',
        name: 'Meeting calls',
        description: 'Incoming meeting rings',
        importance: 5,
        vibration: true,
      });
      await PushNotifications.createChannel({
        id: 'ledge_alerts',
        name: 'Ledge Roofing alerts',
        description: 'Messages and workspace alerts',
        importance: 4,
        vibration: true,
        sound: 'default',
      });
    } catch { /* channels already exist */ }

    if (!listenersReady) {
      await PushNotifications.addListener('registration', ({ value }) => {
        if (!value) return;
        localStorage.setItem(TOKEN_KEY, value);
        void postToken(value);
      });
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        const data = notification?.data || {};
        if (data.type === 'meeting_ring') {
          window.dispatchEvent(new CustomEvent('ledge:meeting-ring', { detail: data }));
        }
      });
      await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        const href = notification?.data?.href;
        if (href) window.location.assign(href);
      });
      listenersReady = true;
    }

    await enableAppPush();
  } catch { /* push remains optional */ }
}
