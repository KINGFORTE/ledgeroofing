import { apiRequest } from './api';
import { isNativeApp } from './notifications';

const TOKEN_KEY = 'ledge-fcm-token';
let listenersReady = false;

async function withPush() {
  if (!isNativeApp()) return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
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
  const PushNotifications = await withPush();
  if (!PushNotifications) return;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // No token yet: force a fresh FCM registration. The registration listener
    // stores the token and posts it to the server.
    try { await PushNotifications.register(); } catch { /* retried later */ }
    return;
  }
  await postToken(token);
}

export async function enableAppPush() {
  const PushNotifications = await withPush();
  if (!PushNotifications) return { ok: false, granted: false, message: 'Call alerts are only available in the Android app.' };

  // Register first. FCM token retrieval does not require notification
  // permission, and a permission prompt must never block it.
  try { await PushNotifications.register(); } catch { /* registration may already be in progress */ }

  let granted = false;
  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    granted = permission.receive === 'granted';
  } catch { /* permission can be changed later in Android settings */ }

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
  const PushNotifications = await withPush();
  if (!PushNotifications) return;

  try {
    await PushNotifications.createChannel({
      id: 'meeting_calls',
      name: 'Meeting calls',
      description: 'Incoming meeting rings',
      importance: 5,
      vibration: true,
    });
  } catch { /* channel may already exist */ }

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
}
