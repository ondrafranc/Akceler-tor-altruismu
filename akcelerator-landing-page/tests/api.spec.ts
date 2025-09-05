import { test, expect } from '@playwright/test';

test('test-supabase API responds JSON (even if error)', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/api/test-supabase');
  expect(res.ok() || res.status() === 500).toBeTruthy();
  const ct = res.headers()['content-type'] || '';
  expect(ct).toMatch(/application\/json/);
});


