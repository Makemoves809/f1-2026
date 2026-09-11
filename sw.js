// F1 2026 Season Hub — service worker
// Strategy: network-first for page navigations (the HTML *is* the data, so it
// must never be a deploy behind) + stale-while-revalidate for static assets.
// Bump CACHE_VERSION whenever you ship a meaningful HTML/CSS/JS change so the
// activate handler purges the old caches.

const CACHE_VERSION = "f1-2026-v26";
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
      // `cache: "reload"` bypasses the browser HTTP cache. Without it, GitHub
      // Pages' max-age on index.html can seed a brand-new cache with the very
      // copy this deploy was meant to replace.
      .then(cache => cache.addAll(
        CORE_ASSETS.map(url => new Request(url, { cache: "reload" }))
      ))
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

  // ── Page navigations: NETWORK-FIRST ──────────────────────────────
  // Every standing, result and schedule lives inside index.html, so serving a
  // cached page means serving stale race data. Go to the network first and fall
  // back to the cache only when the network actually fails (i.e. offline).
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.open(CACHE_VERSION).then(async cache =>
          (await cache.match(req)) ||
          (await cache.match("./index.html")) ||
          (await cache.match("./"))
        ))
    );
    return;
  }

  // ── Everything else: stale-while-revalidate ──────────────────────
  // Respond from cache immediately if we have it, and refresh in the background.
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
