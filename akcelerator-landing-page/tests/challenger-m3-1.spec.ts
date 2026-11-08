import { test, expect } from '@playwright/test';

test.describe('Challenger M3-1: Fold Budget, Touch Targets & Zero Overflow Stress', () => {

  const MOBILE_VIEWPORTS = [
    { width: 320, height: 568, label: '320px (iPhone SE 1st gen / min mobile boundary)' },
    { width: 360, height: 660, label: '360x660 (In-App Instagram/TikTok webview)' },
    { width: 360, height: 800, label: '360x800 (Standard Android viewport)' },
    { width: 375, height: 667, label: '375x667 (iPhone SE 2nd/3rd gen)' },
    { width: 390, height: 844, label: '390x844 (iPhone 12/13/14)' },
    { width: 412, height: 915, label: '412x915 (Samsung Galaxy / Pixel 7)' },
    { width: 430, height: 932, label: '430x932 (iPhone 14/15/16 Pro Max)' }
  ];

  // =========================================================================
  // 1. ABOVE-THE-FOLD VERTICAL BUDGET ON 360x660 & 360x800
  // =========================================================================

  test('1.1 Landing page (360x660): ctaBox660.y + ctaBox660.height < 650 across all 4 energy modes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await page.goto('/');

    const tabs = page.locator('.instant-card .energy-tab');
    await expect(tabs).toHaveCount(4);

    const modeLabels = ['couch (2 min)', 'focus (15 min)', 'walk (Osobně)', 'people (Dlouhodobě)'];
    const primaryCta = page.locator('.instant-card .btn-studio-primary');

    for (let i = 0; i < 4; i++) {
      const tab = tabs.nth(i);
      await tab.click();
      await page.waitForTimeout(100);

      await expect(primaryCta).toBeVisible();
      const ctaBox = await primaryCta.boundingBox();
      expect(ctaBox, `CTA bounding box in mode ${modeLabels[i]} should exist`).not.toBeNull();

      const bottomY = ctaBox!.y + ctaBox!.height;
      console.log(`[Fold Budget] 360x660 mode ${modeLabels[i]}: CTA bottom = ${bottomY.toFixed(2)}px (limit: 650px)`);
      expect(bottomY, `Mode ${modeLabels[i]} CTA bottom (${bottomY.toFixed(2)}px) must be < 650px`).toBeLessThan(650);
    }
  });

  test('1.2 Landing page (360x660): ctaBox660.y + ctaBox660.height < 650 across varying action descriptions and deep links', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });

    // Test cycling actions via next quick idea button (10 cycles per mode)
    await page.goto('/');
    const cycleBtn = page.locator('.instant-card .cycle-btn');
    const primaryCta = page.locator('.instant-card .btn-studio-primary');

    for (let cycle = 1; cycle <= 10; cycle++) {
      await cycleBtn.click();
      await page.waitForTimeout(60);
      const ctaBox = await primaryCta.boundingBox();
      expect(ctaBox).not.toBeNull();
      const bottomY = ctaBox!.y + ctaBox!.height;
      expect(bottomY, `Cycle ${cycle} CTA bottom (${bottomY.toFixed(2)}px) must be < 650px`).toBeLessThan(650);
    }

    // Stress test with known long titles and descriptions from czech-actions.js
    const stressActions = [
      'daruj_vlasy',      // Longest title (69 chars) + desc (164 chars)
      'chodci_sobe',      // Long title (66 chars) + desc (147 chars)
      'freerice_ryze',    // Long title + desc (160 chars)
      'wikipedie_cz',     // Medium-long title
      'click-and-feed',   // Standard action
      'doucovani_deti'    // ZWJ emojis and structured content
    ];

    for (const actionId of stressActions) {
      await page.goto(`/?action=${actionId}`);
      await expect(primaryCta).toBeVisible();
      const ctaBox = await primaryCta.boundingBox();
      expect(ctaBox, `CTA bounding box for ?action=${actionId} should exist`).not.toBeNull();
      const bottomY = ctaBox!.y + ctaBox!.height;
      console.log(`[Fold Budget] 360x660 action ${actionId}: CTA bottom = ${bottomY.toFixed(2)}px`);
      expect(bottomY, `Action ${actionId} CTA bottom (${bottomY.toFixed(2)}px) must be < 650px`).toBeLessThan(650);
    }
  });

  test('1.3 /near on 360x800: first place card has y < 520 across view states', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/near');

    const firstPlace = page.locator('.place-card').first();
    await expect(firstPlace).toBeVisible();

    const placeBox = await firstPlace.boundingBox();
    expect(placeBox).not.toBeNull();
    console.log(`[Fold Budget] /near default first place card y = ${placeBox!.y.toFixed(2)}px (limit: 520px)`);
    expect(placeBox!.y, `First place card y (${placeBox!.y.toFixed(2)}px) must be < 520px`).toBeLessThan(520);

    // Stress: city jumps
    const citySelect = page.locator('#near-city-jump');
    if (await citySelect.isVisible()) {
      for (const city of ['praha', 'brno', 'ostrava']) {
        await citySelect.selectOption(city);
        await page.waitForTimeout(100);
        const cardBox = await page.locator('.place-card').first().boundingBox();
        if (cardBox) {
          console.log(`[Fold Budget] /near city ${city} first place card y = ${cardBox.y.toFixed(2)}px`);
          expect(cardBox.y, `City ${city} first place card y (${cardBox.y.toFixed(2)}px) must be < 520px`).toBeLessThan(520);
        }
      }
    }

    // Stress: radius pills
    const radiusPills = page.locator('.radius-pill');
    const pillCount = await radiusPills.count();
    for (let p = 0; p < Math.min(pillCount, 3); p++) {
      await radiusPills.nth(p).click();
      await page.waitForTimeout(100);
      const cardBox = await page.locator('.place-card').first().boundingBox();
      if (cardBox) {
        expect(cardBox.y).toBeLessThan(520);
      }
    }
  });

  test('1.4 /app/online on 360x800: first card primary CTA has y + height < 740 across filter states', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/app/online');

    const firstOnlineCta = page.locator('.grid .card .cta.primary').first();
    await expect(firstOnlineCta).toBeVisible();

    const ctaBox = await firstOnlineCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    const bottomY = ctaBox!.y + ctaBox!.height;
    console.log(`[Fold Budget] /app/online default first CTA bottom = ${bottomY.toFixed(2)}px (limit: 740px)`);
    expect(bottomY, `Default online CTA bottom (${bottomY.toFixed(2)}px) must be < 740px`).toBeLessThan(740);

    // Stress: category chips
    const chips = page.locator('.filter-toolbar .filter-chip');
    const chipCount = await chips.count();
    for (let c = 0; c < Math.min(chipCount, 4); c++) {
      const chip = chips.nth(c);
      await chip.click();
      await page.waitForTimeout(100);

      const activeCta = page.locator('.grid .card .cta.primary').first();
      if (await activeCta.isVisible()) {
        const box = await activeCta.boundingBox();
        if (box) {
          const chipBottomY = box.y + box.height;
          console.log(`[Fold Budget] /app/online chip #${c} CTA bottom = ${chipBottomY.toFixed(2)}px`);
          expect(chipBottomY).toBeLessThan(740);
        }
      }
    }
  });

  // =========================================================================
  // 2. TOUCH TARGET COMPLIANCE (MIN-HEIGHT >= 44PX)
  // =========================================================================

  test('2.1 Energy tabs in .instant-card have min-height >= 44px across all mobile viewports', async ({ page }) => {
    for (const vp of MOBILE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      const tabs = page.locator('.instant-card .energy-tab');
      await expect(tabs).toHaveCount(4);

      for (let i = 0; i < 4; i++) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();
        expect(box, `Tab ${i} on ${vp.label} boundingBox`).not.toBeNull();

        const computedHeight = await tab.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            offsetHeight: (el as HTMLElement).offsetHeight,
            minHeight: parseFloat(style.minHeight) || 0,
            clientHeight: (el as HTMLElement).clientHeight
          };
        });

        console.log(`[Touch Target] ${vp.label} energy-tab #${i}: box.height=${box!.height.toFixed(1)}px, offsetHeight=${computedHeight.offsetHeight}px, minHeight=${computedHeight.minHeight}px`);
        expect(box!.height, `Energy tab #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(computedHeight.offsetHeight, `Energy tab #${i} offsetHeight (${computedHeight.offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('2.2 Mobile tabs in /near have min-height >= 44px across mobile viewports (<= 680px)', async ({ page }) => {
    const narrowViewports = MOBILE_VIEWPORTS.filter((v) => v.width <= 680);

    for (const vp of narrowViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/near');

      const mobileTabs = page.locator('.mobile-tabs button');
      await expect(mobileTabs).toHaveCount(2);

      for (let i = 0; i < 2; i++) {
        const btn = mobileTabs.nth(i);
        await expect(btn).toBeVisible();
        const box = await btn.boundingBox();
        expect(box, `Mobile tab #${i} bounding box on ${vp.label}`).not.toBeNull();

        const offsetHeight = await btn.evaluate((el) => (el as HTMLElement).offsetHeight);
        console.log(`[Touch Target] ${vp.label} /near mobile-tab #${i}: box.height=${box!.height.toFixed(1)}px, offsetHeight=${offsetHeight}px`);
        expect(box!.height, `/near mobile-tab #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(offsetHeight, `/near mobile-tab #${i} on ${vp.label} offsetHeight (${offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('2.3 Online CTAs in /app/online have min-height >= 44px across mobile viewports (<= 680px)', async ({ page }) => {
    const narrowViewports = MOBILE_VIEWPORTS.filter((v) => v.width <= 680);

    for (const vp of narrowViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/online');

      const ctas = page.locator('.grid .card .cta');
      const count = await ctas.count();
      expect(count).toBeGreaterThan(0);

      // Check first 4 CTAs (both primary and secondary)
      const testCount = Math.min(count, 4);
      for (let i = 0; i < testCount; i++) {
        const cta = ctas.nth(i);
        await expect(cta).toBeVisible();
        const box = await cta.boundingBox();
        expect(box, `CTA #${i} bounding box on ${vp.label}`).not.toBeNull();

        const offsetHeight = await cta.evaluate((el) => (el as HTMLElement).offsetHeight);
        console.log(`[Touch Target] ${vp.label} /app/online CTA #${i}: box.height=${box!.height.toFixed(1)}px, offsetHeight=${offsetHeight}px`);
        expect(box!.height, `/app/online CTA #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(offsetHeight, `/app/online CTA #${i} on ${vp.label} offsetHeight (${offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  // =========================================================================
  // 3. ZERO HORIZONTAL OVERFLOW STRESS (320px, 360px, 375px, 390px, 412px, 430px)
  // =========================================================================

  const SIX_STRESS_VIEWPORTS = [
    { width: 320, height: 600 },
    { width: 360, height: 800 },
    { width: 375, height: 667 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 430, height: 932 }
  ];

  const FIVE_ROUTES = ['/', '/app/guided', '/app/online', '/near', '/svet'];

  for (const vp of SIX_STRESS_VIEWPORTS) {
    test(`3.1 Zero horizontal overflow on ${vp.width}px viewport across all 5 key routes`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of FIVE_ROUTES) {
        await page.goto(route);

        if (route === '/svet') {
          // Allow canvas/molly to initialize
          await page.waitForTimeout(200);
        }

        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = docEl.scrollWidth;
          const clientWidth = docEl.clientWidth;
          const bodyScrollWidth = body ? body.scrollWidth : 0;

          // Find offending element if any
          let offendingSelector = '';
          if (scrollWidth > clientWidth) {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 1.5) {
                offendingSelector = `${el.tagName.toLowerCase()}.${Array.from(el.classList).join('.')} (right: ${rect.right}px)`;
                break;
              }
            }
          }

          return {
            scrollWidth,
            clientWidth,
            bodyScrollWidth,
            diff: scrollWidth - clientWidth,
            offendingSelector
          };
        });

        console.log(`[Overflow Matrix] ${vp.width}px ${route}: scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth}, diff=${metrics.diff}`);
        expect(
          metrics.scrollWidth,
          `Route ${route} at ${vp.width}px has horizontal overflow: scrollWidth (${metrics.scrollWidth}) > clientWidth (${metrics.clientWidth}). Offender: ${metrics.offendingSelector}`
        ).toBeLessThanOrEqual(metrics.clientWidth);
        expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      }
    });
  }

  // =========================================================================
  // 3.2 INTERACTIVE STATE STRESS TESTS FOR ZERO OVERFLOW
  // =========================================================================

  test('3.2.1 Landing page (320px) interactive stress: details open, crisis panel open, mode switching', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto('/');

    // 1. Open mobile details drawer
    const detailsToggle = page.locator('.instant-card details.how-toggle summary');
    if (await detailsToggle.isVisible()) {
      await detailsToggle.click();
      await page.waitForTimeout(100);
      const m1 = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(m1, 'Drawer open must not cause overflow').toBe(true);
    }

    // 2. Click through all 4 energy modes
    const tabs = page.locator('.instant-card .energy-tab');
    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(60);
      const m2 = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(m2, `Mode ${i} must not cause overflow`).toBe(true);
    }

    // 3. Open crisis panel
    const crisisBtn = page.locator('.footer-calm-actions .fc-crisis');
    if (await crisisBtn.isVisible()) {
      await crisisBtn.click();
      await page.waitForTimeout(100);
      const m3 = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(m3, 'Crisis panel open must not cause overflow').toBe(true);
      await page.locator('.crisis-panel .close-btn').click();
    }
  });

  test('3.2.2 Guided helper /app/guided (320px & 375px) interactive stress: choices, drawer, methodology table', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/app/guided');

      // Check initial state
      let ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      expect(ok, `/app/guided at ${width}px initial state`).toBe(true);

      // Expand adaptive parameters drawer
      const drawerSummary = page.locator('.adaptive-params-drawer summary');
      if (await drawerSummary.isVisible()) {
        await drawerSummary.click();
        await page.waitForTimeout(100);
        ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
        expect(ok, `/app/guided at ${width}px with drawer open`).toBe(true);

        // Click a parameter chip inside drawer
        const chip = page.locator('.adaptive-params-drawer .param-chip').first();
        if (await chip.isVisible()) {
          await chip.click();
          await page.waitForTimeout(60);
          ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
          expect(ok, `/app/guided at ${width}px after chip click`).toBe(true);
        }
      }

      // Check methodology table encapsulation
      const methTableWrap = page.locator('.methodology-table-wrap, .meth-table-wrap');
      if (await methTableWrap.isVisible()) {
        const wrapOverflow = await methTableWrap.evaluate((el) => window.getComputedStyle(el).overflowX);
        expect(['auto', 'scroll'].includes(wrapOverflow)).toBe(true);
      }
    }
  });

  test('3.2.3 Catalog /app/online (320px) interactive stress: horizontal scroll of filter chips', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto('/app/online');

    const toolbar = page.locator('.filter-toolbar');
    await expect(toolbar).toBeVisible();

    // Scroll toolbar horizontally to end and back
    await toolbar.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await page.waitForTimeout(100);

    let ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(ok, '/app/online after filter toolbar scroll to end').toBe(true);

    await toolbar.evaluate((el) => {
      el.scrollLeft = 0;
    });
    await page.waitForTimeout(100);

    ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(ok, '/app/online after filter toolbar scroll to start').toBe(true);
  });

  test('3.2.4 Help map /near (320px) interactive stress: switch tabs (List/Map) & city select', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await page.goto('/near');

    const mobileTabs = page.locator('.mobile-tabs button');
    await expect(mobileTabs).toHaveCount(2);

    // Switch to Map tab
    await mobileTabs.nth(1).click();
    await page.waitForTimeout(200);
    let ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(ok, '/near in Map view at 320px must not overflow').toBe(true);

    // Switch back to List tab
    await mobileTabs.nth(0).click();
    await page.waitForTimeout(150);
    ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(ok, '/near in List view at 320px must not overflow').toBe(true);
  });

  test('3.2.5 Interactive Sanctuary /svet (320px) stress: long deed query param & canvas dimensions', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    const longParam = encodeURIComponent('Velmi dlouhý text dobrého skutku se speciálními znaky čřžýáíé úů pro ověření chování při přetečení titulku na malých displejích');
    await page.goto(`/svet?title=${longParam}`);

    await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
    await page.waitForTimeout(300);

    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(ok, '/svet with long ?title= at 320px must not overflow').toBe(true);
  });

});
