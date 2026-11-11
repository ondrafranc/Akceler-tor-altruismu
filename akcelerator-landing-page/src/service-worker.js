/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `akcelerator-cache-${version}`;
const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];
const KNOWN_ASSETS = new Set([...build, ...files].filter((p) => p !== '/'));
const STATIC_EXT_RE = /\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|ico|webmanifest)$/i;
const MAX_CACHE_ENTRIES = 80;

self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(PRECACHE_ASSETS);
    } catch {
      // Ignore individual asset failure in dev mode
    }
  }
  event.waitUntil(addFilesToCache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  async function cleanUpAndPreload() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    if (self.registration.navigationPreload) {
      try {
        await self.registration.navigationPreload.enable();
      } catch {
        // Ignore if unsupported
      }
    }
  }
  event.waitUntil(cleanUpAndPreload());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (build.length === 0) return;
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/.svelte-kit/')
  ) {
    return;
  }

  async function respond() {
    const cache = await caches.open(CACHE);
    const isNavigate = event.request.mode === 'navigate';

    // 1. Static build/files assets: Cache-first
    if (!isNavigate && (KNOWN_ASSETS.has(url.pathname) || STATIC_EXT_RE.test(url.pathname))) {
      const cachedAsset = await cache.match(url.pathname);
      if (cachedAsset) return cachedAsset;

      const response = await fetch(event.request);
      if (response && response.status === 200 && response.type === 'basic') {
        const keys = await cache.keys();
        if (keys.length >= MAX_CACHE_ENTRIES && keys[0]) {
          await cache.delete(keys[0]);
        }
        await cache.put(url.pathname, response.clone());
      }
      return response;
    }

    // 2. HTML Navigations: Network-first with 12s timeout, never cache nonce-bearing HTML,
    // and never fall back to root '/' for other routes (C2 / AUDIT #1).
    if (isNavigate) {
      const controller = new AbortController();
      const navTimer = setTimeout(() => controller.abort(), 12_000);
      try {
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          clearTimeout(navTimer);
          return preloadResponse;
        }
        const response = await fetch(event.request, { signal: controller.signal });
        clearTimeout(navTimer);
        return response;
      } catch (err) {
        clearTimeout(navTimer);
        const offlinePage = await cache.match('/offline.html');
        if (offlinePage) return offlinePage;
        throw err;
      }
    }

    return fetch(event.request);
  }

  event.respondWith(respond());
});

// Service Worker Background Sync for draining offline outbox
self.addEventListener('sync', (event) => {
  const syncEvent = /** @type {any} */ (event);
  if (syncEvent.tag === 'akcelerator-sync' || syncEvent.tag === 'offline-outbox-sync') {
    syncEvent.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_OFFLINE_OUTBOX' });
        }
      })()
    );
  }
});
