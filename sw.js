const CACHE_NAME = 'nug-calc-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Network-first: always try the latest deployed files, fall back to cache when offline.
  // (Cache-first used to keep serving an old index.html after a new deployment.)
  event.respondWith(
    fetch(event.request).then(fetchRes => {
      if (event.request.url.startsWith('http') && fetchRes.status === 200) {
        const copy = fetchRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return fetchRes;
    }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
