const CHANNEL_ID = 'ledge-alerts';

export function isNativeApp() {
  return Boolean(window.Capacitor?.isNativePlatform?.() && window.Capacitor.getPlatform?.() !== 'web');
}

export async function ensureNotificationPermission() {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (window.Notification.permission === 'granted') return true;
  if (window.Notification.permission === 'denied') return false;
  try { return (await window.Notification.requestPermission()) === 'granted'; }
  catch { return false; }
}

export async function showNotificationAlert({ id, title, body, href = '/staff' }) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  const safeTitle = title || 'Ledge Roofing';
  const safeBody = body || '';

  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: 'Ledge Roofing alerts',
          description: 'Meeting, task, and workspace alerts',
          importance: 5,
          vibration: true,
          sound: 'default',
        });
      } catch { /* channel may already exist */ }
      const numericId = Math.abs(Number(id)) || Date.now() % 2147483647;
      await LocalNotifications.schedule({
        notifications: [{
          id: numericId,
          title: safeTitle,
          body: safeBody,
          schedule: { at: new Date(Date.now() + 400) },
          channelId: CHANNEL_ID,
          sound: 'default',
          extra: { href },
        }],
      });
      return true;
    } catch {
      return false;
    }
  }

  try {
    const notification = new window.Notification(safeTitle, {
      body: safeBody,
      icon: '/images/logo.png',
      tag: `ledge-${id || 'alert'}`,
      data: { href },
    });
    notification.onclick = () => {
      window.focus();
      if (href) window.location.assign(href);
    };
    return true;
  } catch {
    return false;
  }
}

export async function initNativeNotifications() {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
      const href = event?.notification?.extra?.href;
      if (href) window.location.assign(href);
    });
  } catch { /* notifications still work without deep links */ }
}
