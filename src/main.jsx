import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initNativeNotifications } from './utils/notifications';
import './index.css';

async function initNativeShell() {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return;
  document.documentElement.classList.add('capacitor-app');
  void initNativeNotifications();
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ]);
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#101715' });
    await StatusBar.setStyle({ style: Style.Dark });
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    // Native plugins unavailable in web builds.
  }
}

void initNativeShell();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
