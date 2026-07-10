const CACHE_NAME = 'sayash-vastu-v3';
const urlsToCache = [
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('supabase')) {
    return fetch(event.request);
  }

  // Network-first: always try fresh version, cache sirf offline-fallback ke liye
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        const respClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, respClone);
        });
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
