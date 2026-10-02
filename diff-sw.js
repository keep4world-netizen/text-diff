const C = 'text-diff-v1';
const FILES = ['./', './index.html', './diff-manifest.webmanifest', './diff-icon-192.png', './diff-icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.allSettled(FILES.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const same = new URL(e.request.url).origin === location.origin;
  if (same) {
    // Own files: internet first so updates arrive, saved copy when offline
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html'))));
  } else {
    // Fonts: saved copy first
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(C).then(c => c.put(e.request, copy)); }
      return res;
    })));
  }
});
