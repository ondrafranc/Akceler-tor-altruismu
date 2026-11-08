import { test, expect } from '@playwright/test';

// Invariant copy forbidden in user-facing rendered UI
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

test.describe('Challenger M3-2: Guided Help State Stress, Filter Combinations & Invariants', () => {

  // =========================================================================
  // SUITE 1: Guided Help State Stress (/app/guided)
  // =========================================================================

  test('G1: Rapid situation and topic switching does not cause layout jitter or displacement', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/guided');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const planSection = page.locator('#personal-plan');
    await expect(planSection).toBeVisible();

    const situations = ['couch', 'focus', 'walk', 'people', 'donate'];

    // 1. Rapidly switch through all situations
    for (let i = 0; i < 15; i++) {
      const sitCard = page.locator('.situation-card').nth(i % situations.length);
      await sitCard.click();

      // Verify #personal-plan remains visible and bounded
      await expect(planSection).toBeVisible();
      const planBox = await planSection.boundingBox();
      expect(planBox).not.toBeNull();
      if (planBox) {
        expect(planBox.width).toBeLessThanOrEqual(375);
        expect(planBox.x).toBeGreaterThanOrEqual(0);
      }

      // Verify zero horizontal page overflow during switching
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    }

    // 2. Rapidly toggle topics
    for (let j = 0; j < 12; j++) {
      const topicPills = page.locator('.topic-pill');
      const count = await topicPills.count();
      const targetPill = topicPills.nth(j % count);
      await targetPill.click();

      // Ensure plan updates and remains within bounds
      await expect(planSection).toBeVisible();
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    }

    // 3. Combined rapid stress: switch situation -> cycle tip -> toggle topic
    for (let k = 0; k < 5; k++) {
      await page.locator('.situation-card').nth(k % 5).click();
      const cycleBtn = page.locator('.btn-cycle-inline');
      if (await cycleBtn.isVisible()) {
        await cycleBtn.click();
      }
      await page.locator('.topic-pill').nth(k % 4).click();
    }

    // Final verification of DOM stability and zero horizontal overflow
    const finalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(finalOverflow).toBe(false);

    // Verify DOM order on mobile: .compass-foundations precedes #personal-plan, which precedes .adaptive-step-block
    const orderEvaluation = await page.evaluate(() => {
      const foundations = document.querySelector('.compass-foundations');
      const plan = document.getElementById('personal-plan');
      const adaptive = document.querySelector('.adaptive-step-block');
      if (!foundations || !plan || !adaptive) return null;

      // In flex column order on mobile:
      const fOrder = parseInt(window.getComputedStyle(foundations).order || '0', 10);
      const pOrder = parseInt(window.getComputedStyle(plan).order || '0', 10);
      const aOrder = parseInt(window.getComputedStyle(adaptive).order || '0', 10);
      return { fOrder, pOrder, aOrder };
    });

    expect(orderEvaluation).not.toBeNull();
    if (orderEvaluation) {
      expect(orderEvaluation.fOrder).toBeLessThan(orderEvaluation.pOrder);
      expect(orderEvaluation.pOrder).toBeLessThan(orderEvaluation.aOrder);
    }
  });

  test('G2: Desktop guided layout stability and non-displacement under rapid switching', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/app/guided');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const planSection = page.locator('#personal-plan');
    await expect(planSection).toBeVisible();

    // Measure initial layout metrics
    const initialBox = (await planSection.boundingBox())!;
    expect(initialBox).not.toBeNull();

    // Rapidly switch situations on desktop
    const situations = ['couch', 'focus', 'walk', 'people', 'donate'];
    for (const sit of situations) {
      const card = page.locator(`.situation-card`).filter({ hasText: sit === 'couch' ? '2 minuty' : sit === 'focus' ? '15 minut' : sit === 'walk' ? 'procházce' : sit === 'people' ? 'partě' : 'dar' });
      if (await card.count() > 0) {
        await card.first().click();
        await page.waitForTimeout(50);
      }
      const box = (await planSection.boundingBox())!;
      expect(box).not.toBeNull();
      // On desktop, plan is in col 2 sticky, box.x should remain roughly constant
      expect(Math.abs(box.x - initialBox.x)).toBeLessThan(50);
    }

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);
  });

  test('G3: Expand and collapse adaptive params drawer without horizontal overflow or erratic scroll jump', async ({ page }) => {
    const testViewports = [
      { width: 320, height: 568, label: '320x568 (iPhone SE 1st gen)' },
      { width: 375, height: 667, label: '375x667 (iPhone SE 2nd gen)' },
      { width: 430, height: 932, label: '430x932 (iPhone 14 Pro Max)' }
    ];

    for (const vp of testViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/guided');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      const drawer = page.locator('details.adaptive-params-drawer');
      await expect(drawer).toBeVisible();

      const summary = drawer.locator('summary');
      await expect(summary).toBeVisible();
      // Verify summary contains gear emoji and required text
      await expect(summary).toContainText('⚙️');
      await expect(summary).toContainText('Upřesnit další volby');

      // Drawer is initially collapsed
      const isInitiallyOpen = await drawer.evaluate((el) => el.hasAttribute('open'));
      expect(isInitiallyOpen).toBe(false);

      // Scroll summary into view
      await summary.scrollIntoViewIfNeeded();
      const initialScrollY = await page.evaluate(() => window.scrollY);

      // 1. Open drawer
      await summary.click();
      await page.waitForTimeout(100);

      const isOpen = await drawer.evaluate((el) => el.hasAttribute('open'));
      expect(isOpen).toBe(true);

      // Verify zero horizontal overflow while drawer is OPEN
      let hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Viewport ${vp.label} had horizontal overflow when drawer was open`).toBe(false);

      // Check scroll jump: opening should not cause wild jump away from summary
      const openScrollY = await page.evaluate(() => window.scrollY);
      expect(Math.abs(openScrollY - initialScrollY), `Erratic scroll jump on ${vp.label}`).toBeLessThan(200);

      // Test inner interactive pills inside open drawer
      const commitmentPills = drawer.locator('.ap-group:has-text("Závazek") button');
      if (await commitmentPills.count() >= 2) {
        await commitmentPills.nth(1).click(); // 'Jednorázově'
        await page.waitForTimeout(50);
        await expect(commitmentPills.nth(1)).toHaveClass(/active/);
      }

      // Verify plan still updates
      await expect(page.locator('#personal-plan')).toBeVisible();

      // 2. Close drawer
      await summary.click();
      await page.waitForTimeout(100);

      const isClosed = await drawer.evaluate((el) => el.hasAttribute('open'));
      expect(isClosed).toBe(false);

      hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Viewport ${vp.label} had horizontal overflow when drawer was closed`).toBe(false);

      // 3. Rapid toggle stress: 8 rapid clicks
      for (let i = 0; i < 8; i++) {
        await summary.click();
      }
      // Zero overflow after toggle storm
      hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });

  test('G4: Methodology drawer table scrolls smoothly without expanding page scrollWidth', async ({ page }) => {
    const testViewports = [
      { width: 320, height: 568 },
      { width: 360, height: 640 },
      { width: 375, height: 667 }
    ];

    for (const vp of testViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/guided');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      const methDrawer = page.locator('details.methodology-drawer');
      await expect(methDrawer).toBeVisible();

      // Scroll to methodology drawer and open it
      await methDrawer.locator('summary').scrollIntoViewIfNeeded();
      await methDrawer.locator('summary').click();
      await page.waitForTimeout(100);

      // Verify table wrapper is present
      const tableWrap = page.locator('.meth-table-wrap');
      await expect(tableWrap).toBeVisible();

      const table = page.locator('.meth-table');
      await expect(table).toBeVisible();

      // CRITICAL CHECK: Page itself MUST NOT overflow horizontally!
      const pageOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });
      expect(pageOverflow.hasOverflow, `Page overflowed on viewport ${vp.width}px: scrollWidth ${pageOverflow.scrollWidth} > clientWidth ${pageOverflow.clientWidth}`).toBe(false);

      // Table wrapper MUST enable horizontal scrolling for wide table content
      const wrapMetrics = await tableWrap.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          overflowX: style.overflowX,
          webkitOverflowScrolling: style.getPropertyValue('-webkit-overflow-scrolling')
        };
      });

      // The table has min-width: 460px, which exceeds 320/360/375px clientWidth
      expect(wrapMetrics.scrollWidth).toBeGreaterThan(wrapMetrics.clientWidth);
      expect(['auto', 'scroll']).toContain(wrapMetrics.overflowX);

      // Test smooth programmatic horizontal scroll inside wrapper
      await tableWrap.evaluate((el) => {
        el.scrollLeft = 80;
      });
      const scrolledLeft = await tableWrap.evaluate((el) => el.scrollLeft);
      expect(scrolledLeft).toBeGreaterThanOrEqual(75);

      // Verify page still does NOT overflow horizontally while table is scrolled
      const pageOverflowAfterScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(pageOverflowAfterScroll).toBe(false);
    }
  });

  // =========================================================================
  // SUITE 2: Catalog & Map Filter Stress
  // =========================================================================

  test('F1: /app/online swipe/scroll filter chips toolbar and click start, middle, end chips', async ({ page }) => {
    // Test on narrow mobile screen
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/app/online');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const toolbar = page.locator('.filter-toolbar');
    await expect(toolbar).toBeVisible();

    // Verify toolbar can scroll horizontally
    const toolbarMetrics = await toolbar.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
    }));
    expect(toolbarMetrics.scrollWidth).toBeGreaterThan(toolbarMetrics.clientWidth);

    const chips = toolbar.locator('.filter-chip');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(5);

    // Initial state: first chip (Doporučené) is active
    await expect(chips.first()).toHaveClass(/active/);
    const initialCardsCount = await page.locator('.grid article.card').count();
    expect(initialCardsCount).toBeGreaterThan(0);

    // 1. Scroll toolbar and click middle chip (e.g. 'Z gauče')
    const midChip = chips.filter({ hasText: 'Z gauče' }).first();
    await midChip.scrollIntoViewIfNeeded();
    await midChip.click();

    // Verify midChip is active and start chip is no longer active
    await expect(midChip).toHaveClass(/active/);
    await expect(chips.first()).not.toHaveClass(/active/);

    // Verify cards are rendered
    const midCardsCount = await page.locator('.grid article.card, .empty-box').count();
    expect(midCardsCount).toBeGreaterThan(0);

    // 2. Scroll toolbar to end and click last chip (Drobný dar)
    const lastChip = chips.filter({ hasText: 'Drobný dar' }).first();
    await lastChip.scrollIntoViewIfNeeded();
    await lastChip.click();

    // Verify lastChip is active
    await expect(lastChip).toHaveClass(/active/);
    await expect(midChip).not.toHaveClass(/active/);

    // 3. Scroll back to start and click first chip (Doporučené)
    const firstChip = chips.first();
    await firstChip.scrollIntoViewIfNeeded();
    await firstChip.click();

    await expect(firstChip).toHaveClass(/active/);
    await expect(lastChip).not.toHaveClass(/active/);
    await expect(page.locator('.grid article.card').first()).toBeVisible();

    // 4. Rapid clicking stress test across all chips
    for (let r = 0; r < chipCount; r++) {
      await chips.nth(r).click();
    }
    // Verify final state matches last clicked chip
    await expect(chips.last()).toHaveClass(/active/);

    // Verify zero horizontal overflow on page
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('F2: /near search queries, city jumps, radius pills, and Seznam/Mapa toggle state preservation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const searchInput = page.locator('#near-location-query');
    const citySelect = page.locator('#near-city-jump');
    const radius15 = page.locator('.radius-pill').filter({ hasText: '15 km' });
    const listTab = page.locator('.mobile-tabs button').filter({ hasText: 'Seznam' });
    const mapTab = page.locator('.mobile-tabs button').filter({ hasText: 'Mapa' });
    const cards = page.locator('.place-card');

    await expect(searchInput).toBeVisible();
    await expect(citySelect).toBeVisible();
    await expect(radius15).toBeVisible();

    // 1. City Jump & Radius Setup
    await citySelect.selectOption('brno');
    await page.waitForTimeout(100);
    await expect(citySelect).toHaveValue('brno');

    await radius15.click();
    await page.waitForTimeout(100);
    await expect(radius15).toHaveClass(/active/);

    // Verify place cards are rendered for Brno
    expect(await cards.count()).toBeGreaterThan(0);

    // 2. Seznam vs Mapa Toggle Stress with City & Radius preserved
    for (let t = 0; t < 10; t++) {
      await mapTab.click();
      await listTab.click();
    }

    // Verify state preserved after 10 toggles
    await expect(citySelect).toHaveValue('brno');
    await expect(radius15).toHaveClass(/active/);
    expect(await cards.count()).toBeGreaterThan(0);

    // 3. Search Query Stress & Toggle Preservation
    await searchInput.fill('Tábor');
    // Ensure search input retains user typed query across view toggles
    await mapTab.click();
    await expect(mapTab).toHaveClass(/active/);
    await expect(page.locator('.map-column')).not.toHaveClass(/hidden-mob/);

    await listTab.click();
    await expect(listTab).toHaveClass(/active/);
    await expect(page.locator('.map-column')).toHaveClass(/hidden-mob/);
    await expect(searchInput).toHaveValue('Tábor');

    // Switch to Map and verify map container is rendered
    await mapTab.click();
    await expect(mapTab).toHaveClass(/active/);
    await expect(page.locator('.map-column')).not.toHaveClass(/hidden-mob/);

    // Map column must be visible and properly sized
    const mapFrame = page.locator('.map-frame');
    await expect(mapFrame).toBeVisible();
    const mapBox = await mapFrame.boundingBox();
    expect(mapBox).not.toBeNull();
    if (mapBox) {
      expect(mapBox.width).toBeGreaterThan(250);
      expect(mapBox.height).toBeGreaterThan(250);
    }

    // Switch back to List and verify list cards are immediately restored
    await listTab.click();
    await expect(listTab).toHaveClass(/active/);
    await expect(page.locator('.map-column')).toHaveClass(/hidden-mob/);
    await expect(cards.first()).toBeVisible();

    // Verify zero horizontal overflow on /near
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  // =========================================================================
  // SUITE 3: Invariants & Security Guard
  // =========================================================================

  test('I1: Exact string "Molly" is preserved in .instant-card .molly-celebration-note across all energy modes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    const energyTabs = page.locator('.energy-tab');
    const tabCount = await energyTabs.count();
    expect(tabCount).toBe(4);

    // Iterate through all 4 energy modes
    for (let m = 0; m < tabCount; m++) {
      await energyTabs.nth(m).click();
      await page.waitForTimeout(100);

      // Trigger completion to reveal celebration card
      const doneBtn = page.locator('.btn-studio-done').first();
      await expect(doneBtn).toBeVisible();
      await doneBtn.click();
      await page.waitForTimeout(100);

      // Locate celebration note inside .instant-card
      const celebrationNote = page.locator('.instant-card .molly-celebration-note');
      await expect(celebrationNote).toBeAttached();

      const noteText = await celebrationNote.textContent();
      expect(noteText).not.toBeNull();
      // MUST preserve exact string "Molly"
      expect(noteText).toContain('Molly');

      // Verify tone is supportive, warm and empathetic (not cringe)
      expect(noteText).toMatch(/🐾|děkuje|odměna|krok/i);

      // Reset for next mode by clicking next idea
      const nextBtn = page.locator('.inline-celebration-next');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(100);
      }
    }
  });

  test('I2: Zero BANNED_RENDERED_COPY strings appear across rendered DOM of all primary routes', async ({ page }) => {
    const routesToAudit = [
      '/',
      '/app',
      '/app/guided',
      '/app/online',
      '/near',
      '/svet'
    ];

    for (const route of routesToAudit) {
      await page.goto(route);
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      // Extract entire rendered text of the page
      const visibleBodyText = await page.evaluate(() => document.body.innerText || '');

      for (const phrase of BANNED_RENDERED_COPY) {
        expect(
          visibleBodyText,
          `Route "${route}" violated copy rule by rendering banned phrase: "${phrase}"`
        ).not.toContain(phrase);
      }
    }
  });
});
