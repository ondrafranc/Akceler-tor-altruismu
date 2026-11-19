import { test, expect } from '@playwright/test';

async function gotoHydrated(page: import('@playwright/test').Page, url: string) {
  await page.goto(url);
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
}

test.describe('Milestone M4 Regressions: Subpages North Star', () => {
  test('M4-1 /near: collapsed Filtrovat drawer + count badge, no premature start on Co napsat, 1-tap contacts, a11y, zero aborted OSM tiles', async ({ page }) => {
    const abortedOsmTiles: string[] = [];
    await page.route('https://*.tile.openstreetmap.org/**', async (route) => {
      await new Promise((r) => setTimeout(r, 60));
      try {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            'base64'
          )
        });
      } catch {
        // route closed on page navigation
      }
    });
    page.on('requestfailed', (req) => {
      if (req.url().includes('tile.openstreetmap.org')) {
        abortedOsmTiles.push(`${req.url()} (${req.failure()?.errorText || 'failed'})`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/near');
    await page.waitForTimeout(300);

    // 1. Collapsed Filtrovat drawer on desktop + count badge when non-default filter applied
    const filtersDrawer = page.locator('details.near-filters-drawer');
    const filtersSummary = filtersDrawer.locator('> summary.near-filters-summary');
    await expect(filtersSummary).toBeVisible();
    await expect(filtersSummary).toContainText('Filtrovat');
    await expect(filtersDrawer).not.toHaveAttribute('open', '');
    await expect(filtersSummary.locator('.filter-count-badge')).toHaveCount(0);

    await filtersSummary.click();
    await expect(filtersDrawer).toHaveAttribute('open', '');
    await filtersDrawer.locator('.radius-pill', { hasText: '15 km' }).click();
    await expect(filtersSummary.locator('.filter-count-badge')).toContainText('1');

    // 2. aria-pressed on .preset-pill, .radius-pill, .source-chip
    await expect(page.locator('.preset-pill').first()).toHaveAttribute('aria-pressed', 'true');
    await expect(filtersDrawer.locator('.radius-pill', { hasText: '15 km' })).toHaveAttribute('aria-pressed', 'true');
    await expect(filtersDrawer.locator('.source-chip').first()).toHaveAttribute('aria-pressed', 'true');

    // 3. Heading hierarchy h1 -> h2 (zero h3 on /near)
    await expect(page.locator('.near-page h1')).toHaveCount(1);
    expect(await page.locator('.near-page h2').count()).toBeGreaterThan(0);
    await expect(page.locator('.near-page h3')).toHaveCount(0);

    // 4. Zero aborted OSM tiles during initial map boot
    expect(abortedOsmTiles).toEqual([]);

    // 5. PlaceCard syncs quickMission, keeps .pc-actions <= 2, surfaces >=44px .pc-quick-contacts,
    // and toggling "Co napsat" does NOT prematurely trigger markActionStarted
    const firstCard = page.locator('.place-card').first();
    await expect(firstCard).toBeVisible();
    expect(await firstCard.locator('.pc-actions > *').count()).toBeLessThanOrEqual(2);
    await expect(firstCard.locator('.pcd-mission')).toContainText('Přines vyprané sezónní oblečení');

    const quickBtns = firstCard.locator('.pc-quick-contacts .pc-quick-btn');
    const qCount = await quickBtns.count();
    expect(qCount).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < qCount; i++) {
      const box = await quickBtns.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    const msgToggle = firstCard.locator('.pc-quick-contacts button', { hasText: 'Co napsat' });
    await msgToggle.click();
    await expect(firstCard.locator('.template-drawer')).toBeVisible();
    await expect(firstCard.locator('.pc-btn.done')).toHaveCount(0);
    await expect(firstCard.locator('.card-effect-stage')).toHaveCount(0);

    // Clicking "Zkopírovat text" marks the place started and unlocks Mám hotovo
    await firstCard.locator('.template-drawer button', { hasText: 'Zkopírovat text' }).click();
    await expect(firstCard.locator('.pc-btn.done')).toBeVisible();

    // 6. Narrow mobile 360x800: .controls-top wraps cleanly without crushing #near-location-query,
    // .controls-utility-row stays on 1 compact row (<= 56px) with >=44px controls,
    // first .place-card stays above y < 520px, and .map-active-sheet surfaces 1-tap contacts
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/near');
    const searchBox = await page.locator('#near-location-query').boundingBox();
    expect(searchBox).not.toBeNull();
    expect(searchBox!.width).toBeGreaterThanOrEqual(200);
    const utilRowBox = await page.locator('.controls-utility-row').boundingBox();
    expect(utilRowBox).not.toBeNull();
    expect(utilRowBox!.height).toBeLessThanOrEqual(56);
    for (const sel of ['.near-filters-summary', '.controls-links .text-util-btn', '.controls-links .text-util-link']) {
      const btnBox = await page.locator(sel).boundingBox();
      expect(btnBox).not.toBeNull();
      expect(btnBox!.width).toBeGreaterThanOrEqual(44);
      expect(btnBox!.height).toBeGreaterThanOrEqual(44);
    }
    const cardBox = await page.locator('.place-card').first().boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.y).toBeLessThan(520);

    await page.locator('.mobile-tabs button', { hasText: 'Mapa' }).click();
    await page.locator('.aa-map-pin').first().click({ force: true });
    const sheet = page.locator('.map-active-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.locator('.mas-actions a', { hasText: 'Mapy.cz' })).toBeVisible();
  });

  test('M4-2 /svet: lazy single initial <picture>, Night opacity 0, >=44px desktop/tablet targets, #ritual-deed-input border, 0 .qp-sep, ARIA', async ({ page }) => {
    // 1. Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/svet');

    await expect(page.locator('.art-parallax-wrap picture')).toHaveCount(1);
    await expect(page.locator('img.art-layer.twilight')).toHaveCount(0);
    await expect(page.locator('.qp-sep')).toHaveCount(0);

    // Switch to Night -> mounts twilight and fades dawn to 0.00
    await page.locator('.atmo-btn', { hasText: 'Hvězdná noc' }).click();
    await expect(page.locator('.art-parallax-wrap picture')).toHaveCount(2);
    await expect(page.locator('img.art-layer.dawn')).toHaveAttribute('style', /opacity:\s*0(\.00)?/);

    // Check ARIA roles on RitualBar and BreathingPacer
    const ritualPills = page.locator('.ritual-modes .ritual-pill');
    await expect(ritualPills.nth(0)).toHaveAttribute('role', 'tab');
    await expect(ritualPills.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(ritualPills.nth(1)).toHaveAttribute('aria-selected', 'false');

    const breathPatterns = page.locator('#dech .pattern-card');
    await expect(breathPatterns.nth(0)).toHaveAttribute('role', 'radio');
    await expect(breathPatterns.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#dech .duration-row')).toHaveAttribute('role', 'group');
    await expect(page.locator('#dech .dur-chip').nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#dech .dur-chip').nth(1)).toHaveAttribute('aria-pressed', 'false');

    // Check #ritual-deed-input visible border + >=44px touch targets on 1440x900 and 768x1024
    for (const vp of [
      { width: 1440, height: 900 },
      { width: 768, height: 1024 }
    ]) {
      await page.setViewportSize(vp);
      const metrics = await page.evaluate(() => {
        const selectors = [
          'summary.guide-toggle-summary',
          '.ritual-pill',
          '.ritual-send-btn',
          '.quick-ideas-summary',
          '.qd-chip',
          '#ritual-deed-input'
        ];
        const boxes = selectors.map((sel) => {
          const el = document.querySelector(sel);
          const r = el?.getBoundingClientRect();
          return { sel, w: r?.width || 0, h: r?.height || 0 };
        });
        const inputEl = document.querySelector('#ritual-deed-input');
        const inputStyle = inputEl ? getComputedStyle(inputEl) : null;
        return {
          boxes,
          borderTopWidth: parseFloat(inputStyle?.borderTopWidth || '0')
        };
      });
      for (const b of metrics.boxes) {
        expect(b.w, `${vp.width}x${vp.height} ${b.sel} width`).toBeGreaterThanOrEqual(44);
        expect(b.h, `${vp.width}x${vp.height} ${b.sel} height`).toBeGreaterThanOrEqual(44);
      }
      expect(metrics.borderTopWidth).toBeGreaterThanOrEqual(1);
    }

    // 2. Mobile 360x800 compact single-row HUD
    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(150);
    const hudBox = await page.locator('.atmosphere-controls').boundingBox();
    expect(hudBox).not.toBeNull();
    expect(hudBox!.height).toBeLessThan(64);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('M4-3 /app/guided, /app/online, /submit: DOM order, non-overlapping Q2/Q3, online sorting & alignment, submit semantics', async ({ page }) => {
    // 1. /app/guided
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/app/guided');

    const guidedCheck = await page.evaluate(() => {
      const plan = document.querySelector('#personal-plan');
      const compass = document.querySelector('.compass-foundations');
      const domPlanBeforeCompass = Boolean(
        plan && compass && (plan.compareDocumentPosition(compass) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
      const liveRegions = document.querySelectorAll('#personal-plan [aria-live="polite"]').length;
      const nestedLiveRegions = document.querySelectorAll('[aria-live] [aria-live]').length;
      const sitGridRole = document.querySelector('.situation-grid')?.getAttribute('role');
      const bodyText = document.body.innerText || '';
      return {
        domPlanBeforeCompass,
        liveRegions,
        nestedLiveRegions,
        sitGridRole,
        hasJargon: bodyText.includes('Ověřený dopad') || bodyText.includes('Přínos (')
      };
    });
    expect(guidedCheck.domPlanBeforeCompass).toBe(true);
    expect(guidedCheck.liveRegions).toBe(1);
    expect(guidedCheck.nestedLiveRegions).toBe(0);
    expect(guidedCheck.sitGridRole).toBe('group');
    expect(guidedCheck.hasJargon).toBe(false);

    // Check aria-pressed on Q2 and Q3 pills + hiding active Step 3 dimension inside drawer
    await expect(page.locator('.topic-pills .topic-pill').first()).toHaveAttribute('aria-pressed', 'true');
    const drawer = page.locator('details.adaptive-params-drawer');
    await drawer.locator('summary').click();
    await expect(drawer.locator('.ap-label', { hasText: 'Anonymita:' })).toHaveCount(0);
    await expect(drawer.locator('.ap-label', { hasText: 'Závazek:' })).toHaveCount(1);

    await page.locator('.situation-card', { hasText: 'Při procházce venku' }).click();
    await expect(drawer.locator('.ap-label', { hasText: 'Závazek:' })).toHaveCount(0);
    await expect(drawer.locator('.ap-label', { hasText: 'Anonymita:' })).toHaveCount(1);

    // Mobile 360x800: .topic-pills wrap instead of horizontal scroll clipping
    await page.setViewportSize({ width: 360, height: 800 });
    const wrapStyle = await page.locator('.compass-foundations .topic-pills').first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { flexWrap: cs.flexWrap, overflowX: cs.overflowX };
    });
    expect(wrapStyle.flexWrap).toBe('wrap');
    expect(wrapStyle.overflowX).toBe('visible');

    // Heading hierarchy inside <main> on /app/guided has zero H2 -> H4 skips (even with alts-drawer open)
    await page.locator('details.alts-drawer summary').click();
    await expect(page.locator('.alt-card h3').first()).toBeVisible();
    const guidedHeadings = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll((els) =>
      els
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        })
        .map((el) => Number(el.tagName.slice(1)))
    );
    expect(guidedHeadings[0]).toBe(1);
    for (let i = 1; i < guidedHeadings.length; i++) {
      expect(guidedHeadings[i] - guidedHeadings[i - 1], `Heading jump at index ${i}`).toBeLessThanOrEqual(1);
    }

    // 2. /app/online
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/app/online');

    // Top 3 default cards prioritize mode !== 'local' (birdlife_ptaci_pasti not in top 3)
    const topCardTexts = await page.locator('.grid .card').allInnerTexts();
    expect(topCardTexts.length).toBe(3);
    for (const txt of topCardTexts) {
      expect(txt).not.toContain('Zabezpeč nebezpečnou skleněnou zastávku');
    }
    await expect(page.locator('.filter-chip').first()).toHaveAttribute('aria-pressed', 'true');

    // Desktop 3-col CTA footer bottoms align across row
    const actionBottoms = await page.locator('.grid .directory-card > .instant-actions').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().bottom))
    );
    expect(actionBottoms.length).toBe(3);
    expect(Math.max(...actionBottoms) - Math.min(...actionBottoms)).toBeLessThanOrEqual(2);

    // "Zobrazit všechny (45)" still reveals all 45 deeds, and "Venku" shows local deeds
    await page.locator('.link-show-all').click();
    await expect(page.locator('.grid .card')).toHaveCount(45);
    await page.locator('.filter-chip', { hasText: 'Venku' }).click();
    await expect(page.locator('.grid .card').first()).toBeVisible();

    // Mobile 360x800 & 320x568: #online-search uncrushed & wraps cleanly on 320px
    await page.setViewportSize({ width: 360, height: 800 });
    const onlineSearchBox = await page.locator('#online-search').boundingBox();
    expect(onlineSearchBox).not.toBeNull();
    expect(onlineSearchBox!.width).toBeGreaterThanOrEqual(200);

    await page.setViewportSize({ width: 320, height: 568 });
    const narrowSearchBox = await page.locator('#online-search').boundingBox();
    expect(narrowSearchBox).not.toBeNull();
    expect(narrowSearchBox!.width).toBeGreaterThanOrEqual(250);

    // 3. /submit
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/submit');

    await expect(page.locator('.tabs')).toHaveAttribute('role', 'tablist');
    const tabOrg = page.locator('.tabs .tab').nth(0);
    const tabEvent = page.locator('.tabs .tab').nth(1);
    await expect(tabOrg).toHaveAttribute('role', 'tab');
    await expect(tabOrg).toHaveAttribute('aria-selected', 'true');
    await expect(tabEvent).toHaveAttribute('aria-selected', 'false');

    await expect(page.locator('#name')).toHaveAttribute('required', '');
    await expect(page.locator('#name')).toHaveAttribute('aria-required', 'true');
    await expect(page.locator('#loc')).toHaveAttribute('required', '');
    await expect(page.locator('#loc')).toHaveAttribute('aria-required', 'true');
    await expect(page.locator('.side-note h2')).toHaveCount(1);
    await expect(page.locator('.side-note h3')).toHaveCount(0);
    await expect(page.locator('.submit-live-region[aria-live="polite"]')).toBeAttached();

    const defaultSub = await page.locator('.page-header-subtitle').innerText();
    await tabEvent.click();
    await expect(tabEvent).toHaveAttribute('aria-selected', 'true');
    const eventSub = await page.locator('.page-header-subtitle').innerText();
    expect(eventSub).not.toBe(defaultSub);
    expect(eventSub).toContain('odkaz na událost');

    await expect(page.locator('#event_url')).toHaveAttribute('type', 'url');
    await expect(page.locator('#event_url')).toHaveAttribute('required', '');
    await expect(page.locator('#event_url')).toHaveAttribute('aria-required', 'true');

    await page.locator('details.optional-fields summary').click();
    await expect(page.locator('#website')).toHaveAttribute('type', 'url');
    await page.locator('.q-pill', { hasText: 'Brno' }).click();
    await expect(page.locator('.q-pill', { hasText: 'Brno' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('M4-4 /near OSM cat-shelter unified hint across card/popup/sheet & /submit collapsed optional validation recovery', async ({ page }) => {
    // 1. /near: cat shelter mentioning "kapsičky" + "psát" never recommends "venčení", while general shelter mentioning "kotce" keeps "venčení"
    const catPlace = {
      id: 'osm:cat-test',
      name: 'Kočičí depozitum Mňau',
      lat: 50.076,
      lon: 14.431,
      kind: 'animals',
      subcategory: 'Útulek pro kočky',
      description: 'Sbíráme kočičí kapsičky a před návštěvou prosíme psát na e-mail.',
      email: 'miau@depozitum.cz',
      website: '',
      curated: false,
      sourceType: 'osm',
      distanceKm: 0.5
    };
    const kotcePlace = {
      id: 'osm:kotce-test',
      name: 'Zvířecí azyl Nové Kotce',
      lat: 50.082,
      lon: 14.442,
      kind: 'animals',
      subcategory: 'Útulek',
      description: 'Opravujeme kotce pro opuštěná zvířata.',
      website: '',
      curated: false,
      sourceType: 'osm',
      distanceKm: 1.0
    };
    await page.route('**/api/nearby**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ places: [catPlace, kotcePlace], fallback: false })
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/near');
    await page.locator('details.near-filters-drawer > summary').click();
    await page.fill('#near-list-filter', 'Kotce');
    const kotceCard = page.locator('#place-card-osm-kotce-test');
    await expect(kotceCard).toBeVisible();
    await expect(kotceCard.locator('.pcd-mission')).toContainText('venčení');

    await page.fill('#near-list-filter', 'Mňau');
    const card = page.locator('#place-card-osm-cat-test');
    await expect(card).toBeVisible();
    const cardMission = await card.locator('.pcd-mission').innerText();
    expect(cardMission).toContain('konzervy');
    expect(cardMission).not.toMatch(/venčen/i);

    await card.locator('.pc-actions button', { hasText: 'Co napsat' }).click();
    const templateBody = card.locator('.template-drawer .td-body');
    await expect(templateBody).toBeVisible();
    const templateText = await templateBody.innerText();
    expect(templateText).toContain('konzervy');
    expect(templateText).toContain('stelivo');
    expect(templateText).not.toMatch(/venčen/i);
    const mailtoHref = await card.locator('.pc-quick-contacts a[href^="mailto:"]').getAttribute('href');
    expect(mailtoHref).toBeTruthy();
    expect(decodeURIComponent(mailtoHref || '')).not.toMatch(/venčen/i);

    await card.locator('button', { hasText: 'Na mapě' }).click();
    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible();
    const popupText = await popup.innerText();
    expect(popupText).toContain('konzervy');
    expect(popupText).not.toMatch(/venčen/i);

    await page.setViewportSize({ width: 360, height: 800 });
    await page.locator('.mobile-tabs button', { hasText: 'Mapa' }).click();
    await page.locator('.aa-map-pin').first().click({ force: true });
    const sheet = page.locator('.map-active-sheet');
    await expect(sheet).toBeVisible();
    const sheetMission = await sheet.locator('.mas-mission').innerText();
    expect(sheetMission).toContain('konzervy');
    expect(sheetMission).not.toMatch(/venčen/i);

    // 2. /submit:
    // (a) earlier invalid required #name keeps focus, keeps <details> closed, clears stale banner, and emits ZERO "not focusable" console errors;
    // (b) closing <details> and immediately pressing Enter in #name (without waiting) opens <details>, focuses #website, and renders .submit-live-region
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/submit');
    await page.locator('.q-pill', { hasText: 'Brno' }).click();
    const optDrawer = page.locator('details.optional-fields');
    await optDrawer.locator('summary').click();
    await expect(optDrawer).toHaveAttribute('open', '');
    await page.fill('#website', 'invalid-site');
    await optDrawer.locator('summary').click();
    await expect(optDrawer).not.toHaveAttribute('open', '');

    // Empty #name + invalid collapsed #website -> #name keeps focus, drawer stays closed, live region has no #website URL error
    await page.locator('button.submit-btn').click();
    await expect(page.locator('#name')).toBeFocused();
    await expect(optDrawer).not.toHaveAttribute('open', '');
    await expect(page.locator('.submit-live-region')).not.toContainText('https://');

    // Fill #name -> invalid collapsed #website opens drawer, focuses #website, and shows URL error
    await page.fill('#name', 'Testovací místo');
    await page.locator('button.submit-btn').click();
    await expect(optDrawer).toHaveAttribute('open', '');
    await expect(page.locator('.submit-live-region .banner.error')).toBeVisible();
    await expect(page.locator('.submit-live-region')).toContainText('https://');
    await expect(page.locator('#website')).toBeFocused();

    // Collapse drawer, clear #name, submit -> clears stale optional-field banner and keeps #name focused
    await optDrawer.locator('summary').click();
    await expect(optDrawer).not.toHaveAttribute('open', '');
    await page.fill('#name', '');
    await page.locator('button.submit-btn').click();
    await expect(page.locator('#name')).toBeFocused();
    await expect(optDrawer).not.toHaveAttribute('open', '');
    await expect(page.locator('.submit-live-region')).not.toContainText('https://');

    // Re-fill #name, open & immediately close drawer then press Enter in #name without waiting on toggle event
    await page.fill('#name', 'Testovací útulek');
    await optDrawer.locator('summary').click();
    await expect(optDrawer).toHaveAttribute('open', '');
    await page.evaluate(() => {
      const summary = document.querySelector('details.optional-fields > summary') as HTMLElement | null;
      const nameInput = document.querySelector('#name') as HTMLInputElement | null;
      summary?.click();
      nameInput?.focus();
    });
    await page.keyboard.press('Enter');
    await expect(optDrawer).toHaveAttribute('open', '');
    await expect(page.locator('#website')).toBeFocused();
    await expect(page.locator('.submit-live-region .banner.error')).toContainText('https://');

    expect(consoleErrors.filter((err) => err.includes('not focusable'))).toEqual([]);
  });
});
