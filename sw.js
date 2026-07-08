const CACHE_NAME = "ccl-scouting-v1";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for the HTML shell (so refreshed data isn't stuck behind a stale cache),
// cache-first for everything else (icons, manifest).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode === "navigate" || req.url.endsWith("index.html") || req.url.endsWith("/")) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
  }
});
