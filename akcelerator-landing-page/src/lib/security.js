/**
 * Shared input sanitization, URL/contact validation, bounded caching,
 * rate limiting, and geodesic helpers used across API endpoints and UI.
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
 * @param {unknown} value
 * @returns {number | null}
 */
export function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
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
 * @param {string} bucket
 * @param {string} clientId
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {{ allowed: boolean, retryAfterSec: number }}
 */
export function checkRateLimit(bucket, clientId, maxRequests, windowMs) {
  const now = Date.now();
  const key = `${bucket}:${clientId || 'anon'}`;

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
      const victim = singleHitKey ?? RATE_LIMIT_BUCKETS.keys().next().value;
      if (victim !== undefined) RATE_LIMIT_BUCKETS.delete(victim);
    }
  }

  const existing = RATE_LIMIT_BUCKETS.get(key);
  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  existing.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Resolves a best-effort client IP string from SvelteKit request headers.
 * @param {Request} request
 * @param {() => string} [getClientAddress]
 * @returns {string}
 */
export function resolveClientKey(request, getClientAddress) {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const parts = vercelIp.split(',').map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 64);
  }
  const cfIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip');
  if (cfIp?.trim()) return cfIp.trim().slice(0, 64);
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.slice(0, 64);
  }
  try {
    if (typeof getClientAddress === 'function') {
      return String(getClientAddress() || 'local').slice(0, 64);
    }
  } catch {
    // Ignore when clientAddress is unavailable in adapter context
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

