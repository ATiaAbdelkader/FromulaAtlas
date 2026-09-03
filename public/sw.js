/**
 * Service Worker for Formula Atlas — PWA offline support
 *
 * Caching strategy:
 *   1. App shell (HTML, JS, CSS) — Stale-while-revalidate
 *   2. Static assets (images, fonts, model files) — Cache-first
 *   3. API calls (Open-Meteo, etc.) — Network-first with cache fallback
 *
 * The app works offline for:
 *   - FarmPilot plan, calendar, today's tasks
 *   - Crop calendar
 *   - All calculators (client-side math)
 *   - CNN disease detection model (cached after first load)
 *   - Last weather forecast (cached)
 *   - All localStorage data (farm profile, field records, soil tests)
 */

const CACHE_VERSION = 'fa-v0.3.0';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Files to pre-cache on install (app shell)
const APP_SHELL_FILES = [
  '/',
  '/app',
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL_FILES).catch(() => {
        // If any file fails, just skip it — don't block installation
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — routing strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests except for specific allowed origins
  const isSameOrigin = url.origin === self.location.origin;
  const isOpenMeteo = url.hostname === 'api.open-meteo.com';
  const isUnpkg = url.hostname === 'unpkg.com';

  if (!isSameOrigin && !isOpenMeteo && !isUnpkg) return;

  // Strategy 1: Model files — Cache-first (large, static, never change)
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // Strategy 2: Static assets (images, fonts, _next/static) — Cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|woff2?|ttf|eot|css)$/)
  ) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }

  // Strategy 3: API calls (Open-Meteo) — Network-first with cache fallback
  if (isOpenMeteo) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, 600)); // 10 min cache
    return;
  }

  // Strategy 4: Navigation (HTML pages) — Network-first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline — try cached page, fall back to app shell
          return caches.match(request).then((cached) => {
            return cached || caches.match('/app');
          });
        })
    );
    return;
  }

  // Strategy 5: Everything else — Stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ---------------------------------------------------------------------------
// Cache strategies
// ---------------------------------------------------------------------------

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName, maxAgeSec) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    // Offline — return cached response if available
    const cached = await cache.match(request);
    if (cached) {
      // Check if cache is too old
      const cachedTime = cached.headers.get('date');
      if (cachedTime) {
        const age = (Date.now() - new Date(cachedTime).getTime()) / 1000;
        if (age > maxAgeSec) {
          // Return stale data with a warning header
          const staleResponse = cached.clone();
          staleResponse.headers.set('X-Cache-Status', 'stale');
          return staleResponse;
        }
      }
      return cached;
    }
    return new Response('{"error":"Offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
