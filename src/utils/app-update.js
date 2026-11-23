import { isNativeApp } from './notifications';

const VERSION_URL = 'https://api.ledgeroofing.org/downloads/version.json';

export async function checkForAppUpdate() {
  if (!isNativeApp() || window.Capacitor?.getPlatform?.() !== 'android') return null;
  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const response = await fetch(VERSION_URL, { cache: 'no-store' });
    if (!response.ok) return null;
    const latest = await response.json();
    const currentCode = Number(info.build) || 0;
    const latestCode = Number(latest.versionCode) || 0;
    if (latestCode > currentCode) {
      return { ...latest, currentCode, currentVersion: info.version || '' };
    }
    return null;
  } catch {
    return null;
  }
}

export async function openAppUpdate(update) {
  if (!update?.url) return;
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: update.url, toolbarColor: '#101715' });
  } catch {
    window.location.assign(update.url);
  }
}
