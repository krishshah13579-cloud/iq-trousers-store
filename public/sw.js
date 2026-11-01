/**
 * Service Worker for IQ TROUSERS E-Commerce PWA
 * Enforces live network synchronization, zero-stale HTML, and automatic reload on update.
 */

const CACHE_NAME = "iq-trousers-store-v2";

// Immediately activate new service worker on install
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Take immediate control of all open clients/tabs
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Clean up legacy caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch strategy:
// 1. Navigation / HTML: Network-First (always live from server, cache fallback only if offline)
// 2. APIs (/api/): Network-Only (never stale)
// 3. Static chunks: Cache with Network Fallback
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Bypass API calls, auth routes, and version checks — always live network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Navigation / Page loads: Network-First to guarantee live updates
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Always try fetching fresh HTML directly from server
          const networkResponse = await fetch(request, {
            cache: "no-cache",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          });

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
          return networkResponse;
        } catch (err) {
          // Offline fallback: serve from cache if available
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw err;
        }
      })()
    );
    return;
  }

  // 2. Next.js Static Chunks & Public Assets: Cache-first with network refresh
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|svg|ico|css|woff2?)$/)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, fresh.clone());
          }
          return fresh;
        } catch {
          return cached || new Response("Offline", { status: 503 });
        }
      })()
    );
  }
});

// Message listener for client coordination
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
