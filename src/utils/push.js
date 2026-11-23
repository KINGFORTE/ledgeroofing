import { API_BASE, apiRequest } from './api';
import { isNativeApp } from './notifications';

const TOKEN_KEY = 'ledge-fcm-token';
let listenersReady = false;

function beacon(label, detail = '') {
  try {
    const value = `${label}:${detail}`.slice(0, 180);
    fetch(`${API_BASE}/health?pushdiag=${encodeURIComponent(value)}`, { cache: 'no-store' }).catch(() => {});
  } catch { /* diagnostics only */ }
}

async function withPush() {
  if (!isNativeApp()) { beacon('withPush', 'not-native'); return null; }
  try {
    const module = await import('@capacitor/push-notifications');
    beacon('withPush', 'loaded');
    // Return a plain wrapper. The Capacitor plugin proxy looks thenable, so
    // resolving a promise directly with it would hang forever.
    return { PushNotifications: module.PushNotifications };
  } catch (error) {
    beacon('withPush', `import-error:${error?.message || 'unknown'}`.slice(0, 120));
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
    beacon('postToken', 'ok');
    window.dispatchEvent(new CustomEvent('ledge:push-token-ready'));
  } catch (error) {
    beacon('postToken', `fail:${error?.message || 'unknown'}`.slice(0, 120));
    // The token is retried on next app open or login.
  }
}

export async function syncPushToken() {
  const push = await withPush();
  if (!push) return;
  const { PushNotifications } = push;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    beacon('sync', 'no-local-token');
    // No token yet: force a fresh FCM registration. The registration listener
    // stores the token and posts it to the server.
    try { await PushNotifications.register(); beacon('sync', 'register-called'); }
    catch (error) { beacon('sync', `register-error:${error?.message || 'unknown'}`.slice(0, 120)); }
    return;
  }
  beacon('sync', `posting:${token.length}`);
  await postToken(token);
}

export async function enableAppPush() {
  const push = await withPush();
  if (!push) return { ok: false, granted: false, message: 'Call alerts are only available in the Android app.' };
  const { PushNotifications } = push;

  // Register first. FCM token retrieval does not require notification
  // permission, and a permission prompt must never block it.
  try { await PushNotifications.register(); beacon('enable', 'register-called'); }
  catch (error) { beacon('enable', `register-error:${error?.message || 'unknown'}`.slice(0, 120)); }

  let granted = false;
  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
    granted = permission.receive === 'granted';
  } catch (error) { beacon('enable', `permission-error:${error?.message || 'unknown'}`.slice(0, 120)); }

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
  beacon('init', 'start');
  try {
    const push = await withPush();
    if (!push) return;
    const { PushNotifications } = push;
    beacon('init', 'plugin-ready');

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
      beacon('init', 'channel-ok');
    } catch (error) {
      beacon('init', `channel-skip:${error?.message || 'existing'}`.slice(0, 100));
    }

    if (!listenersReady) {
      beacon('init', 'listeners-start');
      await PushNotifications.addListener('registration', ({ value }) => {
        beacon('registration', value ? `token:${value.length}` : 'empty');
        if (!value) return;
        localStorage.setItem(TOKEN_KEY, value);
        void postToken(value);
      });
      beacon('init', 'listener-registration');
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        const data = notification?.data || {};
        if (data.type === 'meeting_ring') {
          window.dispatchEvent(new CustomEvent('ledge:meeting-ring', { detail: data }));
        }
      });
      beacon('init', 'listener-received');
      await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        const href = notification?.data?.href;
        if (href) window.location.assign(href);
      });
      listenersReady = true;
      beacon('init', 'listeners-done');
    }

    await enableAppPush();
    beacon('init', 'enable-done');
  } catch (error) {
    beacon('init', `fatal:${error?.message || 'unknown'}`.slice(0, 120));
  }
}
