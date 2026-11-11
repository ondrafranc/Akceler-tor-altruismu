import crypto from 'node:crypto';

/**
 * Shared input sanitization, URL/contact validation, bounded caching,
 * rate limiting, CSRF/Origin validation, bounded stream body parsing,
 * and geodesic helpers used across API endpoints and UI.
 */

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const DANGEROUS_SCHEME_RE = /^\s*(javascript|data|vbscript|file|blob|about):/i;
const SIMPLE_EMAIL_RE = /^[^\s@<>?&#"'`\\]+@[^\s@<>?&#"'`\\]+\.[^\s@<>?&#"'`\\]{2,}$/;
const SAFE_PHONE_RE = /^[+\d][\d\s()./-]{2,38}$/;

/** @type {Map<string, { count: number, resetAt: number }>} */
const RATE_LIMIT_BUCKETS = new Map();
const MAX_RATE_BUCKETS = 2000;

/**
 * Trims a string and strips ASCII control characters (preserving \n, \r, \t).
 * @param {unknown} value
 * @returns {string}
 */
export function safeText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS_RE, '').trim();
}

/**
 * Converts unknown input to a finite number or null.
 * Strictly rejects non-primitive non-numeric types (e.g. booleans, arrays, objects)
 * and whitespace-only strings.
 * @param {unknown} value
 * @returns {number | null}
 */
export function toFiniteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Clamps a numeric value into [min, max].
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Validates geographic coordinates.
 * @param {number | null} lat
 * @param {number | null} lon
 * @returns {lat is number}
 */
export function isValidLatLon(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Checks whether coordinates lie within Czechia (+ small border buffer).
 * Prevents global proxy abuse of Czech-only endpoints (H3).
 * @param {number | null} lat
 * @param {number | null} lon
 * @returns {boolean}
 */
export function isCzLatLon(lat, lon) {
  if (!isValidLatLon(lat, lon)) return false;
  return lat >= 47.5 && lat <= 51.5 && lon >= 11.5 && lon <= 19.5;
}

/**
 * Great-circle distance in kilometers between two WGS84 coordinates.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number}
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Validates and normalizes an external HTTP(S) URL.
 * Rejects javascript:, data:, credentials-in-URL, and malformed hostnames.
 * @param {unknown} raw
 * @param {number} [maxLen=280]
 * @returns {string | null}
 */
export function sanitizeHttpUrl(raw, maxLen = 280) {
  const cleaned = safeText(raw).replace(/[\r\n\t]/g, '');
  if (!cleaned || cleaned.length > maxLen) return null;
  if (DANGEROUS_SCHEME_RE.test(cleaned)) return null;

  let candidate = cleaned;
  if (candidate.startsWith('//')) {
    candidate = `https:${candidate}`;
  } else if (!/^https?:\/\//i.test(candidate)) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
      return null;
    }
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase();
    if (!host || (!host.includes('.') && host !== 'localhost')) return null;
    if (host.startsWith('.') || host.endsWith('.') || host.includes('..')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validates and sanitizes an email address (safe for mailto: links without header injection).
 * @param {unknown} raw
 * @param {number} [maxLen=120]
 * @returns {string | null}
 */
export function sanitizeEmail(raw, maxLen = 120) {
  const cleaned = safeText(raw).replace(/[\r\n\t]/g, '');
  if (!cleaned || cleaned.length > maxLen) return null;
  if (!SIMPLE_EMAIL_RE.test(cleaned)) return null;
  return cleaned;
}

/**
 * Validates and sanitizes a phone number string.
 * @param {unknown} raw
 * @param {number} [maxLen=40]
 * @returns {string | null}
 */
export function sanitizePhone(raw, maxLen = 40) {
  const cleaned = safeText(raw).replace(/[\r\n\t]/g, '');
  if (!cleaned || cleaned.length > maxLen) return null;
  if (!SAFE_PHONE_RE.test(cleaned)) return null;
  return cleaned;
}

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
 * Resolves a client IP string prioritizing SvelteKit's platform-verified getClientAddress()
 * over spoofable X-Forwarded-For headers (H8 / AUDIT #9).
 * @param {Request} request
 * @param {() => string} [getClientAddress]
 * @returns {string}
 */
export function resolveClientKey(request, getClientAddress) {
  try {
    if (typeof getClientAddress === 'function') {
      const addr = getClientAddress();
      if (addr && addr !== '127.0.0.1' && addr !== '::1') {
        return String(addr).slice(0, 64);
      }
    }
  } catch {
    // Fallback when getClientAddress is unavailable in adapter context
  }
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp?.trim()) return cfIp.trim().slice(0, 64);
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const first = vercelIp.split(',')[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  try {
    if (typeof getClientAddress === 'function') {
      const addr = getClientAddress();
      if (addr) return String(addr).slice(0, 64);
    }
  } catch {
    // Ignore
  }
  return 'local';
}

/**
 * Checks whether Content-Length exceeds a safe JSON payload byte budget.
 * @param {Request} request
 * @param {number} [maxBytes=32768]
 * @returns {boolean}
 */
export function hasExcessiveBodySize(request, maxBytes = 32_768) {
  const len = Number(request.headers.get('content-length') || 0);
  return Number.isFinite(len) && len > maxBytes;
}

/**
 * Reads and parses a JSON request body using a bounded stream reader so chunked
 * transfer-encoding payloads cannot bypass Content-Length and cause OOM (M3 / AUDIT #25).
 * @param {Request} request
 * @param {number} [maxBytes=32768]
 * @returns {Promise<{ ok: true, data: any, status?: undefined, error?: undefined } | { ok: false, status: number, error: string, data?: undefined }>}
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
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site' && secFetchSite !== 'none') {
    return false;
  }
  const origin = request.headers.get('origin');
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
  if (ct && !ct.includes('application/json')) {
    return false;
  }
  return true;
}

/**
 * Clock-skew-safe form timing check (H7 / AUDIT #4).
 * Uses monotonic client elapsed_ms when provided; if only wall-clock started_at is sent,
 * only rejects when delta is strictly between 0ms and 800ms (never when delta < 0 due to mobile clock skew).
 * @param {Record<string, any>} body
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
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' && process.env?.VERCEL_ENV === 'production') {
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
