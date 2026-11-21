import { test, expect } from '@playwright/test';

// These tests share one server-side rate-limit budget and write to a live database: keep them in order.
test.describe.configure({ mode: 'default' });

test('test-supabase API responds 200 JSON on GET and POST', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/api/test-supabase');
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] || '';
  expect(ct).toMatch(/application\/json/);

  const postRes = await request.post(baseURL! + '/api/test-supabase', {
    data: { feedback_text: 'Skvělý web, moc mi pomohl najít útulek v okolí!', rating: 5 }
  });
  expect(postRes.status()).toBe(200);
  const postBody = await postRes.json();
  expect(postBody.success).toBe(true);
});

test('nearby API returns places array quickly', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/api/nearby?lat=50.0755&lon=14.4378&radius_m=5000&kinds=ngo,community,food,animals');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body.places)).toBeTruthy();
  expect(body.places.length).toBeGreaterThan(0);
});

test('community-nearby and submissions APIs work end-to-end', async ({ request, baseURL }) => {
  const getRes = await request.get(baseURL! + '/api/community-nearby?lat=50.0755&lon=14.4378&radius_m=15000');
  expect(getRes.status()).toBe(200);
  const getBody = await getRes.json();
  expect(Array.isArray(getBody.items)).toBeTruthy();
  expect(getBody.items.length).toBeGreaterThan(0);

  const subRes = await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'org',
      name: 'Testovací komunitní zahrada Praha',
      category: '🌱 Příroda a úklid',
      lat: 50.0755,
      lon: 14.4378,
      address_label: 'Praha'
    }
  });
  expect(subRes.status()).toBe(200);
  const subBody = await subRes.json();
  expect(subBody.success).toBe(true);
});

test('anywhere in Czechia (even rural Šumava / Vysočina) always returns nearest actions sorted by distance', async ({ request, baseURL }) => {
  // Remote Šumava coordinates with a tiny 1km radius
  const ruralLat = 49.025;
  const ruralLon = 13.625;
  const nearRes = await request.get(
    `${baseURL!}/api/nearby?lat=${ruralLat}&lon=${ruralLon}&radius_m=1000&kinds=ngo,community,food,animals`
  );
  expect(nearRes.status()).toBe(200);
  const nearBody = await nearRes.json();
  expect(Array.isArray(nearBody.places)).toBeTruthy();
  expect(nearBody.places.length).toBeGreaterThanOrEqual(2);

  const commRes = await request.get(`${baseURL!}/api/community-nearby?lat=${ruralLat}&lon=${ruralLon}&radius_m=1000`);
  expect(commRes.status()).toBe(200);
  const commBody = await commRes.json();
  expect(Array.isArray(commBody.items)).toBeTruthy();
  expect(commBody.items.length).toBeGreaterThanOrEqual(2);
  // Nearest regional capitals to central Šumava are České Budějovice / Plzeň
  expect(commBody.items[0].distanceKm).toBeLessThanOrEqual(commBody.items[1].distanceKm);

  // Geocode test (with diacritics-free query)
  const geoRes = await request.get(`${baseURL!}/api/geocode?q=Tabor&limit=3`);
  expect(geoRes.status()).toBe(200);
  const geoBody = await geoRes.json();
  expect(Array.isArray(geoBody.results)).toBeTruthy();
  expect(geoBody.results.length).toBeGreaterThan(0);
});

test('APIs reject dangerous URLs, invalid coordinates, and out-of-range inputs', async ({ request, baseURL }) => {
  // Reject javascript: URI in submissions
  const xssSub = await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'org',
      name: 'Testovací komunitní zahrada Praha',
      website: 'javascript:alert(1)',
      lat: 50.0755,
      lon: 14.4378
    }
  });
  expect(xssSub.status()).toBe(400);

  // Reject invalid geographic bounds on /api/nearby
  const badNear = await request.get(baseURL! + '/api/nearby?lat=999&lon=14.4378');
  expect(badNear.status()).toBe(400);

  // Reject out-of-range rating on /api/test-supabase
  const badFb = await request.post(baseURL! + '/api/test-supabase', {
    data: { feedback_text: 'Test', rating: 99 }
  });
  expect(badFb.status()).toBe(400);
});

test('pulse API (JSON + SSE), edge Cache-Control headers, and unverified submission isolation', async ({ request, baseURL }) => {
  // 1. /api/pulse JSON
  const pulseJsonRes = await request.get(baseURL! + '/api/pulse');
  expect(pulseJsonRes.status()).toBe(200);
  expect(pulseJsonRes.headers()['cache-control']).toContain('s-maxage=30');
  const pulseJson = await pulseJsonRes.json();
  expect(typeof pulseJson.message).toBe('string');
  expect(pulseJson.message.length).toBeGreaterThan(10);
  expect(pulseJson.message).not.toContain('(');
  expect(pulseJson.message).not.toContain('v Kladno');
  expect(pulseJson.message).not.toContain('v Karlovy Vary');

  // 2. /api/pulse SSE
  const pulseSseRes = await request.get(baseURL! + '/api/pulse', {
    headers: { accept: 'text/event-stream' }
  });
  expect(pulseSseRes.status()).toBe(200);
  expect(pulseSseRes.headers()['content-type']).toContain('text/event-stream');
  const sseText = await pulseSseRes.text();
  expect(sseText).toContain('event: pulse');

  // 3. Public HTML GET response with per-request CSP nonce must NOT be publicly CDN-cached & /api/feedback works
  const homeRes = await request.get(baseURL! + '/');
  expect(homeRes.status()).toBe(200);
  expect(homeRes.headers()['cache-control']).toContain('private');
  expect(homeRes.headers()['cache-control']).toContain('no-store');
  expect(homeRes.headers()['cache-control']).not.toContain('s-maxage');

  const fbAliasRes = await request.post(baseURL! + '/api/feedback', {
    data: { feedback_text: 'Skvělý nový mobilní zen režim!', rating: 5 }
  });
  expect(fbAliasRes.status()).toBe(200);
  const fbAliasBody = await fbAliasRes.json();
  expect(fbAliasBody.success).toBe(true);

  // 4. Unverified pending submission does NOT poison public /api/community-nearby response
  await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'org',
      name: 'Nepotvrzený spolek Test 123',
      category: '🌱 Příroda a úklid',
      lat: 50.08,
      lon: 14.43,
      address_label: 'Praha'
    }
  });
  const commRes = await request.get(baseURL! + '/api/community-nearby?lat=50.08&lon=14.43&radius_m=15000');
  const commBody = await commRes.json();
  expect(commBody.items.some((i: any) => i.name === 'Nepotvrzený spolek Test 123')).toBe(false);

  // 5. District towns (Tábor, Kladno) return local curated & community places within radius
  const taborRes = await request.get(
    baseURL! + '/api/nearby?lat=49.4144&lon=14.6578&radius_m=8000&kinds=ngo,community,food,animals'
  );
  expect(taborRes.status()).toBe(200);
  const taborBody = await taborRes.json();
  expect(taborBody.places.some((p: any) => p.name.includes('Tábor'))).toBe(true);

  const kladnoRes = await request.get(
    baseURL! + '/api/nearby?lat=50.1473&lon=14.1028&radius_m=8000&kinds=ngo,community,food,animals'
  );
  expect(kladnoRes.status()).toBe(200);
  const kladnoBody = await kladnoRes.json();
  expect(kladnoBody.places.some((p: any) => p.name.includes('Kladno'))).toBe(true);

  // 6. Curated places with shared prefix ("Veřejná knihobudka...") are not dropped as false duplicates and stay sorted nearest-first
  const prahaCommRes = await request.get(
    baseURL! + '/api/nearby?lat=50.0755&lon=14.4378&radius_m=8000&kinds=community'
  );
  expect(prahaCommRes.status()).toBe(200);
  const prahaCommBody = await prahaCommRes.json();
  const curatedIds = prahaCommBody.places.filter((p: any) => p.curated).map((p: any) => p.id);
  expect(curatedIds).toContain('curated:praha-knihobudka-jzp');
  expect(curatedIds).toContain('curated:praha-knihobudka-dejvice');
  const curatedDists = prahaCommBody.places.filter((p: any) => p.curated).map((p: any) => p.distanceKm);
  expect(curatedDists[0]).toBeLessThanOrEqual(curatedDists[1]);
});

test('M1 hardening: event submission persistence, non-JSON mutation rejection, and PATCH moderation auth', async ({ request, baseURL }) => {
  // 1. Event submission preserves kind, event_start, event_end
  const startIso = '2026-12-01T09:00:00.000Z';
  const endIso = '2026-12-01T15:00:00.000Z';
  const eventRes = await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'event',
      name: 'Sousedský úklid parku Test',
      category: 'nature',
      event_url: 'https://example.cz/uklid',
      event_start: startIso,
      event_end: endIso,
      lat: 50.0755,
      lon: 14.4378,
      address_label: 'Praha'
    }
  });
  expect(eventRes.status()).toBe(200);
  const eventBody = await eventRes.json();
  expect(eventBody.success).toBe(true);
  expect(eventBody.item.kind).toBe('event');
  expect(eventBody.item.event_start).toBe(startIso);
  expect(eventBody.item.event_end).toBe(endIso);

  // Reject event_end before event_start
  const badDatesRes = await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'event',
      name: 'Akce se špatným časem',
      event_url: 'https://example.cz/uklid',
      event_start: endIso,
      event_end: startIso,
      lat: 50.0755,
      lon: 14.4378
    }
  });
  expect(badDatesRes.status()).toBe(400);

  // 2. Non-JSON Content-Type is rejected on JSON mutation endpoints
  const nonJsonRes = await request.post(baseURL! + '/api/feedback', {
    headers: { 'content-type': 'text/plain' },
    data: '{"feedback_text":"test"}'
  });
  expect(nonJsonRes.status()).toBe(403);

  // 3. PATCH /api/submissions strictly rejects unauthenticated requests
  const unauthPatch = await request.patch(baseURL! + '/api/submissions', {
    data: { id: '00000000-0000-4000-8000-000000000001', status: 'approved' }
  });
  expect(unauthPatch.status()).toBe(401);

  // 4. POST /api/submissions truncates fallback city from >80-char address_label to <=80 chars
  const longAddress = 'Komunitní centrum U Velkého Rybníka 123/45, Praha 10 - Strašnice, Hlavní město Praha, Česko';
  const longAddrRes = await request.post(baseURL! + '/api/submissions', {
    data: {
      hp: '',
      started_at: Date.now() - 5000,
      kind: 'org',
      name: 'Testovací místo s dlouhou adresou',
      category: 'community',
      lat: 50.0755,
      lon: 14.4378,
      city: null,
      address_label: longAddress
    }
  });
  expect(longAddrRes.status()).toBe(200);
  const longAddrBody = await longAddrRes.json();
  expect(longAddrBody.item.city.length).toBeLessThanOrEqual(80);

  // 5. Non-200 SSR HTML responses also emit private, no-store Cache-Control
  const notFoundHtmlRes = await request.get(baseURL! + '/nonexistent-m1-cache-check');
  expect(notFoundHtmlRes.status()).toBe(404);
  expect(notFoundHtmlRes.headers()['cache-control']).toContain('private');
  expect(notFoundHtmlRes.headers()['cache-control']).toContain('no-store');
  expect(notFoundHtmlRes.headers()['cache-control']).not.toContain('s-maxage');
});

test('M2 hardening: PATCH wrong-secret non-429 isolation, /api/pulse validation, /api/nearby parity, /api/geocode bounds', async ({ request, baseURL }) => {
  // 1. Wrong-secret PATCH /api/submissions must always return 401 and never trip 429 lockout
  for (let i = 0; i < 12; i++) {
    const res = await request.patch(baseURL! + '/api/submissions', {
      headers: { 'x-moderator-secret': `wrong-secret-${i}` },
      data: { id: '00000000-0000-4000-8000-000000000001', status: 'approved' }
    });
    expect(res.status()).toBe(401);
    expect(res.headers()['cache-control']).toContain('no-store');
  }

  // 2. POST /api/pulse rejects unlisted actionId and unsafe city with 400; accepts canonical actionId + clamps long city
  const badPulseAction = await request.post(baseURL! + '/api/pulse', {
    data: { actionId: 'unlisted_arbitrary_action', city: 'Praha', kind: 'click' }
  });
  expect(badPulseAction.status()).toBe(400);
  expect(badPulseAction.headers()['cache-control']).toContain('no-store');

  const badPulseCity = await request.post(baseURL! + '/api/pulse', {
    data: { actionId: 'zvirata_utulek_online', city: '<script>alert(1)</script>', kind: 'click' }
  });
  expect(badPulseCity.status()).toBe(400);
  expect(badPulseCity.headers()['cache-control']).toContain('no-store');

  const validPulseLongCity = await request.post(baseURL! + '/api/pulse', {
    data: { actionId: 'zvirata_utulek_online', city: 'Praha'.repeat(20), kind: 'click' }
  });
  expect(validPulseLongCity.status()).toBe(200);
  const validPulseBody = await validPulseLongCity.json();
  expect(validPulseBody.success).toBe(true);

  // 3. GET /api/nearby returns identical places regardless of include_associations param
  const near0 = await request.get(baseURL! + '/api/nearby?lat=50.0755&lon=14.4378&radius_m=5000&include_associations=0');
  const near1 = await request.get(baseURL! + '/api/nearby?lat=50.0755&lon=14.4378&radius_m=5000&include_associations=1');
  expect(near0.status()).toBe(200);
  expect(near1.status()).toBe(200);
  const body0 = await near0.json();
  const body1 = await near1.json();
  expect(body0.places.length).toBe(body1.places.length);
  expect(body0.places.map((p: any) => p.id)).toEqual(body1.places.map((p: any) => p.id));

  // 4. GET /api/geocode rejects <2 and >120 char queries with 400 no-store
  const shortGeo = await request.get(baseURL! + '/api/geocode?q=a');
  expect(shortGeo.status()).toBe(400);
  expect(shortGeo.headers()['cache-control']).toContain('no-store');

  const longGeo = await request.get(baseURL! + `/api/geocode?q=${'x'.repeat(121)}`);
  expect(longGeo.status()).toBe(400);
  expect(longGeo.headers()['cache-control']).toContain('no-store');
});
