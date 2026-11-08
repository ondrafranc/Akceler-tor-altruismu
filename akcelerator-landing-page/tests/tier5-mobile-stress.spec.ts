import { test, expect } from '@playwright/test';

// ============================================================================
// TIER 5 WHITE-BOX ADVERSARIAL STRESS SUITE: MOBILE UX, ROTATIONS & TONE
// ============================================================================

const BANNED_RENDERED_COPY = [
  'PRO LIDI, NE PRO FIRMY',
  'pro lidi, ne pro firmy',
  'Tiché útočiště',
  'doomscrolling',
  'žádné levely',
  'žádné úrovně',
  'BEZ ZAHLCENÍ',
  'KLIDNÝ KOMPAS',
  'bloudivý nerv',
  'stěna úkolů',
  'Pustit starost po vodě',
  'Začít pomáhat (Začít pomáhat'
];

const FORBIDDEN_ARCADE_TOKENS = [
  '+1 bod',
  '+10 bod',
  '+100 bod',
  '+1 treat',
  '+1 pamlsek',
  '+1 XP',
  'XP získan',
  'level 1',
  'level 2'
];

const FORBIDDEN_META_PHRASES = [
  'klikněte zde',
  'klikni sem',
  'Molly je virtuální',
  'jsem jen virtuální',
  'AI asistent',
  'robotická kočka',
  'stiskněte tlačítko'
];

/**
 * Robust zero horizontal overflow validator with detailed diagnostic logging.
 */
async function checkZeroHorizontalOverflow(page: any, contextLabel: string = '') {
  const result = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const clientW = docEl.clientWidth;
    const scrollW = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
    // 1px tolerance for subpixel rounding in fractional viewports
    const isOverflowing = scrollW > clientW + 1;
    const offending: Array<{ tag: string; id?: string; className?: string; right: number; width: number }> = [];

    if (isOverflowing) {
      document.querySelectorAll('*').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientW + 2) {
          offending.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || undefined,
            className: typeof el.className === 'string' ? el.className.slice(0, 60) : undefined,
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          });
        }
      });
    }

    return { clientW, scrollW, isOverflowing, offending: offending.slice(0, 5) };
  });

  expect(
    result.isOverflowing,
    `Horizontal overflow detected in "${contextLabel}": clientWidth=${result.clientW}px, scrollWidth=${result.scrollW}px. Offending: ${JSON.stringify(result.offending)}`
  ).toBe(false);
}

/**
 * Verifies that no banned copy, arcade tokens, or meta language appear anywhere in rendered DOM.
 */
async function verifyToneInvariants(page: any, routeLabel: string = '') {
  const textContent = await page.evaluate(() => document.body.innerText);

  for (const phrase of BANNED_RENDERED_COPY) {
    expect(
      textContent,
      `[Tone Invariant] Route "${routeLabel}" rendered banned copy phrase: "${phrase}"`
    ).not.toContain(phrase);
  }

  for (const token of FORBIDDEN_ARCADE_TOKENS) {
    expect(
      textContent.toLowerCase(),
      `[Arcade Token Invariant] Route "${routeLabel}" rendered forbidden arcade token: "${token}"`
    ).not.toContain(token.toLowerCase());
  }

  for (const phrase of FORBIDDEN_META_PHRASES) {
    expect(
      textContent.toLowerCase(),
      `[Meta Copy Invariant] Route "${routeLabel}" rendered forbidden meta phrase: "${phrase}"`
    ).not.toContain(phrase.toLowerCase());
  }
}

test.describe('Tier 5 Adversarial Stress: Mobile UX, Viewport Rotations & Tone Invariants', () => {

  // =========================================================================
  // SUITE 1: EXTREME INPUT LENGTHS & ADVERSARIAL INPUT STRESS
  // =========================================================================

  test('1.1 /app/online: 500-character unbroken string into #online-search renders empty state and preserves zero overflow on 375x667 and 320x568', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Test on standard mobile (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const searchInput = page.locator('#online-search');
    await expect(searchInput).toBeVisible();

    const extremeString = 'Z'.repeat(500);
    await searchInput.fill(extremeString);

    const emptyBox = page.locator('.empty-box');
    await expect(emptyBox).toBeVisible();
    await expect(emptyBox).toContainText('Pro hledání');

    // Crucial check: verify that unbroken 500-character string wrapped and did NOT cause horizontal overflow
    await checkZeroHorizontalOverflow(page, '375x667 with 500-char search string in empty-box');

    // Test reset CTA
    const resetBtn = emptyBox.locator('button.cta.primary');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Verify search was reset and initial cards are back
    await expect(searchInput).toHaveValue('');
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(3);
    await checkZeroHorizontalOverflow(page, '375x667 after search reset');

    // Test boundary mobile (320x568 iPhone SE 1st gen)
    await page.setViewportSize({ width: 320, height: 568 });
    await searchInput.fill('DlouhyNazevBezMezer'.repeat(15));
    await expect(emptyBox).toBeVisible();
    await checkZeroHorizontalOverflow(page, '320x568 boundary mobile with long search string');

    expect(pageErrors, 'Should be 0 unhandled page errors during extreme search').toHaveLength(0);
  });

  test('1.2 /app/online: XSS vectors, script injection, and Unicode ZWJ sequences into #online-search do not execute or break DOM', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const searchInput = page.locator('#online-search');
    const xssPayload = '<script>window.__XSS_TRIGGERED__=true</script><img src="x" onerror="window.__XSS_TRIGGERED__=true">👨‍👩‍👧‍👦🐈‍⬛';
    await searchInput.fill(xssPayload);

    // Verify XSS did not execute
    const xssExecuted = await page.evaluate(() => (window as any).__XSS_TRIGGERED__);
    expect(xssExecuted).toBeUndefined();

    // Verify zero overflow with Unicode / emojis
    await checkZeroHorizontalOverflow(page, '375x667 with XSS and emoji payload');
    expect(pageErrors).toHaveLength(0);
  });

  test('1.3 /near: 400-character unbroken query into #near-location-query does not overflow or crash geocode pipeline', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const locationInput = page.locator('#near-location-query');
    await expect(locationInput).toBeVisible();

    const extremeLocation = 'CeskeBudejoviceSever'.repeat(20);
    await locationInput.fill(extremeLocation);
    await page.waitForTimeout(150);

    // Verify layout bounds
    await checkZeroHorizontalOverflow(page, '375x667 with 400-char location query');

    // Trigger Enter key (geocoding attempt)
    await locationInput.press('Enter');
    await page.waitForTimeout(300);

    // Page must remain responsive and not throw exceptions
    await checkZeroHorizontalOverflow(page, '375x667 after extreme geocode attempt');
    expect(pageErrors).toHaveLength(0);
  });

  test('1.4 /near: Regex metacharacters and extreme query in #near-list-filter updates count-heading without regex explosion', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const listFilter = page.locator('#near-list-filter');
    if (await listFilter.isVisible()) {
      // Regex metacharacters that would crash RegExp without proper sanitization
      const adversarialRegex = '.*+?^${}()|[]\\\\'.repeat(10);
      await listFilter.fill(adversarialRegex);
      await page.waitForTimeout(100);

      // Verify count heading reflects 0 places found
      const countHeading = page.locator('.count-heading');
      await expect(countHeading).toBeVisible();
      await expect(countHeading).toContainText('0');

      await checkZeroHorizontalOverflow(page, '375x667 near-list-filter regex stress');

      // Clear input and verify places return
      await listFilter.fill('');
      await page.waitForTimeout(100);
      await expect(countHeading).not.toContainText('0');
    }

    expect(pageErrors).toHaveLength(0);
  });


  // =========================================================================
  // SUITE 2: SCREEN ROTATION & DYNAMIC ORIENTATION STRESS (375x667 <-> 667x375)
  // =========================================================================

  test('2.1 / (Landing Page): Dynamic orientation rotation (375x667 -> 667x375 -> 375x667) preserves instant card, CTA, and zero overflow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Initial portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const instantCard = page.locator('.instant-card');
    await expect(instantCard).toBeVisible();
    const primaryCta = page.locator('.instant-card .btn-studio-primary');
    await expect(primaryCta).toBeVisible();

    await checkZeroHorizontalOverflow(page, 'Landing page initial portrait (375x667)');

    // 2. Rotate to landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(150);

    await expect(instantCard).toBeVisible();
    await expect(primaryCta).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Landing page dynamic landscape (667x375)');

    // Cycle through energy tabs in landscape
    const energyTabs = page.locator('.instant-card .energy-tab');
    await expect(energyTabs).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      await energyTabs.nth(i).click();
      await page.waitForTimeout(80);
      await expect(primaryCta).toBeVisible();
      await checkZeroHorizontalOverflow(page, `Landing landscape tab ${i} active`);
    }

    // 3. Rotate back to portrait (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(150);

    await expect(instantCard).toBeVisible();
    await expect(primaryCta).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Landing page restored portrait (375x667)');

    expect(pageErrors).toHaveLength(0);
  });

  test('2.2 /app/guided: Dynamic orientation rotation preserves #personal-plan containment, situation switching, and drawer', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Initial portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/guided');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const planCard = page.locator('#personal-plan');
    await expect(planCard).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Guided initial portrait (375x667)');

    // 2. Rotate to landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(150);

    await expect(planCard).toBeVisible();
    const planBox = await planCard.boundingBox();
    expect(planBox).not.toBeNull();
    if (planBox) {
      expect(planBox.width).toBeLessThanOrEqual(667);
      expect(planBox.x).toBeGreaterThanOrEqual(0);
    }
    await checkZeroHorizontalOverflow(page, 'Guided landscape (667x375)');

    // Switch situation in landscape
    const walkSituation = page.locator('.situation-card').nth(2); // 'walk' opens local drawer
    await walkSituation.click();
    await page.waitForTimeout(100);
    await checkZeroHorizontalOverflow(page, 'Guided landscape walk situation');

    // Toggle collapsible adaptive drawer if present
    const adaptiveDrawer = page.locator('.adaptive-details summary');
    if (await adaptiveDrawer.isVisible()) {
      await adaptiveDrawer.click();
      await page.waitForTimeout(100);
      await checkZeroHorizontalOverflow(page, 'Guided landscape with adaptive drawer open');
    }

    // 3. Rotate back to portrait (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(150);

    await expect(planCard).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Guided restored portrait (375x667)');

    expect(pageErrors).toHaveLength(0);
  });

  test('2.3 /app/online: Dynamic orientation rotation preserves filter toolbar, card stacking, and zero overflow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Initial portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const filterToolbar = page.locator('.filter-toolbar');
    await expect(filterToolbar).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Online catalog initial portrait (375x667)');

    // 2. Rotate to landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(150);

    await checkZeroHorizontalOverflow(page, 'Online catalog dynamic landscape (667x375)');

    // Switch filters in landscape
    const filtersToTest = ['free', 'fast', 'evidenceA'];
    for (const filterId of filtersToTest) {
      const chip = page.locator(`.filter-chip:has-text("${filterId === 'free' ? 'Zdarma' : filterId === 'fast' ? 'Do 5 min' : '✦ Důkazy A'}")`);
      if (await chip.isVisible()) {
        await chip.click();
        await page.waitForTimeout(80);
        await checkZeroHorizontalOverflow(page, `Online landscape filter: ${filterId}`);
      }
    }

    // 3. Rotate back to portrait (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(150);

    await checkZeroHorizontalOverflow(page, 'Online catalog restored portrait (375x667)');
    expect(pageErrors).toHaveLength(0);
  });

  test('2.4 /near: Dynamic orientation rotation preserves mobile tabs, map container, and place active sheet', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // 1. Initial portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const mobileTabs = page.locator('.mobile-tabs');
    await expect(mobileTabs).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Near initial portrait (375x667)');

    // Switch to Map tab on mobile
    const mapTab = mobileTabs.locator('button').nth(1);
    await mapTab.click();
    await page.waitForTimeout(200);

    // 2. Rotate to landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(250);

    // Map container must be responsive and not overflow
    const mapElement = page.locator('.map-frame .map-canvas');
    await expect(mapElement).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Near dynamic landscape map view (667x375)');

    // Switch back to List tab in landscape
    const listTab = mobileTabs.locator('button').nth(0);
    await listTab.click();
    await page.waitForTimeout(150);
    await checkZeroHorizontalOverflow(page, 'Near dynamic landscape list view (667x375)');

    // 3. Rotate back to portrait (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(150);

    await checkZeroHorizontalOverflow(page, 'Near restored portrait (375x667)');
    expect(pageErrors).toHaveLength(0);
  });

  test('2.5 Rapid multi-cycle orientation flipping (375x667 <-> 667x375 x4) does not degrade layout or leak horizontal overflow', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    for (let flip = 1; flip <= 4; flip++) {
      // Flip to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(60);
      await checkZeroHorizontalOverflow(page, `Flip ${flip} Landscape (667x375)`);

      // Flip to portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(60);
      await checkZeroHorizontalOverflow(page, `Flip ${flip} Portrait (375x667)`);
    }

    const cta = page.locator('.instant-card .btn-studio-primary');
    await expect(cta).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });


  // =========================================================================
  // SUITE 3: DEEP-LINKING BOUNDARY & MALFORMED PARAMETER ADVERSARIAL STRESS
  // =========================================================================

  test('3.1 /: Malformed and non-existent action/intent query parameters fall back safely to valid state', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });

    const maliciousActionParams = [
      'non_existent_action_xyz_99999',
      '../../etc/passwd',
      '%00null%00',
      'undefined',
      '<script>alert(1)</script>',
      'DROP+TABLE+actions;'
    ];

    for (const badParam of maliciousActionParams) {
      await page.goto(`/?action=${encodeURIComponent(badParam)}&intent=corrupted_intent_mode`);
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      // Verify page rendered gracefully and did not throw uncaught errors
      const cta = page.locator('.instant-card .btn-studio-primary');
      await expect(cta).toBeVisible();
      await expect(cta).toContainText('Začít pomáhat');

      // Verify fallback action title is populated
      const title = page.locator('.instant-card .action-title');
      await expect(title).toBeVisible();
      const titleText = await title.innerText();
      expect(titleText.trim().length).toBeGreaterThan(0);

      await checkZeroHorizontalOverflow(page, `Landing with malicious ?action=${badParam}`);
    }

    // Test hash-based invalid action
    await page.goto('/#action=ghost_hash_action_999');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    const cta = page.locator('.instant-card .btn-studio-primary');
    await expect(cta).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'Landing with invalid #action hash');

    expect(pageErrors).toHaveLength(0);
  });

  test('3.2 /app/guided: Corrupted topic and situation query parameters fall back gracefully', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });

    const malformedGuidedUrls = [
      '/app/guided?topic=undefined&situation=broken_id',
      '/app/guided?topic=%3Cscript%3Ealert(1)%3C%2Fscript%3E',
      '/app/guided?topic=invalid_topic_123&situation=null',
      '/app/guided?topic=animals,nature,community,food,seniors,extra,overflow'
    ];

    for (const url of malformedGuidedUrls) {
      await page.goto(url);
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      // Expect #personal-plan to be visible with recommended step
      const planSection = page.locator('#personal-plan');
      await expect(planSection).toBeVisible();

      const planTitle = page.locator('#personal-plan .rec-title');
      await expect(planTitle).toBeVisible();
      const text = await planTitle.innerText();
      expect(text.trim().length).toBeGreaterThan(0);

      await checkZeroHorizontalOverflow(page, `Guided with URL: ${url}`);
    }

    expect(pageErrors).toHaveLength(0);
  });

  test('3.3 /app/online: Malformed filter and action query parameters do not disrupt catalog', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });

    const malformedOnlineUrls = [
      '/app/online?filter=invalid_filter_param',
      '/app/online?action=ghost_action_99999',
      '/app/online?filter=%27+OR+1%3D1--&action=null',
      '/app/online?filter=undefined&action=undefined'
    ];

    for (const url of malformedOnlineUrls) {
      await page.goto(url);
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      // Expect default catalog cards to be rendered (at least 3 cards)
      const cards = page.locator('.card');
      const count = await cards.count();
      expect(count, `Expected >= 3 cards for URL ${url}`).toBeGreaterThanOrEqual(3);

      await checkZeroHorizontalOverflow(page, `Online catalog with URL: ${url}`);
    }

    expect(pageErrors).toHaveLength(0);
  });

  test('3.4 /near: Extreme coordinates, negative radius, and corrupt kinds do not crash map or directory', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });

    const malformedNearUrls = [
      '/near?lat=NaN&lon=Infinity&r=-50&kinds=invalid',
      '/near?lat=999999&lon=-999999',
      '/near?lat=0&lon=0',
      '/near?place=non_existent_place_xyz',
      '/near?lat=foo&lon=bar&r=999999999&kinds=foo,bar,baz'
    ];

    for (const url of malformedNearUrls) {
      await page.goto(url);
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      // Verify places stack is rendered with fallback places
      const cards = page.locator('.place-card');
      const count = await cards.count();
      expect(count, `Expected >= 1 place card on URL ${url}`).toBeGreaterThanOrEqual(1);

      await checkZeroHorizontalOverflow(page, `Near with URL: ${url}`);
    }

    expect(pageErrors).toHaveLength(0);
  });


  // =========================================================================
  // SUITE 4: TONE INVARIANTS, CRINGE ELIMINATION & ARCADE TOKEN BAN
  // =========================================================================

  test('4.1 Invariant verification across all 4 routes in default and edge states', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Landing page in default + cycled states
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    await verifyToneInvariants(page, 'Landing page initial');

    // Cycle actions on landing
    const cycleBtn = page.locator('.instant-card .cycle-btn');
    for (let c = 0; c < 4; c++) {
      await cycleBtn.click();
      await page.waitForTimeout(60);
      await verifyToneInvariants(page, `Landing page cycle ${c}`);
    }

    // 2. Guided help page across all situations
    await page.goto('/app/guided');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    await verifyToneInvariants(page, 'Guided initial');

    const situations = page.locator('.situation-card');
    const sitCount = await situations.count();
    for (let s = 0; s < sitCount; s++) {
      await situations.nth(s).click();
      await page.waitForTimeout(60);
      await verifyToneInvariants(page, `Guided situation ${s}`);
    }

    // 3. Online catalog with empty search state
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    await verifyToneInvariants(page, 'Online initial');

    const searchInput = page.locator('#online-search');
    await searchInput.fill('ZadnaShodaPojmu123');
    await page.waitForTimeout(100);
    await verifyToneInvariants(page, 'Online empty state');

    // 4. Near places directory
    await page.goto('/near');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    await verifyToneInvariants(page, 'Near initial');
  });

  test('4.2 Contract verification: .molly-celebration-note on / maintains exact "Molly" name and warm treat copy across modes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const energyTabs = page.locator('.instant-card .energy-tab');
    await expect(energyTabs).toHaveCount(4);

    for (let modeIdx = 0; modeIdx < 4; modeIdx++) {
      await energyTabs.nth(modeIdx).click();
      await page.waitForTimeout(100);

      const note = page.locator('.instant-card .molly-celebration-note');
      if (await note.isVisible()) {
        const text = await note.innerText();
        // Mandatory substring check per PROJECT.md interface contract
        expect(text, `Mode index ${modeIdx} note must contain "Molly"`).toContain('Molly');
        // Ensure no arcade +1 prefix in treat name
        expect(text, `Mode index ${modeIdx} note must not contain "+1"`).not.toContain('+1');
      }
    }
  });

  test('4.3 SmallWinCelebration modal dialog: zero overflow on mobile portrait & landscape, tone invariants, and Molly note', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const firstCard = page.locator('.card').first();
    const doneBtn = firstCard.locator('.cta.secondary');
    await expect(doneBtn).toBeVisible();
    await doneBtn.click();

    // SmallWinCelebration modal must appear
    const modal = page.locator('.celebration-backdrop');
    await expect(modal).toBeVisible();

    // Check zero overflow in portrait with modal open
    await checkZeroHorizontalOverflow(page, '375x667 with SmallWinCelebration modal open');

    // Verify tone invariants inside modal
    await verifyToneInvariants(page, 'SmallWinCelebration modal');

    // Verify Molly celebration note inside modal if treat awarded
    const mollyNote = modal.locator('.molly-celebration-note');
    if (await mollyNote.isVisible()) {
      const text = await mollyNote.innerText();
      expect(text, 'Celebration note must contain "Molly"').toContain('Molly');
      expect(text, 'Celebration note must not contain arcade "+1"').not.toContain('+1');
    }

    // Rotate to landscape (667x375) while modal is open
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(150);
    await checkZeroHorizontalOverflow(page, '667x375 landscape with SmallWinCelebration modal open');

    // Close modal via Escape key (Finding: in 375px height landscape, modal is taller than viewport and .celebration-backdrop lacks overflow-y: auto)
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    // Rotate back to portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    await checkZeroHorizontalOverflow(page, '375x667 restored after celebration modal closed');

    expect(pageErrors).toHaveLength(0);
  });

});
