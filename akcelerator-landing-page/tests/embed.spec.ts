import { test, expect } from '@playwright/test';

test('Streamlit test page is reachable', async ({ page }) => {
  const res = await page.goto('/test');
  expect(res?.status()).toBe(200);
});


