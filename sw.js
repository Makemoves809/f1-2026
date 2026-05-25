// F1 2026 Season Hub — service worker
// Strategy: cache-first for the shell + stale-while-revalidate for everything else.
// Bump CACHE_VERSION whenever you ship a meaningful HTML/CSS/JS change so the
// activate handler purges the old caches.

const CACHE_VERSION = "f1-2026-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./og-image.svg",
  "./icon.svg",
  "./icon-maskable.svg",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;

  // Only handle GET; let everything else pass through to the network.
  if (req.method !== "GET") return;

  // Don't cache the weather API — its job is to be fresh.
  if (req.url.includes("api.open-meteo.com")) return;

  // Don't cache GoogleFonts CSS (they have their own cache headers and 30-day TTLs).
  if (req.url.includes("fonts.googleapis.com") || req.url.includes("fonts.gstatic.com")) return;

  // Stale-while-revalidate: respond from cache immediately if we have it,
  // and refresh the cache in the background.
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(req).then(cached => {
        const network = fetch(req).then(res => {
          // Only cache successful responses for same-origin and CDN images.
          if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
            cache.put(req, res.clone()).catch(() => {});
          }
          return res;
        }).catch(() => cached); // offline — return whatever we have

        return cached || network;
      })
    )
  );
});
