/*
 * The budget reminder on the 1st (F-033, ADR 0037), loaded into the app's service worker (vite.config.ts,
 * `workbox.importScripts`). The server sends `{ title, body, url }`, encrypted for this device; the phone draws the
 * notification with Pup's icon, and a tap opens the Budget page in the app (or brings the open one forward).
 */
self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    // An empty or broken message still has to show something: browsers require a notification for every push
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'Pup Budget', {
      body: message.body || '',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'budget-reminder',
      data: { url: message.url || '/budget' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/budget', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) return open.navigate(url).then((client) => (client ?? open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
