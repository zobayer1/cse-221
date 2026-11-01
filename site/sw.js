// CSE 221 course website: a do-nothing service worker for /cse-221/.
// The site shares its domain with another site whose service worker (scope "/") serves every page
// it has seen from its cache, forever. A service worker with the narrower scope /cse-221/ takes
// those pages over. This one has no fetch handler, so every request goes straight to the network.
self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (event) {
  var scope = new URL(self.registration.scope).pathname;
  event.waitUntil(caches.keys().then(function (names) {
    // Drop the stale copies of this site's pages from the other site's caches; leave its own pages alone.
    return Promise.all(names.map(function (name) {
      return caches.open(name).then(function (cache) {
        return cache.keys().then(function (requests) {
          return Promise.all(requests.filter(function (r) { return new URL(r.url).pathname.indexOf(scope) === 0; })
            .map(function (r) { return cache.delete(r); }));
        });
      });
    }));
  }).then(function () { return self.clients.claim(); }));
});
