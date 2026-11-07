// Family App service worker: shows a notification and updates the app icon badge when a message arrives.
const BADGE_KEY = 'badge-count';

async function getCount() {
  try { const c = await caches.open('family-badge'); const r = await c.match(BADGE_KEY); return r ? Number(await r.text()) || 0 : 0; } catch (e) { return 0; }
}
async function setCount(n) {
  try { const c = await caches.open('family-badge'); await c.put(BADGE_KEY, new Response(String(n))); } catch (e) {}
  try { if (self.navigator.setAppBadge) { n ? await self.navigator.setAppBadge(n) : await self.navigator.clearAppBadge(); } } catch (e) {}
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'Family App', body: event.data ? event.data.text() : '' }; }
  event.waitUntil((async () => {
    const n = (await getCount()) + 1;
    await setCount(n);
    await self.registration.showNotification(d.title || 'Family App', {
      body: d.body || 'New message',
      icon: 'icon.png',
      badge: 'icon.png',
      tag: d.tag || 'family-chat',
      renotify: true,
      data: { url: d.url || './?view=chat' }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { try { await c.focus(); c.postMessage({ open: 'chat' }); return; } catch (e) {} }
    await self.clients.openWindow(url);
  })());
});

self.addEventListener('message', event => {
  if (event.data && typeof event.data.badge === 'number') event.waitUntil(setCount(event.data.badge));
});
