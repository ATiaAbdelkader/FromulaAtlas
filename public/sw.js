/* Service worker for the Atlas of Agri-Formulas & Metrics.
 *
 * Strategy:
 *   - Cache-first for static assets (/_next/static, /icon, /logo, fonts).
 *   - Network-first for pages (HTML navigations), falling back to cache.
 *   - Bypass the cache entirely for API requests and external URLs.
 *
 * Bumping CACHE_VERSION invalidates the previous cache on the next load.
 */

const CACHE_VERSION = 'agri-atlas-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const STATIC_ASSET_PATTERNS = [
  /\/_next\/static\//,
  /\/icon\.svg$/,
  /\/logo\.svg$/,
  /\/manifest\.json$/,
  /\/robots\.txt$/,
  /fonts\.(googleapis|gstatic)\.com/,
];

const NETWORK_FIRST_PATTERNS = [
  // HTML navigations
  (url) => url.pathname === '/' || url.pathname.startsWith('/?'),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Pre-cache the bare essentials. Best-effort — failures are ignored.
      try {
        await cache.addAll(['/', '/icon.svg', '/manifest.json']);
      } catch (_err) {
        /* individual addAll failures are non-fatal */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_err) {
    return;
  }

  // Never intercept API calls or cross-origin requests.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Cache-first for static assets.
  if (STATIC_ASSET_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Network-first for navigation (HTML) requests.
  if (req.mode === 'navigate' || NETWORK_FIRST_PATTERNS.some((p) => p(url))) {
    event.respondWith(networkFirst(req, PAGE_CACHE));
    return;
  }

  // Default: try the network, fall back to any cache hit.
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())),
  );
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    return cached || Response.error();
  }
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      cache.put(req, res.clone());
    }
    return res;
  } catch (_err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    // Last resort: serve the cached root for offline navigations.
    const root = await cache.match('/');
    if (root) return root;
    return new Response('You are offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
