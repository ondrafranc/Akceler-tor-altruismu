/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

const CACHE = `akcelerator-cache-${version}`;
const PRECACHE_ASSETS = ['/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];
const KNOWN_ASSETS = new Set([...build, ...files].filter((p) => p !== '/'));
const MAX_CACHE_ENTRIES = 80;

self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll(PRECACHE_ASSETS);
    } catch {}
  }
  event.waitUntil(addFilesToCache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }
  event.waitUntil(deleteOldCaches());
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

    if (!isNavigate && KNOWN_ASSETS.has(url.pathname)) {
      const cachedAsset = await cache.match(url.pathname);
      if (cachedAsset) return cachedAsset;
    }

    const controller = isNavigate ? new AbortController() : null;
    const navTimer = controller ? setTimeout(() => controller.abort(), 2500) : null;

    try {
      const response = await fetch(
        event.request,
        controller ? { signal: controller.signal } : undefined
      );
      if (navTimer) clearTimeout(navTimer);
      if (response && response.status === 200 && response.type === 'basic') {
        const keys = await cache.keys();
        if (keys.length >= MAX_CACHE_ENTRIES && keys[0]) {
          await cache.delete(keys[0]);
        }
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (err) {
      if (navTimer) clearTimeout(navTimer);
      const cached =
        (await cache.match(event.request)) ||
        (isNavigate ? (await cache.match(url.pathname)) || (await cache.match('/')) : null);
      if (cached) return cached;
      throw err;
    }
  }

  event.respondWith(respond());
});
