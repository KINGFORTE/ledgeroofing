const CHANNEL_ID = 'ledge-alerts';

export function notificationTag(kind = 'general') {
  const value = String(kind || 'general');
  if (/meeting|ring|call|video/i.test(value)) return 'Meeting';
  if (/task|project|checklist|due/i.test(value)) return 'Tasks';
  if (/drawing|file|upload/i.test(value)) return 'Drawings';
  if (/mail|email|inbox/i.test(value)) return 'Email';
  if (/attendance|audit|admin|role/i.test(value)) return 'Workspace';
  return 'Alerts';
}

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

export async function showNotificationAlert({ id, title, body, href = '/staff', tag, kind }) {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;
  const safeTitle = title || 'Ledge Roofing';
  const safeBody = body || '';
  const alertTag = tag || notificationTag(kind);

  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const channelId = `${CHANNEL_ID}-${alertTag.toLowerCase().replace(/[^a-z0-9_-]+/g, '_')}`;
      try {
        await LocalNotifications.createChannel({
          id: channelId,
          name: `Ledge Roofing · ${alertTag}`,
          description: `${alertTag} alerts with phone notification sound`,
          importance: 5,
          vibration: true,
          sound: 'default',
        });
      } catch { /* channel may already exist */ }
      const numericId = Math.abs(Number(id)) || Date.now() % 2147483647;
      await LocalNotifications.schedule({
        notifications: [{
          id: numericId,
          title: `${alertTag}: ${safeTitle}`,
          body: safeBody,
          schedule: { at: new Date(Date.now() + 400) },
          channelId,
          tag: alertTag,
          sound: 'default',
          group: 'ledge-roofing',
          extra: { href, tag: alertTag, notificationId: id },
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
      tag: `ledge-${alertTag}-${id || 'alert'}`,
      data: { href, tag: alertTag },
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

let ringContext = null;
let ringTimer = null;
let ringOscillator = null;

export function stopRingTone() {
  if (ringTimer) { window.clearInterval(ringTimer); ringTimer = null; }
  try { ringOscillator?.stop(); } catch { /* already stopped */ }
  ringOscillator = null;
  if (ringContext) { void ringContext.close().catch(() => {}); ringContext = null; }
  try { navigator.vibrate?.(0); } catch { /* vibration unsupported */ }
}

export function startRingTone() {
  stopRingTone();
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return stopRingTone;
    ringContext = new AudioContextClass();
    const gain = ringContext.createGain();
    ringOscillator = ringContext.createOscillator();
    ringOscillator.type = 'sine';
    ringOscillator.frequency.value = 880;
    gain.gain.value = 0.0001;
    ringOscillator.connect(gain);
    gain.connect(ringContext.destination);
    ringOscillator.start();
    let loud = true;
    const pulse = () => {
      if (!ringContext) return;
      const now = ringContext.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(loud ? 0.06 : 0.0001, now);
      loud = !loud;
    };
    pulse();
    ringTimer = window.setInterval(pulse, 450);
    try { navigator.vibrate?.([300, 180, 300, 180, 600]); } catch { /* vibration unsupported */ }
    return stopRingTone;
  } catch {
    return stopRingTone;
  }
}
