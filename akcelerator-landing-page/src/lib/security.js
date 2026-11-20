import crypto from 'node:crypto';
import {
  safeText,
  toFiniteNumber,
  clamp,
  isValidLatLon,
  isCzLatLon,
  haversineKm,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone
} from './validation.js';

export {
  safeText,
  toFiniteNumber,
  clamp,
  isValidLatLon,
  isCzLatLon,
  haversineKm,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone
};

/**
 * Server-side HTTP security helpers: bounded caching, fixed-window rate limiting,
 * CSRF/Origin validation, bounded stream body parsing, and constant-time token comparison.
 */

/** @type {Map<string, { count: number, resetAt: number }>} */
const RATE_LIMIT_BUCKETS = new Map();
const MAX_RATE_BUCKETS = 2000;

/**
 * Inserts an entry into a Map cache while enforcing TTL cleanup and a hard entry cap.
 * @template T
 * @param {Map<string, { expiresAt: number, data: T }>} cache
 * @param {string} key
 * @param {T} data
 * @param {number} ttlMs
 * @param {number} [maxEntries=250]
 */
export function setBoundedCache(cache, key, data, ttlMs, maxEntries = 250) {
  const now = Date.now();
  if (cache.size >= maxEntries) {
    for (const [k, entry] of cache) {
      if (!entry || entry.expiresAt <= now) {
        cache.delete(k);
      }
    }
  }
  while (cache.size >= maxEntries) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    cache.delete(oldestKey);
  }
  cache.set(key, { expiresAt: now + ttlMs, data });
}

/**
 * Bounded in-memory fixed-window rate limiter per route bucket & client identifier.
 * Protects high-hit blocked buckets from being evicted by single-hit random keys (H8).
 * @param {string} bucket
 * @param {string} clientId
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {{ allowed: boolean, retryAfterSec: number }}
 */
export function checkRateLimit(bucket, clientId, maxRequests, windowMs) {
  if (maxRequests <= 0) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(windowMs / 1000)) };
  }
  const now = Date.now();
  const key = `${encodeURIComponent(bucket)}\x1F${encodeURIComponent(clientId || 'anon')}`;

  const existing = RATE_LIMIT_BUCKETS.get(key);
  if (existing && existing.resetAt > now) {
    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return { allowed: false, retryAfterSec };
    }
    existing.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  if (RATE_LIMIT_BUCKETS.size >= MAX_RATE_BUCKETS) {
    let singleHitKey;
    for (const [k, v] of RATE_LIMIT_BUCKETS) {
      if (v.resetAt <= now) {
        RATE_LIMIT_BUCKETS.delete(k);
      } else if (singleHitKey === undefined && v.count <= 1) {
        singleHitKey = k;
      }
    }
    if (RATE_LIMIT_BUCKETS.size >= MAX_RATE_BUCKETS) {
      if (singleHitKey !== undefined) {
        RATE_LIMIT_BUCKETS.delete(singleHitKey);
      } else {
        const oldestKey = RATE_LIMIT_BUCKETS.keys().next().value;
        if (oldestKey !== undefined) {
          RATE_LIMIT_BUCKETS.delete(oldestKey);
        }
      }
    }
  }

  RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Checks whether an address string represents a loopback or empty interface address.
 * @param {unknown} addr
 * @returns {boolean}
 */
function isLoopbackAddress(addr) {
  if (typeof addr !== 'string') return true;
  const normalized = addr.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '::ffff:127.0.0.1' ||
    normalized === '0:0:0:0:0:0:0:1' ||
    normalized === 'localhost'
  );
}

/**
 * Extracts the first non-empty trimmed IP entry from a comma-separated header value.
 * @param {string | null} val
 * @returns {string}
 */
function parseFirstHeaderIp(val) {
  if (typeof val !== 'string' || !val) return '';
  return val.split(',').map((s) => s.trim()).find(Boolean) || '';
}

/**
 * Resolves a client IP string prioritizing platform-verified addresses over spoofable headers.
 * On Vercel: `x-vercel-forwarded-for` -> non-loopback `getClientAddress()` -> loopback `getClientAddress()` -> `'local'`.
 * Off Vercel: non-loopback `getClientAddress()` -> `x-vercel-forwarded-for` -> loopback `getClientAddress()`
 * -> `cf-connecting-ip` / `x-forwarded-for` (only if `getClientAddress()` is unavailable/throws) -> `'local'`.
 * @param {Request} request
 * @param {() => string} [getClientAddress]
 * @returns {string}
 */
export function resolveClientKey(request, getClientAddress) {
  const isVercel =
    typeof process !== 'undefined' &&
    (process.env?.VERCEL === '1' || Boolean(process.env?.VERCEL_ENV));

  let directAddr = '';
  let hasDirectAddr = false;
  try {
    if (typeof getClientAddress === 'function') {
      const raw = getClientAddress();
      if (raw !== undefined && raw !== null) {
        const trimmed = String(raw).trim();
        if (trimmed) {
          directAddr = trimmed;
          hasDirectAddr = true;
        }
      }
    }
  } catch {
    // Fallback when getClientAddress is unavailable in adapter context
  }

  const vercelIp = parseFirstHeaderIp(request?.headers?.get('x-vercel-forwarded-for') ?? null);

  if (isVercel) {
    if (vercelIp) return vercelIp.slice(0, 64);
    if (hasDirectAddr && !isLoopbackAddress(directAddr)) return directAddr.slice(0, 64);
    if (hasDirectAddr) return directAddr.slice(0, 64);
    return 'local';
  }

  if (hasDirectAddr && !isLoopbackAddress(directAddr)) return directAddr.slice(0, 64);
  if (vercelIp) return vercelIp.slice(0, 64);
  if (hasDirectAddr) return directAddr.slice(0, 64);

  const cfIp = parseFirstHeaderIp(request?.headers?.get('cf-connecting-ip') ?? null);
  if (cfIp) return cfIp.slice(0, 64);

  const xffIp = parseFirstHeaderIp(request?.headers?.get('x-forwarded-for') ?? null);
  if (xffIp) return xffIp.slice(0, 64);

  return 'local';
}

/**
 * Checks whether Content-Length exceeds a safe JSON payload byte budget.
 * @param {Request} request
 * @param {number} [maxBytes=32768]
 * @returns {boolean}
 */
function hasExcessiveBodySize(request, maxBytes = 32_768) {
  const len = Number(request.headers.get('content-length') || 0);
  return Number.isFinite(len) && len > maxBytes;
}

/**
 * Reads and parses a JSON request body using a bounded stream reader so chunked
 * transfer-encoding payloads cannot bypass Content-Length and cause OOM (M3 / AUDIT #25).
 * @param {Request} request
 * @param {number} [maxBytes=32768]
 * @returns {Promise<{ ok: true, data: Record<string, unknown>, status?: undefined, error?: undefined } | { ok: false, status: number, error: string, data?: undefined }>}
 */
export async function readJsonBodyBounded(request, maxBytes = 32_768) {
  if (hasExcessiveBodySize(request, maxBytes)) {
    return { ok: false, status: 413, error: 'Odeslaná data jsou příliš velká.' };
  }

  if (!request.body) {
    return { ok: false, status: 400, error: 'Prázdné tělo požadavku.' };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          try {
            await reader.cancel();
          } catch { }
          return { ok: false, status: 413, error: 'Odeslaná data jsou příliš velká.' };
        }
        chunks.push(value);
      }
    }
  } catch {
    return { ok: false, status: 400, error: 'Chyba při čtení požadavku.' };
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: false }).decode(merged);
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, status: 400, error: 'Neplatný formát dat.' };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, status: 400, error: 'Neplatný formát dat.' };
  }
}

/**
 * Validates that a mutating POST/PUT/DELETE request originates from the same site
 * and rejects cross-site spam distribution (M5 / AUDIT #16).
 * @param {Request} request
 * @param {URL} url
 * @returns {boolean}
 */
export function validateMutationOrigin(request, url) {
  const secFetchSite = (request.headers.get('sec-fetch-site') || '').trim().toLowerCase();
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site' && secFetchSite !== 'none') {
    return false;
  }
  const origin = (request.headers.get('origin') || '').trim();
  if (secFetchSite === 'same-site' && !origin) {
    return false;
  }
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== url.host) {
        return false;
      }
    } catch {
      return false;
    }
  }
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return false;
  }
  return true;
}

/**
 * Clock-skew-safe form timing check (H7 / AUDIT #4).
 * Uses monotonic client elapsed_ms when provided; if only wall-clock started_at is sent,
 * only rejects when delta is strictly between 0ms and 800ms (never when delta < 0 due to mobile clock skew).
 * @param {Record<string, unknown>} body
 * @returns {boolean} true if submission is suspiciously instantaneous (< 800ms)
 */
export function isSubmissionTooFast(body) {
  const elapsedMs = toFiniteNumber(body?.elapsed_ms);
  if (elapsedMs !== null) {
    return elapsedMs >= 0 && elapsedMs < 800;
  }
  const startedAt = toFiniteNumber(body?.started_at);
  if (startedAt !== null && startedAt > 0) {
    const delta = Date.now() - startedAt;
    // Negative delta means client clock is ahead of server NTP clock -> do NOT reject!
    if (delta >= 0 && delta < 800) {
      return true;
    }
  }
  return false;
}

/**
 * Compares two secret tokens in constant time using SHA-256 digests and crypto.timingSafeEqual.
 * Safe against length leaks and timing attacks.
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
export function safeCompareTokens(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Checks whether a request carries a valid non-production test bypass secret (H9 / AUDIT #10).
 * Never permits access if TEST_BYPASS_SECRET is unset or empty.
 * @param {Request} request
 * @returns {boolean}
 */
export function isAuthorizedTestBypass(request) {
  if (typeof process !== 'undefined' && process.env?.VERCEL_ENV === 'production') {
    return false;
  }
  const expected = typeof process !== 'undefined' ? process.env?.TEST_BYPASS_SECRET : undefined;
  if (!expected || typeof expected !== 'string' || expected.trim().length === 0) {
    return false;
  }
  const headerSecret = request.headers.get('x-test-bypass-secret');
  if (!headerSecret || typeof headerSecret !== 'string') {
    return false;
  }
  return safeCompareTokens(headerSecret.trim(), expected.trim());
}
