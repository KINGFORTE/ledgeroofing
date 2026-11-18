self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || '' }; }
  const title = payload.title || 'Ledge Roofing workspace';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || 'You have a new workspace update.',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.tag || 'ledge-workspace',
    data: { url: payload.url || '/staff' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/staff', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
