const CACHE = 'roy-cms-v1';
const STATIC = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
];

// ── Install: cache static assets ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network first, cache fallback ───────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('firestore') || e.request.url.includes('firebase')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push notifications ─────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'Roy CMS';
  const options = {
    body:    data.body  || 'You have a new notification',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url || '/' },
    actions: data.actions || [],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ─────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url === url && 'focus' in c);
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// ── Background sync: queue failed form submits ─────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-messages') {
    e.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // Re-attempt any queued offline writes
  const cache = await caches.open('offline-queue');
  const reqs  = await cache.keys();
  for (const req of reqs) {
    try {
      await fetch(req);
      await cache.delete(req);
    } catch {}
  }
}
