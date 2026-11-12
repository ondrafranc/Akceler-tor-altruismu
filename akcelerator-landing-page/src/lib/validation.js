/**
 * Browser- and server-safe input sanitization, URL/contact validation,
 * and geodesic helpers (zero Node-only dependencies).
 */

const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const DANGEROUS_SCHEME_RE = /^\s*(javascript|data|vbscript|file|blob|about):/i;
const SIMPLE_EMAIL_RE = /^[^\s@<>?&#"'`\\]+@[^\s@<>?&#"'`\\]+\.[^\s@<>?&#"'`\\]{2,}$/;
const SAFE_PHONE_RE = /^[+\d][\d\s()./-]{2,38}$/;

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

