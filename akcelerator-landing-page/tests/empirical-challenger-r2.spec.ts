import { test, expect } from '@playwright/test';

/**
 * EMPIRICAL CHALLENGER R2 ADVERSARIAL HARNESS
 * Rigorously probes Requirement R2 (Psychological delayed gratification mechanics for Molly)
 *
 * Vector 1: Rapid click storms on floating companion, canvas, pill, impulse button.
 * Vector 2: Exact-once treat unlock and consumption semantics.
 * Vector 3: Zero-treat petting emotional feedback (purring, warm Czech whispers).
 * Vector 4: Immunity to race conditions and double-spending of earned treats.
 */

test.describe('Empirical Challenger R2 — Delayed Gratification & Anti-Spam Immunity', () => {

  test.beforeEach(async ({ page }) => {
    const origGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      let res;
      for (let attempt = 1; attempt <= 7; attempt++) {
        try {
          res = await origGoto(url, options);
          break;
        } catch (err: any) {
          const isConnErr =
            err.message?.includes('ERR_CONNECTION_REFUSED') ||
            err.message?.includes('ERR_CONNECTION_RESET') ||
            err.message?.includes('net::ERR_');
          if (isConnErr && attempt < 7) {
            await page.waitForTimeout(600 * attempt);
            continue;
          }
          throw err;
        }
      }
      return res;
    };

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('EC-1: Extreme click storm (50 rapid clicks) on floating companion does NOT grant treats', async ({ page }) => {
    const companion = page.locator('.molly-companion-layer');
    await expect(companion).toBeAttached();

    const initialTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    const initialAvailable = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(initialTreats).toBe(0);
    expect(initialAvailable).toBe(0);

    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();

    // Fire 50 rapid clicks
    for (let i = 0; i < 50; i++) {
      await petBtn.click({ delay: 10 });
    }

    await page.waitForTimeout(500);

    const finalTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    const finalAvailable = Number(await companion.getAttribute('data-molly-available-treats') || '0');

    expect(finalTreats, '50 rapid petting clicks must NEVER increment treats').toBe(0);
    expect(finalAvailable, '50 rapid petting clicks must NEVER unlock unearned treats').toBe(0);

    // Verify emotional feedback
    const whisperEl = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisperEl).toBeVisible();
    const whisperText = await whisperEl.innerText();
    expect(whisperText.length).toBeGreaterThan(5);

    // Verify localStorage integrity
    const storageRaw = await page.evaluate(() => localStorage.getItem('aa_molly_companion_v1'));
    expect(storageRaw).not.toBeNull();
    const parsed = JSON.parse(storageRaw!);
    expect(parsed.treatsFedTotal).toBe(0);
    expect(parsed.availableTreats).toBe(0);
    expect(parsed.petCount).toBeGreaterThanOrEqual(50);
  });

  test('EC-2: Rapid clicks on "✨ Impuls" button do NOT increment treats or unearned treats', async ({ page }) => {
    const companion = page.locator('.molly-companion-layer');
    await expect(companion).toBeAttached();

    const sparkBtn = page.locator('.instant-card .effect-spark-btn');
    if (await sparkBtn.isVisible()) {
      for (let i = 0; i < 30; i++) {
        await sparkBtn.click({ delay: 10 });
      }
      await page.waitForTimeout(400);

      const treats = Number(await companion.getAttribute('data-molly-treats') || '0');
      const available = Number(await companion.getAttribute('data-molly-available-treats') || '0');
      expect(treats, '✨ Impuls must strictly NOT award treats').toBe(0);
      expect(available, '✨ Impuls must strictly NOT unlock available treats').toBe(0);
    }
  });

  test('EC-3: Rapid clicks on canvas diorama and sanctuary pill in /svet do NOT grant unearned treats', async ({ page }) => {
    await page.goto('/svet');
    await page.waitForLoadState('networkidle');

    const canvas = page.locator('canvas.sanctuary-canvas');
    await expect(canvas).toHaveAttribute('data-sanctuary-molly', 'ready');

    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(initialTreats).toBe(0);

    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = await viewport.boundingBox();
    expect(vpBox).not.toBeNull();

    // Rapid clicking on canvas Molly coordinates
    for (let i = 0; i < 20; i++) {
      await viewport.click({
        position: { x: Math.round(vpBox!.width * 0.24), y: Math.round(vpBox!.height * 0.72) }
      });
      await page.waitForTimeout(50);
    }

    // Rapid clicking on sanctuary pill
    const pill = page.locator('.molly-sanctuary-pill');
    await expect(pill).toBeVisible();
    for (let i = 0; i < 20; i++) {
      await pill.click({ force: true });
      await page.waitForTimeout(50);
    }

    await page.waitForTimeout(500);

    const postTreats = Number(await companion.getAttribute('data-molly-treats') || '0');
    const postAvailable = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(postTreats, 'Canvas and pill clicks without deeds must NOT increment treats').toBe(0);
    expect(postAvailable, 'Canvas and pill clicks without deeds must NOT unlock available treats').toBe(0);
  });

  test('EC-4: Exact deed unlock and single-feed consumption semantics', async ({ page }) => {
    const companion = page.locator('.molly-companion-layer');

    // 1. Trigger instant deed
    const doneBtn = page.locator('.instant-card .btn-studio-done');
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();
    await page.waitForTimeout(500);

    // Verify exactly 1 treat unlocked
    const availableAfterDeed = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(availableAfterDeed).toBe(1);
    const treatsBeforeFeed = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(treatsBeforeFeed).toBe(0);

    // 2. Feed Molly once via celebration modal
    const feedBtn = page.locator('.celebration-action-bar button:has-text("Dát pamlsek"), button:has-text("Pamlsek pro Molly")');
    if (await feedBtn.isVisible()) {
      await feedBtn.click();
      await page.waitForTimeout(500);
    } else {
      // If modal not open, feed via /svet
      await page.goto('/svet');
      await page.waitForLoadState('networkidle');
      const pill = page.locator('.molly-sanctuary-pill');
      await pill.click();
      await page.waitForTimeout(500);
    }

    const treatsAfterFeed = Number(await companion.getAttribute('data-molly-treats') || '0');
    const availableAfterFeed = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(treatsAfterFeed, 'Feeding earned treat must increment treats by exactly 1').toBe(1);
    expect(availableAfterFeed, 'Feeding earned treat must decrement available treats to 0').toBe(0);

    // 3. Attempt double-spend: try feeding again 10 times
    if (page.url().includes('/svet')) {
      const pill = page.locator('.molly-sanctuary-pill');
      for (let i = 0; i < 10; i++) {
        await pill.click();
      }
    } else {
      await page.goto('/svet');
      await page.waitForLoadState('networkidle');
      const pill = page.locator('.molly-sanctuary-pill');
      for (let i = 0; i < 10; i++) {
        await pill.click();
      }
    }
    await page.waitForTimeout(500);

    const treatsAfterExhaustion = Number(await companion.getAttribute('data-molly-treats') || '0');
    expect(treatsAfterExhaustion, 'Treats count must remain 1 after available treats exhausted').toBe(1);
  });

  test('EC-5: Multi-deed accumulation and sequential consumption', async ({ page }) => {
    // Navigate to /svet
    await page.goto('/svet');
    await page.waitForLoadState('networkidle');
    const companion = page.locator('.molly-companion-layer');

    // Submit Deed 1 in Krajina dobra
    const deedInput = page.locator('#ritual-deed-input');
    await expect(deedInput).toBeVisible();
    await deedInput.fill('První skutek: darování teplého oblečení');
    await page.locator('.ritual-bar button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Submit Deed 2 in Krajina dobra
    await deedInput.fill('Druhý skutek: pomoc sousedce s nákupem');
    await page.locator('.ritual-bar button[type="submit"]').click();
    await page.waitForTimeout(500);

    const available = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(available, 'Two submitted deeds should unlock 2 available treats').toBe(2);

    const pill = page.locator('.molly-sanctuary-pill');

    // First feed
    await pill.click();
    await page.waitForTimeout(400);
    const treats1 = Number(await companion.getAttribute('data-molly-treats') || '0');
    const avail1 = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(treats1).toBe(1);
    expect(avail1).toBe(1);

    // Second feed
    await pill.click();
    await page.waitForTimeout(400);
    const treats2 = Number(await companion.getAttribute('data-molly-treats') || '0');
    const avail2 = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(treats2).toBe(2);
    expect(avail2).toBe(0);

    // Third click (exhausted)
    await pill.click();
    await page.waitForTimeout(400);
    const treats3 = Number(await companion.getAttribute('data-molly-treats') || '0');
    const avail3 = Number(await companion.getAttribute('data-molly-available-treats') || '0');
    expect(treats3).toBe(2);
    expect(avail3).toBe(0);
  });

  test('EC-6: Emotional copy tone verification — warm Czech guidance without gamification tokens', async ({ page }) => {
    await page.goto('/');
    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await petBtn.click();
    await page.waitForTimeout(300);

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisper).toBeVisible();
    const text = (await whisper.innerText()).toLowerCase();

    // Check for warm supportive tone
    const expectedCzechTokens = ['mrrr', 'předu', 'mňau', 'pohlazení', 'bříško', 'skutek', 'dobrý', 'pomoc', 'laskavost'];
    const hasWarmTone = expectedCzechTokens.some(t => text.includes(t));
    expect(hasWarmTone, `Molly unearned whisper should be warm and supportive. Got: ${text}`).toBe(true);

    // Strict ban on gamification & punitive tokens
    const forbiddenTokens = ['+1 xp', 'level', 'odemknuto bodů', 'trest', 'chyba', 'musíš', 'bodů', 'achievement'];
    for (const token of forbiddenTokens) {
      expect(text).not.toContain(token);
    }
  });

});
