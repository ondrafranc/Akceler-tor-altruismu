import { test, expect, type Page } from '@playwright/test';

/**
 * Delayed Gratification (R2) & UI Declutter / Progressive Disclosure (R1) Test Suite
 *
 * Covers:
 * - DG-1: Empty clicking immunity across all entry points (Impuls button, canvas Molly, sanctuary pill, place effect toggle)
 * - DG-2: Altruistic deed unlocks treat (recordSmallWin, recordSanctuaryWish, submit deed)
 * - DG-3: Molly supportive waiting prompts (Czech empathetic tone, zero punitive tone, zero arcade tokens)
 * - PD-1: Landing Page (/) decluttering, collapsed steps by default, fold budget
 * - PD-2: Guided Wizard (/app/guided) progressive disclosure, collapsed filter/methodology drawers
 * - PD-3: Online Catalog (/app/online) card simplicity, inline steps collapsed
 * - PD-4: Help Map (/near) mobile view switcher, compact search and radius
 * - PD-5: Krajina Dobra (/svet) sanctuary diorama layout, compact HUD, desktop & mobile integrity
 */

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568, label: '320px (iPhone SE 1st gen)' },
  { width: 360, height: 660, label: '360x660 (In-App webview)' },
  { width: 375, height: 667, label: '375x667 (iPhone SE 2nd/3rd gen)' },
  { width: 390, height: 844, label: '390x844 (iPhone 12/13/14)' },
  { width: 412, height: 915, label: '412x915 (Android / Pixel)' },
  { width: 430, height: 932, label: '430x932 (iPhone Pro Max)' }
];

const DESKTOP_VIEWPORTS = [
  { width: 1024, height: 768, label: '1024x768 (iPad landscape / small desktop)' },
  { width: 1280, height: 800, label: '1280x800 (Laptop)' },
  { width: 1440, height: 900, label: '1440x900 (Desktop)' }
];

const FORBIDDEN_ARCADE_WORDS = [
  '+1 XP',
  'odemknuto bodů',
  'level up',
  'herní skóre',
  'streak ztracen',
  'trest',
  'chyba uživatele',
  'neplatná akce'
];

async function checkZeroHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const docOverflow = doc.scrollWidth > doc.clientWidth + 1;
    const bodyOverflow = body ? body.scrollWidth > body.clientWidth + 1 : false;
    return {
      hasOverflow: docOverflow || bodyOverflow,
      scrollWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
      clientWidth: Math.min(doc.clientWidth, body ? body.clientWidth : 0)
    };
  });
  expect(
    overflow.hasOverflow,
    `[Overflow Error] ${label}: scrollWidth (${overflow.scrollWidth}px) exceeds clientWidth (${overflow.clientWidth}px)`
  ).toBe(false);
}

async function gotoHydrated(page: Page, path: string) {
  await page.goto(path);
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(250);
}

test.describe('R2: Delayed Gratification (Molly Treat Economics)', () => {

  test.beforeEach(async ({ page }) => {
    // Reset local storage for clean companion state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await gotoHydrated(page, '/');
  });

  // =========================================================================
  // DG-1: Empty clicking immunity
  // =========================================================================

  test('DG-1.1: Clicking "✨ Impuls" button on / does NOT increment treats', async ({ page }) => {
    await page.goto('/');
    const companion = page.locator('.molly-companion-layer');
    await expect(companion).toBeAttached();

    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    const sparkBtn = page.locator('.instant-card .effect-spark-btn');
    if (await sparkBtn.isVisible()) {
      for (let i = 0; i < 5; i++) {
        await sparkBtn.click();
        await page.waitForTimeout(100);
      }
    }

    const treatsAfterSparks = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterSparks, '✨ Impuls clicks must not award treats on empty clicking').toBe(initialTreats);
  });

  test('DG-1.2: Direct canvas click on Molly at (0.24w, 0.72h) on /svet does NOT increment treats', async ({ page }) => {
    await page.goto('/svet');
    const canvas = page.locator('canvas.sanctuary-canvas');
    await expect(canvas).toHaveAttribute('data-sanctuary-molly', 'ready');

    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    const viewport = page.locator('.sanctuary-viewport');
    const vpBox = await viewport.boundingBox();
    expect(vpBox).not.toBeNull();

    // Click directly at Molly's sanctuary coordinate 5 times
    for (let i = 0; i < 5; i++) {
      await viewport.click({
        position: { x: Math.round(vpBox!.width * 0.24), y: Math.round(vpBox!.height * 0.72) }
      });
      await page.waitForTimeout(150);
    }

    const treatsAfterClicks = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterClicks, 'Direct canvas clicks on Molly must not increment treats without an earned deed').toBe(initialTreats);
  });

  test('DG-1.3: Clicking .molly-sanctuary-pill on /svet does NOT increment treats', async ({ page }) => {
    await page.goto('/svet');
    const pill = page.locator('.molly-sanctuary-pill');
    await expect(pill).toBeVisible();

    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    for (let i = 0; i < 4; i++) {
      await pill.click();
      await page.waitForTimeout(120);
    }

    const treatsAfterPill = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterPill, 'Sanctuary pill clicks must not award unearned treats').toBe(initialTreats);
  });

  test('DG-1.4: Place effect toggles and quick triggers do NOT increment treats', async ({ page }) => {
    await page.goto('/app/online');
    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    // Click filter chips and quick triggers
    const chips = page.locator('.filter-chip');
    const count = await chips.count();
    for (let i = 0; i < Math.min(count, 4); i++) {
      await chips.nth(i).click();
      await page.waitForTimeout(100);
    }

    const treatsAfterFilters = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterFilters, 'Catalog filter selections must not award treats').toBe(initialTreats);
  });

  test('DG-1.5: Rapid click storm (15 clicks) on floating companion does NOT increment treats', async ({ page }) => {
    await page.goto('/');
    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    if (await petBtn.isVisible()) {
      for (let i = 0; i < 15; i++) {
        await petBtn.click();
      }
    }

    const treatsAfterSpam = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterSpam, 'Rapid petting clicks must not award treats').toBe(initialTreats);
  });

  // =========================================================================
  // DG-2: Altruistic deed unlocks treat
  // =========================================================================

  test('DG-2.1: Completing instant deed on / via .btn-studio-done unlocks treat and celebration feeding increments treats by 1', async ({ page }) => {
    await gotoHydrated(page, '/');
    const companion = page.locator('.molly-companion-layer');
    const initialAvailable = Number((await companion.getAttribute('data-molly-available-treats')) || '0');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    // Complete instant deed
    const doneBtn = page.locator('.instant-card .btn-studio-done');
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();
    await page.waitForTimeout(500);

    // Verify celebration note appears with Molly mention
    const celebrationNote = page.locator('.instant-card .molly-celebration-note');
    await expect(celebrationNote).toBeVisible();
    await expect(celebrationNote).toContainText('Molly');

    // Verify treat was unlocked
    const availableAfterDeed = Number((await companion.getAttribute('data-molly-available-treats')) || '0');
    expect(availableAfterDeed, 'Completing an altruistic deed must unlock an available treat for Molly').toBe(initialAvailable + 1);

    // Follow celebration link to Krajina dobra to feed Molly the earned treat
    const svetLink = page.locator('.return-dopamine-actions a[href*="/svet"]').first();
    await expect(svetLink).toBeVisible();
    await svetLink.click();
    await gotoHydrated(page, '/svet');

    // In Krajina dobra, feed the earned treat
    const pill = page.locator('.molly-sanctuary-pill');
    await pill.click();
    await page.waitForTimeout(500);

    const treatsAfterFeed = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterFeed, 'Feeding the earned treat in Krajina dobra increments treatsFedTotal by 1').toBe(initialTreats + 1);
  });

  test('DG-2.2: Submitting altruistic deed ritual on /svet via #ritual-deed-input unlocks treat and feeding increments treats by 1', async ({ page }) => {
    await gotoHydrated(page, '/svet');
    const companion = page.locator('.molly-companion-layer');
    const initialTreats = Number((await companion.getAttribute('data-molly-treats')) || '0');

    const deedInput = page.locator('#ritual-deed-input');
    await expect(deedInput).toBeVisible();
    await deedInput.fill('Pomohl jsem sousedovi odnést těžký nákup');

    const submitBtn = page.locator('.ritual-bar button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(600);

    // After submitting deed, availableTreats > 0, so clicking sanctuary pill feeds Molly
    const pill = page.locator('.molly-sanctuary-pill');
    await pill.click();
    await page.waitForTimeout(400);

    const treatsAfterRitual = Number((await companion.getAttribute('data-molly-treats')) || '0');
    expect(treatsAfterRitual, 'Submitting a deed in Krajina dobra and feeding Molly must increment Molly treats by 1').toBe(initialTreats + 1);
  });

  test('DG-2.3: Submitting community deed on /submit unlocks and feeds a treat', async ({ page }) => {
    await gotoHydrated(page, '/submit');

    // Fill form using exact field IDs
    await page.locator('#name').fill('Sousedská knihobudka na návsi');
    await page.locator('#loc').fill('Praha');

    // Click quick city
    const quickCity = page.locator('button.q-pill').first();
    if (await quickCity.isVisible()) {
      await quickCity.click();
    }

    const companion = page.locator('.molly-companion-layer');
    const initialAvailable = Number((await companion.getAttribute('data-molly-available-treats')) || '0');

    // Wait at least 1100ms to satisfy anti-bot elapsed_ms requirement
    await page.waitForTimeout(1100);

    // Submit
    const submitBtn = page.locator('button.submit-btn');
    await submitBtn.click();

    // Verify submission succeeds and unlocks a treat
    await expect(page.locator('.banner.success')).toBeVisible({ timeout: 10000 });
    const availableAfterSubmit = Number((await companion.getAttribute('data-molly-available-treats')) || '0');
    expect(availableAfterSubmit, 'Submitting a community deed should unlock an available treat').toBeGreaterThanOrEqual(initialAvailable + 1);
  });

  test('DG-2.4: Online catalog action completion unlocks an earned treat', async ({ page }) => {
    await gotoHydrated(page, '/app/online');
    const companion = page.locator('.molly-companion-layer');
    const initialAvailable = Number((await companion.getAttribute('data-molly-available-treats')) || '0');

    const doneBtn = page.locator('.grid .card .actions-row .cta.secondary').first();
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();
    await page.waitForTimeout(600);

    const availableAfterCatalog = Number((await companion.getAttribute('data-molly-available-treats')) || '0');
    expect(availableAfterCatalog, 'Completing an online catalog action must unlock an earned treat').toBeGreaterThanOrEqual(initialAvailable + 1);
  });

  // =========================================================================
  // DG-3: Molly supportive waiting prompts
  // =========================================================================

  test('DG-3.1: Clicking Molly with 0 earned treats displays loving Czech whisper or toast', async ({ page }) => {
    await gotoHydrated(page, '/');
    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();
    await petBtn.click();

    // Verify whisper bubble or dock whisper is visible
    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisper).toBeVisible();

    const whisperText = await whisper.innerText();
    // Warm Czech text check: contains comforting words
    const warmWords = ['mrrr', 'předu', 'laskavost', 'radost', 'pomoc', 'hřeje', 'svět', 'kousek', 'klid', 'bříško', 'šetřím', 'dobrot', 'skutek', 'lehký', 'ahoj', 'sovo', 'čas'];
    const hasWarmTone = warmWords.some(w => whisperText.toLowerCase().includes(w));
    expect(hasWarmTone, `Molly whisper text should be warm and supportive. Got: "${whisperText}"`).toBe(true);
  });

  test('DG-3.2: Complete absence of punitive tone in Molly responses', async ({ page }) => {
    await gotoHydrated(page, '/');
    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await petBtn.click();

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    if (await whisper.isVisible()) {
      const text = await whisper.innerText();
      const punitiveWords = ['trest', 'chyba', 'musíš', 'špatně', 'neplatné', 'povinnost'];
      for (const word of punitiveWords) {
        expect(text.toLowerCase()).not.toContain(word);
      }
    }
  });

  test('DG-3.3: Complete absence of forbidden arcade / gamification tokens in Molly copy', async ({ page }) => {
    await gotoHydrated(page, '/svet');
    const pill = page.locator('.molly-sanctuary-pill');
    await pill.click();

    const bodyText = await page.locator('body').innerText();
    for (const forbidden of FORBIDDEN_ARCADE_WORDS) {
      expect(bodyText).not.toContain(forbidden);
    }
  });

  test('DG-3.4: Petting Molly displays supportive whisper and preserves zero horizontal overflow on 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/');

    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();
    await petBtn.click();
    await page.waitForTimeout(400);

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper, .gentle-toast, .molly-dock-toggle-btn');
    await expect(whisper.first()).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'molly-whisper-375px');
  });

});

test.describe('R1: Progressive Disclosure & UI Declutter', () => {

  // =========================================================================
  // PD-1: Landing Page (/) Declutter
  // =========================================================================

  test('PD-1.1: Mobile 360x660 & 375x667: Steps & impact chain inside details.how-toggle are collapsed by default', async ({ page }) => {
    for (const vp of [{ width: 360, height: 660 }, { width: 375, height: 667 }]) {
      await page.setViewportSize(vp);
      await page.goto('/');

      const howToggle = page.locator('.instant-card details.how-toggle');
      await expect(howToggle).toBeAttached();
      // Must NOT be open by default (progressive disclosure)
      await expect(howToggle).not.toHaveAttribute('open', '');
    }
  });

  test('PD-1.2: Expanding details.how-toggle reveals steps without causing horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await page.goto('/');

    const howToggle = page.locator('.instant-card details.how-toggle');
    await expect(howToggle).toBeAttached();

    // Click summary to expand
    await howToggle.locator('summary').click();
    await expect(howToggle).toHaveAttribute('open', '');

    // Check steps content is now visible
    const stepsContent = howToggle.locator('.how-steps, .steps-ol, .impact-chain-row').first();
    await expect(stepsContent).toBeVisible();

    // Verify zero horizontal overflow even after expanding
    await checkZeroHorizontalOverflow(page, 'landing-details-expanded-360px');
  });

  test('PD-1.3: Primary CTA remains above the fold (< 650px) on 360x660 across all energy modes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await page.goto('/');

    const tabs = page.locator('.instant-card .energy-tab');
    await expect(tabs).toHaveCount(4);

    const primaryCta = page.locator('.instant-card .btn-studio-primary');

    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(100);

      await expect(primaryCta).toBeVisible();
      const ctaBox = await primaryCta.boundingBox();
      expect(ctaBox).not.toBeNull();
      const bottomY = ctaBox!.y + ctaBox!.height;
      expect(bottomY, `CTA bottom coordinate (${bottomY.toFixed(1)}px) must be < 650px`).toBeLessThan(650);
    }
  });

  test('PD-1.4: Landing page zero horizontal overflow matrix across all 6 mobile viewports', async ({ page }) => {
    for (const vp of MOBILE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await checkZeroHorizontalOverflow(page, `landing-${vp.label}`);
    }
  });

  // =========================================================================
  // PD-2: Guided Wizard (/app/guided) Progressive Flow
  // =========================================================================

  test('PD-2.1: Guided Help: situation selection is immediately clear on mobile 360x660 & 390x844', async ({ page }) => {
    for (const vp of [{ width: 360, height: 660 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(vp);
      await page.goto('/app/guided');

      // Situation selection block is visible
      const situationStep = page.locator('.step-block, .situation-grid').first();
      await expect(situationStep).toBeVisible();

      // Recommendation plan card is accessible
      const plan = page.locator('#personal-plan, .highlight-card').first();
      await expect(plan).toBeVisible();
    }
  });

  test('PD-2.2: Advanced parameter and methodology drawers are collapsed by default on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/guided');

    const adaptiveDrawer = page.locator('details.adaptive-params-drawer');
    if (await adaptiveDrawer.isVisible()) {
      await expect(adaptiveDrawer).not.toHaveAttribute('open', '');
    }

    const methodologyDrawer = page.locator('details.methodology-drawer');
    if (await methodologyDrawer.isVisible()) {
      await expect(methodologyDrawer).not.toHaveAttribute('open', '');
    }

    const altsDrawer = page.locator('details.alts-drawer');
    if (await altsDrawer.isVisible()) {
      await expect(altsDrawer).not.toHaveAttribute('open', '');
    }
  });

  test('PD-2.3: Expanding drawers on /app/guided preserves zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/guided');

    const adaptiveDrawer = page.locator('details.adaptive-params-drawer');
    if (await adaptiveDrawer.isVisible()) {
      await adaptiveDrawer.locator('summary').click();
      await expect(adaptiveDrawer).toHaveAttribute('open', '');
      await checkZeroHorizontalOverflow(page, 'guided-adaptive-drawer-expanded');
    }
  });

  // =========================================================================
  // PD-3: Online Catalog (/app/online) Declutter
  // =========================================================================

  test('PD-3.1: Online Catalog: Action cards show title, short impact note, and CTA; steps collapsed', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/online');

    const firstCard = page.locator('.grid .card').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('.card-title')).toBeVisible();

    // Inline steps details must be collapsed by default
    const stepsInline = firstCard.locator('details.steps-inline');
    if (await stepsInline.isVisible()) {
      await expect(stepsInline).not.toHaveAttribute('open', '');
    }
  });

  test('PD-3.2: Filter toolbar chips scroll horizontally smoothly without expanding viewport width', async ({ page }) => {
    for (const vp of MOBILE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/online');
      await checkZeroHorizontalOverflow(page, `online-catalog-${vp.label}`);
    }
  });

  // =========================================================================
  // PD-4: Help Map (/near) Mobile Layout
  // =========================================================================

  test('PD-4.1: Mobile view switcher cleanly toggles between List and Map on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');

    const switcher = page.locator('.mobile-view-toggle, .map-view-switcher');
    if (await switcher.isVisible()) {
      // Toggle to Map
      const mapBtn = switcher.locator('button', { hasText: 'Mapa' });
      await mapBtn.click();
      await page.waitForTimeout(200);

      // Map container must be visible
      await expect(page.locator('.map-container, #near-map')).toBeVisible();

      // Toggle back to List
      const listBtn = switcher.locator('button', { hasText: 'Seznam' });
      await listBtn.click();
      await page.waitForTimeout(200);
      await expect(page.locator('.place-card').first()).toBeVisible();
    }

    await checkZeroHorizontalOverflow(page, 'near-mobile-switcher-375px');
  });

  test('PD-4.2: Location search, city jump, and radius pills are compact and zero-overflow', async ({ page }) => {
    for (const vp of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 412, height: 915 }]) {
      await page.setViewportSize(vp);
      await page.goto('/near');

      await expect(page.locator('#near-location-query')).toBeVisible();
      await expect(page.locator('#near-city-jump')).toBeVisible();
      await checkZeroHorizontalOverflow(page, `near-compact-controls-${vp.width}px`);
    }
  });

  // =========================================================================
  // PD-5: Krajina Dobra (/svet) Sanctuary & Desktop Integrity
  // =========================================================================

  test('PD-5.1: Diorama canvas renders cleanly with data-sanctuary-molly="ready"', async ({ page }) => {
    await page.goto('/svet');
    const canvas = page.locator('canvas.sanctuary-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('data-sanctuary-molly', 'ready');
  });

  test('PD-5.2: Compact HUD controls and deed ritual dock do not obstruct diorama', async ({ page }) => {
    await page.goto('/svet');
    const hud = page.locator('.sanctuary-hud');
    await expect(hud).toBeVisible();

    const ritualDock = page.locator('.ritual-dock-main');
    await expect(ritualDock).toBeVisible();
  });

  test('PD-5.3: Desktop view integrity across 1024px–1440px preserves layout and non-wrapping grid', async ({ page }) => {
    for (const vp of DESKTOP_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, `svet-desktop-${vp.label}`);

      await page.goto('/');
      await checkZeroHorizontalOverflow(page, `home-desktop-${vp.label}`);
    }
  });

  test('PD-5.4: Zero horizontal overflow across all 5 key routes on mobile 360x800', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const routes = ['/', '/app/guided', '/app/online', '/near', '/svet'];

    for (const route of routes) {
      await page.goto(route);
      await checkZeroHorizontalOverflow(page, `route-${route}-360x800`);
    }
  });

});
