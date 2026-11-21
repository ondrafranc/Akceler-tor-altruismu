import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('$app/environment', () => ({ browser: false, dev: false }));

import { resolveClientKey, isAuthorizedTestBypass } from '$lib/security.js';
import {
  buildClientCacheKey,
  getServerSupabase,
  getAdminSupabase
} from '$lib/server/supabase.js';
import { MICRO_ACTIONS } from '$lib/data/czech-actions.js';
import { PATCH as submissionsPatch } from '../../src/routes/api/submissions/+server.js';
import { GET as pulseGet, POST as pulsePost } from '../../src/routes/api/pulse/+server.js';
import {
  GET as testSupabaseGet,
  POST as testSupabasePost
} from '../../src/routes/api/test-supabase/+server.js';
import {
  GET as geocodeGet,
  _resetGeocodeStateForTests
} from '../../src/routes/api/geocode/+server.js';
import {
  GET as feedbackGet,
  POST as feedbackPost
} from '../../src/routes/api/feedback/+server.js';
import { GET as nearbyGet } from '../../src/routes/api/nearby/+server.js';

const APP_ROOT = path.resolve(import.meta.dirname, '../..');

describe('M2 #1: PATCH /api/submissions auth-before-ratelimit', () => {
  const origModSecret = process.env.MODERATOR_SECRET;
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const origPubUrl = process.env.PUBLIC_SUPABASE_URL;

  afterEach(() => {
    if (origModSecret === undefined) delete process.env.MODERATOR_SECRET;
    else process.env.MODERATOR_SECRET = origModSecret;
    if (origServiceKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
    if (origPubUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origPubUrl;
  });

  it('returns 401 with no-store on missing, empty, unconfigured, wrong, or length-mismatched secret without consuming quota', async () => {
    delete process.env.MODERATOR_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    const ip = () => '198.51.100.110';

    const unconfiguredRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: { 'x-moderator-secret': 'anything' }
        }),
        getClientAddress: ip
      })
    );
    expect(unconfiguredRes.status).toBe(401);
    expect(unconfiguredRes.headers.get('cache-control')).toBe('no-store');

    process.env.MODERATOR_SECRET = 'correct-moderator-secret-123456';

    const badSecrets = ['', 'short', 'x'.repeat(128), 'wrong-secret'];
    for (let i = 0; i < 16; i++) {
      const secret = badSecrets[i % badSecrets.length];
      /** @type {Record<string, string>} */
      const headers = secret ? { 'x-moderator-secret': secret } : {};
      const res = await submissionsPatch(
        /** @type {*} */ ({
          request: new Request('https://localhost/api/submissions', {
            method: 'PATCH',
            headers
          }),
          getClientAddress: ip
        })
      );
      expect(res.status).toBe(401);
      expect(res.headers.get('cache-control')).toBe('no-store');
    }

    // Valid moderator from the same IP must NOT be rate-limited after unauthenticated flood
    const validRes = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'correct-moderator-secret-123456',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: ip
      })
    );
    expect(validRes.status).toBe(503);
    expect(validRes.headers.get('cache-control')).toBe('no-store');
  });

  it('enforces 10-request submissions-mod limit strictly for authenticated moderators', async () => {
    process.env.MODERATOR_SECRET = 'correct-moderator-secret-123456';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ip = () => '198.51.100.111';

    for (let i = 0; i < 10; i++) {
      const res = await submissionsPatch(
        /** @type {*} */ ({
          request: new Request('https://localhost/api/submissions', {
            method: 'PATCH',
            headers: {
              'x-moderator-secret': 'correct-moderator-secret-123456',
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              id: '550e8400-e29b-41d4-a716-446655440000',
              status: 'approved'
            })
          }),
          getClientAddress: ip
        })
      );
      expect(res.status).toBe(503);
    }

    const blocked = await submissionsPatch(
      /** @type {*} */ ({
        request: new Request('https://localhost/api/submissions', {
          method: 'PATCH',
          headers: {
            'x-moderator-secret': 'correct-moderator-secret-123456',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            id: '550e8400-e29b-41d4-a716-446655440000',
            status: 'approved'
          })
        }),
        getClientAddress: ip
      })
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('cache-control')).toBe('no-store');
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});

describe('M2 #2: resolveClientKey & isAuthorizedTestBypass hardening', () => {
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  const origNodeEnv = process.env.NODE_ENV;
  const origBypass = process.env.TEST_BYPASS_SECRET;

  afterEach(() => {
    if (origVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = origVercel;
    if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = origVercelEnv;
    if (origNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = origNodeEnv;
    if (origBypass === undefined) delete process.env.TEST_BYPASS_SECRET;
    else process.env.TEST_BYPASS_SECRET = origBypass;
  });

  it('prioritizes x-vercel-forwarded-for over spoofable headers and handles all loopback forms on Vercel', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'production';

    const req = new Request('https://akcelerator-altruismu.vercel.app/api/pulse', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
        'x-forwarded-for': '192.0.2.50',
        'x-vercel-forwarded-for': ', 203.0.113.5, 10.0.0.1'
      }
    });
    expect(resolveClientKey(req, () => '198.51.100.77')).toBe('203.0.113.5');
    expect(resolveClientKey(req, () => '::ffff:127.0.0.1')).toBe('203.0.113.5');

    // Without x-vercel-forwarded-for on Vercel, never trust cf-connecting-ip / x-forwarded-for
    const spoofedOnlyReq = new Request('https://akcelerator-altruismu.vercel.app/api/pulse', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
        'x-forwarded-for': '192.0.2.50'
      }
    });
    expect(resolveClientKey(spoofedOnlyReq, () => '198.51.100.77')).toBe('198.51.100.77');
    expect(resolveClientKey(spoofedOnlyReq, () => '::ffff:127.0.0.1')).toBe('::ffff:127.0.0.1');
    expect(resolveClientKey(spoofedOnlyReq, () => '0:0:0:0:0:0:0:1')).toBe('0:0:0:0:0:0:0:1');
    expect(
      resolveClientKey(spoofedOnlyReq, () => {
        throw new Error('unavailable');
      })
    ).toBe('local');
  });

  it('off-Vercel prefers non-loopback getClientAddress, then x-vercel-forwarded-for, then loopback getClientAddress', () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    const req = new Request('http://localhost/api/pulse', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
        'x-forwarded-for': '192.0.2.50',
        'x-vercel-forwarded-for': '203.0.113.8, 10.0.0.2'
      }
    });

    // Non-loopback direct address wins
    expect(resolveClientKey(req, () => '198.51.100.44')).toBe('198.51.100.44');

    // Loopback direct addresses yield to x-vercel-forwarded-for (not cf-connecting-ip)
    for (const loopback of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '0:0:0:0:0:0:0:1', 'localhost', '  LOCALHOST  ']) {
      expect(resolveClientKey(req, () => loopback)).toBe('203.0.113.8');
    }

    // Without x-vercel-forwarded-for, loopback getClientAddress beats cf-connecting-ip
    const cfOnlyReq = new Request('http://localhost/api/pulse', {
      headers: {
        'cf-connecting-ip': '198.51.100.99',
        'x-forwarded-for': '192.0.2.50'
      }
    });
    expect(resolveClientKey(cfOnlyReq, () => '::ffff:127.0.0.1')).toBe('::ffff:127.0.0.1');

    // Only when getClientAddress is unavailable/throws and x-vercel-forwarded-for is absent
    expect(
      resolveClientKey(cfOnlyReq, () => {
        throw new Error('no socket');
      })
    ).toBe('198.51.100.99');

    // Truncates >64 chars
    const longIpReq = new Request('http://localhost/api/pulse', {
      headers: { 'x-vercel-forwarded-for': 'a'.repeat(100) }
    });
    expect(resolveClientKey(longIpReq, () => '')).toHaveLength(64);
  });

  it('isAuthorizedTestBypass rejects VERCEL_ENV=production even when NODE_ENV is not production', () => {
    process.env.TEST_BYPASS_SECRET = 'secret-xyz';
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'production';

    const req = new Request('https://localhost', {
      headers: { 'x-test-bypass-secret': 'secret-xyz' }
    });
    expect(isAuthorizedTestBypass(req)).toBe(false);

    process.env.VERCEL_ENV = 'preview';
    expect(isAuthorizedTestBypass(req)).toBe(true);
  });
});

describe('M2 #3: Supabase client cache key SHA-256 non-collision', () => {
  const origUrl = process.env.PUBLIC_SUPABASE_URL;
  const origAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;
  const origService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (origUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origUrl;
    if (origAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origAnon;
    if (origService === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = origService;
  });

  it('produces 64-char SHA-256 keys and invalidates singletons when JWTs share identical prefixes', () => {
    const sharedPrefix = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.';
    const jwtA = `${sharedPrefix}eyJyb2xlIjoiYW5vbiIsInYiOjF9.sigA`;
    const jwtB = `${sharedPrefix}eyJyb2xlIjoiYW5vbiIsInYiOjJ9.sigB`;

    const keyA = buildClientCacheKey('anon', 'https://example.supabase.co', jwtA);
    const keyB = buildClientCacheKey('anon', 'https://example.supabase.co', jwtB);
    const adminKeyA = buildClientCacheKey('admin', 'https://example.supabase.co', jwtA);

    expect(keyA).toMatch(/^[0-9a-f]{64}$/);
    expect(keyA).not.toBe(keyB);
    expect(keyA).not.toBe(adminKeyA);

    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = jwtA;
    const anonClient1 = getServerSupabase();
    const anonClient1Again = getServerSupabase();
    expect(anonClient1).not.toBeNull();
    expect(anonClient1).toBe(anonClient1Again);

    process.env.PUBLIC_SUPABASE_ANON_KEY = jwtB;
    const anonClient2 = getServerSupabase();
    expect(anonClient2).not.toBeNull();
    expect(anonClient2).not.toBe(anonClient1);

    const svcA = `${sharedPrefix}eyJyb2xlIjoic2VydmljZV9yb2xlIiwidiI6MX0.sig1`;
    const svcB = `${sharedPrefix}eyJyb2xlIjoic2VydmljZV9yb2xlIiwidiI6Mn0.sig2`;
    process.env.SUPABASE_SERVICE_ROLE_KEY = svcA;
    const adminClient1 = getAdminSupabase();
    expect(adminClient1).toBe(getAdminSupabase());

    process.env.SUPABASE_SERVICE_ROLE_KEY = svcB;
    const adminClient2 = getAdminSupabase();
    expect(adminClient2).not.toBe(adminClient1);
  });
});

describe('M2 #4a: POST & GET /api/pulse allowlist, city sanitization & secret bypass', () => {
  const origAllowDev = process.env.PULSE_ALLOW_DEV_WRITES;
  const origVercelEnv = process.env.VERCEL_ENV;
  const origBypass = process.env.TEST_BYPASS_SECRET;
  const origUrl = process.env.PUBLIC_SUPABASE_URL;
  const origAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    if (origAllowDev === undefined) delete process.env.PULSE_ALLOW_DEV_WRITES;
    else process.env.PULSE_ALLOW_DEV_WRITES = origAllowDev;
    if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = origVercelEnv;
    if (origBypass === undefined) delete process.env.TEST_BYPASS_SECRET;
    else process.env.TEST_BYPASS_SECRET = origBypass;
    if (origUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origUrl;
    if (origAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origAnon;
  });

  it('rejects unallowlisted actionIds and unsafe cities with 400 no-store, accepts all canonical/emitter IDs', async () => {
    const prodUrl = new URL('http://localhost/api/pulse');

    const badActionIds = [
      '',
      'arbitrary_evil_id',
      '../etc/passwd',
      'curated:A',
      'curated:' + 'a'.repeat(80),
      'submit_123'
    ];
    for (const badId of badActionIds) {
      const res = await pulsePost(
        /** @type {*} */ ({
          url: prodUrl,
          request: new Request(prodUrl, {
            method: 'POST',
            headers: { origin: 'http://localhost', 'content-type': 'application/json' },
            body: JSON.stringify({ actionId: badId, city: 'Praha' })
          }),
          getClientAddress: () => '198.51.100.120'
        })
      );
      expect(res.status).toBe(400);
      expect(res.headers.get('cache-control')).toBe('no-store');
    }

    const badCities = ['<script>alert(1)</script>', 'https://evil.cz', 'Praha 123', 'Brno 🐾'];
    for (const badCity of badCities) {
      const res = await pulsePost(
        /** @type {*} */ ({
          url: prodUrl,
          request: new Request(prodUrl, {
            method: 'POST',
            headers: { origin: 'http://localhost', 'content-type': 'application/json' },
            body: JSON.stringify({ actionId: 'zvirata_utulek_online', city: badCity })
          }),
          getClientAddress: () => '198.51.100.121'
        })
      );
      expect(res.status).toBe(400);
      expect(res.headers.get('cache-control')).toBe('no-store');
    }

    const validActionIds = [
      ...MICRO_ACTIONS.map((a) => a.id),
      'curated:praha-potravinova-banka',
      'comm-seed-1',
      'comm:50.0755:14.4378',
      'submit_1700000000000',
      '550e8400-e29b-41d4-a716-446655440000',
      'mindful_breathing',
      'sanctuary_wish',
      'altruism_step',
      'spark_impulse',
      'step'
    ];
    expect(validActionIds).toContain('nevypusť_dusi');

    for (let i = 0; i < validActionIds.length; i++) {
      const res = await pulsePost(
        /** @type {*} */ ({
          url: prodUrl,
          request: new Request(prodUrl, {
            method: 'POST',
            headers: { origin: 'http://localhost', 'content-type': 'application/json' },
            body: JSON.stringify({
              actionId: validActionIds[i],
              city: i === 0 ? 'Kladno (Stř. Čechy)' : 'Praha'.repeat(20)
            })
          }),
          getClientAddress: () => `198.51.100.${130 + Math.floor(i / 20)}`
        })
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.skipped).toBe('non-production');
    }
  });

  it('rejects User-Agent Playwright/HeadlessChrome bypass on non-localhost hosts and honors TEST_BYPASS_SECRET only', async () => {
    delete process.env.PULSE_ALLOW_DEV_WRITES;
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    process.env.VERCEL_ENV = 'preview';
    process.env.TEST_BYPASS_SECRET = 'pulse-bypass-secret';

    const previewUrl = new URL('https://akcelerator-preview.vercel.app/api/pulse');

    // Spoofed UA without valid secret must NOT skip production write path (reaches DB check -> 503 when unconfigured)
    for (const ua of ['Playwright/1.55', 'HeadlessChrome/130.0']) {
      const res = await pulsePost(
        /** @type {*} */ ({
          url: previewUrl,
          request: new Request(previewUrl, {
            method: 'POST',
            headers: {
              origin: 'https://akcelerator-preview.vercel.app',
              'content-type': 'application/json',
              'user-agent': ua
            },
            body: JSON.stringify({ actionId: 'zvirata_utulek_online', city: 'Praha' })
          }),
          getClientAddress: () => '198.51.100.140'
        })
      );
      expect(res.status).toBe(503);
    }

    // Valid x-test-bypass-secret skips DB write in preview
    const bypassRes = await pulsePost(
      /** @type {*} */ ({
        url: previewUrl,
        request: new Request(previewUrl, {
          method: 'POST',
          headers: {
            origin: 'https://akcelerator-preview.vercel.app',
            'content-type': 'application/json',
            'x-test-bypass-secret': 'pulse-bypass-secret'
          },
          body: JSON.stringify({ actionId: 'zvirata_utulek_online', city: 'Praha' })
        }),
        getClientAddress: () => '198.51.100.140'
      })
    );
    expect(bypassRes.status).toBe(200);
    expect((await bypassRes.json()).skipped).toBe('non-production');
  });

  it('sanitizes unsafe DB city values in GET /api/pulse', async () => {
    process.env.PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.PUBLIC_SUPABASE_ANON_KEY = 'anon-key-test';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: '1',
            created_at: new Date().toISOString(),
            action_id: 'zvirata_utulek_online',
            city: '<script>alert(1)</script>',
            kind: 'click'
          }
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const url = new URL('http://localhost/api/pulse');
    const res = await pulseGet(
      /** @type {*} */ ({
        url,
        request: new Request(url)
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.city).not.toContain('<script>');
    expect(body.message).not.toContain('<script>');
  });
});

describe('M2 #4b: /api/test-supabase Preview/Prod gating & rate limit', () => {
  const origVercel = process.env.VERCEL;
  const origVercelEnv = process.env.VERCEL_ENV;
  const origBypass = process.env.TEST_BYPASS_SECRET;
  const origUrl = process.env.PUBLIC_SUPABASE_URL;
  const origAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    if (origVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = origVercel;
    if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = origVercelEnv;
    if (origBypass === undefined) delete process.env.TEST_BYPASS_SECRET;
    else process.env.TEST_BYPASS_SECRET = origBypass;
    if (origUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origUrl;
    if (origAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origAnon;
  });

  it('blocks GET & POST with 404 in Vercel Preview/Production and non-local hosts unless authorized', async () => {
    process.env.TEST_BYPASS_SECRET = 'diag-bypass-123';
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    const previewUrl = new URL('https://preview.vercel.app/api/test-supabase');

    const previewGet = await testSupabaseGet(
      /** @type {*} */ ({
        url: previewUrl,
        request: new Request(previewUrl),
        getClientAddress: () => '198.51.100.150'
      })
    );
    expect(previewGet.status).toBe(404);
    expect(previewGet.headers.get('cache-control')).toBe('no-store');

    const previewPost = await testSupabasePost(
      /** @type {*} */ ({
        url: previewUrl,
        request: new Request(previewUrl, {
          method: 'POST',
          headers: { origin: 'https://preview.vercel.app', 'content-type': 'application/json' },
          body: JSON.stringify({ feedback_text: 'test', rating: 5 })
        }),
        getClientAddress: () => '198.51.100.150'
      })
    );
    expect(previewPost.status).toBe(404);
    expect(previewPost.headers.get('cache-control')).toBe('no-store');

    // Authorized bypass works in preview (reaches feedbackGet -> 503 if Supabase unconfigured)
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    const authPreviewGet = await testSupabaseGet(
      /** @type {*} */ ({
        url: previewUrl,
        request: new Request(previewUrl, {
          headers: { 'x-test-bypass-secret': 'diag-bypass-123' }
        }),
        getClientAddress: () => '198.51.100.151'
      })
    );
    expect(authPreviewGet.status).toBe(503);

    // Production blocks unconditionally even with valid bypass secret
    process.env.VERCEL_ENV = 'production';
    const prodUrl = new URL('https://akcelerator-altruismu.vercel.app/api/test-supabase');
    const authProdGet = await testSupabaseGet(
      /** @type {*} */ ({
        url: prodUrl,
        request: new Request(prodUrl, {
          headers: { 'x-test-bypass-secret': 'diag-bypass-123' }
        }),
        getClientAddress: () => '198.51.100.151'
      })
    );
    expect(authProdGet.status).toBe(404);
    expect(authProdGet.headers.get('cache-control')).toBe('no-store');

    // Non-Vercel non-local host is also blocked with 404
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    const extUrl = new URL('https://akcelerator-altruismu.cz/api/test-supabase');
    const extGet = await testSupabaseGet(
      /** @type {*} */ ({
        url: extUrl,
        request: new Request(extUrl),
        getClientAddress: () => '198.51.100.152'
      })
    );
    expect(extGet.status).toBe(404);
  });

  it('rate-limits allowed local GET /api/test-supabase after 20 requests/min', async () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;

    const localUrl = new URL('http://localhost/api/test-supabase');
    const ip = () => '198.51.100.155';

    for (let i = 0; i < 20; i++) {
      const res = await testSupabaseGet(
        /** @type {*} */ ({
          url: localUrl,
          request: new Request(localUrl),
          getClientAddress: ip
        })
      );
      expect(res.status).toBe(503);
    }

    const limited = await testSupabaseGet(
      /** @type {*} */ ({
        url: localUrl,
        request: new Request(localUrl),
        getClientAddress: ip
      })
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.get('cache-control')).toBe('no-store');
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
  });
});

describe('M2 #4c: /api/geocode queue wait cap & dead state removal', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    _resetGeocodeStateForTests();
  });

  it('has no dead LAST_UPSTREAM_TS state in geocode/+server.js', () => {
    const src = fs.readFileSync(path.join(APP_ROOT, 'src/routes/api/geocode/+server.js'), 'utf8');
    expect(src).not.toContain('LAST_UPSTREAM_TS');
  });

  it('returns uncached 503 with retry-after when concurrent queue wait exceeds 2500ms', async () => {
    _resetGeocodeStateForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00.000Z'));

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify([{ lat: '50.0755', lon: '14.4378', display_name: 'Test, Česko', address: { country_code: 'cz' } }]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    /**
     * @param {string} q
     * @param {string} ip
     */
    const makeReq = (q, ip) => {
      const url = new URL(`http://localhost/api/geocode?q=${encodeURIComponent(q)}&limit=3`);
      return geocodeGet(
        /** @type {*} */ ({
          url,
          request: new Request(url),
          getClientAddress: () => ip
        })
      );
    };

    // Launch 3 concurrent uncached misses: delays 0ms, 1100ms, 2200ms (all <= 2500ms)
    const p1 = makeReq('neznamaulice101', '198.51.100.160');
    const p2 = makeReq('neznamaulice102', '198.51.100.161');
    const p3 = makeReq('neznamaulice103', '198.51.100.162');

    // 4th concurrent miss at t=0 has delay 3300ms > 2500ms -> immediate 503 without waiting
    const res4 = await makeReq('neznamaulice104', '198.51.100.163');
    expect(res4.status).toBe(503);
    expect(res4.headers.get('cache-control')).toBe('no-store');
    expect(Number(res4.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    const body4 = await res4.json();
    expect(body4.error).toBe('Geocoding service busy');
    expect(body4.results).toEqual([]);

    await vi.advanceTimersByTimeAsync(2300);
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(200);

    // Ensure 503 did NOT poison CACHE or advance lastScheduleTime past p3: after 1200ms, neznamaulice104 succeeds
    await vi.advanceTimersByTimeAsync(1200);
    const retryRes4 = await makeReq('neznamaulice104', '198.51.100.163');
    expect(retryRes4.status).toBe(200);
  });
});

describe('M2 #4d & #5: /api/nearby unified cache key & service-worker.js dead sync removal', () => {
  it('removes includeAssociations / include_associations from /api/nearby & nearbyService.js and returns identical responses', async () => {
    const nearbyApiSrc = fs.readFileSync(path.join(APP_ROOT, 'src/routes/api/nearby/+server.js'), 'utf8');
    const nearbySvcSrc = fs.readFileSync(path.join(APP_ROOT, 'src/lib/server/nearbyService.js'), 'utf8');
    expect(nearbyApiSrc).not.toContain('includeAssociations');
    expect(nearbyApiSrc).not.toContain('include_associations');
    expect(nearbySvcSrc).not.toContain('includeAssociations');

    const url0 = new URL('http://localhost/api/nearby?lat=50.0755&lon=14.4378&radius_m=5000&include_associations=0');
    const url1 = new URL('http://localhost/api/nearby?lat=50.0755&lon=14.4378&radius_m=5000&include_associations=1');

    const res0 = await nearbyGet(
      /** @type {*} */ ({
        url: url0,
        request: new Request(url0),
        getClientAddress: () => '198.51.100.170'
      })
    );
    const res1 = await nearbyGet(
      /** @type {*} */ ({
        url: url1,
        request: new Request(url1),
        getClientAddress: () => '198.51.100.170'
      })
    );
    expect(res0.status).toBe(200);
    expect(res1.status).toBe(200);
    expect(await res0.json()).toEqual(await res1.json());
  });

  it('removes orphan SYNC_OFFLINE_OUTBOX listener from service-worker.js while retaining offline fallback', () => {
    const swSrc = fs.readFileSync(path.join(APP_ROOT, 'src/service-worker.js'), 'utf8');
    expect(swSrc).not.toContain('SYNC_OFFLINE_OUTBOX');
    expect(swSrc).not.toContain('offline-outbox-sync');
    expect(swSrc).not.toContain("addEventListener('sync'");
    expect(swSrc).toContain('/offline.html');
    expect(swSrc).toContain("url.pathname.startsWith('/api/')");
  });
});

describe('M1 security remediations: feedback rate limit & no-store, geocode fallback no-store', () => {
  const origBypass = process.env.TEST_BYPASS_SECRET;
  const origVercelEnv = process.env.VERCEL_ENV;
  const origUrl = process.env.PUBLIC_SUPABASE_URL;
  const origAnon = process.env.PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    vi.restoreAllMocks();
    _resetGeocodeStateForTests();
    if (origBypass === undefined) delete process.env.TEST_BYPASS_SECRET;
    else process.env.TEST_BYPASS_SECRET = origBypass;
    if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = origVercelEnv;
    if (origUrl === undefined) delete process.env.PUBLIC_SUPABASE_URL;
    else process.env.PUBLIC_SUPABASE_URL = origUrl;
    if (origAnon === undefined) delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    else process.env.PUBLIC_SUPABASE_ANON_KEY = origAnon;
  });

  it('GET /api/feedback rate-limits at 30/min with no-store and retry-after, while honoring authorized test bypass', async () => {
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VERCEL_ENV;
    process.env.TEST_BYPASS_SECRET = 'm1-feedback-bypass';

    const url = new URL('http://localhost/api/feedback');
    const ip = () => '198.51.100.210';

    for (let i = 0; i < 30; i++) {
      const res = await feedbackGet(
        /** @type {*} */ ({
          url,
          request: new Request(url),
          getClientAddress: ip
        })
      );
      expect(res.status).toBe(503);
      expect(res.headers.get('cache-control')).toBe('no-store');
    }

    const blocked = await feedbackGet(
      /** @type {*} */ ({
        url,
        request: new Request(url),
        getClientAddress: ip
      })
    );
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('cache-control')).toBe('no-store');
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);

    const bypassed = await feedbackGet(
      /** @type {*} */ ({
        url,
        request: new Request(url, { headers: { 'x-test-bypass-secret': 'm1-feedback-bypass' } }),
        getClientAddress: ip
      })
    );
    expect(bypassed.status).toBe(503);
    expect(bypassed.headers.get('cache-control')).toBe('no-store');
  });

  it('POST /api/feedback sets Cache-Control: no-store on 403, 400, 503, 200, and 429 responses', async () => {
    delete process.env.VERCEL_ENV;
    delete process.env.TEST_BYPASS_SECRET;
    const url = new URL('https://localhost/api/feedback');
    const ip = () => '198.51.100.211';

    // 403 cross-origin
    const res403 = await feedbackPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
          body: JSON.stringify({ message: 'test' })
        }),
        getClientAddress: ip
      })
    );
    expect(res403.status).toBe(403);
    expect(res403.headers.get('cache-control')).toBe('no-store');

    // 400 validation error
    const res400 = await feedbackPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify({ message: '' })
        }),
        getClientAddress: ip
      })
    );
    expect(res400.status).toBe(400);
    expect(res400.headers.get('cache-control')).toBe('no-store');

    // 503 unconfigured Supabase
    delete process.env.PUBLIC_SUPABASE_URL;
    delete process.env.PUBLIC_SUPABASE_ANON_KEY;
    const res503 = await feedbackPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify({ message: 'Skvělý projekt' })
        }),
        getClientAddress: ip
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
    const res200 = await feedbackPost(
      /** @type {*} */ ({
        url,
        request: new Request(url, {
          method: 'POST',
          headers: { origin: 'https://localhost', 'content-type': 'application/json' },
          body: JSON.stringify({ message: 'Skvělý projekt', rating: 5 })
        }),
        getClientAddress: ip
      })
    );
    expect(res200.status).toBe(200);
    expect(res200.headers.get('cache-control')).toBe('no-store');

    // 429 rate-limited (25/10min per IP)
    let res429 = null;
    for (let i = 0; i < 26; i++) {
      const r = await feedbackPost(
        /** @type {*} */ ({
          url,
          request: new Request(url, {
            method: 'POST',
            headers: { origin: 'https://localhost', 'content-type': 'application/json' },
            body: JSON.stringify({ message: 'Další zpráva' })
          }),
          getClientAddress: ip
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

  it('GET /api/geocode emits no-store on fallback:true (empty Nominatim & rejected Nominatim across fresh, inflight, and cached hits) and s-maxage=86400 on valid responses', async () => {
    // 1. Empty Nominatim ([]) -> fallback: true -> no-store on fresh, inflight, and cache hit
    _resetGeocodeStateForTests();
    /** @type {(res: Response) => void} */
    let resolveEmptyFetch = () => {};
    /** @type {() => void} */
    let markEmptyFetchStarted = () => {};
    const emptyFetchStarted = new Promise((resolve) => {
      markEmptyFetchStarted = () => resolve(undefined);
    });
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveEmptyFetch = resolve;
          markEmptyFetchStarted();
        })
    );

    const emptyUrl = new URL('http://localhost/api/geocode?q=neznamaulice201&limit=3');
    const pFresh = geocodeGet(
      /** @type {*} */ ({
        url: emptyUrl,
        request: new Request(emptyUrl),
        getClientAddress: () => '198.51.100.212'
      })
    );
    const pInflight = geocodeGet(
      /** @type {*} */ ({
        url: emptyUrl,
        request: new Request(emptyUrl),
        getClientAddress: () => '198.51.100.213'
      })
    );

    await emptyFetchStarted;
    resolveEmptyFetch(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    );

    const [freshEmptyRes, inflightEmptyRes] = await Promise.all([pFresh, pInflight]);
    expect(freshEmptyRes.status).toBe(200);
    expect(freshEmptyRes.headers.get('cache-control')).toBe('no-store');
    expect((await freshEmptyRes.json()).fallback).toBe(true);

    expect(inflightEmptyRes.status).toBe(200);
    expect(inflightEmptyRes.headers.get('cache-control')).toBe('no-store');
    expect((await inflightEmptyRes.json()).fallback).toBe(true);

    const cachedEmptyRes = await geocodeGet(
      /** @type {*} */ ({
        url: emptyUrl,
        request: new Request(emptyUrl),
        getClientAddress: () => '198.51.100.214'
      })
    );
    expect(cachedEmptyRes.status).toBe(200);
    expect(cachedEmptyRes.headers.get('cache-control')).toBe('no-store');
    expect((await cachedEmptyRes.json()).fallback).toBe(true);

    // 2. Rejected Nominatim -> fallback: true -> no-store on fresh, inflight, and cache hit
    _resetGeocodeStateForTests();
    /** @type {(err: Error) => void} */
    let rejectFetch = () => {};
    /** @type {() => void} */
    let markErrFetchStarted = () => {};
    const errFetchStarted = new Promise((resolve) => {
      markErrFetchStarted = () => resolve(undefined);
    });
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFetch = reject;
          markErrFetchStarted();
        })
    );

    const errUrl = new URL('http://localhost/api/geocode?q=neznamaulice202&limit=3');
    const pErrFresh = geocodeGet(
      /** @type {*} */ ({
        url: errUrl,
        request: new Request(errUrl),
        getClientAddress: () => '198.51.100.215'
      })
    );
    const pErrInflight = geocodeGet(
      /** @type {*} */ ({
        url: errUrl,
        request: new Request(errUrl),
        getClientAddress: () => '198.51.100.216'
      })
    );

    await errFetchStarted;
    rejectFetch(new Error('Network down'));
    const [errFreshRes, errInflightRes] = await Promise.all([pErrFresh, pErrInflight]);
    expect(errFreshRes.status).toBe(200);
    expect(errFreshRes.headers.get('cache-control')).toBe('no-store');
    expect((await errFreshRes.json()).fallback).toBe(true);

    expect(errInflightRes.status).toBe(200);
    expect(errInflightRes.headers.get('cache-control')).toBe('no-store');
    expect((await errInflightRes.json()).fallback).toBe(true);

    const errCachedRes = await geocodeGet(
      /** @type {*} */ ({
        url: errUrl,
        request: new Request(errUrl),
        getClientAddress: () => '198.51.100.217'
      })
    );
    expect(errCachedRes.status).toBe(200);
    expect(errCachedRes.headers.get('cache-control')).toBe('no-store');

    // 3. Valid Nominatim hit & instant match still emit s-maxage=86400
    _resetGeocodeStateForTests();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify([{ lat: '50.0755', lon: '14.4378', display_name: 'Karlín, Praha', address: { country_code: 'cz' } }]),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );
    const okUrl = new URL('http://localhost/api/geocode?q=neznamaulice203&limit=3');
    const okRes = await geocodeGet(
      /** @type {*} */ ({
        url: okUrl,
        request: new Request(okUrl),
        getClientAddress: () => '198.51.100.218'
      })
    );
    expect(okRes.status).toBe(200);
    expect(okRes.headers.get('cache-control')).toContain('s-maxage=86400');

    const instantUrl = new URL('http://localhost/api/geocode?q=Brno&limit=3');
    const instantRes = await geocodeGet(
      /** @type {*} */ ({
        url: instantUrl,
        request: new Request(instantUrl),
        getClientAddress: () => '198.51.100.219'
      })
    );
    expect(instantRes.status).toBe(200);
    expect(instantRes.headers.get('cache-control')).toContain('s-maxage=86400');
  });
});
