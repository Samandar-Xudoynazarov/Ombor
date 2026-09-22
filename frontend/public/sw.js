// Oddiy service worker: ilovani telefonga o'rnatish imkonini beradi.
// Sahifalar tarmoqdan olinadi, internet yo'q bo'lsa keshdagi versiya ko'rsatiladi.
const CACHE = 'ombor-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Faqat o'z domenimizdagi GET so'rovlar (API boshqa domenda — keshlanmaydi)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (url.pathname.startsWith('/_next/static') || req.mode === 'navigate')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/')))
  );
});
