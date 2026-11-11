/**
 * Offline Storage & Synchronization Engine for Akcelerátor altruismu.
 * Implements an IndexedDB outbox queue for caching civic deeds, telemetry,
 * feedback, and completion events when disconnected, with automatic draining
 * upon reconnection and Service Worker Background Sync support.
 */

const DB_NAME = 'akcelerator_offline_v1';
const DB_VERSION = 1;
const OUTBOX_STORE = 'outbox';
const DEEDS_STORE = 'deeds_cache';

const isBrowser = () => typeof window !== 'undefined';
const hasIdb = () => isBrowser() && typeof window.indexedDB !== 'undefined';

/** @type {IDBDatabase | null} */
let cachedDb = null;

/** In-memory fallback queue for SSR or environments without IndexedDB */
/** @type {Array<any>} */
const memoryOutbox = [];

/**
 * Opens or initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase | null>}
 */
export function openOfflineDb() {
  if (!hasIdb()) return Promise.resolve(null);
  if (cachedDb) return Promise.resolve(cachedDb);

  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = /** @type {IDBOpenDBRequest} */ (e.target).result;
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          const outboxStore = db.createObjectStore(OUTBOX_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
          outboxStore.createIndex('attempts', 'attempts', { unique: false });
        }
        if (!db.objectStoreNames.contains(DEEDS_STORE)) {
          db.createObjectStore(DEEDS_STORE, { keyPath: 'id' });
        }
      };

      req.onsuccess = (e) => {
        cachedDb = /** @type {IDBOpenDBRequest} */ (e.target).result;
        cachedDb.onclose = () => {
          cachedDb = null;
        };
        resolve(cachedDb);
      };

      req.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/**
 * Enqueues an outgoing request to the outbox queue.
 * @param {object} param0
 * @param {string} param0.url Target URL
 * @param {string} [param0.method='POST'] HTTP method
 * @param {any} [param0.body] Request payload
 * @param {Record<string, string>} [param0.headers] Optional headers
 * @returns {Promise<number | string>} Generated queue item ID
 */
export async function enqueueOfflineRequest({ url, method = 'POST', body, headers = {} }) {
  const item = {
    url,
    method,
    body: typeof body === 'object' ? JSON.stringify(body) : body,
    headers,
    createdAt: Date.now(),
    attempts: 0
  };

  const db = await openOfflineDb();
  if (!db) {
    const memId = Date.now() + Math.random();
    memoryOutbox.push({ ...item, id: memId });
    return memId;
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(OUTBOX_STORE, 'readwrite');
      const store = tx.objectStore(OUTBOX_STORE);
      const req = store.add(item);
      req.onsuccess = () => {
        registerBackgroundSync().catch(() => {});
        resolve(Number(req.result));
      };
      req.onerror = () => {
        const memId = Date.now() + Math.random();
        memoryOutbox.push({ ...item, id: memId });
        resolve(memId);
      };
    } catch (err) {
      const memId = Date.now() + Math.random();
      memoryOutbox.push({ ...item, id: memId });
      resolve(memId);
    }
  });
}

/**
 * Retrieves all pending outbox requests.
 * @returns {Promise<Array<any>>}
 */
export async function getPendingRequests() {
  const db = await openOfflineDb();
  if (!db) return [...memoryOutbox];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(OUTBOX_STORE, 'readonly');
      const store = tx.objectStore(OUTBOX_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const idbResults = Array.isArray(req.result) ? req.result : [];
        resolve([...idbResults, ...memoryOutbox]);
      };
      req.onerror = () => resolve([...memoryOutbox]);
    } catch {
      resolve([...memoryOutbox]);
    }
  });
}

/**
 * Removes a completed request from the outbox.
 * @param {number | string} id
 * @returns {Promise<boolean>}
 */
export async function removePendingRequest(id) {
  // Remove from memory fallback if present
  const memIdx = memoryOutbox.findIndex((x) => x.id === id);
  if (memIdx !== -1) {
    memoryOutbox.splice(memIdx, 1);
  }

  const db = await openOfflineDb();
  if (!db || typeof id !== 'number') return true;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(OUTBOX_STORE, 'readwrite');
      const store = tx.objectStore(OUTBOX_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Clears all pending requests from the outbox.
 * @returns {Promise<void>}
 */
export async function clearOutbox() {
  memoryOutbox.length = 0;
  const db = await openOfflineDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(OUTBOX_STORE, 'readwrite');
      const store = tx.objectStore(OUTBOX_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Flushes all pending outbox requests when online.
 * @returns {Promise<number>} Number of successfully synchronized requests
 */
export async function flushOfflineQueue() {
  if (isBrowser() && typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  const pending = await getPendingRequests();
  if (!pending.length) return 0;

  let syncedCount = 0;

  for (const req of pending) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(req.headers || {})
      };

      const res = await fetch(req.url, {
        method: req.method || 'POST',
        headers,
        body: req.body
      });

      // Status 2xx or 4xx (client validation error, no point in retrying) are removed
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        await removePendingRequest(req.id);
        syncedCount++;
      } else {
        // Server 5xx error: abort flush to preserve order
        break;
      }
    } catch (err) {
      // Network failure: stop draining until next online trigger
      break;
    }
  }

  return syncedCount;
}

/**
 * Caches an array of recommended deeds into IndexedDB for offline discovery.
 * @param {Array<any>} deeds
 * @returns {Promise<void>}
 */
export async function cacheDeedsOffline(deeds) {
  if (!Array.isArray(deeds) || !deeds.length) return;
  const db = await openOfflineDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DEEDS_STORE, 'readwrite');
      const store = tx.objectStore(DEEDS_STORE);
      for (const deed of deeds) {
        if (deed && deed.id) {
          store.put(deed);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Retrieves cached deeds from offline storage.
 * @returns {Promise<Array<any>>}
 */
export async function getCachedDeedsOffline() {
  const db = await openOfflineDb();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DEEDS_STORE, 'readonly');
      const store = tx.objectStore(DEEDS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Requests the Service Worker Background Sync API to drain the outbox.
 * @returns {Promise<boolean>}
 */
export async function registerBackgroundSync() {
  if (!isBrowser()) return false;
  try {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      // @ts-ignore
      await reg.sync?.register('akcelerator-sync');
      return true;
    }
  } catch {}
  return false;
}

/**
 * Network wrapper: attempts fetch, and enqueues to outbox upon network disconnection.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
export async function offlineFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();

  // For GET requests, perform regular fetch (service worker handles cache)
  if (method === 'GET') {
    return fetch(url, options);
  }

  // If already known to be offline, enqueue directly
  if (isBrowser() && typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineRequest({
      url,
      method,
      body: options.body,
      headers: /** @type {Record<string, string>} */ (options.headers || {})
    });
    return new Response(JSON.stringify({ offline: true, queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    return await fetch(url, options);
  } catch (err) {
    // Network failure (offline, timeout, airplane mode): enqueue to outbox
    await enqueueOfflineRequest({
      url,
      method,
      body: options.body,
      headers: /** @type {Record<string, string>} */ (options.headers || {})
    });
    return new Response(JSON.stringify({ offline: true, queued: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Auto-register online listeners in browser environment
if (isBrowser()) {
  window.addEventListener('online', () => {
    flushOfflineQueue().catch(() => {});
  });

  if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_OFFLINE_OUTBOX') {
        flushOfflineQueue().catch(() => {});
      }
    });
  }
}
