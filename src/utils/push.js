import { apiRequest } from './api';
import { isNativeApp } from './notifications';

const TOKEN_KEY = 'ledge-fcm-token';

async function withPush() {
  if (!isNativeApp() || window.Capacitor?.getPlatform?.() !== 'android') return null;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  return PushNotifications;
}

export async function syncPushToken() {
  const PushNotifications = await withPush();
  if (!PushNotifications) return;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;
  try {
    await apiRequest('/workspace/push-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'android' }),
    });
  } catch {
    // The token is retried on next app open or login.
  }
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

  await PushNotifications.addListener('registration', ({ value }) => {
    if (!value) return;
    localStorage.setItem(TOKEN_KEY, value);
    void syncPushToken();
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

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive !== 'granted') permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') await PushNotifications.register();
}
