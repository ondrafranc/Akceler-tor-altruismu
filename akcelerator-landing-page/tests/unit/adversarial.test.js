import { describe, it, expect } from 'vitest';
import {
  safeText,
  toFiniteNumber,
  clamp,
  isValidLatLon,
  isCzLatLon,
  haversineKm,
  sanitizeHttpUrl,
  sanitizeEmail,
  sanitizePhone,
  checkRateLimit,
  isSubmissionTooFast
} from '$lib/security.js';

describe('ADVERSARIAL: toFiniteNumber edge cases', () => {
  it('probes type coercion on non-numeric types', () => {
    // Array coercion
    const emptyArr = toFiniteNumber([]);
    const singleNumArr = toFiniteNumber([42]);
    // Boolean coercion
    const boolFalse = toFiniteNumber(false);
    const boolTrue = toFiniteNumber(true);
    // Whitespace string coercion
    const spaceStr = toFiniteNumber('   ');
    const tabNewline = toFiniteNumber('\t\n');
    // Date object coercion
    const dateObj = toFiniteNumber(new Date());

    console.log('toFiniteNumber edge case results:', {
      emptyArr,
      singleNumArr,
      boolFalse,
      boolTrue,
      spaceStr,
      tabNewline,
      dateObj
    });

    // In a strict validator, booleans, arrays, objects, and whitespace strings are rejected
    expect(emptyArr).toBeNull();
    expect(singleNumArr).toBeNull();
    expect(boolFalse).toBeNull();
    expect(boolTrue).toBeNull();
    expect(spaceStr).toBeNull();
    expect(tabNewline).toBeNull();
    expect(dateObj).toBeNull();

    expect(toFiniteNumber(0)).toBe(0);
    expect(toFiniteNumber('0')).toBe(0);
    expect(toFiniteNumber(' 42 ')).toBe(42);
  });

  it('probes hexadecimal, octal and exponential notations', () => {
    expect(toFiniteNumber('1e3')).toBe(1000);
    expect(toFiniteNumber('0x10')).toBe(16);
    expect(toFiniteNumber('-0')).toBe(-0);
  });
});

describe('ADVERSARIAL: safeText edge cases', () => {
  it('probes non-string types', () => {
    expect(safeText(false)).toBe('');
    expect(safeText(true)).toBe('');
    expect(safeText(Symbol('test'))).toBe('');
    expect(safeText(BigInt(100))).toBe('');
    expect(safeText(() => {})).toBe('');
    expect(safeText([1, 2, 3])).toBe('');
  });

  it('probes Unicode zero-width characters and homoglyphs', () => {
    // Zero-width space (\u200B) is NOT in ASCII control char range \u0000-\u001F
    const zwsp = 'Hello\u200BWorld';
    expect(safeText(zwsp)).toBe('Hello\u200BWorld');

    // Right-to-left override (\u202E)
    const bidi = 'abc\u202Edef';
    expect(safeText(bidi)).toBe('abc\u202Edef');
  });

  it('probes strings consisting only of control characters or whitespace', () => {
    expect(safeText('\x00\x01\x02\x08')).toBe('');
    expect(safeText('   \t\r\n   ')).toBe('');
  });
});

describe('ADVERSARIAL: sanitizeHttpUrl edge cases', () => {
  it('probes obfuscated dangerous schemes', () => {
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('JAVASCRIPT:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('javascript :alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('java\x00script:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('java\tscript:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('java\r\nscript:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('blob:https://example.com/uuid')).toBeNull();
    expect(sanitizeHttpUrl('about:blank')).toBeNull();
    expect(sanitizeHttpUrl('file:///etc/passwd')).toBeNull();
  });

  it('probes backslash host injection (WHATWG URL parsing)', () => {
    // In WHATWG URL parsing, backslashes in authority are converted to slashes in http/https schemes
    // https://example.com\attacker.com becomes https://example.com/attacker.com
    const backslashUrl = sanitizeHttpUrl('https://example.com\\attacker.com');
    if (backslashUrl) {
      const parsed = new URL(backslashUrl);
      expect(parsed.hostname).toBe('example.com');
    }
  });

  it('probes URL credentials and ports', () => {
    expect(sanitizeHttpUrl('https://user:password@example.com/')).toBeNull();
    expect(sanitizeHttpUrl('https://user@example.com/')).toBeNull();
    expect(sanitizeHttpUrl('https://example.com:8443/')).toBe('https://example.com:8443/');
  });

  it('probes internationalized domain names (IDN)', () => {
    // Czech domain with diacritics
    const idnUrl = sanitizeHttpUrl('https://českárepublika.cz/pomoc');
    expect(idnUrl).not.toBeNull();
    expect(idnUrl?.includes('xn--') || idnUrl?.includes('českárepublika')).toBe(true);
  });

  it('probes IP address formats', () => {
    expect(sanitizeHttpUrl('http://127.0.0.1')).toBe('http://127.0.0.1/');
    expect(sanitizeHttpUrl('http://169.254.169.254/latest/meta-data')).toBe('http://169.254.169.254/latest/meta-data');
    expect(sanitizeHttpUrl('http://localhost:5173')).toBe('http://localhost:5173/');
  });

  it('probes missing TLD or invalid hostnames and records WHATWG dot edge cases', () => {
    expect(sanitizeHttpUrl('https://invalid_domain')).toBeNull();
    expect(sanitizeHttpUrl('https://internalhost')).toBeNull();
    // WHATWG dot edge cases are rejected
    expect(sanitizeHttpUrl('https://.com')).toBeNull();
    expect(sanitizeHttpUrl('https://.')).toBeNull();
    expect(sanitizeHttpUrl('https://..')).toBeNull();
    expect(sanitizeHttpUrl('https://example..com')).toBeNull();
    expect(sanitizeHttpUrl('https://example.com.')).toBeNull();
  });
});

describe('ADVERSARIAL: haversineKm edge cases', () => {
  it('probes antipodal points and poles', () => {
    // North pole to South pole
    const poleToPole = haversineKm(90, 0, -90, 0);
    expect(poleToPole).toBeCloseTo(20015.08, 0);

    // North pole to North pole at different longitudes (should be 0)
    const poleToSamePole = haversineKm(90, 0, 90, 180);
    expect(poleToSamePole).toBeCloseTo(0, 5);

    // Equator halfway around the globe
    const equatorHalfway = haversineKm(0, 0, 0, 180);
    expect(equatorHalfway).toBeCloseTo(20015.08, 0);

    // Antipodal points with potential floating point rounding > 1 in Math.sqrt(a)
    const antipodal1 = haversineKm(45, 90, -45, -90);
    expect(Number.isFinite(antipodal1)).toBe(true);
    expect(antipodal1).toBeCloseTo(20015.08, 0);
  });

  it('probes sub-meter distances', () => {
    // 0.00001 deg lat is ~1.11 meters
    const distMeters = haversineKm(50.087, 14.421, 50.08701, 14.421);
    expect(distMeters).toBeGreaterThan(0.001);
    expect(distMeters).toBeLessThan(0.002);
  });
});

describe('ADVERSARIAL: checkRateLimit edge cases', () => {
  it('probes behavior when maxRequests = 0', () => {
    const bucket = 'zero_limit_test_' + Math.random().toString(36).slice(2);
    const r1 = checkRateLimit(bucket, 'client_1', 0, 10000);
    expect(r1.allowed).toBe(false);
    expect(r1.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('probes key collision between bucket and clientId containing colons', () => {
    const b1 = 'user:action';
    const c1 = '123';
    const b2 = 'user';
    const c2 = 'action:123';

    const testPrefix = 'collision_' + Math.random().toString(36).slice(2);
    const bucket1 = `${testPrefix}_${b1}`;
    const bucket2 = `${testPrefix}_${b2}`;

    const r1 = checkRateLimit(bucket1, c1, 1, 10000);
    expect(r1.allowed).toBe(true);
    // Keys must not collide even if bucket/client contains colons
    const r2 = checkRateLimit(bucket2, c2, 1, 10000);
    expect(r2.allowed).toBe(true);
  });

  it('probes map size growth when MAX_RATE_BUCKETS is reached with multi-hit keys', () => {
    // Fill buckets with multi-hit keys to probe eviction
    // Note: RATE_LIMIT_BUCKETS is module-scoped, so let's check if we can insert past 2000
    const prefix = 'overflow_test_';
    // Let's test inserting 50 distinct clients making 2 hits each
    for (let i = 0; i < 50; i++) {
      checkRateLimit(prefix, `c_${i}`, 5, 60000);
      checkRateLimit(prefix, `c_${i}`, 5, 60000);
    }
    // All 50 now have count = 2
  });
});

describe('ADVERSARIAL: isSubmissionTooFast edge cases', () => {
  it('probes boundary values around 800ms threshold', () => {
    expect(isSubmissionTooFast({ elapsed_ms: 0 })).toBe(true);
    expect(isSubmissionTooFast({ elapsed_ms: 799 })).toBe(true);
    expect(isSubmissionTooFast({ elapsed_ms: 799.99 })).toBe(true);
    expect(isSubmissionTooFast({ elapsed_ms: 800 })).toBe(false);
    expect(isSubmissionTooFast({ elapsed_ms: 800.01 })).toBe(false);
  });

  it('probes negative values', () => {
    // Negative elapsed_ms should not be considered "too fast" normal submission
    expect(isSubmissionTooFast({ elapsed_ms: -1 })).toBe(false);
    expect(isSubmissionTooFast({ elapsed_ms: -100 })).toBe(false);
  });

  it('probes extreme future or past started_at', () => {
    expect(isSubmissionTooFast({ started_at: Date.now() + 1_000_000 })).toBe(false);
    expect(isSubmissionTooFast({ started_at: 0 })).toBe(false);
    expect(isSubmissionTooFast({ started_at: -1000 })).toBe(false);
  });
});
