// PWA v3.4.2: shell cache only. No Google auth tokens or Drive API responses cached.
const CACHE = 'biblioteca-links-shell-v3.4.2';
const SHELL = ['./', './index.html', './privacidade.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('biblioteca-links-shell-') && k !== CACHE).map(k => caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Cache only application documents and known shell assets; never API / OAuth traffic.
  const pathname = url.pathname.slice(new URL(self.registration.scope).pathname.length);
  const allowed = new Set(['', 'index.html', 'privacidade.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']);
  if (!allowed.has(pathname)) return;
  event.respondWith(fetch(req).then(response => {
    if (response.ok && response.type === 'basic') {
      const clone = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, clone)));
    }
    return response;
  }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
