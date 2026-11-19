import { test, expect, type Page } from '@playwright/test';

async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(450);
}

async function stubOsmTiles(page: Page) {
  await page.route('https://*.tile.openstreetmap.org/**', async (route) => {
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
      // route closed on navigation
    }
  });
}

async function detectMollyAndWhisperOverlaps(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    function isVisible(el: Element | null): el is HTMLElement {
      if (!el) return false;
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = getComputedStyle(cur);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    }

    const actors = Array.from(
      document.querySelectorAll('.molly-roaming-actor, .molly-whisper-bubble, .molly-dock-whisper')
    ).filter(isVisible);

    const targets = Array.from(
      document.querySelectorAll(
        [
          '.hero-overline',
          '.hero-title',
          '.hero-lead',
          '.hero-mobile-claim',
          '.hero-btn',
          '.page-header-kicker',
          '.section-overline',
          '.instant-card .btn-studio-primary',
          '.instant-card .btn-studio-done',
          '.instant-card .cycle-btn',
          '.instant-card .energy-tab',
          '.instant-card details.how-toggle summary',
          '.instant-card .how-details-content',
          '.instant-card .deed-stage',
          '.instant-card .in-situ-affirmation',
          '.instant-card .molly-celebration-note',
          '.instant-card .molly-inline-fed-badge',
          '.instant-card h2',
          '.instant-card p',
          '.deck-header-bar',
          '.deck-indicator',
          '.deck-nav-prev',
          '.deck-nav-next',
          '.bento-card h3',
          '.bento-card p',
          '.bento-card .bento-cta',
          '.bento-icon-wrap',
          '.crisis-trigger',
          '.site-footer .footer-brand',
          '.site-footer .footer-desc',
          '.site-footer .footer-heading'
        ].join(', ')
      )
    ).filter(isVisible);

    const hits: string[] = [];
    for (const actor of actors) {
      const ar = actor.getBoundingClientRect();
      const box = actor.classList.contains('molly-roaming-actor')
        ? {
          left: ar.left + ar.width * 0.1,
          right: ar.right - ar.width * 0.1,
          top: ar.top + ar.height * 0.08,
          bottom: ar.bottom - 1
        }
        : ar;
      for (const target of targets) {
        if (actor.contains(target) || target.contains(actor)) continue;
        if (target.closest('.molly-companion-layer, .molly-pelisek-dock')) continue;
        const tr = target.getBoundingClientRect();
        const w = Math.min(box.right, tr.right) - Math.max(box.left, tr.left);
        const h = Math.min(box.bottom, tr.bottom) - Math.max(box.top, tr.top);
        if (w > 2 && h > 2) {
          hits.push(`${actor.className.split(' ')[0]}<->${target.tagName}.${String(target.className).split(' ')[0]}(${Math.round(w * h)}px)`);
        }
      }
    }
    return hits;
  });
}

test.describe('Mobile & Tablet Experience Parity Polish (MT1-MT4)', () => {
  test('MT1: Mobile welcome renders flush Czech dawn backdrop, dynamic serif H1, subtitle, single-row glass pills on tall phones, and fold-safe CTA', async ({
    page
  }) => {
    const mobileViewports = [
      { width: 360, height: 800, expectHeroCtas: true, maxCtaBottom: 800 },
      { width: 375, height: 667, expectHeroCtas: false, maxCtaBottom: 667 },
      { width: 390, height: 844, expectHeroCtas: true, maxCtaBottom: 844 }
    ];

    for (const vp of mobileViewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const metrics = await page.evaluate(() => {
        const stage = document.querySelector('.hero-stage') as HTMLElement | null;
        const backdrop = document.querySelector('.hero-painted-backdrop') as HTMLElement | null;
        const h1 = document.querySelector('.hero-title') as HTMLElement | null;
        const serif = document.querySelector('.hero-serif') as HTMLElement | null;
        const claim = document.querySelector('.hero-mobile-claim') as HTMLElement | null;
        const ctas = document.querySelector('.hero-ctas') as HTMLElement | null;
        const ctaLinks = Array.from(document.querySelectorAll('.hero-ctas a.hero-btn')) as HTMLElement[];
        const primaryCta = document.querySelector('.instant-card .btn-studio-primary') as HTMLElement | null;
        const footer = document.querySelector('.site-footer') as HTMLElement | null;
        const sanctuaryCard = document.querySelector('.sanctuary-portal-card') as HTMLElement | null;

        return {
          stageTop: stage ? Math.round(stage.getBoundingClientRect().top) : 999,
          backdropH: backdrop ? Math.round(backdrop.getBoundingClientRect().height) : 0,
          backdropOp: backdrop ? parseFloat(getComputedStyle(backdrop).opacity) : 0,
          h1Visible: Boolean(h1 && getComputedStyle(h1).display !== 'none' && h1.getBoundingClientRect().height > 20),
          h1Text: h1?.innerText?.trim() || '',
          serifColor: serif ? getComputedStyle(serif).color : '',
          serifFont: serif ? getComputedStyle(serif).fontFamily : '',
          claimVisible: Boolean(claim && getComputedStyle(claim).display !== 'none'),
          claimBottom: claim ? Math.round(claim.getBoundingClientRect().bottom) : 999,
          ctasVisible: Boolean(ctas && getComputedStyle(ctas).display !== 'none'),
          ctaRowSameLine:
            ctaLinks.length === 2
              ? Math.abs(ctaLinks[0].getBoundingClientRect().top - ctaLinks[1].getBoundingClientRect().top) <= 4
              : false,
          ctaMinHeight:
            ctaLinks.length === 2
              ? Math.min(ctaLinks[0].getBoundingClientRect().height, ctaLinks[1].getBoundingClientRect().height)
              : 0,
          primaryCtaBottom: primaryCta ? Math.round(primaryCta.getBoundingClientRect().bottom) : 9999,
          footerBg: footer ? getComputedStyle(footer).backgroundColor : '',
          sanctuaryBgImg: sanctuaryCard ? getComputedStyle(sanctuaryCard).backgroundImage : '',
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
      });

      expect(metrics.stageTop, `${vp.width}x${vp.height} hero flush behind top-nav`).toBeLessThanOrEqual(0);
      expect(metrics.backdropH, `${vp.width}x${vp.height} lush dawn backdrop height >= 300`).toBeGreaterThanOrEqual(300);
      expect(metrics.backdropOp, `${vp.width}x${vp.height} backdrop opacity >= 0.84`).toBeGreaterThanOrEqual(0.84);
      expect(metrics.h1Visible, `${vp.width}x${vp.height} editorial H1 visible`).toBe(true);
      expect(metrics.h1Text).toContain('Pomáhat může být lehké.');
      expect(metrics.h1Text).toContain('Stačí 2 minuty dnes.');
      expect(metrics.serifColor).toBe('rgb(246, 231, 193)');
      expect(metrics.serifFont.toLowerCase()).toContain('instrument serif');
      expect(metrics.claimVisible).toBe(true);
      expect(metrics.primaryCtaBottom, `${vp.width}x${vp.height} CTA above fold`).toBeLessThanOrEqual(vp.maxCtaBottom);
      expect(metrics.footerBg, `${vp.width}x${vp.height} bohemian-mist footer`).toBe('rgb(230, 240, 234)');
      expect(metrics.sanctuaryBgImg, `${vp.width}x${vp.height} sanctuary sage-to-mist gradient`).toContain('linear-gradient');
      expect(metrics.overflowX, `${vp.width}x${vp.height} zero horizontal overflow`).toBe(false);

      if (vp.expectHeroCtas) {
        expect(metrics.ctasVisible, `${vp.width}x${vp.height} glass sanctuary hero CTAs visible`).toBe(true);
        expect(metrics.ctaRowSameLine, `${vp.width}x${vp.height} hero CTAs on single row`).toBe(true);
        expect(metrics.ctaMinHeight, `${vp.width}x${vp.height} hero CTAs >= 44px`).toBeGreaterThanOrEqual(43.5);
      } else {
        expect(metrics.ctasVisible, `${vp.width}x${vp.height} hero CTAs hidden on compact height`).toBe(false);
      }
    }

    // Dynamic serif + mobile subtitle both update on tab switches on mobile
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/');
    const tabs = page.locator('.energy-tabs [role="tab"]');
    await tabs.nth(2).click();
    await expect(page.locator('.hero-serif')).toHaveText('Stačí krátká procházka dnes.');
    await expect(page.locator('.hero-mobile-claim')).toHaveText('Konkrétní dobrý skutek v tvém okolí bez obrazovek.');
  });

  test('MT2: Tablet portrait (768x1024) & landscape (1024x768) match desktop dawn luminosity, side-by-side landscape hero, and zero overflow', async ({
    page
  }) => {
    // Portrait tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoHydrated(page, '/');
    const portrait = await page.evaluate(() => {
      const backdrop = document.querySelector('.hero-painted-backdrop') as HTMLElement | null;
      const card = document.querySelector('.instant-card') as HTMLElement | null;
      const cta = document.querySelector('.instant-card .btn-studio-primary') as HTMLElement | null;
      return {
        backdropOp: backdrop ? parseFloat(getComputedStyle(backdrop).opacity) : 0,
        cardWidth: card ? Math.round(card.getBoundingClientRect().width) : 0,
        ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : 9999,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    expect(portrait.backdropOp).toBeGreaterThanOrEqual(0.8);
    expect(portrait.cardWidth).toBeLessThanOrEqual(665);
    expect(portrait.ctaBottom).toBeLessThanOrEqual(1024);
    expect(portrait.overflowX).toBe(false);

    // Landscape tablet 1024x768: 2-column hero with CTA comfortably above fold
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoHydrated(page, '/');
    const landscape = await page.evaluate(() => {
      const backdrop = document.querySelector('.hero-painted-backdrop') as HTMLElement | null;
      const copy = document.querySelector('.hero-copy') as HTMLElement | null;
      const card = document.querySelector('.instant-card') as HTMLElement | null;
      const cta = document.querySelector('.instant-card .btn-studio-primary') as HTMLElement | null;
      const cr = copy?.getBoundingClientRect();
      const kr = card?.getBoundingClientRect();
      return {
        backdropOp: backdrop ? parseFloat(getComputedStyle(backdrop).opacity) : 0,
        sideBySide: Boolean(cr && kr && kr.left >= cr.right - 10 && Math.abs(kr.top - cr.top) < 80),
        ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : 9999,
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    expect(landscape.backdropOp).toBeGreaterThanOrEqual(0.8);
    expect(landscape.sideBySide, '1024x768 tablet hero renders 2-column side-by-side').toBe(true);
    expect(landscape.ctaBottom, '1024x768 primary CTA sits above 768px fold').toBeLessThanOrEqual(768);
    expect(landscape.overflowX).toBe(false);
  });

  test('MT3: Molly stays continuously visible and roaming across scroll heights on mobile & tablet with zero overlap', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const viewports = [
      { width: 360, height: 800 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 }
    ];
    const scrollStops = [0, 250, 600, 900, 1400];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      for (const y of scrollStops) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' as ScrollBehavior }), y);
        await page.waitForTimeout(380);

        const state = await page.evaluate(() => {
          const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
          const dock = document.querySelector('.molly-pelisek-dock') as HTMLElement | null;
          if (!actor || !dock) return null;
          const cs = getComputedStyle(actor);
          const ar = actor.getBoundingClientRect();
          return {
            actorDocked: actor.classList.contains('is-docked'),
            dockDocked: dock.classList.contains('is-docked'),
            opacity: cs.opacity,
            visibility: cs.visibility,
            left: ar.left,
            right: ar.right,
            top: ar.top,
            bottom: ar.bottom,
            width: ar.width,
            vw: window.innerWidth,
            vh: window.innerHeight
          };
        });

        expect(state, `${vp.width}x${vp.height} y=${y}`).not.toBeNull();
        expect(state!.actorDocked, `${vp.width}x${vp.height} y=${y} Molly visible`).toBe(false);
        expect(state!.dockDocked, `${vp.width}x${vp.height} y=${y} dock not auto-parked`).toBe(false);
        expect(state!.opacity, `${vp.width}x${vp.height} y=${y} opacity=1`).toBe('1');
        expect(state!.visibility, `${vp.width}x${vp.height} y=${y} visibility=visible`).toBe('visible');
        expect(state!.left, `${vp.width}x${vp.height} y=${y} inside left`).toBeGreaterThanOrEqual(0);
        expect(state!.right, `${vp.width}x${vp.height} y=${y} inside right`).toBeLessThanOrEqual(state!.vw);
        expect(state!.top, `${vp.width}x${vp.height} y=${y} inside top`).toBeGreaterThanOrEqual(0);
        expect(state!.bottom, `${vp.width}x${vp.height} y=${y} inside bottom`).toBeLessThanOrEqual(state!.vh);
        expect(state!.width, `${vp.width}x${vp.height} y=${y} visible cat size`).toBeGreaterThanOrEqual(40);

        const overlaps = await detectMollyAndWhisperOverlaps(page);
        expect(overlaps, `${vp.width}x${vp.height} y=${y} zero overlaps`).toEqual([]);
      }
    }
  });

  test('MT4: Molly Pelisek/Prochazka toggle, direct tap petting, whisper non-overlap, and multi-route visibility work on mobile & tablet', async ({
    page
  }) => {
    test.setTimeout(90_000);
    await stubOsmTiles(page);

    for (const vp of [
      { width: 360, height: 800 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 }
    ]) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      const actor = page.locator('.molly-roaming-actor');
      const toggleBtn = page.locator('.molly-dock-toggle-btn');
      const petBtn = page.locator('.molly-dock-pet-btn');

      // 1. Starts roaming & visible
      await expect(actor).not.toHaveClass(/is-docked/);

      // 2. Direct tap on Molly's rendered position pets her cleanly (without unearned treats)
      const actorBox = await actor.boundingBox();
      expect(actorBox, `${vp.width}x${vp.height} Molly boundingBox`).not.toBeNull();
      await page.mouse.click(actorBox!.x + actorBox!.width * 0.5, actorBox!.y + actorBox!.height * 0.5);
      await page.waitForTimeout(350);
      await expect(page.locator('.molly-whisper-bubble, .molly-dock-whisper').first()).toBeVisible();
      expect(await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')).toBe('0');
      expect(await detectMollyAndWhisperOverlaps(page), `${vp.width}x${vp.height} direct-tap overlaps`).toEqual([]);

      // 3. Header dock pet button shows whisper with zero overlaps on mobile AND tablet
      await petBtn.click();
      await page.waitForTimeout(350);
      await expect(page.locator('.molly-whisper-bubble, .molly-dock-whisper').first()).toBeVisible();
      expect(await detectMollyAndWhisperOverlaps(page), `${vp.width}x${vp.height} dock-pet overlaps`).toEqual([]);

      // 4. Pelisek toggle parks Molly, and Prochazka wakes her visibly back up
      await toggleBtn.click();
      await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
      await expect(actor).toHaveClass(/is-docked/);

      await toggleBtn.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'roaming');
      await expect(actor).not.toHaveClass(/is-docked/);

      // 5. Subpages keep Molly alive on non-svet routes and hand over cleanly on /svet
      for (const route of ['/app/online', '/app/guided', '/near', '/submit']) {
        await gotoHydrated(page, route);
        await expect(actor, `${vp.width}x${vp.height} ${route} Molly visible`).not.toHaveClass(/is-docked/);
      }
      await gotoHydrated(page, '/svet');
      await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-home', 'lake');
      await expect(actor).toHaveClass(/is-docked/);
    }
  });

  test('MT5: Dynamic deed completion (Before->After), expanded details, bento tap safety, boundary viewports (320x760, 681x900, 920x650), and reduced motion stay glitch-free', async ({
    page
  }) => {
    test.setTimeout(90_000);

    // 1. Mobile .cycle-link ("Jiny tip") never overlaps .energy-tabs, and 320x760 keeps CTAs single-row / fold-safe
    for (const vp of [
      { width: 320, height: 760 },
      { width: 360, height: 800 },
      { width: 375, height: 667 }
    ]) {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');
      const cardGeom = await page.evaluate(() => {
        const cycle = document.querySelector('.cycle-link')?.getBoundingClientRect();
        const tabs = document.querySelector('.energy-tabs')?.getBoundingClientRect();
        const cta = document.querySelector('.instant-card .btn-studio-primary')?.getBoundingClientRect();
        const overlap =
          cycle && tabs
            ? Math.max(0, Math.min(cycle.right, tabs.right) - Math.max(cycle.left, tabs.left)) *
            Math.max(0, Math.min(cycle.bottom, tabs.bottom) - Math.max(cycle.top, tabs.top))
            : 0;
        const heroBtns = Array.from(document.querySelectorAll('.hero-ctas a.hero-btn')).filter(
          (el) => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 1
        );
        const heroBtnsWrapped =
          heroBtns.length === 2
            ? Math.abs(heroBtns[0].getBoundingClientRect().top - heroBtns[1].getBoundingClientRect().top) > 4
            : false;
        return {
          cycleTabsOverlap: Math.round(overlap),
          ctaBottom: cta ? Math.round(cta.bottom) : 9999,
          heroBtnsWrapped
        };
      });
      expect(cardGeom.cycleTabsOverlap, `${vp.width}x${vp.height} Jiny tip never overlaps energy-tabs`).toBe(0);
      expect(cardGeom.heroBtnsWrapped, `${vp.width}x${vp.height} hero CTAs never wrap`).toBe(false);
      expect(cardGeom.ctaBottom, `${vp.width}x${vp.height} CTA above fold`).toBeLessThanOrEqual(vp.height);
    }

    // 2. Boundary tablets: 681x900 zero overlap with .hero-lead; 920x650 energy-tabs stay inside capsule
    await page.setViewportSize({ width: 681, height: 900 });
    await gotoHydrated(page, '/');
    expect(await detectMollyAndWhisperOverlaps(page), '681x900 zero overlap with .hero-lead').toEqual([]);

    await page.setViewportSize({ width: 920, height: 650 });
    await gotoHydrated(page, '/');
    const tabsFit = await page.evaluate(() => {
      const container = document.querySelector('.energy-tabs') as HTMLElement | null;
      const items = Array.from(document.querySelectorAll('.energy-tab')) as HTMLElement[];
      if (!container || items.length !== 4) return { ok: false, overflow: 999 };
      const cr = container.getBoundingClientRect();
      const maxRight = Math.max(...items.map((el) => el.getBoundingClientRect().right));
      return {
        ok: maxRight <= cr.right + 1 && container.scrollWidth <= container.clientWidth + 1,
        overflow: Math.round(maxRight - cr.right)
      };
    });
    expect(tabsFit.ok, `920x650 energy-tabs stay inside pill bar (overflow=${tabsFit.overflow})`).toBe(true);

    // 3. Dynamic 360x800 interactions: details open, deed start -> complete (Before->After payoff), feed Molly, flush hero backdrop with compact inflow whisper
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/');

    await page.locator('.instant-card details.how-toggle summary').click();
    await page.waitForTimeout(400);
    expect(await detectMollyAndWhisperOverlaps(page), '360x800 expanded details zero overlap').toEqual([]);
    await page.locator('.instant-card details.how-toggle summary').click();
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const a = document.querySelector('.instant-card .btn-studio-primary') as HTMLAnchorElement | null;
      if (a) a.addEventListener('click', (e) => e.preventDefault(), { once: true });
    });
    await page.locator('.instant-card .btn-studio-primary').click();
    await page.waitForTimeout(350);
    await page.locator('.instant-card .btn-studio-done').click();
    await page.waitForTimeout(450);

    const payoffState = await page.evaluate(() => {
      const stage = document.querySelector('.hero-stage')?.getBoundingClientRect();
      const deedStage = document.querySelector('.instant-card .deed-stage');
      const actor = document.querySelector('.molly-roaming-actor') as HTMLElement | null;
      const bubble = document.querySelector('.molly-whisper-bubble') as HTMLElement | null;
      const aRect = actor && !actor.classList.contains('is-docked') ? actor.getBoundingClientRect() : null;
      const bRect = bubble && getComputedStyle(bubble).display !== 'none' ? bubble.getBoundingClientRect() : null;
      const bubbleCatOverlap =
        aRect && bRect
          ? Math.max(0, Math.min(aRect.right, bRect.right) - Math.max(aRect.left, bRect.left)) *
          Math.max(0, Math.min(aRect.bottom, bRect.bottom) - Math.max(aRect.top, bRect.top))
          : 0;
      return {
        heroFlushTop: stage ? Math.round(stage.top) <= 0 : false,
        payoffMode: deedStage?.getAttribute('data-stage-mode') || '',
        actorTop: aRect ? Math.round(aRect.top) : 700,
        bubbleCatOverlap: Math.round(bubbleCatOverlap)
      };
    });
    expect(payoffState.payoffMode, 'Deed transitions to payoff (Before->After)').toBe('payoff');
    expect(payoffState.heroFlushTop, 'Hero backdrop stays flush behind top-nav + inflow whisper').toBe(true);
    expect(payoffState.actorTop, 'Molly stays grounded during payoff').toBeGreaterThanOrEqual(800 - 170);
    expect(payoffState.bubbleCatOverlap, 'Molly never overlaps compact inflow whisper').toBe(0);
    expect(await detectMollyAndWhisperOverlaps(page), '360x800 deed payoff zero overlap').toEqual([]);

    const feedBtn = page.locator('.btn-inline-feed-molly');
    if (await feedBtn.isVisible()) {
      await feedBtn.click();
      await page.waitForTimeout(450);
      expect(await detectMollyAndWhisperOverlaps(page), '360x800 after feeding Molly zero overlap').toEqual([]);
    }

    // 4. Tapping Molly over Bento cards pets her cleanly without navigating away; dragging near Molly does not accidentally pet her
    await gotoHydrated(page, '/');
    await page.evaluate(() => window.scrollTo({ top: 750, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(450);
    const bentoBox = await page.locator('.molly-roaming-actor').boundingBox();
    expect(bentoBox).not.toBeNull();
    // Simulate touch drag / scroll gesture starting on Molly: must NOT trigger whisper
    await page.mouse.move(bentoBox!.x + bentoBox!.width * 0.5, bentoBox!.y + bentoBox!.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(bentoBox!.x + bentoBox!.width * 0.5, bentoBox!.y + bentoBox!.height * 0.5 - 45, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    expect(await page.locator('.molly-whisper-bubble, .molly-dock-whisper').count()).toBe(0);

    // Direct tap on Molly over Bento card pets her without triggering link navigation
    const beforeTapUrl = page.url();
    const freshBentoBox = await page.locator('.molly-roaming-actor').boundingBox();
    expect(freshBentoBox).not.toBeNull();
    await page.mouse.click(
      freshBentoBox!.x + freshBentoBox!.width * 0.5,
      freshBentoBox!.y + freshBentoBox!.height * 0.5
    );
    await page.waitForTimeout(350);
    expect(page.url(), 'Direct tap on Molly over Bento card must not navigate away').toBe(beforeTapUrl);
    await expect(page.locator('.molly-whisper-bubble, .molly-dock-whisper').first()).toBeVisible();

    // 5. Reduced motion keeps Molly visible & non-overlapping on mobile
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/');
    await expect(page.locator('.molly-roaming-actor')).not.toHaveClass(/is-docked/);
    expect(await detectMollyAndWhisperOverlaps(page), '360x800 reduced-motion zero overlap').toEqual([]);
  });

  test('MT6: Round-2 craft — scrolled top-nav shield, zero-CLS / zero-drift anchored Molly whispers, untruncated mobile preview HUD, /near 1024x768 fold & auto-dock label, portrait alignment, mobile payoff & /app/online polish', async ({
    page
  }) => {
    test.setTimeout(90_000);
    await stubOsmTiles(page);

    // 1. 390x844 on /: transparent top-nav at y=0, opaque light shield at y=360, serene hero breathing room,
    //    untruncated preview HUD across Mám 2 min & Mám 15 min, 0px CLS on tap@0, 0px drift & Molly-anchored whisper at y=360
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page, '/');

    const home390 = await page.evaluate(() => {
      const topNav = document.querySelector('.top-nav') as HTMLElement;
      const capsule = document.querySelector('.nav-capsule')!.getBoundingClientRect();
      const overline = document.querySelector('.hero-overline')!.getBoundingClientRect();
      const heroCopy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const card = document.querySelector('.instant-card')!.getBoundingClientRect();
      const cta = document.querySelector('.instant-card .btn-studio-primary')!.getBoundingClientRect();
      const hud = document.querySelector('.preview-hud') as HTMLElement;
      const pSpan = document.querySelector('.preview-promise-pill > span:last-child') as HTMLElement;
      const sSpan = document.querySelector('.preview-status-pill > span:last-child') as HTMLElement;
      return {
        hasShieldAtTop: topNav.classList.contains('shield-light') || topNav.classList.contains('shield-dark'),
        overlineGap: Math.round(overline.top - capsule.bottom),
        heroCopyY: Math.round(heroCopy.top),
        cardY: Math.round(card.top),
        ctaBottom: Math.round(cta.bottom),
        hudBg: getComputedStyle(hud).backgroundColor,
        pOverflow: pSpan.scrollWidth > pSpan.clientWidth + 1,
        sOverflow: sSpan.scrollWidth > sSpan.clientWidth + 1
      };
    });
    expect(home390.hasShieldAtTop, '390x844 top-nav stays transparent at scrollY=0').toBe(false);
    expect(home390.overlineGap, '390x844 serene breathing room below header capsule').toBeGreaterThanOrEqual(14);
    expect(home390.ctaBottom, '390x844 primary CTA above fold').toBeLessThanOrEqual(844);
    expect(home390.hudBg, '390x844 preview HUD transparent (no black pills)').toBe('rgba(0, 0, 0, 0)');
    expect(home390.pOverflow, '390x844 Mám 2 min promise has zero mid-word truncation').toBe(false);
    expect(home390.sOverflow, '390x844 Mám 2 min status has zero mid-word truncation').toBe(false);

    // Direct tap on Molly at scrollY=0: 0px CLS, anchored next to Molly, 0 overlaps
    const actorBox0 = await page.locator('.molly-roaming-actor').boundingBox();
    expect(actorBox0).not.toBeNull();
    await page.mouse.click(actorBox0!.x + actorBox0!.width * 0.5, actorBox0!.y + actorBox0!.height * 0.5);
    await page.waitForTimeout(250);
    const afterTap0 = await page.evaluate(() => {
      const heroCopy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const card = document.querySelector('.instant-card')!.getBoundingClientRect();
      const whisper = document.querySelector('.molly-whisper-bubble')!.getBoundingClientRect();
      const actor = document.querySelector('.molly-roaming-actor')!.getBoundingClientRect();
      return {
        heroCopyY: Math.round(heroCopy.top),
        cardY: Math.round(card.top),
        whisperVertDistToMolly: Math.round(Math.abs(whisper.bottom - actor.bottom)),
        inflowCount: document.querySelectorAll('.molly-whisper-bubble.is-compact-inflow').length
      };
    });
    expect(afterTap0.inflowCount, 'No in-flow whisper element pushing layout').toBe(0);
    expect(afterTap0.heroCopyY, '0px hero CLS on Molly tap at scrollY=0').toBe(home390.heroCopyY);
    expect(afterTap0.cardY, '0px card CLS on Molly tap at scrollY=0').toBe(home390.cardY);
    expect(afterTap0.whisperVertDistToMolly, 'Whisper anchored close to Molly at scrollY=0').toBeLessThanOrEqual(80);
    expect(await detectMollyAndWhisperOverlaps(page), '390x844 tap@0 zero overlaps').toEqual([]);

    // Check Mám 15 min tab preview HUD has zero truncation too
    await page.locator('.energy-tabs [role="tab"]').nth(1).click();
    await page.waitForTimeout(150);
    const focusHud = await page.evaluate(() => {
      const pSpan = document.querySelector('.preview-promise-pill > span:last-child') as HTMLElement;
      const sSpan = document.querySelector('.preview-status-pill > span:last-child') as HTMLElement;
      return {
        pOverflow: pSpan.scrollWidth > pSpan.clientWidth + 1,
        sOverflow: sSpan.scrollWidth > sSpan.clientWidth + 1
      };
    });
    expect(focusHud.pOverflow, '390x844 Mám 15 min promise has zero mid-word truncation').toBe(false);
    expect(focusHud.sOverflow, '390x844 Mám 15 min status has zero mid-word truncation').toBe(false);

    // Mid-scroll over woodland (y=180) keeps dark woodland shield; scrolling past hero wave (y=360)
    // switches cleanly to opaque light shield + solid white capsule, and repeated taps cause 0px scroll drift
    await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(200);
    await expect(page.locator('.top-nav')).toHaveClass(/shield-dark/);

    await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(420);
    await expect(page.locator('.top-nav')).toHaveClass(/shield-light/);
    expect(
      await page.evaluate(() => getComputedStyle(document.querySelector('.nav-capsule')!).backgroundColor),
      'Scrolled nav-capsule stays solid white (no ghost text bleed)'
    ).toBe('rgb(255, 255, 255)');
    const syBefore = await page.evaluate(() => window.scrollY);
    for (let tap = 0; tap < 3; tap++) {
      const ab = await page.locator('.molly-roaming-actor').boundingBox();
      expect(ab).not.toBeNull();
      await page.mouse.click(ab!.x + ab!.width * 0.5, ab!.y + ab!.height * 0.5);
      await page.waitForTimeout(220);
    }
    const afterScrollTaps = await page.evaluate(() => {
      const whisper = document.querySelector('.molly-whisper-bubble')!.getBoundingClientRect();
      const actor = document.querySelector('.molly-roaming-actor')!.getBoundingClientRect();
      const catOverlap =
        Math.max(0, Math.min(whisper.right, actor.right) - Math.max(whisper.left, actor.left)) *
        Math.max(0, Math.min(whisper.bottom, actor.bottom) - Math.max(whisper.top, actor.top));
      return {
        scrollY: window.scrollY,
        whisperToMollyGap: Math.round(actor.top - whisper.bottom),
        whisperCenterToMollyY: Math.round(Math.abs((whisper.top + whisper.bottom) / 2 - (actor.top + actor.bottom) / 2)),
        catOverlap: Math.round(catOverlap)
      };
    });
    expect(afterScrollTaps.scrollY, '0px scroll-anchoring drift across repeated Molly taps').toBe(syBefore);
    expect(afterScrollTaps.catOverlap, 'Scrolled whisper never overlaps Molly').toBe(0);
    expect(afterScrollTaps.whisperCenterToMollyY, 'Scrolled whisper stays anchored near Molly on same card (not detached mid-viewport)').toBeLessThanOrEqual(210);
    expect(await detectMollyAndWhisperOverlaps(page), '390x844 tap@360 zero overlaps').toEqual([]);

    // 1b. 360x800 & 390x812 phones keep clear breathing room below floating header capsule
    for (const tallVp of [
      { width: 360, height: 800 },
      { width: 390, height: 812 }
    ]) {
      await page.setViewportSize(tallVp);
      await gotoHydrated(page, '/');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
      const gap = await page.evaluate(() => {
        const cap = document.querySelector('.nav-capsule')!.getBoundingClientRect();
        const ov = document.querySelector('.hero-overline')!.getBoundingClientRect();
        return Math.round(ov.top - cap.bottom);
      });
      expect(gap, `${tallVp.width}x${tallVp.height} hero-overline clears header capsule cleanly`).toBeGreaterThanOrEqual(10);
    }

    // 2. 375x667 on /: untruncated preview HUD, balanced tab spacing, CTA above fold
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/');
    const se375 = await page.evaluate(() => {
      const pSpan = document.querySelector('.preview-promise-pill > span:last-child') as HTMLElement;
      const sSpan = document.querySelector('.preview-status-pill > span:last-child') as HTMLElement;
      const tabs = Array.from(document.querySelectorAll('.energy-tab')).map((e) => e.getBoundingClientRect());
      const icon2 = document.querySelectorAll('.energy-tab')[1]?.querySelector('svg')?.getBoundingClientRect();
      const cta = document.querySelector('.instant-card .btn-studio-primary')!.getBoundingClientRect();
      return {
        pOverflow: pSpan.scrollWidth > pSpan.clientWidth + 1,
        sOverflow: sSpan.scrollWidth > sSpan.clientWidth + 1,
        pillToIconGap: icon2 ? Math.round(icon2.left - tabs[0].right) : 0,
        ctaBottom: Math.round(cta.bottom)
      };
    });
    expect(se375.pOverflow, '375x667 preview promise has zero mid-word truncation').toBe(false);
    expect(se375.sOverflow, '375x667 preview status has zero mid-word truncation').toBe(false);
    expect(se375.pillToIconGap, '375x667 active tab pill clears next tab telescope icon').toBeGreaterThanOrEqual(7);
    expect(se375.ctaBottom, '375x667 primary CTA remains above 667px fold').toBeLessThanOrEqual(667);

    // 3. 768x1024 portrait tablet: .hero-copy aligns cleanly with centered .instant-card column
    await page.setViewportSize({ width: 768, height: 1024 });
    await gotoHydrated(page, '/');
    const align768 = await page.evaluate(() => {
      const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const card = document.querySelector('.instant-card')!.getBoundingClientRect();
      return {
        leftDiff: Math.abs(Math.round(copy.left - card.left)),
        rightDiff: Math.abs(Math.round(copy.right - card.right))
      };
    });
    expect(align768.leftDiff, '768x1024 hero-copy left aligns with instant-card').toBeLessThanOrEqual(2);
    expect(align768.rightDiff, '768x1024 hero-copy right aligns with instant-card').toBeLessThanOrEqual(2);

    // 4. 390x844 mobile payoff: cohesive dark emerald .payoff-head, Dát Molly pamlsek well inside viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page, '/');
    await page.evaluate(() => {
      const a = document.querySelector('.instant-card .btn-studio-primary') as HTMLAnchorElement | null;
      if (a) a.addEventListener('click', (e) => e.preventDefault(), { once: true });
    });
    await page.locator('.instant-card .btn-studio-primary').click();
    await page.waitForTimeout(250);
    const activeHeadBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.card-effect-head') as HTMLElement).backgroundColor
    );
    expect(activeHeadBg, '390x844 active-stage header blends in dark emerald (no stark pale bar)').not.toBe(
      'rgb(237, 242, 238)'
    );
    await page.locator('.instant-card .btn-studio-done').click();
    await page.waitForTimeout(450);
    const payoff390 = await page.evaluate(() => {
      const head = document.querySelector('.payoff-head') as HTMLElement;
      const feed = document.querySelector('.btn-inline-feed-molly')!.getBoundingClientRect();
      return {
        headBg: getComputedStyle(head).backgroundColor,
        feedBottom: Math.round(feed.bottom)
      };
    });
    expect(payoff390.headBg, '390x844 payoff-head blends smoothly with dark canvas (no stark pale bar)').not.toBe('rgb(237, 242, 238)');
    expect(payoff390.feedBottom, '390x844 Dát Molly pamlsek sits comfortably above bottom edge').toBeLessThanOrEqual(836);

    // 5. /near @ 1024x768 & 768x1024: 2-row compact controls-card at 1024x768, first PlaceCard primary CTA above 768px fold,
    //    single utility row on 768x1024, and non-hero top-nav has light shield
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoHydrated(page, '/near');
    await expect(page.locator('.top-nav')).toHaveClass(/shield-light/);
    const near1024 = await page.evaluate(() => {
      const top = document.querySelector('.controls-top')!.getBoundingClientRect();
      const util = document.querySelector('.controls-utility-row')!.getBoundingClientRect();
      const cta = document.querySelector('.place-card .pc-btn.primary')!.getBoundingClientRect();
      return {
        sameTopRow: Math.abs(top.top - util.top) <= 6,
        ctaBottom: Math.round(cta.bottom)
      };
    });
    expect(near1024.sameTopRow, '/near 1024x768 merges utility controls into top row').toBe(true);
    expect(near1024.ctaBottom, '/near 1024x768 first place primary CTA completely above 768px fold').toBeLessThanOrEqual(760);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(250);
    const near768SameUtilityRow = await page.evaluate(() => {
      const summary = document.querySelector('.near-filters-summary')?.getBoundingClientRect();
      const btns = Array.from(
        document.querySelectorAll('.controls-utility-row > div button, .controls-utility-row > div a')
      ).map((el) => el.getBoundingClientRect());
      return Boolean(summary && btns.length >= 2 && btns.every((b) => Math.abs(summary.top - b.top) <= 6));
    });
    expect(near768SameUtilityRow, '/near 768x1024 keeps Filtrovat + utility buttons on a single row').toBe(true);

    // 6. /app/online @ 390x844: crisp uniform 4-side border on "Co to přinese:", Molly never beside 2nd card h2,
    //    auto-parked Molly dock button shows distinct resting state, clicking it produces zero-overlap whisper,
    //    and scrolling into open space wakes Molly and auto-dismisses the crowded whisper
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await gotoHydrated(page, '/app/online');
    await expect(page.locator('.top-nav')).toHaveClass(/shield-light/);
    const online390 = await page.evaluate(() => {
      const imp = document.querySelector('.directory-card .action-impact-summary') as HTMLElement;
      const cs = getComputedStyle(imp);
      const actor = document.querySelector('.molly-roaming-actor') as HTMLElement;
      const isParked = actor.classList.contains('is-docked');
      const ar = actor.getBoundingClientRect();
      const h2 = document.querySelectorAll('.directory-card')[1]?.querySelector('h2')?.getBoundingClientRect();
      const besideSecondH2 = Boolean(
        !isParked && h2 && ar.bottom > h2.top - 4 && ar.top < h2.bottom + 4
      );
      const toggleBtn = document.querySelector('.molly-dock-toggle-btn') as HTMLElement;
      return {
        borders: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
        isParked,
        besideSecondH2,
        toggleText: toggleBtn.textContent?.trim() || '',
        toggleAriaLabel: toggleBtn.getAttribute('aria-label') || '',
        togglePressed: toggleBtn.getAttribute('aria-pressed') || '',
        hasAutoParkedClass: toggleBtn.classList.contains('is-auto-parked')
      };
    });
    expect(online390.borders, '/app/online impact summary has crisp 1px border on all 4 sides').toEqual([
      '1px',
      '1px',
      '1px',
      '1px'
    ]);
    expect(online390.besideSecondH2, '/app/online Molly never parks beside 2nd card h2').toBe(false);
    if (online390.isParked) {
      expect(online390.toggleText, 'Auto-parked dock toggle shows V pelíšku').toBe('V pelíšku');
      expect(online390.togglePressed, 'Auto-parked dock toggle has aria-pressed=true').toBe('true');
      expect(online390.hasAutoParkedClass, 'Auto-parked dock toggle shows distinct resting visual style').toBe(true);
      expect(online390.toggleAriaLabel, 'Auto-parked dock toggle aria-label reflects resting state').toContain(
        'odpočívá v pelíšku'
      );

      await page.locator('.molly-dock-toggle-btn').click();
      await page.waitForTimeout(300);
      await expect(page.locator('.molly-whisper-bubble')).toBeVisible();
      expect(
        await detectMollyAndWhisperOverlaps(page),
        '/app/online auto-parked wake whisper never overlaps kicker/h1/cards'
      ).toEqual([]);

      await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' as ScrollBehavior }));
      await page.waitForTimeout(400);
      await expect(page.locator('.molly-roaming-actor')).not.toHaveClass(/is-docked/);
      await expect(page.locator('.molly-whisper-bubble')).toHaveCount(0);
    }
  });

  test('MT7: Rule 2.3 — subtle preview transformation lure across hover, keyboard focus-visible, tap, idle pause, details toggle, card switch, visibilitychange, and reduced motion (desktop + mobile) with zero CLS', async ({
    page
  }) => {
    test.setTimeout(90_000);

    // 1. Desktop 1440x900: rest -> hover -> keyboard focus-visible -> tap -> details toggle -> card switch -> visibilitychange
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');

    const stage = page.locator('.instant-card .deed-preview-stage').first();
    const statusPill = stage.locator('.preview-status-pill').first();
    const cta = page.locator('.instant-card .btn-studio-primary').first();

    const measureGeom = () =>
      page.evaluate(() => {
        const s = document.querySelector('.instant-card .deed-preview-stage') as HTMLElement;
        const c = document.querySelector('.instant-card .btn-studio-primary') as HTMLElement;
        const hud = s.querySelector('.preview-hud') as HTMLElement;
        const canvas = s.querySelector('canvas.stage-canvas') as HTMLCanvasElement;
        const sr = s.getBoundingClientRect();
        const cr = c.getBoundingClientRect();
        return {
          lure: s.getAttribute('data-preview-lure') || '',
          isPrimed: s.classList.contains('is-primed'),
          isTeased: s.classList.contains('is-teased'),
          stageH: Math.round(sr.height),
          ctaTop: Math.round(cr.top),
          hudBg: getComputedStyle(hud).backgroundColor,
          mollyMini: canvas.getAttribute('data-molly-mini')
        };
      });

    const rest = await measureGeom();
    expect(rest.lure).toBe('rest');
    expect(rest.isPrimed).toBe(false);
    expect(rest.isTeased).toBe(false);
    expect(rest.hudBg).toBe('rgba(0, 0, 0, 0)');
    expect(rest.mollyMini).toBeNull();

    // Hover over preview stage -> calm curiosity copy, 0px CLS
    await stage.hover();
    await page.waitForTimeout(120);
    const hoverState = await measureGeom();
    expect(hoverState.lure).toBe('hover');
    expect(hoverState.isPrimed).toBe(true);
    expect(hoverState.stageH).toBe(rest.stageH);
    expect(hoverState.ctaTop).toBe(rest.ctaTop);
    await expect(statusPill).toContainText('Po splnění scéna ožije');

    // Leave hover -> returns cleanly to rest
    await page.mouse.move(10, 10);
    await page.waitForTimeout(120);
    expect((await measureGeom()).lure).toBe('rest');

    // Keyboard :focus-visible on CTA -> primes stage & shows transformation copy
    await page.locator('.instant-card details.how-toggle summary').focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120);
    const focusState = await measureGeom();
    expect(focusState.lure).toBe('focus');
    expect(focusState.isPrimed).toBe(true);
    await expect(statusPill).toContainText('Po splnění scéna ožije');

    // Blur keyboard focus
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur?.());
    await page.waitForTimeout(100);
    expect((await measureGeom()).lure).toBe('rest');

    // Tap/click on .deed-preview-stage -> playful nudge cue, 0px CLS
    await stage.click();
    await page.waitForTimeout(120);
    const tapState = await measureGeom();
    expect(tapState.lure).toBe('tap');
    expect(tapState.isPrimed).toBe(true);
    expect(tapState.stageH).toBe(rest.stageH);
    await expect(statusPill).toContainText('Klikni níže — scéna ožije');

    // Open "Jak to funguje" -> triggers calm details tease
    await page.mouse.move(10, 10);
    await page.locator('.instant-card details.how-toggle summary').click();
    await page.waitForTimeout(150);
    const detailsState = await measureGeom();
    expect(detailsState.lure).toBe('details');
    expect(detailsState.isTeased).toBe(true);
    expect(detailsState.mollyMini).toBeNull();
    await expect(statusPill).toContainText('Po akci se scéna promění');
    await page.locator('.instant-card details.how-toggle summary').click();

    // Switch card -> triggers calm switch tease after short settle delay
    await page.locator('.deck-nav-next').first().click();
    await page.waitForTimeout(420);
    const switchState = await measureGeom();
    expect(switchState.lure).toBe('switch');
    expect(switchState.isTeased).toBe(true);
    await expect(statusPill).toContainText('Po akci se scéna promění');

    // Simulate returning to browser tab (visibilitychange hidden -> visible)
    await page.waitForTimeout(2350);
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(150);
    const visState = await measureGeom();
    expect(visState.lure).toBe('visibility');
    expect(visState.isTeased).toBe(true);
    await expect(statusPill).toContainText('Po akci se scéna promění');

    // 2. Mobile 390x844 (touch device without hover): idle reading pause fires automatic lure with 0px CLS & zero truncation
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHydrated(page, '/');
    const mobRest = await measureGeom();
    expect(mobRest.lure).toBe('rest');

    await page.waitForTimeout(4050);
    const mobIdle = await page.evaluate(() => {
      const s = document.querySelector('.instant-card .deed-preview-stage') as HTMLElement;
      const c = document.querySelector('.instant-card .btn-studio-primary') as HTMLElement;
      const hud = s.querySelector('.preview-hud') as HTMLElement;
      const sSpan = s.querySelector('.preview-status-pill > span:last-child') as HTMLElement;
      const canvas = s.querySelector('canvas.stage-canvas') as HTMLCanvasElement;
      return {
        lure: s.getAttribute('data-preview-lure') || '',
        isTeased: s.classList.contains('is-teased'),
        stageH: Math.round(s.getBoundingClientRect().height),
        ctaTop: Math.round(c.getBoundingClientRect().top),
        hudBg: getComputedStyle(hud).backgroundColor,
        sText: sSpan.textContent?.trim() || '',
        sOverflow: sSpan.scrollWidth > sSpan.clientWidth + 1,
        mollyMini: canvas.getAttribute('data-molly-mini')
      };
    });
    expect(mobIdle.lure).toBe('idle');
    expect(mobIdle.isTeased).toBe(true);
    expect(mobIdle.sText).toBe('Po akci se scéna promění');
    expect(mobIdle.stageH, 'Mobile idle lure causes 0px stage height CLS').toBe(mobRest.stageH);
    expect(mobIdle.ctaTop, 'Mobile idle lure causes 0px CTA shift').toBe(mobRest.ctaTop);
    expect(mobIdle.hudBg).toBe('rgba(0, 0, 0, 0)');
    expect(mobIdle.sOverflow, 'Mobile idle lure caption has zero truncation').toBe(false);
    expect(mobIdle.mollyMini).toBeNull();
    expect(await detectMollyAndWhisperOverlaps(page), 'Mobile idle lure zero Molly overlaps').toEqual([]);

    // 3. Reduced motion on mobile 390x844: suppresses unsolicited idle pulse while keeping direct tap hint
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHydrated(page, '/');
    await page.waitForTimeout(4050);
    const reducedIdle = await measureGeom();
    expect(reducedIdle.lure, 'Reduced motion suppresses automatic idle lure').toBe('rest');
    expect(reducedIdle.isTeased).toBe(false);

    await page.locator('.instant-card .deed-preview-stage').first().click();
    await page.waitForTimeout(100);
    const reducedTap = await measureGeom();
    expect(reducedTap.lure, 'Reduced motion still honors direct tap cue').toBe('tap');
    await expect(page.locator('.instant-card .preview-status-pill').first()).toContainText('Klikni níže — scéna ožije');
  });
});

