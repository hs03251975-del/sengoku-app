const CACHE_NAME = "sengoku-cache-v4";
const urlsToCache = [
  "/",
  "/static/index.html",
  "/static/manifest.json",
  "/static/icon-192.png",
  "/static/icon-512.png",
  "/static/sw.js"
];

// ★ インストール時にキャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// ★ 新しい Service Worker を即時反映
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ★ オフライン時はキャッシュを使う
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
