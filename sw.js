/* ============================================================
   SERVICE WORKER — Stale-while-revalidate for app shell
   ============================================================ */

const CACHE_NAME = 'puppy-tracker-v7';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/theme.css',
  './css/components.css',
  './css/pages.css',
  './js/app.js',
  './js/data.js',
  './js/storage.js',
  './js/firebase.js',
  './js/pages/feeding.js',
  './js/pages/weight.js',
  './js/pages/potty.js',
  './js/pages/sleep.js',
  './js/pages/health.js',
  './js/pages/milestones.js',
  './icons/favicon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Firebase / Google CDN
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('google.com')) {
    return;
  }

  // Stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(res => {
          if (res.ok && event.request.method === 'GET' && url.origin === self.location.origin) {
            cache.put(event.request, res.clone());
          }
          return res;
        });
        return cached || networkFetch;
      })
    )
  );
});
