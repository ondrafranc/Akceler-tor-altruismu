/**
 * Centralized Type-Safe Storage Registry and SSR-Safe Storage Helpers.
 */

import type { StorageKey } from './keys.js';
export * from './keys.js';

const MEMORY_LOCAL = new Map<string, string>();
const MEMORY_SESSION = new Map<string, string>();
const failedNativeWrites = new Set<string>();

/**
 * Safely resolves window.localStorage or window.sessionStorage inside try/catch
 * so browsers with "Block all cookies" or strict In-App WebViews never throw SecurityError.
 */
export function resolveNativeStorage(kind: 'local' | 'session' = 'local'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Safely reads a key from localStorage or sessionStorage with in-memory fallback.
 */
export function getStoredItem(
  key: StorageKey | (string & {}),
  kind: 'local' | 'session' = 'local'
): string | null {
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  const storeId = `${kind}:${key}`;

  // If native write previously failed for this key, prioritize memory to avoid stale reads
  if (failedNativeWrites.has(storeId)) {
    return mem.has(key) ? (mem.get(key) ?? null) : null;
  }

  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      const val = native.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fall through to in-memory map
    }
  }
  return mem.has(key) ? (mem.get(key) ?? null) : null;
}

/**
 * Safely writes a key to localStorage or sessionStorage with in-memory fallback.
 */
export function setStoredItem(
  key: StorageKey | (string & {}),
  value: string | number | boolean,
  kind: 'local' | 'session' = 'local'
): void {
  const strVal = String(value);
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  const storeId = `${kind}:${key}`;
  mem.set(key, strVal);

  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      native.setItem(key, strVal);
      failedNativeWrites.delete(storeId);
    } catch {
      // Stored in memory fallback; mark native write as failed to avoid stale reads
      failedNativeWrites.add(storeId);
    }
  }
}

/**
 * Safely removes a key from localStorage or sessionStorage and in-memory fallback.
 */
export function removeStoredItem(
  key: StorageKey | (string & {}),
  kind: 'local' | 'session' = 'local'
): void {
  const mem = kind === 'session' ? MEMORY_SESSION : MEMORY_LOCAL;
  const storeId = `${kind}:${key}`;
  mem.delete(key);
  failedNativeWrites.delete(storeId);

  const native = resolveNativeStorage(kind);
  if (native) {
    try {
      native.removeItem(key);
    } catch {
      // Ignore
    }
  }
}

// Canonical aliases for backward compatibility with existing codebase
export const safeGetItem = getStoredItem;
export const safeSetItem = setStoredItem;
export const safeRemoveItem = removeStoredItem;
