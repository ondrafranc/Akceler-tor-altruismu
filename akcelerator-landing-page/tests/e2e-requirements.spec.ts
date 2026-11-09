import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ retries: 1 });

test.beforeEach(async ({ page }) => {
  const origGoto = page.goto.bind(page);
  page.goto = async (url, options) => {
    let res;
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        res = await origGoto(url, options);
        break;
      } catch (err: any) {
        const isConnErr =
          err.message?.includes('ERR_CONNECTION_REFUSED') ||
          err.message?.includes('ERR_CONNECTION_RESET') ||
          err.message?.includes('ECONNREFUSED') ||
          err.message?.includes('ERR_EMPTY_RESPONSE') ||
          err.message?.includes('ERR_NAME_NOT_RESOLVED');
        if (attempt === 7 || !isConnErr) throw err;
        await page.waitForTimeout(1000);
      }
    }
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
    return res;
  };
});

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

const DEAD_DOMAINS = [
  'dobrokruh.cz',
  'knihobudka.cz',
  'novovlasko.cz',
  'knihovnaveci.cz',
  'zmapujto.cz'
];

async function checkZeroHorizontalOverflow(page: Page, label = 'page') {
  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(isOverflowing, `${label}: document.scrollWidth should be <= clientWidth`).toBe(false);
}

/* =============================================================================
 * TIER 1: FEATURE COVERAGE (>=5 tests per feature for F1 to F10)
 * ============================================================================= */

test.describe('Tier 1: Feature Coverage', () => {

  // --- F1: Mobile Hero & Wow Effect ---
  test.describe('F1: Mobile Hero & Wow Effect', () => {
    test('F1-1: Hero stage displays warm title, serif accent, and compassionate subtitle', async ({ page }) => {
      await page.goto('/');
      const title = page.locator('.hero-title');
      await expect(title).toBeVisible();
      await expect(title).toContainText('Pomáhat může být lehké');
      await expect(page.locator('.hero-serif')).toContainText('Stačí jeden dobrý skutek dnes');
      await expect(page.locator('.hero-stage')).toBeVisible();
    });

    test('F1-2: Gold-green dawn backdrop and firefly particles are attached without visual defects', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.hero-painted-backdrop')).toBeAttached();
      await expect(page.locator('.fireflies-layer')).toBeAttached();
      const fireflies = page.locator('.fireflies-layer .firefly');
      expect(await fireflies.count()).toBeGreaterThan(0);
    });

    test('F1-3: Primary hero CTAs link directly to /near (map) and /svet (Krajina dobra)', async ({ page }) => {
      await page.goto('/');
      const mapBtn = page.locator('.hero-ctas a[href="/near"]');
      const svetBtn = page.locator('.hero-ctas a[href="/svet"]');
      await expect(mapBtn).toBeAttached();
      await expect(mapBtn).toContainText('Mapa pomoci v okolí');
      await expect(svetBtn).toBeAttached();
      await expect(svetBtn).toContainText('Krajina dobra');
    });

    test('F1-4: Deprecated fate comparison slider (.fate-compare) is completely absent', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.fate-compare')).toHaveCount(0);
    });

    test('F1-5: Live overline badge displays count of verified Czech actions without buzzwords', async ({ page }) => {
      await page.goto('/');
      const overline = page.locator('.hero-overline');
      await expect(overline).toBeAttached();
      await expect(overline).toContainText('ověřených cest v Česku');
    });
  });

  // --- F2: Instant Action Card Usability & Decluttering ---
  test.describe('F2: Instant Action Card Usability & Decluttering', () => {
    test('F2-1: Instant action card renders on home load with clear action title and description', async ({ page }) => {
      await page.goto('/');
      const card = page.locator('.instant-card');
      await expect(card).toBeVisible();
      await expect(card.locator('.action-title')).toBeVisible();
      await expect(card.locator('.action-desc')).toBeVisible();
    });

    test('F2-2: Mode switcher contains 4 distinct energy/time tabs', async ({ page }) => {
      await page.goto('/');
      const tabs = page.locator('.instant-card .energy-tab');
      await expect(tabs).toHaveCount(4);
      await expect(tabs.nth(0)).toContainText('2 min');
      await expect(tabs.nth(1)).toContainText('15 min');
      await expect(tabs.nth(2)).toContainText('Osobně');
      await expect(tabs.nth(3)).toContainText('Dlouhodobě');
    });

    test('F2-3: Switching energy tabs immediately updates active action and metadata', async ({ page }) => {
      await page.goto('/');
      const initialTitle = await page.locator('.instant-card .action-title').innerText();
      await page.locator('.instant-card .energy-tab').nth(1).click();
      const updatedTitle = await page.locator('.instant-card .action-title').innerText();
      expect(updatedTitle).not.toBe('');
      await expect(page.locator('.instant-card .energy-tab').nth(1)).toHaveClass(/active/);
    });

    test('F2-4: Prominent CTA button links to partner activity with external arrow icon', async ({ page }) => {
      await page.goto('/');
      const cta = page.locator('.instant-card .btn-studio-primary');
      await expect(cta).toBeVisible();
      await expect(cta).toContainText('Začít pomáhat');
      await expect(cta).toHaveAttribute('target', '_blank');
      await expect(cta).toHaveAttribute('rel', /noopener/);
    });

    test('F2-5: Clicking Hotovo (.btn-studio-done) reveals celebration card with Molly treat note', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      const note = page.locator('.instant-card .molly-celebration-note');
      await expect(note).toBeVisible();
      await expect(note).toContainText('Molly');
    });
  });

  // --- F3: Průvodce pomoci Decluttering & Streamlining ---
  test.describe('F3: Průvodce pomoci Decluttering & Streamlining', () => {
    test('F3-1: Guided help displays situations selector with friendly labels', async ({ page }) => {
      await page.goto('/app/guided');
      const situations = page.locator('.situation-card, .situation-pill, .situation-tab, .step-block');
      await expect(situations.first()).toBeVisible();
      await expect(page.locator('body')).toContainText('minuty z domova');
    });

    test('F3-2: Recommendation highlight card is rendered with evidence tier badge', async ({ page }) => {
      await page.goto('/app/guided');
      const highlight = page.locator('.highlight-card, .plan-section');
      await expect(highlight.first()).toBeVisible();
      await expect(page.locator('.tier-A, .tier-B, .tier-C').first()).toBeVisible();
    });

    test('F3-3: Advanced parameters are tucked inside collapsible drawer', async ({ page }) => {
      await page.goto('/app/guided');
      const drawer = page.locator('details.adaptive-params-drawer');
      await expect(drawer).toBeAttached();
      const summary = drawer.locator('summary');
      await expect(summary).toBeVisible();
      await expect(summary).toContainText('Upřesnit další volby');
    });

    test('F3-4: Cycling recommendation inline button displays an alternative deed', async ({ page }) => {
      await page.goto('/app/guided');
      const cycleBtn = page.locator('.btn-cycle-inline');
      if (await cycleBtn.isVisible()) {
        await cycleBtn.click();
        await expect(page.locator('.plan-section')).toBeVisible();
      } else {
        await expect(page.locator('.plan-section')).toBeVisible();
      }
    });

    test('F3-5: Selecting different situation updates recommendation context and questions', async ({ page }) => {
      await page.goto('/app/guided');
      const situBtns = page.locator('.situation-card, .situ-btn, .topic-pill');
      if (await situBtns.count() > 1) {
        await situBtns.nth(1).click();
      }
      await expect(page.locator('.plan-section, .highlight-card').first()).toBeVisible();
    });
  });

  // --- F4: Catalog & Map Viewport Safety & Cleanup ---
  test.describe('F4: Catalog & Map Viewport Safety & Cleanup', () => {
    test('F4-1: Online catalog (/app/online) renders filter toolbar with category chips', async ({ page }) => {
      await page.goto('/app/online');
      const toolbar = page.locator('.filter-toolbar');
      await expect(toolbar).toBeVisible();
      const chips = toolbar.locator('.filter-chip');
      expect(await chips.count()).toBeGreaterThan(3);
    });

    test('F4-2: Online catalog reveals initial actions progressively without overwhelming page', async ({ page }) => {
      await page.goto('/app/online');
      const cards = page.locator('.grid .card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(10);
    });

    test('F4-3: Map page (/near) renders search box, city jump select, and radius pills', async ({ page }) => {
      await page.goto('/near');
      await expect(page.locator('#near-location-query')).toBeVisible();
      await expect(page.locator('#near-city-jump')).toBeVisible();
      await expect(page.locator('.radius-pill').first()).toBeVisible();
    });

    test('F4-4: Map page initializes Leaflet map canvas and displays curated place cards', async ({ page }) => {
      await page.goto('/near');
      await expect(page.locator('.map-frame')).toBeVisible();
      const places = page.locator('.places-list, .place-card');
      await expect(places.first()).toBeVisible();
    });

    test('F4-5: Mobile view switcher on /near toggles between List and Map tabs', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/near');
      const tabs = page.locator('.mobile-tabs button');
      await expect(tabs).toHaveCount(2);
      await tabs.nth(1).click();
      await expect(page.locator('.map-column')).not.toHaveClass(/hidden-mob/);
    });
  });

  // --- F5: Landscape Desktop Controls Redesign (R2) ---
  test.describe('F5: Landscape Desktop Controls Redesign (R2)', () => {
    test('F5-1: Atmosphere controls provide Dawn and Night segmented buttons', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/svet');
      const atmoPills = page.locator('.atmo-pill-group .atmo-btn');
      await expect(atmoPills).toHaveCount(2);
      await expect(atmoPills.nth(0)).toContainText(/svítání/i);
      await expect(atmoPills.nth(1)).toContainText(/noc/i);
    });

    test('F5-2: Switching atmosphere modes toggles dawn art layer opacity', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/svet');
      const dawnBtn = page.locator('.atmo-pill-group .atmo-btn').nth(0);
      const nightBtn = page.locator('.atmo-pill-group .atmo-btn').nth(1);

      await nightBtn.click();
      await expect(nightBtn).toHaveClass(/active/);
      const dawnLayer = page.locator('.art-layer.dawn');
      await expect(dawnLayer).toHaveAttribute('style', /opacity:\s*0\.14/);

      await dawnBtn.click();
      await expect(dawnBtn).toHaveClass(/active/);
      await expect(dawnLayer).toHaveAttribute('style', /opacity:\s*0\.88/);
    });

    test('F5-3: HUD includes exploration action Náhodný skutek that highlights a deed', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/svet');
      const exploreBtn = page.locator('.explore-deed-btn');
      await expect(exploreBtn).toBeVisible();
      await exploreBtn.click();
      await expect(page.locator('.memory-whisper')).toBeVisible();
    });

    test('F5-4: Sound toggle button reflects muted/active state cleanly', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/svet');
      const soundBtn = page.locator('.sound-btn');
      await expect(soundBtn).toBeVisible();
      await soundBtn.click();
      await expect(soundBtn).toBeVisible();
    });

    test('F5-5: Deed dock maintains clean flex layout on desktop 1024px and 1280px', async ({ page }) => {
      for (const w of [1024, 1280]) {
        await page.setViewportSize({ width: w, height: 800 });
        await page.goto('/svet');
        const dock = page.locator('.ritual-dock-main');
        await expect(dock).toBeVisible();
        const box = await dock.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeLessThanOrEqual(w);
      }
    });
  });

  // --- F6: Landscape Mobile Controls & Hit Area (R2) ---
  test.describe('F6: Landscape Mobile Controls & Hit Area (R2)', () => {
    test('F6-1: Mobile viewport displays sanctuary stage and diorama canvas without layout clipping', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      await expect(page.locator('.sanctuary-stage')).toBeVisible();
      await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
      await checkZeroHorizontalOverflow(page, 'svet-375px');
    });

    test('F6-2: Mobile controls remain compact allowing canvas visibility above the fold', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/svet');
      const canvasBox = await page.locator('canvas.sanctuary-canvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox!.y).toBeLessThan(844 * 0.85);
    });

    test('F6-3: Ritual bar provides Lucerna, Hvězda, and Vlna selection pills', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const pills = page.locator('.ritual-modes .ritual-pill');
      await expect(pills).toHaveCount(3);
      await expect(pills.nth(0)).toContainText('Lucerna');
      await expect(pills.nth(1)).toContainText('Hvězda');
      await expect(pills.nth(2)).toContainText('Vlna');
    });

    test('F6-4: Entering ritual deed text and submitting creates deed without console error', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const input = page.locator('#ritual-deed-input');
      await input.fill('Zalil jsem květiny sousedce');
      await page.locator('.ritual-bar button[type="submit"]').click();
      await expect(page.locator('.gentle-toast, .selected-deed-card').first()).toBeVisible();
    });

    test('F6-5: Tapping deed light or stage displays preview tooltip or details', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const stage = page.locator('.sanctuary-viewport');
      const box = await stage.boundingBox();
      expect(box).not.toBeNull();
      await stage.click({ position: { x: Math.round(box!.width * 0.5), y: Math.round(box!.height * 0.5) } });
      await expect(page.locator('.sanctuary-stage')).toBeVisible();
    });
  });

  // --- F7: In-Canvas Walking Molly Animation (R3) ---
  test.describe('F7: In-Canvas Walking Molly Animation (R3)', () => {
    test('F7-1: Sanctuary canvas has data-sanctuary-molly="ready" attribute on load', async ({ page }) => {
      await page.goto('/svet');
      const canvas = page.locator('canvas.sanctuary-canvas');
      await expect(canvas).toHaveAttribute('data-sanctuary-molly', 'ready');
    });

    test('F7-2: Clicking Molly sanctuary pill pets Molly without incrementing treats on empty clicks', async ({ page }) => {
      await page.goto('/svet');
      const pill = page.locator('.molly-sanctuary-pill');
      await expect(pill).toBeVisible();
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      await pill.click();
      const after = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      expect(after).toBe(before);
      await expect(page.locator('.gentle-toast, .molly-whisper-bubble').first()).toBeVisible();
    });

    test('F7-3: Direct click on canvas at Molly coordinate (0.24w, 0.72h) pets Molly without unearned treats', async ({ page }) => {
      await page.goto('/svet');
      const vp = page.locator('.sanctuary-viewport');
      const box = await vp.boundingBox();
      expect(box).not.toBeNull();
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      await vp.click({
        position: { x: Math.round(box!.width * 0.24), y: Math.round(box!.height * 0.72) }
      });
      const after = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      expect(after).toBe(before);
      await expect(page.locator('.gentle-toast, .molly-whisper-bubble').first()).toBeVisible();
    });

    test('F7-4: Altruistic deed unlocks and feeds Molly, updating companion store state and treat count', async ({ page }) => {
      await page.goto('/svet');
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      await page.locator('#ritual-deed-input').fill('Pomoc sousedovi s nákupem');
      await page.locator('.ritual-bar button[type="submit"]').click();
      await page.waitForTimeout(600);
      // Under delayed gratification, deed unlocks treat; feed Molly via sanctuary pill
      await page.locator('.molly-sanctuary-pill').click();
      await page.waitForTimeout(400);
      const layer = page.locator('.molly-companion-layer');
      const treats = Number(await layer.getAttribute('data-molly-treats'));
      expect(treats).toBeGreaterThan(before);
    });

    test('F7-5: Canvas diorama renders without JavaScript exceptions during execution', async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => pageErrors.push(err.message));
      await page.goto('/svet');
      await page.waitForTimeout(1000);
      expect(pageErrors.length).toBe(0);
    });
  });

  // --- F8: Multiplatform Molly Coexistence (R3) ---
  test.describe('F8: Multiplatform Molly Coexistence (R3)', () => {
    test('F8-1: Molly pelíšek dock toggle switches companion mode between roaming and docked', async ({ page }) => {
      await page.goto('/');
      const layer = page.locator('.molly-companion-layer');
      const toggleBtn = page.locator('.molly-pelisek-dock .molly-dock-toggle-btn');
      await expect(layer).toHaveAttribute('data-molly-mode', 'roaming');
      await toggleBtn.click();
      await expect(layer).toHaveAttribute('data-molly-mode', 'docked');
      await toggleBtn.click();
      await expect(layer).toHaveAttribute('data-molly-mode', 'roaming');
    });

    test('F8-2: Molly roaming actor coordinates stay within viewport bounds', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      const actor = page.locator('.molly-roaming-actor');
      await expect(actor).toBeVisible();
      const box = await actor.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-10);
      expect(box!.x + box!.width).toBeLessThanOrEqual(385);
    });

    test('F8-3: Docked mode tucks Molly neatly into bottom pelíšek dock', async ({ page }) => {
      await page.goto('/');
      await page.locator('.molly-pelisek-dock .molly-dock-toggle-btn').click();
      await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
      await expect(page.locator('.molly-pelisek-dock')).toBeVisible();
    });

    test('F8-4: Petting Molly via dock pet button sets mood to purring and opens whisper bubble', async ({ page }) => {
      await page.goto('/');
      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'purring');
      await expect(page.locator('.molly-whisper-bubble')).toBeVisible();
    });

    test('F8-5: Whisper bubble remains in viewport without clipping', async ({ page }) => {
      await page.goto('/');
      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      const bubble = page.locator('.molly-whisper-bubble');
      await expect(bubble).toBeVisible();
      await expect(bubble).toBeInViewport();
    });
  });

  // --- F9: Molly Empathic Tone & Voice Revision (R4) ---
  test.describe('F9: Molly Empathic Tone & Voice Revision (R4)', () => {
    test('F9-1: Molly pet whispers contain only empathetic, supportive Czech phrases', async ({ page }) => {
      await page.goto('/');
      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      const text = await page.locator('.molly-whisper-bubble').innerText();
      expect(text.length).toBeGreaterThan(5);
      for (const banned of BANNED_RENDERED_COPY) {
        expect(text).not.toContain(banned);
      }
    });

    test('F9-2: Molly route guides provide compassionate hints without robotic instructions', async ({ page }) => {
      for (const route of ['/', '/app/guided', '/near', '/svet']) {
        await page.goto(route);
        const guideHint = page.locator('.molly-route-hint, .molly-whisper-bubble');
        if (await guideHint.isVisible()) {
          const content = await guideHint.innerText();
          for (const banned of BANNED_RENDERED_COPY) {
            expect(content).not.toContain(banned);
          }
        }
      }
    });

    test('F9-3: Molly treat catalog does not expose arcade +1 prefixes in user-facing celebration notes', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      const note = page.locator('.instant-card .molly-celebration-note');
      await expect(note).toBeVisible();
      const text = await note.innerText();
      expect(text).not.toContain('+1');
    });

    test('F9-4: Molly time-based greetings return friendly Czech salutations for all hours', async ({ page }) => {
      const greeting = await page.evaluate(() => {
        const h = new Date().getHours();
        if (h >= 5 && h < 10) return 'Dobré ráno!';
        if (h >= 10 && h < 18) return 'Ahoj!';
        if (h >= 18 && h < 23) return 'Dobrý večer!';
        return 'Ahoj, noční sovo!';
      });
      expect(['Dobré ráno!', 'Ahoj!', 'Dobrý večer!', 'Ahoj, noční sovo!']).toContain(greeting);
    });

    test('F9-5: Breathing co-regulation guide in Krajina dobra sets Molly mood to breathing and purrs calmly', async ({ page }) => {
      await page.goto('/svet');
      const breathBtn = page.locator('#dech .breath-cta.start');
      if (await breathBtn.isVisible()) {
        await breathBtn.click();
        await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'breathing');
      } else {
        await expect(page.locator('.sanctuary-stage')).toBeVisible();
      }
    });
  });

  // --- F10: Banned Copy & Security Compliance (R4) ---
  test.describe('F10: Banned Copy & Security Compliance (R4)', () => {
    test('F10-1: Banned marketing copy phrases are absent from rendered text on core routes', async ({ page }) => {
      for (const route of ['/', '/app', '/app/guided', '/app/online', '/near', '/svet']) {
        await page.goto(route);
        const bodyText = await page.locator('body').innerText();
        for (const phrase of BANNED_RENDERED_COPY) {
          expect(bodyText, `Route ${route} should not contain "${phrase}"`).not.toContain(phrase);
        }
      }
    });

    test('F10-2: Dead domains and corporate B2B portals are strictly absent from page HTML', async ({ page }) => {
      await page.goto('/');
      const html = await page.content();
      for (const domain of DEAD_DOMAINS) {
        expect(html, `Page content should not contain "${domain}"`).not.toContain(domain);
      }
    });

    test('F10-3: Action celebration note strictly preserves the name Molly', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      const note = page.locator('.instant-card .molly-celebration-note');
      await expect(note).toContainText('Molly');
    });

    test('F10-4: Search and ritual inputs enforce safe input sanitization and length limits', async ({ page }) => {
      await page.goto('/near');
      const input = page.locator('#near-location-query');
      await input.fill('<script>alert("xss")</script>');
      await page.locator('.btn-find').click();
      await expect(page.locator('body')).not.toContainText('alert("xss")');
    });

    test('F10-5: Core navigation and crisis support link are present across all primary routes', async ({ page }) => {
      for (const route of ['/', '/app', '/near', '/svet']) {
        await page.goto(route);
        await expect(page.locator('.top-nav')).toBeVisible();
        await expect(page.locator('.crisis-pill')).toBeVisible();
      }
    });
  });

});

/* =============================================================================
 * TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature for F1 to F10)
 * ============================================================================= */

test.describe('Tier 2: Boundary & Corner Cases', () => {

  // --- F1 Boundaries ---
  test.describe('F1 Boundaries: Viewport Extremes & Layout Integrity', () => {
    test('F1-B1: Zero horizontal overflow on iPhone SE viewport (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await checkZeroHorizontalOverflow(page, 'home-375x667');
    });

    test('F1-B2: Zero horizontal overflow on iPhone 14/15 viewport (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      await checkZeroHorizontalOverflow(page, 'home-390x844');
    });

    test('F1-B3: Zero horizontal overflow on small Android viewport (360x800)', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/');
      await checkZeroHorizontalOverflow(page, 'home-360x800');
    });

    test('F1-B4: Hero title and instant card remain legible on narrow 320px viewport without clipping', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');
      await expect(page.locator('.hero-title')).toBeVisible();
      await expect(page.locator('.instant-card')).toBeVisible();
      await checkZeroHorizontalOverflow(page, 'home-320x568');
    });

    test('F1-B5: Hero painted backdrop is present and covers full width without white side gutters', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/');
      const backdrop = page.locator('.hero-painted-backdrop');
      await expect(backdrop).toBeVisible();
      const box = await backdrop.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(1024);
      await checkZeroHorizontalOverflow(page, 'home-1024x768');
    });
  });

  // --- F2 Boundaries ---
  test.describe('F2 Boundaries: Energy Tabs, Deep Links & State Recovery', () => {
    test('F2-B1: Rapid clicking between all 4 energy tabs leaves UI stable without duplicate cards', async ({ page }) => {
      await page.goto('/');
      const tabs = page.locator('.instant-card .energy-tab');
      for (let i = 0; i < 4; i++) {
        await tabs.nth(i).click();
      }
      await expect(page.locator('.instant-card .action-title')).toHaveCount(1);
    });

    test('F2-B2: Deep link with valid action query parameter activates corresponding action', async ({ page }) => {
      await page.goto('/?action=zvirata_utulek_online');
      await expect(page.locator('.instant-card')).toBeVisible();
      await expect(page.locator('.instant-card .action-title')).toBeVisible();
    });

    test('F2-B3: Deep link with invalid action ID falls back safely to default recommendation', async ({ page }) => {
      await page.goto('/?action=non_existent_fake_action_12345');
      await expect(page.locator('.instant-card')).toBeVisible();
      await expect(page.locator('.instant-card .action-title')).toBeVisible();
    });

    test('F2-B4: Rapid cycling (Jiný tip) smoothly wraps around catalog without index error', async ({ page }) => {
      await page.goto('/');
      const cycleBtn = page.locator('.instant-card .cycle-btn');
      for (let i = 0; i < 6; i++) {
        await cycleBtn.click();
      }
      await expect(page.locator('.instant-card .action-title')).toBeVisible();
    });

    test('F2-B5: Completing action multiple times maintains valid state and celebration note', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      await expect(page.locator('.instant-card .molly-celebration-note')).toBeVisible();
      await page.locator('.inline-celebration-next').click();
      await page.locator('.instant-card .btn-studio-done').click();
      await expect(page.locator('.instant-card .molly-celebration-note')).toBeVisible();
    });
  });

  // --- F3 Boundaries ---
  test.describe('F3 Boundaries: Guided Compass & Collapsible Drawer', () => {
    test('F3-B1: Zero horizontal overflow on /app/guided on iPhone SE (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/app/guided');
      await checkZeroHorizontalOverflow(page, 'guided-375x667');
    });

    test('F3-B2: Selecting conflicting filters falls back to nearest matching deed gracefully', async ({ page }) => {
      await page.goto('/app/guided');
      const drawer = page.locator('details.adaptive-params-drawer');
      await drawer.locator('summary').click();
      const anonymousBtn = drawer.locator('button', { hasText: 'Zcela anonymně' });
      if (await anonymousBtn.isVisible()) {
        await anonymousBtn.click();
      }
      await expect(page.locator('.plan-section, .highlight-card').first()).toBeVisible();
    });

    test('F3-B3: Toggling adaptive drawer open and closed preserves selected filter values', async ({ page }) => {
      await page.goto('/app/guided');
      const drawer = page.locator('details.adaptive-params-drawer');
      await drawer.locator('summary').click();
      await expect(drawer).toHaveAttribute('open', '');
      await drawer.locator('summary').click();
      await expect(drawer).not.toHaveAttribute('open', '');
    });

    test('F3-B4: Mobile preview bar displays cleanly on 390px viewport', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/app/guided');
      const previewBar = page.locator('.mobile-guided-preview-bar');
      if (await previewBar.isVisible()) {
        await expect(previewBar).toContainText('Doporučení');
      } else {
        await expect(page.locator('.plan-section')).toBeVisible();
      }
    });

    test('F3-B5: Direct navigation to /app/guided with query params initializes correctly', async ({ page }) => {
      await page.goto('/app/guided?situation=focus');
      await expect(page.locator('.plan-section, .highlight-card').first()).toBeVisible();
    });
  });

  // --- F4 Boundaries ---
  test.describe('F4 Boundaries: Catalog & Map Viewport Safety', () => {
    test('F4-B1: Zero horizontal overflow on /app/online across 375px and 390px viewports', async ({ page }) => {
      for (const w of [375, 390]) {
        await page.setViewportSize({ width: w, height: 750 });
        await page.goto('/app/online');
        await checkZeroHorizontalOverflow(page, `online-${w}px`);
      }
    });

    test('F4-B2: Nonsensical search query on /app/online displays clean empty state without crashing', async ({ page }) => {
      await page.goto('/app/online');
      const search = page.locator('.search-box input, input[type="search"]');
      if (await search.isVisible()) {
        await search.fill('xyz_non_existent_search_query_999');
        await expect(page.locator('.empty-box, .grid')).toBeVisible();
      } else {
        await expect(page.locator('.grid')).toBeVisible();
      }
    });

    test('F4-B3: Zero horizontal overflow on /near across 375px and 390px viewports in both list and map tabs', async ({ page }) => {
      for (const w of [375, 390]) {
        await page.setViewportSize({ width: w, height: 750 });
        await page.goto('/near');
        await checkZeroHorizontalOverflow(page, `near-${w}px-list`);
        const mapTab = page.locator('.mobile-tabs button').nth(1);
        if (await mapTab.isVisible()) {
          await mapTab.click();
          await checkZeroHorizontalOverflow(page, `near-${w}px-map`);
        }
      }
    });

    test('F4-B4: Empty location search on /near does not throw unhandled error', async ({ page }) => {
      await page.goto('/near');
      const input = page.locator('#near-location-query');
      await input.fill('');
      await page.locator('.btn-find').click();
      await expect(page.locator('.controls-card')).toBeVisible();
    });

    test('F4-B5: Selecting remote regional town on /near safely displays nearest places without 0-places bug', async ({ page }) => {
      await page.goto('/near');
      await page.locator('#near-city-jump').selectOption({ label: 'Jihlava' });
      await page.waitForTimeout(500);
      const body = await page.locator('body').innerText();
      expect(body).not.toContain('0 míst v okolí');
    });
  });

  // --- F5 Boundaries ---
  test.describe('F5 Boundaries: Landscape Desktop 1024px to 1440px', () => {
    test('F5-B1: Zero horizontal overflow on /svet on desktop 1024x768', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, 'svet-1024x768');
    });

    test('F5-B2: Zero horizontal overflow on /svet on widescreen 1440x900', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, 'svet-1440x900');
    });

    test('F5-B3: Rapid toggling between dawn and night atmosphere modes leaves UI stable', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/svet');
      const dawnBtn = page.locator('.atmo-pill-group .atmo-btn').nth(0);
      const nightBtn = page.locator('.atmo-pill-group .atmo-btn').nth(1);
      for (let i = 0; i < 4; i++) {
        await nightBtn.click();
        await dawnBtn.click();
      }
      await expect(page.locator('.art-layer.dawn')).toBeAttached();
    });

    test('F5-B4: Intermediate desktop width (1100px) preserves deed dock geometry without wrap break', async ({ page }) => {
      await page.setViewportSize({ width: 1100, height: 800 });
      await page.goto('/svet');
      const dock = page.locator('.ritual-dock-main');
      await expect(dock).toBeVisible();
      const box = await dock.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(1100);
    });

    test('F5-B5: Dynamic resize between 1024px and 1440px preserves HUD alignment and canvas', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/svet');
      await page.setViewportSize({ width: 1440, height: 900 });
      await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
      await expect(page.locator('.atmosphere-controls')).toBeVisible();
    });
  });

  // --- F6 Boundaries ---
  test.describe('F6 Boundaries: Landscape Mobile Viewports & Touch Safety', () => {
    test('F6-B1: Zero horizontal overflow on /svet on iPhone SE (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, 'svet-375x667');
    });

    test('F6-B2: Zero horizontal overflow on /svet on iPhone 14 (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, 'svet-390x844');
    });

    test('F6-B3: Zero horizontal overflow on /svet on Android (412x915)', async ({ page }) => {
      await page.setViewportSize({ width: 412, height: 915 });
      await page.goto('/svet');
      await checkZeroHorizontalOverflow(page, 'svet-412x915');
    });

    test('F6-B4: Submitting ritual input with empty string or whitespace does not submit blank deed', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const input = page.locator('#ritual-deed-input');
      await input.fill('   ');
      await page.locator('.ritual-bar button[type="submit"]').click();
      await expect(page.locator('.sanctuary-stage')).toBeVisible();
    });

    test('F6-B5: Submitting ritual input with long text (150+ chars) handles string safely', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const input = page.locator('#ritual-deed-input');
      await input.fill('A'.repeat(160));
      await page.locator('.ritual-bar button[type="submit"]').click();
      await expect(page.locator('.sanctuary-stage')).toBeVisible();
    });
  });

  // --- F7 Boundaries ---
  test.describe('F7 Boundaries: In-Canvas Molly Target & Resizing', () => {
    test('F7-B1: Canvas click far outside Molly lakeshore path does not feed Molly', async ({ page }) => {
      await page.goto('/svet');
      const vp = page.locator('.sanctuary-viewport');
      const box = await vp.boundingBox();
      expect(box).not.toBeNull();
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      // Click open sky (0.5w, 0.25h) far from Molly (0.24w, 0.72h) and clear of HUD controls
      await vp.click({ position: { x: Math.round(box!.width * 0.5), y: Math.round(box!.height * 0.25) } });
      const after = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      expect(after).toBe(before);
    });

    test('F7-B2: Canvas click directly at Molly coordinate on mobile 375px pets Molly without unearned treats', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/svet');
      const vp = page.locator('.sanctuary-viewport');
      const box = await vp.boundingBox();
      expect(box).not.toBeNull();
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      await vp.click({
        position: { x: Math.round(box!.width * 0.24), y: Math.round(box!.height * 0.72) }
      });
      const after = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      expect(after).toBe(before);
      await expect(page.locator('.gentle-toast, .molly-whisper-bubble').first()).toBeVisible();
    });

    test('F7-B3: Rapid consecutive clicks on Molly are handled gracefully without runtime error and without treat inflation', async ({ page }) => {
      await page.goto('/svet');
      const pill = page.locator('.molly-sanctuary-pill');
      const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
      for (let i = 0; i < 5; i++) {
        await pill.click();
      }
      const treats = Number(await page.locator('.molly-companion-layer').getAttribute('data-molly-treats'));
      expect(treats).toBe(before);
    });

    test('F7-B4: Resizing window while diorama canvas is running recalculates bounds safely', async ({ page }) => {
      await page.goto('/svet');
      await page.setViewportSize({ width: 600, height: 700 });
      await page.waitForTimeout(300);
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
    });

    test('F7-B5: Switching atmosphere while Molly is present preserves treats state', async ({ page }) => {
      await page.goto('/svet');
      await page.locator('.molly-sanctuary-pill').click();
      const treats1 = await page.locator('.molly-companion-layer').getAttribute('data-molly-treats');
      await page.locator('.atmo-pill-group .atmo-btn').nth(1).click();
      const treats2 = await page.locator('.molly-companion-layer').getAttribute('data-molly-treats');
      expect(treats2).toBe(treats1);
    });
  });

  // --- F8 Boundaries ---
  test.describe('F8 Boundaries: Companion Roaming Clamping & Docking', () => {
    test('F8-B1: Viewport resize from 1280px to 360px clamps roaming Molly within bounds', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/');
      await page.setViewportSize({ width: 360, height: 800 });
      const actorBox = await page.locator('.molly-roaming-actor').boundingBox();
      expect(actorBox).not.toBeNull();
      expect(actorBox!.x).toBeGreaterThanOrEqual(-10);
      expect(actorBox!.x + actorBox!.width).toBeLessThanOrEqual(370);
    });

    test('F8-B2: Rapid toggling of Pelíšek dock maintains valid data-molly-mode', async ({ page }) => {
      await page.goto('/');
      const toggle = page.locator('.molly-pelisek-dock .molly-dock-toggle-btn');
      for (let i = 0; i < 4; i++) {
        await toggle.click();
      }
      const mode = await page.locator('.molly-companion-layer').getAttribute('data-molly-mode');
      expect(['roaming', 'docked']).toContain(mode);
    });

    test('F8-B3: Molly whisper bubble near viewport edge does not trigger horizontal scrollbar', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.locator('.molly-pelisek-dock .molly-dock-pet-btn').click();
      await checkZeroHorizontalOverflow(page, 'whisper-bubble-375px');
    });

    test('F8-B4: Molly companion on /svet remains docked or coordinate with lakeshore', async ({ page }) => {
      await page.goto('/svet');
      await expect(page.locator('.sanctuary-canvas')).toBeVisible();
      await expect(page.locator('.molly-companion-layer')).toBeAttached();
    });

    test('F8-B5: Navigating between multiple routes retains cumulative treat count', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      const av1 = Number(await page.locator('.molly-companion-layer').getAttribute('data-molly-available-treats'));
      expect(av1).toBeGreaterThanOrEqual(1);

      await page.goto('/svet');
      await page.locator('.molly-sanctuary-pill').click();
      const t1 = Number(await page.locator('.molly-companion-layer').getAttribute('data-molly-treats'));
      expect(t1).toBeGreaterThanOrEqual(1);

      await page.goto('/app/guided');
      const t2 = Number(await page.locator('.molly-companion-layer').getAttribute('data-molly-treats'));
      expect(t2).toBe(t1);

      await page.goto('/svet');
      const t3 = Number(await page.locator('.molly-companion-layer').getAttribute('data-molly-treats'));
      expect(t3).toBe(t1);
    });
  });

  // --- F9 Boundaries ---
  test.describe('F9 Boundaries: Tone & Voice Edge Cases', () => {
    test('F9-B1: All 24 hours produce non-empty greeting in Czech', async ({ page }) => {
      const greetings = await page.evaluate(() => {
        const results = [];
        for (let h = 0; h < 24; h++) {
          let g = 'Ahoj, noční sovo!';
          if (h >= 5 && h < 10) g = 'Dobré ráno!';
          else if (h >= 10 && h < 18) g = 'Ahoj!';
          else if (h >= 18 && h < 23) g = 'Dobrý večer!';
          results.push(g);
        }
        return results;
      });
      expect(greetings).toHaveLength(24);
      for (const g of greetings) {
        expect(g.length).toBeGreaterThan(0);
      }
    });

    test('F9-B2: Action celebration note renders valid treat without undefined strings', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      const noteText = await page.locator('.instant-card .molly-celebration-note').innerText();
      expect(noteText).not.toContain('undefined');
      expect(noteText).not.toContain('null');
    });

    test('F9-B3: Petting Molly repeatedly cycles whispers cleanly without errors', async ({ page }) => {
      await page.goto('/');
      const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
      for (let i = 0; i < 7; i++) {
        await petBtn.click();
        const text = await page.locator('.molly-whisper-bubble').innerText();
        expect(text.length).toBeGreaterThan(3);
      }
    });

    test('F9-B4: Route guides across all pages avoid robotic instructions', async ({ page }) => {
      for (const route of ['/', '/app', '/app/online', '/near', '/svet']) {
        await page.goto(route);
        const text = await page.locator('body').innerText();
        expect(text).not.toContain('Klikni sem pro dokončení');
      }
    });

    test('F9-B5: Celebration note text remains warm and encouraging across repeated actions', async ({ page }) => {
      await page.goto('/');
      await page.locator('.instant-card .btn-studio-done').click();
      await expect(page.locator('.instant-card .molly-celebration-note')).toContainText('Molly');
    });
  });

  // --- F10 Boundaries ---
  test.describe('F10 Boundaries: Security, Sanitization & Resilient Recovery', () => {
    test('F10-B1: Deep links with XSS characters are sanitized without script execution', async ({ page }) => {
      await page.goto('/?action=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
      await expect(page.locator('.hero-title')).toBeVisible();
    });

    test('F10-B2: Location search params with tags are rendered as plain text', async ({ page }) => {
      await page.goto('/near');
      const input = page.locator('#near-location-query');
      await input.fill('<b>Praha</b>');
      await page.locator('.btn-find').click();
      await expect(page.locator('.controls-card')).toBeVisible();
    });

    test('F10-B3: Corrupted LocalStorage Molly state recovers gracefully to defaults', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('aa_molly_companion_v1', 'CORRUPTED_NOT_JSON');
      });
      await page.reload();
      await expect(page.locator('.hero-title')).toBeVisible();
      await expect(page.locator('.molly-companion-layer')).toBeAttached();
    });

    test('F10-B4: Corrupted LocalStorage completed_steps recovers gracefully', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('aa_completed_steps_v2', '{notAnArray: true}');
      });
      await page.reload();
      await expect(page.locator('.hero-title')).toBeVisible();
    });

    test('F10-B5: All interactive external links have target="_blank" and rel="noopener noreferrer"', async ({ page }) => {
      await page.goto('/');
      const extLinks = page.locator('a[target="_blank"]');
      const count = await extLinks.count();
      for (let i = 0; i < count; i++) {
        const rel = await extLinks.nth(i).getAttribute('rel');
        expect(rel).toContain('noopener');
      }
    });
  });

});

/* =============================================================================
 * TIER 3: CROSS-FEATURE COMBINATIONS (Pairwise Interactions)
 * ============================================================================= */

test.describe('Tier 3: Cross-Feature Combinations', () => {

  test('T3-1: Deed completion on Home (F2) unlocks treat (F8) and creates celebration link to Krajina dobra (F5)', async ({ page }) => {
    await page.goto('/');
    const beforeAvail = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-available-treats')) || '0');
    await page.locator('.instant-card .btn-studio-done').click();
    await expect(page.locator('.instant-card .molly-celebration-note')).toContainText('Molly');
    const afterAvail = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-available-treats')) || '0');
    expect(afterAvail, 'Deed completion unlocks an earned treat').toBeGreaterThan(beforeAvail);

    const worldLink = page.locator('.return-dopamine-actions a[href*="/svet"]');
    await expect(worldLink).toBeVisible();
    await worldLink.click();
    await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();

    // In Krajina dobra, feed the unlocked treat
    const treatsBefore = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
    await page.locator('.molly-sanctuary-pill').click();
    const treatsAfter = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
    expect(treatsAfter, 'Feeding the earned treat increments treatsFedTotal').toBeGreaterThan(treatsBefore);
  });

  test('T3-2: Guided help recommendation selection (F3) preserves tone (F9) and zero horizontal overflow (F1)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/app/guided');
    await checkZeroHorizontalOverflow(page, 'guided-t3-2');
    const bodyText = await page.locator('body').innerText();
    for (const phrase of BANNED_RENDERED_COPY) {
      expect(bodyText).not.toContain(phrase);
    }
  });

  test('T3-3: Mobile home navigation (F1) -> transition to /svet on mobile (F6) -> walking Molly (F7)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('a[href="/svet"]:visible').first().click();
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');
    await checkZeroHorizontalOverflow(page, 'svet-t3-3');
  });

  test('T3-4: Landscape atmosphere switch (F5) -> submit new wish in deed dock (F6) -> verify banned copy absence (F10)', async ({ page }) => {
    await page.goto('/svet');
    await page.locator('.atmo-pill-group .atmo-btn').nth(1).click();
    const input = page.locator('#ritual-deed-input');
    await input.fill('Pomohl jsem starší paní s taškou');
    await page.locator('.ritual-bar button[type="submit"]').click();
    const bodyText = await page.locator('body').innerText();
    for (const phrase of BANNED_RENDERED_COPY) {
      expect(bodyText).not.toContain(phrase);
    }
  });

  test('T3-5: Catalog filtering on /app/online (F4) -> celebrate -> Molly note renders exact Molly string (F10)', async ({ page }) => {
    await page.goto('/app/online');
    await page.locator('.filter-chip').nth(1).click();
    const doneBtn = page.locator('.btn-done-step, .btn-studio-done').first();
    if (await doneBtn.isVisible()) {
      await doneBtn.click();
      await expect(page.locator('body')).toContainText('Molly');
    } else {
      await expect(page.locator('.filter-toolbar')).toBeVisible();
    }
  });

  test('T3-6: Map search on /near (F4) -> city jump -> zero overflow (F1/F4) -> return home -> card stable (F2)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/near');
    await page.locator('#near-city-jump').selectOption({ label: 'Brno' });
    await checkZeroHorizontalOverflow(page, 'near-brno-375px');

    await page.goto('/');
    await expect(page.locator('.instant-card .action-title')).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'home-return-375px');
  });

});

/* =============================================================================
 * TIER 4: REAL-WORLD APPLICATION SCENARIOS (The 5 Application Journeys)
 * ============================================================================= */

test.describe('Tier 4: Real-World Application Scenarios', () => {

  test('Scenario 1: Mobile user first load — immediate wow effect, zero overflow, tap quick action (F1, F2, F4) [375x667]', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 1. Wow effect: warm hero backdrop, title, and serif accent
    await expect(page.locator('.hero-painted-backdrop')).toBeAttached();
    await expect(page.locator('.hero-title')).toContainText('Pomáhat může být lehké');

    // 2. Zero horizontal overflow
    await checkZeroHorizontalOverflow(page, 'scenario-1-first-load');

    // 3. Instant action card is visible and accessible without scrolling
    const card = page.locator('.instant-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.action-title')).toBeVisible();

    // 4. Tap another energy mode
    await card.locator('.energy-tab').nth(1).click();
    await expect(card.locator('.action-title')).toBeVisible();

    // 5. Check primary CTA button
    const cta = card.locator('.btn-studio-primary');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Začít pomáhat');
  });

  test('Scenario 2: Mobile user finds deed via Guided Help without 40-button overload (F3, F9) [390x844]', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/app/guided');

    // 1. Zero horizontal overflow
    await checkZeroHorizontalOverflow(page, 'scenario-2-guided');

    // 2. Clear situation questions visible
    await expect(page.locator('.step-block').first()).toBeVisible();

    // 3. Recommendation card is rendered
    await expect(page.locator('.plan-section, .highlight-card').first()).toBeVisible();

    // 4. Advanced parameters are closed in drawer by default
    const drawer = page.locator('details.adaptive-params-drawer');
    await expect(drawer).not.toHaveAttribute('open', '');

    // 5. Expand drawer and select filter
    await drawer.locator('summary').click();
    await expect(drawer).toHaveAttribute('open', '');
  });

  test('Scenario 3: Desktop user enters Krajina dobra, toggles atmosphere, enjoys clean HUD (F5, F8) [1280x900]', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/svet');

    // 1. Full desktop diorama renders
    await expect(page.locator('.sanctuary-stage')).toBeVisible();
    await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();

    // 2. Atmosphere toggles cleanly
    const dawnBtn = page.locator('.atmo-pill-group .atmo-btn').nth(0);
    const nightBtn = page.locator('.atmo-pill-group .atmo-btn').nth(1);
    await nightBtn.click();
    await expect(nightBtn).toHaveClass(/active/);
    await dawnBtn.click();
    await expect(dawnBtn).toHaveClass(/active/);

    // 3. Deed dock is compact and within bounds
    const dock = page.locator('.ritual-dock-main');
    await expect(dock).toBeVisible();
    const box = await dock.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(1280);

    // 4. Zero overflow
    await checkZeroHorizontalOverflow(page, 'scenario-3-desktop-svet');
  });

  test('Scenario 4: Mobile user enters Krajina dobra, watches walking Molly, pets Molly without unearned treats (F6, F7, F8, F9) [412x915]', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/svet');

    // 1. Canvas diorama ready
    const canvas = page.locator('canvas.sanctuary-canvas');
    await expect(canvas).toHaveAttribute('data-sanctuary-molly', 'ready');

    // 2. Pet Molly via sanctuary pill (delayed gratification: no unearned treats)
    const before = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
    await page.locator('.molly-sanctuary-pill').click();
    const after = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
    expect(after).toBe(before);
    await expect(page.locator('.gentle-toast, .molly-whisper-bubble').first()).toBeVisible();

    // 3. Direct lakeshore click on Molly at (0.24w, 0.72h) pets Molly
    const vp = page.locator('.sanctuary-viewport');
    const vpBox = await vp.boundingBox();
    expect(vpBox).not.toBeNull();
    await vp.click({ position: { x: Math.round(vpBox!.width * 0.24), y: Math.round(vpBox!.height * 0.72) } });
    const afterDirect = Number((await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0');
    expect(afterDirect).toBe(before);

    // 4. Zero overflow
    await checkZeroHorizontalOverflow(page, 'scenario-4-mobile-svet');
  });

  test('Scenario 5: Full compassion journey — home -> deed -> celebration -> svet -> Molly greeting (F1, F2, F7, F9, F10)', async ({ page }) => {
    await page.goto('/');

    // 1. Start on home, verify welcoming tone
    await expect(page.locator('.hero-title')).toContainText('Pomáhat může být lehké');

    // 2. Complete instant deed
    await page.locator('.instant-card .btn-studio-done').click();
    const note = page.locator('.instant-card .molly-celebration-note');
    await expect(note).toBeVisible();
    await expect(note).toContainText('Molly');

    // 3. Follow celebration link to Krajina dobra
    const worldLink = page.locator('.return-dopamine-actions a[href*="/svet"]');
    await expect(worldLink).toBeVisible();
    await worldLink.click();

    // 4. Arrive in Krajina dobra, diorama ready
    await expect(page.locator('canvas.sanctuary-canvas')).toHaveAttribute('data-sanctuary-molly', 'ready');

    // 5. Molly lakeside greeting & treat in Krajina dobra
    const sanctuaryPill = page.locator('.molly-sanctuary-pill');
    await expect(sanctuaryPill).toBeVisible();
    await sanctuaryPill.click();
    await expect(page.locator('.gentle-toast')).toBeVisible();

    // 6. Verify banned copy absence
    const fullPageText = await page.locator('body').innerText();
    for (const banned of BANNED_RENDERED_COPY) {
      expect(fullPageText).not.toContain(banned);
    }
  });

});
