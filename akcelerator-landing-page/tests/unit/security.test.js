import { describe, it, expect, afterEach } from 'vitest';
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
  isSubmissionTooFast,
  safeCompareTokens,
  isAuthorizedTestBypass
} from '$lib/security.js';

describe('security: text & number sanitization', () => {
  it('safeText handles normal strings, strips control chars and handles invalid inputs', () => {
    expect(safeText('  Ahoj světe  ')).toBe('Ahoj světe');
    expect(safeText('Text\x00with\x08null\x1Fbytes')).toBe('Textwithnullbytes');
    expect(safeText('Line 1\nLine 2\tTabbed')).toBe('Line 1\nLine 2\tTabbed');
    expect(safeText(null)).toBe('');
    expect(safeText(undefined)).toBe('');
    expect(safeText(12345)).toBe('');
    expect(safeText({ text: 'obj' })).toBe('');
  });

  it('toFiniteNumber converts valid numbers and returns null for invalid', () => {
    expect(toFiniteNumber(42)).toBe(42);
    expect(toFiniteNumber('3.1415')).toBe(3.1415);
    expect(toFiniteNumber('-100')).toBe(-100);
    expect(toFiniteNumber(0)).toBe(0);
    expect(toFiniteNumber('')).toBeNull();
    expect(toFiniteNumber(null)).toBeNull();
    expect(toFiniteNumber(undefined)).toBeNull();
    expect(toFiniteNumber(NaN)).toBeNull();
    expect(toFiniteNumber(Infinity)).toBeNull();
    expect(toFiniteNumber('not-a-number')).toBeNull();
  });

  it('clamp clamps numbers within [min, max]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('security: URL, Email & Phone sanitization', () => {
  it('sanitizeHttpUrl accepts valid HTTP/HTTPS URLs and normalizes scheme', () => {
    expect(sanitizeHttpUrl('https://darujme.cz/projekt/123')).toBe('https://darujme.cz/projekt/123');
    expect(sanitizeHttpUrl('http://example.com/page')).toBe('http://example.com/page');
    expect(sanitizeHttpUrl('//en.wikipedia.org/wiki/Altruism')).toBe('https://en.wikipedia.org/wiki/Altruism');
    expect(sanitizeHttpUrl('akcelerator-altruismu.cz')).toBe('https://akcelerator-altruismu.cz/');
  });

  it('sanitizeHttpUrl rejects dangerous schemes and credentials', () => {
    expect(sanitizeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeHttpUrl('vbscript:msgbox(1)')).toBeNull();
    expect(sanitizeHttpUrl('file:///etc/passwd')).toBeNull();
    expect(sanitizeHttpUrl('https://admin:password@malicious.com')).toBeNull();
    expect(sanitizeHttpUrl('https://invalid_domain')).toBeNull();
    expect(sanitizeHttpUrl('https://' + 'a'.repeat(300) + '.com', 280)).toBeNull();
  });

  it('sanitizeEmail validates emails and rejects injections', () => {
    expect(sanitizeEmail('pomoc@akcelerator.cz')).toBe('pomoc@akcelerator.cz');
    expect(sanitizeEmail('  user.name+tag@domain.co.uk  ')).toBe('user.name+tag@domain.co.uk');
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('user@domain\r\nBcc:attacker@spam.com')).toBeNull();
    expect(sanitizeEmail('')).toBeNull();
    expect(sanitizeEmail(null)).toBeNull();
  });

  it('sanitizePhone validates phone numbers and rejects arbitrary text', () => {
    expect(sanitizePhone('+420 123 456 789')).toBe('+420 123 456 789');
    expect(sanitizePhone('777123456')).toBe('777123456');
    expect(sanitizePhone('+420 (0) 777-888-999')).toBe('+420 (0) 777-888-999');
    expect(sanitizePhone('00420 777 888 999')).toBe('00420 777 888 999');
    expect(sanitizePhone('volat po 17:00')).toBeNull();
    expect(sanitizePhone('<script>')).toBeNull();
    expect(sanitizePhone(null)).toBeNull();
  });
});

describe('security: coordinates & distance calculation', () => {
  it('isValidLatLon validates WGS84 range', () => {
    expect(isValidLatLon(50.087, 14.421)).toBe(true);
    expect(isValidLatLon(90, 180)).toBe(true);
    expect(isValidLatLon(-90, -180)).toBe(true);
    expect(isValidLatLon(90.1, 14.421)).toBe(false);
    expect(isValidLatLon(50.087, 180.1)).toBe(false);
    expect(isValidLatLon('50.087', 14.421)).toBe(false);
    expect(isValidLatLon(null, 14.421)).toBe(false);
  });

  it('isCzLatLon checks boundaries within Czechia territory', () => {
    // Prague
    expect(isCzLatLon(50.087, 14.421)).toBe(true);
    // Brno
    expect(isCzLatLon(49.195, 16.608)).toBe(true);
    // Ostrava
    expect(isCzLatLon(49.821, 18.262)).toBe(true);
    // New York
    expect(isCzLatLon(40.7128, -74.006)).toBe(false);
    // Sydney
    expect(isCzLatLon(-33.8688, 151.2093)).toBe(false);
  });

  it('haversineKm calculates great-circle distance accurately', () => {
    // Same point -> 0 distance
    expect(haversineKm(50.087, 14.421, 50.087, 14.421)).toBe(0);

    // Prague (50.087, 14.421) to Brno (49.195, 16.608) ~ 185-190 km
    const distPragueBrno = haversineKm(50.087, 14.421, 49.195, 16.608);
    expect(distPragueBrno).toBeGreaterThan(180);
    expect(distPragueBrno).toBeLessThan(195);

    // Symmetry check
    const distBrnoPrague = haversineKm(49.195, 16.608, 50.087, 14.421);
    expect(Math.abs(distPragueBrno - distBrnoPrague)).toBeLessThan(0.0001);
  });
});

describe('security: rate limiter', () => {
  it('allows requests within threshold and blocks subsequent ones', () => {
    const bucket = 'test_bucket_' + Math.random().toString(36).substring(7);
    const client = 'client_123';

    // 3 requests allowed in 10-second window
    const r1 = checkRateLimit(bucket, client, 3, 10000);
    expect(r1.allowed).toBe(true);
    expect(r1.retryAfterSec).toBe(0);

    const r2 = checkRateLimit(bucket, client, 3, 10000);
    expect(r2.allowed).toBe(true);

    const r3 = checkRateLimit(bucket, client, 3, 10000);
    expect(r3.allowed).toBe(true);

    // 4th request must be rejected
    const r4 = checkRateLimit(bucket, client, 3, 10000);
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
    expect(r4.retryAfterSec).toBeLessThanOrEqual(10);
  });

  it('isolates different clients and different buckets', () => {
    const bucketA = 'bucket_A_' + Math.random().toString(36).substring(7);
    const bucketB = 'bucket_B_' + Math.random().toString(36).substring(7);

    // Single request limit
    expect(checkRateLimit(bucketA, 'user_one', 1, 10000).allowed).toBe(true);
    expect(checkRateLimit(bucketA, 'user_one', 1, 10000).allowed).toBe(false);

    // Different user in same bucket is allowed
    expect(checkRateLimit(bucketA, 'user_two', 1, 10000).allowed).toBe(true);

    // Same user in different bucket is allowed
    expect(checkRateLimit(bucketB, 'user_one', 1, 10000).allowed).toBe(true);
  });
});

describe('security: anti-bot timing token (isSubmissionTooFast)', () => {
  it('detects suspiciously fast submissions using elapsed_ms', () => {
    expect(isSubmissionTooFast({ elapsed_ms: 200 })).toBe(true);
    expect(isSubmissionTooFast({ elapsed_ms: 799 })).toBe(true);
    expect(isSubmissionTooFast({ elapsed_ms: 800 })).toBe(false);
    expect(isSubmissionTooFast({ elapsed_ms: 2500 })).toBe(false);
  });

  it('detects fast submissions using started_at timestamp', () => {
    const now = Date.now();
    expect(isSubmissionTooFast({ started_at: now - 300 })).toBe(true);
    expect(isSubmissionTooFast({ started_at: now - 3000 })).toBe(false);
  });

  it('handles client-side clock skew safely without false rejections', () => {
    // If client clock is in the future compared to server NTP (delta < 0), do NOT reject
    const futureStartedAt = Date.now() + 5000;
    expect(isSubmissionTooFast({ started_at: futureStartedAt })).toBe(false);
  });

  it('handles missing or malformed body gracefully', () => {
    expect(isSubmissionTooFast({})).toBe(false);
    expect(isSubmissionTooFast(null)).toBe(false);
    expect(isSubmissionTooFast({ elapsed_ms: 'invalid' })).toBe(false);
  });
});

describe('security: constant-time token comparison (safeCompareTokens)', () => {
  it('returns true for identical string tokens', () => {
    expect(safeCompareTokens('super-secret-123', 'super-secret-123')).toBe(true);
    expect(safeCompareTokens('a'.repeat(64), 'a'.repeat(64))).toBe(true);
  });

  it('returns false for different tokens', () => {
    expect(safeCompareTokens('token-a', 'token-b')).toBe(false);
    expect(safeCompareTokens('super-secret-123', 'super-secret-124')).toBe(false);
  });

  it('returns false safely for different lengths without throwing', () => {
    expect(safeCompareTokens('short', 'much-longer-token-secret')).toBe(false);
    expect(safeCompareTokens('longer', 'short')).toBe(false);
  });

  it('returns false safely for non-strings, null, undefined or empty strings', () => {
    expect(safeCompareTokens('', '')).toBe(false);
    expect(safeCompareTokens('secret', '')).toBe(false);
    expect(safeCompareTokens('', 'secret')).toBe(false);
    expect(safeCompareTokens(null, 'secret')).toBe(false);
    expect(safeCompareTokens('secret', undefined)).toBe(false);
    expect(safeCompareTokens(12345, 12345)).toBe(false);
    expect(safeCompareTokens({}, {})).toBe(false);
  });
});

describe('security: test bypass authorization (isAuthorizedTestBypass)', () => {
  const origEnv = process.env.TEST_BYPASS_SECRET;
  const origNodeEnv = process.env.NODE_ENV;
  const origVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.TEST_BYPASS_SECRET = origEnv;
    process.env.NODE_ENV = origNodeEnv;
    process.env.VERCEL_ENV = origVercelEnv;
  });

  it('strictly rejects when TEST_BYPASS_SECRET is not configured', () => {
    delete process.env.TEST_BYPASS_SECRET;
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'development';

    const reqOldFallback = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'akcelerator-dev-test' }
    });
    expect(isAuthorizedTestBypass(reqOldFallback)).toBe(false);

    const reqRandom = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'some-random-key' }
    });
    expect(isAuthorizedTestBypass(reqRandom)).toBe(false);
  });

  it('strictly rejects when TEST_BYPASS_SECRET is empty string', () => {
    process.env.TEST_BYPASS_SECRET = '   ';
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'development';

    const req = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'akcelerator-dev-test' }
    });
    expect(isAuthorizedTestBypass(req)).toBe(false);
  });

  it('authorizes valid secret in non-production environment', () => {
    process.env.TEST_BYPASS_SECRET = 'correct-e2e-secret-xyz';
    delete process.env.VERCEL_ENV;
    process.env.NODE_ENV = 'development';

    const reqValid = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'correct-e2e-secret-xyz' }
    });
    expect(isAuthorizedTestBypass(reqValid)).toBe(true);

    const reqInvalid = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'wrong-secret' }
    });
    expect(isAuthorizedTestBypass(reqInvalid)).toBe(false);
  });

  it('always rejects in production even if secret matches', () => {
    process.env.TEST_BYPASS_SECRET = 'correct-e2e-secret-xyz';
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';

    const reqValid = new Request('http://localhost', {
      headers: { 'x-test-bypass-secret': 'correct-e2e-secret-xyz' }
    });
    expect(isAuthorizedTestBypass(reqValid)).toBe(false);
  });
});
