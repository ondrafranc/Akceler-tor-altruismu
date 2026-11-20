import { describe, it, expect, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$app/environment', () => ({ browser: false, dev: false }));
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
  isAuthorizedTestBypass,
  validateMutationOrigin
} from '$lib/security.js';
import { resolveSupabaseConfig, hashClientKey } from '$lib/server/supabase.js';
import { POST as submissionsPost, PATCH as submissionsPatch } from '../../src/routes/api/submissions/+server.js';
import { GET as communityNearbyGet } from '../../src/routes/api/community-nearby/+server.js';
import { handle as serverHandle } from '../../src/hooks.server.js';
import {
  completedSteps,
  sanctuaryWishes,
  restoreProgressFromBackupCode
} from '$lib/progress.js';
import { cleanMeta, exportProgressPasscode } from '$lib/utils.js';

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

describe('security: validateMutationOrigin strict Content-Type & origin enforcement', () => {
  it('accepts same-origin application/json requests and rejects missing or non-JSON Content-Type', () => {
    const targetUrl = new URL('https://akcelerator-altruismu.cz/api/feedback');

    const validReq = new Request(targetUrl, {
      method: 'POST',
      headers: {
        origin: 'https://akcelerator-altruismu.cz',
        'content-type': 'application/json; charset=utf-8'
      }
    });
    expect(validateMutationOrigin(validReq, targetUrl)).toBe(true);

    const missingCtReq = new Request(targetUrl, {
      method: 'POST',
      headers: { origin: 'https://akcelerator-altruismu.cz' }
    });
    expect(validateMutationOrigin(missingCtReq, targetUrl)).toBe(false);

    const formCtReq = new Request(targetUrl, {
      method: 'POST',
      headers: {
        origin: 'https://akcelerator-altruismu.cz',
        'content-type': 'application/x-www-form-urlencoded'
      }
    });
    expect(validateMutationOrigin(formCtReq, targetUrl)).toBe(false);

    const crossOriginReq = new Request(targetUrl, {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(crossOriginReq, targetUrl)).toBe(false);
  });

  it('rejects sec-fetch-site: same-site without matching Origin while allowing same-origin/none or absent headers', () => {
    const targetUrl = new URL('https://akcelerator-altruismu.cz/api/feedback');

    const sameSiteNoOrigin = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-site',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(sameSiteNoOrigin, targetUrl)).toBe(false);

    const sameSiteNormalizedNoOrigin = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': ' SAME-SITE ',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(sameSiteNormalizedNoOrigin, targetUrl)).toBe(false);

    const sameSiteSubdomainOrigin = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-site',
        origin: 'https://evil.akcelerator-altruismu.cz',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(sameSiteSubdomainOrigin, targetUrl)).toBe(false);

    const sameSiteMatchingOrigin = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-site',
        origin: 'https://akcelerator-altruismu.cz',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(sameSiteMatchingOrigin, targetUrl)).toBe(true);

    const sameOriginNoOriginHeader = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(sameOriginNoOriginHeader, targetUrl)).toBe(true);

    const noneNoOriginHeader = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'none',
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(noneNoOriginHeader, targetUrl)).toBe(true);

    const absentBothHeaders = new Request(targetUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      }
    });
    expect(validateMutationOrigin(absentBothHeaders, targetUrl)).toBe(true);
  });
});

describe('security: Supabase config & ephemeral IP salt (supabase.js)', () => {
  const origApiKey = process.env['API Key'];
  const origSalt = process.env.IP_HASH_SALT;
  const origJwt = process.env.SUPABASE_JWT_SECRET;

  afterEach(() => {
    if (origApiKey === undefined) delete process.env['API Key'];
    else process.env['API Key'] = origApiKey;
    if (origSalt === undefined) delete process.env.IP_HASH_SALT;
    else process.env.IP_HASH_SALT = origSalt;
    if (origJwt === undefined) delete process.env.SUPABASE_JWT_SECRET;
    else process.env.SUPABASE_JWT_SECRET = origJwt;
  });

  it('ignores non-standard "API Key" env var in resolveSupabaseConfig', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    process.env['API Key'] = 'should-not-be-used';
    const cfg = resolveSupabaseConfig();
    expect(cfg.serviceKey).toBe('');
  });

  it('never uses static hardcoded literal salt in hashClientKey when env secrets are unset', async () => {
    delete process.env.IP_HASH_SALT;
    delete process.env.SUPABASE_JWT_SECRET;
    const crypto = await import('node:crypto');
    const legacyStaticHash = crypto
      .createHash('sha256')
      .update('akcelerator-ip-salt:1.2.3.4')
      .digest('hex')
      .slice(0, 24);
    expect(hashClientKey('1.2.3.4')).not.toBe(legacyStaticHash);

    process.env.IP_HASH_SALT = 'custom-prod-salt-123';
    const saltedA = hashClientKey('1.2.3.4');
    process.env.IP_HASH_SALT = 'custom-prod-salt-456';
    const saltedB = hashClientKey('1.2.3.4');
    expect(saltedA).not.toBe(saltedB);
  });
});

describe('security: PATCH /api/submissions & GET /api/community-nearby hardening', () => {
  const origModSecret = process.env.MODERATOR_SECRET;
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origPubUrl = process.env.PUBLIC_SUPABASE_URL;
  const origPubAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    if (origModSecret === undefined) delete process.env.MODERATOR_SECRET;
    else process.env.MODERATOR_SECRET = origModSecret;
    if (origServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
    if (origPubUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origPubUrl;
    if (origPubAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origPubAnon;
  });

  it('enforces UUID validation (400), JSON Content-Type (415), strict admin client (503), and rate limiting (429) on PATCH /api/submissions', async () => {
    process.env.MODERATOR_SECRET = 'test-mod-secret-value';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-must-not-be-used';

    const clientAddr = () => '198.51.100.77';

    const badCtRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'text/plain'
          },
          body: '{"id":"550e8400-e29b-41d4-a716-446655440000","status":"approved"}'
        }),
        getClientAddress: clientAddr
      })
    );
    expect(badCtRes.status).toBe(415);

    const badUuidRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'application/json'
          },
          body: JSON.stringify({ id: 'not-a-uuid', status: 'approved' })
        }),
        getClientAddress: clientAddr
      })
    );
    expect(badUuidRes.status).toBe(400);

    const noAdminRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: clientAddr
      })
    );
    expect(noAdminRes.status).toBe(503);

    // Wrong or missing secrets must return 401 and NEVER consume the valid-moderator quota
    for (let i = 0; i < 12; i++) {
      const unauthRes = await submissionsPatch(
        /** @type {*} */ ({
          request: new Request('https://localhost/api/submissions', {
            method: 'PATCH',
            headers: { 'x-moderator-secret': 'wrong' }
          }),
          getClientAddress: clientAddr
        })
      );
      expect(unauthRes.status).toBe(401);
      expect(unauthRes.headers.get('cache-control')).toBe('no-store');
    }

    // Exhaust the remaining 7 of 10 valid-secret attempts in the 15-min window and confirm 11th returns 429
    for (let i = 0; i < 7; i++) {
      const validRes = await submissionsPatch(
        /** @type {*} */ ({
          request: new Request('https://localhost/api/submissions', {
            method: 'PATCH',
            headers: {
              'x-moderator-secret': 'test-mod-secret-value',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              id: '550e8400-e29b-41d4-a716-446655440000',
              status: 'approved'
            })
          }),
          getClientAddress: clientAddr
        })
      );
      expect(validRes.status).toBe(503);
    }
    const rateLimitedRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: clientAddr
      })
    );
    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.headers.get('cache-control')).toBe('no-store');
    expect(Number(rateLimitedRes.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('rate-limits GET /api/community-nearby after 120 requests', async () => {
    const clientAddr = () => '198.51.100.88';
    const url = new URL('https://localhost/api/community-nearby?lat=50.0755&lon=14.4378&radius_m=5000');

    for (let i = 0; i < 120; i++) {
      const res = await communityNearbyGet(
        /** @type {*} */ ({
          url,
          request: new Request(url),
          getClientAddress: clientAddr
        })
      );
      expect(res.status).toBe(200);
    }

    const limitedRes = await communityNearbyGet(
      /** @type {*} */ ({
        url,
        request: new Request(url),
        getClientAddress: clientAddr
      })
    );
    expect(limitedRes.status).toBe(429);
  });
});

describe('security: restoreProgressFromBackupCode schema validation & sanitization', () => {
  it('sanitizes restored steps/wishes, clamps coordinates, drops malformed entries, and rejects invalid objects', () => {
    const bogusCode = exportProgressPasscode({ unrelated: 'payload' });
    // Note: exportProgressPasscode prepends v: 1; verify malformed array elements are dropped and valid ones sanitized
    expect(restoreProgressFromBackupCode('not-a-valid-code')).toBe(false);

    const dirtyCode = exportProgressPasscode({
      s: [
        null,
        'bad-string-item',
        123,
        {
          id: 'zvirata_utulek_online',
          title: '🐾 Naplnit misku',
          element: 'invalid_element',
          lightType: 'invalid_light',
          plantedPos: { x: 99, y: -5, lightType: 'bogus' },
          timestamp: 'not-a-date'
        }
      ],
      w: [
        null,
        { bad: true },
        {
          title: '🕯️ Sousedská pomoc',
          lightType: 'star',
          element: 'bogus',
          x: -2,
          y: 5,
          timestamp: '2026-11-18T12:00:00.000Z'
        }
      ],
      m: { treatsFedTotal: -5, petCount: 3, availableTreats: 1, giftDeeds: 2 }
    });

    expect(restoreProgressFromBackupCode(dirtyCode)).toBe(true);
    const steps = get(completedSteps);
    expect(steps.length).toBe(1);
    expect(steps[0].title).toBe('Naplnit misku');
    expect(steps[0].element).toBe('animals');
    expect(steps[0].lightType).toBe('lantern');
    expect(steps[0].plantedPos?.x).toBe(0.94);
    expect(steps[0].plantedPos?.y).toBe(0.07);
    expect(steps[0].plantedPos?.zone).toBe('sky');
    expect(Number.isNaN(Date.parse(steps[0].timestamp))).toBe(false);

    const wishes = get(sanctuaryWishes);
    expect(wishes.length).toBe(1);
    expect(wishes[0].title).toBe('Sousedská pomoc');
    expect(wishes[0].lightType).toBe('star');
    expect(wishes[0].zone).toBe('sky');
    expect(wishes[0].x).toBe(0.06);
    expect(wishes[0].y).toBe(0.88);
    expect(bogusCode.startsWith('AA1-')).toBe(true);
  });

  it('strips emoji-only and embedded emojis from restored title, concreteImpact, and note with safe defaults', () => {
    const emojiCode = exportProgressPasscode({
      s: [
        {
          id: 'emoji_only_step',
          title: '🐾',
          concreteImpact: '🎁 Dárek',
          note: 'Poznámka 🔥 s emoji'
        },
        {
          id: 'embedded_emoji_step',
          title: 'Nakrmit 🐾 misku',
          concreteImpact: 'Světlo ✨ pro útulek',
          note: '🌟'
        }
      ],
      w: [
        {
          title: '🌟',
          lightType: 'star',
          concreteImpact: '🎁 Dárek pro radost'
        },
        {
          title: 'Pomoc 🐾 sousedům',
          lightType: 'wave',
          concreteImpact: '🔥 Teplo domova'
        }
      ]
    });

    expect(restoreProgressFromBackupCode(emojiCode)).toBe(true);
    const emojiRe = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;

    const steps = get(completedSteps);
    expect(steps.length).toBe(2);
    expect(steps[0].title).toBe('Malý dobrý krok');
    expect(steps[0].concreteImpact).toBe('Dárek');
    expect(steps[0].note).toBe('Poznámka s emoji');
    expect(steps[1].title).toBe('Nakrmit misku');
    expect(steps[1].concreteImpact).toBe('Světlo pro útulek');
    expect(steps[1].note).toBe('');
    for (const s of steps) {
      expect(s.title).not.toMatch(emojiRe);
      expect(s.concreteImpact).not.toMatch(emojiRe);
      expect(s.note).not.toMatch(emojiRe);
    }

    const wishes = get(sanctuaryWishes);
    expect(wishes.length).toBe(2);
    expect(wishes[0].title).toBe('Hvězda tiché inspirace');
    expect(wishes[0].concreteImpact).toBe('Dárek pro radost');
    expect(wishes[1].title).toBe('Pomoc sousedům');
    expect(wishes[1].concreteImpact).toBe('Teplo domova');
    for (const w of wishes) {
      expect(w.title).not.toMatch(emojiRe);
      expect(w.concreteImpact).not.toMatch(emojiRe);
    }
  });
});

describe('security: M1 iteration 2 boundary & error-handling regressions', () => {
  const origModSecret = process.env.MODERATOR_SECRET;
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origPubUrl = process.env.PUBLIC_SUPABASE_URL;
  const origPubAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (origModSecret === undefined) delete process.env.MODERATOR_SECRET;
    else process.env.MODERATOR_SECRET = origModSecret;
    if (origServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
    if (origPubUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origPubUrl;
    if (origPubAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origPubAnon;
  });

  it('sanitizeHttpUrl rejects URLs exceeding maxLen after scheme/normalization expansion', () => {
    const schemeless278 = 'example.cz/' + 'a'.repeat(267); // 278 raw -> 286 with https://
    expect(schemeless278.length).toBe(278);
    expect(sanitizeHttpUrl(schemeless278, 280)).toBeNull();

    const noSlash280 = 'http://' + 'a'.repeat(270) + '.cz'; // 280 raw -> 281 with trailing '/'
    expect(noSlash280.length).toBe(280);
    expect(sanitizeHttpUrl(noSlash280, 280)).toBeNull();

    const exact280 = 'https://example.cz/' + 'a'.repeat(261); // 280 normalized
    expect(exact280.length).toBe(280);
    expect(sanitizeHttpUrl(exact280, 280)).toBe(exact280);
  });

  it('isCzLatLon aligns strictly with 0002_rls_hardening.sql Czechia bounds (48.0..51.5, 11.5..19.5)', () => {
    expect(isCzLatLon(47.99, 14.4378)).toBe(false);
    expect(isCzLatLon(48.0, 14.4378)).toBe(true);
    expect(isCzLatLon(51.5, 14.4378)).toBe(true);
    expect(isCzLatLon(51.51, 14.4378)).toBe(false);
    expect(isCzLatLon(50.0, 11.49)).toBe(false);
    expect(isCzLatLon(50.0, 11.5)).toBe(true);
    expect(isCzLatLon(50.0, 19.5)).toBe(true);
    expect(isCzLatLon(50.0, 19.51)).toBe(false);
  });

  it('POST /api/submissions truncates fallback city from >80-char address_label to <=80 chars', async () => {
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

    /** @type {Record<string, unknown> | null} */
    let insertedRow = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const bodyStr = typeof init?.body === 'string' ? init.body : '';
      const parsed = bodyStr ? JSON.parse(bodyStr) : null;
      insertedRow = Array.isArray(parsed) ? parsed[0] : parsed;
      return new Response(JSON.stringify({}), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      });
    });

    const longAddress = 'Komunitní zahrada U Velkého Rybníka 123/45, Praha 10 - Strašnice, Hlavní město Praha, Česko';
    expect(longAddress.length).toBeGreaterThan(80);

    const url = new URL('https://localhost/api/submissions');
    const res = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: {
            origin: 'https://localhost',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            hp: '',
            elapsed_ms: 2500,
            kind: 'org',
            name: 'Knihobudka Strašnice',
            category: 'community',
            city: null,
            address_label: longAddress,
            lat: 50.0755,
            lon: 14.4378
          })
        }),
        getClientAddress: () => '198.51.100.91'
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.item.city).toBe('string');
    expect(body.item.city.length).toBe(80);
    expect(insertedRow).not.toBeNull();
    expect(typeof insertedRow?.city).toBe('string');
    expect(String(insertedRow?.city).length).toBe(80);
  });

  it('PATCH /api/submissions returns 404 on PGRST116 and JSON 503 on timeout without throwing', async () => {
    process.env.MODERATOR_SECRET = 'test-mod-secret-value';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key';
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          code: 'PGRST116',
          details: 'The result contains 0 rows',
          hint: null,
          message: 'Cannot coerce the result to a single JSON object'
        }),
        { status: 406, headers: { 'content-type': 'application/json' } }
      )
    );

    const pgrstRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: () => '198.51.100.92'
      })
    );
    expect(pgrstRes.status).toBe(404);
    const pgrstJson = await pgrstRes.json();
    expect(pgrstJson.success).toBe(false);

    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => new Promise(() => {}));

    const timeoutPromise = submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'test-mod-secret-value',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: () => '198.51.100.92'
      })
    );

    await vi.advanceTimersByTimeAsync(2900);
    const timeoutRes = await timeoutPromise;
    expect(timeoutRes.status).toBe(503);
    const timeoutJson = await timeoutRes.json();
    expect(timeoutJson.success).toBe(false);
  });

  it('hooks.server.js sets private/no-store Cache-Control on non-200 SSR HTML responses', async () => {
    const res = await serverHandle({
      event: /** @type {*} */ ({
        request: new Request('https://localhost/nonexistent-page', { method: 'GET' }),
        url: new URL('https://localhost/nonexistent-page')
      }),
      resolve: async () =>
        new Response('<html><body>Not Found</body></html>', {
          status: 404,
          headers: { 'content-type': 'text/html; charset=utf-8' }
        })
    });

    expect(res.status).toBe(404);
    expect(res.headers.get('cache-control')).toBe('private, no-cache, no-store, must-revalidate');
    expect(res.headers.get('pragma')).toBe('no-cache');
  });

  it('cleanMeta and restoreProgressFromBackupCode strip Unicode tag-sequence flags and keycap emojis while preserving normal digits/#/*', () => {
    expect(cleanMeta('🏴󠁧󠁢󠁥󠁮󠁧󠁿')).toBe('');
    expect(cleanMeta('🏴󠁧󠁢󠁳󠁣󠁴󠁿')).toBe('');
    expect(cleanMeta('1️⃣')).toBe('');
    expect(cleanMeta('#️⃣')).toBe('');
    expect(cleanMeta('*️⃣')).toBe('');
    expect(cleanMeta('1\u20E3')).toBe('');
    expect(cleanMeta('Krok 1️⃣ hotový')).toBe('Krok hotový');
    expect(cleanMeta('Krok 1 hotový')).toBe('Krok 1 hotový');
    expect(cleanMeta('#1 výzva * poznámka')).toBe('#1 výzva * poznámka');

    const edgeCode = exportProgressPasscode({
      s: [
        {
          id: 'tag_flag_step',
          title: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          concreteImpact: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
          note: 'Krok 1️⃣ hotový'
        },
        {
          id: 'keycap_step',
          title: '1️⃣',
          concreteImpact: '#️⃣ *️⃣',
          note: 'Krok 1 hotový'
        }
      ],
      w: [
        {
          title: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          lightType: 'star',
          concreteImpact: '1️⃣'
        },
        {
          title: '1️⃣',
          lightType: 'lantern',
          concreteImpact: 'Krok 1️⃣ hotový'
        }
      ]
    });

    expect(restoreProgressFromBackupCode(edgeCode)).toBe(true);
    const steps = get(completedSteps);
    expect(steps.length).toBe(2);
    expect(steps[0].title).toBe('Malý dobrý krok');
    expect(steps[0].concreteImpact).toBe('');
    expect(steps[0].note).toBe('Krok hotový');
    expect(steps[1].title).toBe('Malý dobrý krok');
    expect(steps[1].concreteImpact).toBe('');
    expect(steps[1].note).toBe('Krok 1 hotový');

    const wishes = get(sanctuaryWishes);
    expect(wishes.length).toBe(2);
    expect(wishes[0].title).toBe('Hvězda tiché inspirace');
    expect(wishes[0].concreteImpact).toBe('');
    expect(wishes[1].title).toBe('Drobný osobní skutek v běžném dni');
    expect(wishes[1].concreteImpact).toBe('Krok hotový');
  });

  it('POST /api/submissions avoids unpaired UTF-16 surrogates when truncating 4-byte characters at index 79..80 and 199..200', async () => {
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

    /** @type {Record<string, unknown> | null} */
    let insertedRow = null;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const bodyStr = typeof init?.body === 'string' ? init.body : '';
      const parsed = bodyStr ? JSON.parse(bodyStr) : null;
      insertedRow = Array.isArray(parsed) ? parsed[0] : parsed;
      return new Response(JSON.stringify({}), {
        status: 201,
        headers: { 'content-type': 'application/json' }
      });
    });

    const loneSurrogateRe = /(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])/;
    const addressWithBoundarySurrogates =
      'a'.repeat(79) + '🌲' + 'b'.repeat(119) + '🌲' + 'c'.repeat(20);

    const url = new URL('https://localhost/api/submissions');
    const res = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: {
            origin: 'https://localhost',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            hp: '',
            elapsed_ms: 2500,
            kind: 'org',
            name: 'Lesní školka Dubínek',
            category: 'nature',
            city: null,
            address_label: addressWithBoundarySurrogates,
            lat: 50.0755,
            lon: 14.4378
          })
        }),
        getClientAddress: () => '198.51.100.93'
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.item.city).toBe('string');
    expect(Array.from(body.item.city).length).toBe(80);
    expect(body.item.city.endsWith('🌲')).toBe(true);
    expect(body.item.city).not.toMatch(loneSurrogateRe);
    expect(body.item.address_label).not.toMatch(loneSurrogateRe);
    expect(Array.from(body.item.address_label).length).toBe(200);
    expect(insertedRow).not.toBeNull();
    expect(Array.from(String(insertedRow?.city)).length).toBe(80);
    expect(String(insertedRow?.city)).not.toMatch(loneSurrogateRe);
    expect(String(insertedRow?.address)).not.toMatch(loneSurrogateRe);
  });

  it('POST /api/submissions emits Cache-Control: no-store across 403, 400, 200 (honeypot), 503, 200, and 429 responses', async () => {
    const url = new URL('https://localhost/api/submissions');

    // 403 cross-origin
    const res403 = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
          body: JSON.stringify({})
        }),
        getClientAddress: () => '198.51.100.201'
      })
    );
    expect(res403.status).toBe(403);
    expect(res403.headers.get('cache-control')).toBe('no-store');

    // 200 honeypot
    const resHoneypot = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify({ hp: 'bot-filled' })
        }),
        getClientAddress: () => '198.51.100.201'
      })
    );
    expect(resHoneypot.status).toBe(200);
    expect(resHoneypot.headers.get('cache-control')).toBe('no-store');

    // 400 validation error
    const res400 = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify({ hp: '', elapsed_ms: 2500, kind: 'org', name: 'A' })
        }),
        getClientAddress: () => '198.51.100.201'
      })
    );
    expect(res400.status).toBe(400);
    expect(res400.headers.get('cache-control')).toBe('no-store');

    // 503 missing Supabase config
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    const validPayload = {
      hp: '',
      elapsed_ms: 2500,
      kind: 'org',
      name: 'Komunitní centrum Lipová',
      category: 'community',
      city: 'Praha',
      lat: 50.0755,
      lon: 14.4378
    };
    const res503 = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify(validPayload)
        }),
        getClientAddress: () => '198.51.100.201'
      })
    );
    expect(res503.status).toBe(503);
    expect(res503.headers.get('cache-control')).toBe('no-store');

    // 200 mocked Supabase insert
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), { status: 201, headers: { 'content-type': 'application/json' } })
    );
    const res200 = await submissionsPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify(validPayload)
        }),
        getClientAddress: () => '198.51.100.201'
      })
    );
    expect(res200.status).toBe(200);
    expect(res200.headers.get('cache-control')).toBe('no-store');

    // 429 rate-limited (15/10min per IP; already made 3 non-honeypot requests above from 198.51.100.201)
    let res429 = null;
    for (let i = 0; i < 15; i++) {
      const r = await submissionsPost(
        /** @type {*} */ ({
          url,
          request: new Request(url, {
            method: 'POST',
            headers: { origin: 'https://localhost', 'content-type': 'application/json' },
            body: JSON.stringify(validPayload)
          }),
          getClientAddress: () => '198.51.100.201'
        })
      );
      if (r.status === 429) {
        res429 = r;
        break;
      }
    }
    expect(res429).not.toBeNull();
    expect(res429?.headers.get('cache-control')).toBe('no-store');
    expect(Number(res429?.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});
