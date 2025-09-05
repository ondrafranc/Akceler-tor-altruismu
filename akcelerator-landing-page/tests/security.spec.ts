import { test, expect } from '@playwright/test';

test('root sets security headers', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/');
  expect(res.status()).toBeLessThan(500);
  const h = res.headers();
  expect(h['content-security-policy']).toBeDefined();
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['x-content-type-options']).toBe('nosniff');
});

test('test route returns 200', async ({ page }) => {
  const res = await page.goto('/test');
  expect(res?.status()).toBe(200);
});

