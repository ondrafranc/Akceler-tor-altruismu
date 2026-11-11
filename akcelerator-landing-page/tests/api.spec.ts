import { test, expect } from '@playwright/test';

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

  // 3. Public HTML GET response has Edge CDN Cache-Control header & /api/feedback works
  const homeRes = await request.get(baseURL! + '/');
  expect(homeRes.status()).toBe(200);
  expect(homeRes.headers()['cache-control']).toContain('s-maxage=3600');

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
