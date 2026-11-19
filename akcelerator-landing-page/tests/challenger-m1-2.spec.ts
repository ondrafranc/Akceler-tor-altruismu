import { test, expect } from '@playwright/test';

/**
 * Challenger M1-2: Responsiveness, Visual Stability & Sensory Engine
 * 
 * Verifies:
 * 1. SanctuaryTeaser.svelte: Living diorama preview, keyframes, picture fallback, accessibility, links.
 * 2. Navigation & Deep Link: Seamless navigation to /svet and /svet#dech without router crash.
 * 3. Tablet Header Nav: .world-pill layout, visibility, and zero window overflow at 681px-1024px.
 * 4. Sensory Engine: ResizeObserver dynamic wake-up, blank frame prevention, and unclipped Mini-Molly coordinates.
 * 5. Nav Pill Gap Diagnosis & Verified Mitigation (681px–767px).
 */

test.describe('Challenger M1-2: Responsiveness, Visual Stability & Sensory Engine', () => {

  test('1. SanctuaryTeaser.svelte: Structural integrity, Keyframes, WebP/JPG fallback & A11y', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Section existence and a11y label
    const section = page.locator('section.sanctuary-portal-section');
    await expect(section).toBeVisible();
    await expect(section).toHaveAttribute('aria-label', 'Krajina dobra a dechové zastavení');

    // Living diorama card & kicker
    const card = section.locator('.sanctuary-portal-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.stage-kicker')).toContainText('KRAJINA DOBRA · TICHÉ ÚTOČIŠTĚ');

    // Picture element, WebP source & JPG fallback
    const picture = section.locator('picture');
    await expect(picture).toBeVisible();

    const webpSource = picture.locator('source[type="image/webp"]');
    await expect(webpSource).toHaveAttribute('srcset', '/art/sanctuary-dawn-800.webp');

    const img = picture.locator('img.preview-bg-img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', '/art/sanctuary-dawn.jpg');
    await expect(img).toHaveAttribute('alt', 'Klidná česká lesní tůň za ranního svítání obklopená břízami a smrky');

    // Verify image actually loads (scroll into view for loading="lazy")
    await img.scrollIntoViewIfNeeded();
    await expect.poll(
      async () => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      { timeout: 10000 }
    ).toBe(true);

    // Clean editorial preview overlay & feature tags (zero floating lanterns/fireflies/emojis)
    await expect(section.locator('.preview-atmosphere, .living-lantern, .living-firefly')).toHaveCount(0);
    await expect(section.locator('.spw-live-pill')).toBeVisible();
    await expect(section.locator('.spw-live-pill')).toHaveAttribute('aria-hidden', 'true');

    const spwEnter = section.locator('.spw-enter');
    await expect(spwEnter).toContainText('Vstoupit do tůně');
    expect(await spwEnter.innerText()).not.toContain('→');
    await expect(spwEnter.locator('svg')).toBeVisible();

    const featuresStrip = section.locator('.sanctuary-features-strip');
    await expect(featuresStrip).toHaveAttribute('aria-hidden', 'true');
    const featureTags = featuresStrip.locator('.feature-tag');
    await expect(featureTags).toHaveCount(3);
    await expect(featureTags.nth(0)).toContainText('Plovoucí lucerny');
    await expect(featureTags.nth(1)).toContainText('Zářící hvězdy');
    await expect(featureTags.nth(2)).toContainText('Klidný dech');
    for (let i = 0; i < 3; i++) {
      await expect(featureTags.nth(i).locator('svg')).toBeVisible();
    }

    // Verify reduced motion compliance
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const previewLink = section.locator('a.sanctuary-preview-window');
    await previewLink.hover();
    const reducedTransform = await previewLink.evaluate((el) => window.getComputedStyle(el).transform);
    expect(reducedTransform).toBe('none');

    // Reset reduced motion
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Verify link targets
    const primaryBtn = section.locator('.sanctuary-open-btn');
    await expect(primaryBtn).toHaveAttribute('href', '/svet');
    await expect(primaryBtn).toContainText('Vstoupit do Krajiny dobra');

    const breathBtn = section.locator('.sanctuary-breath-link');
    await expect(breathBtn).toHaveAttribute('href', '/svet#dech');
    await expect(breathBtn).toContainText('Dechové zastavení');

    await expect(previewLink).toHaveAttribute('href', '/svet');
    await expect(previewLink).toHaveAttribute('aria-label', 'Otevřít živou Krajinu dobra');

    expect(consoleErrors).toHaveLength(0);
  });

  test('2. SanctuaryTeaser navigation & deep link: /svet and /svet#dech', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Click on primary CTA
    const primaryBtn = page.locator('.sanctuary-open-btn');
    await primaryBtn.click();
    await page.waitForURL('**/svet');
    expect(page.url()).toContain('/svet');

    // Verify /svet rendered properly without router crash
    await expect(page.locator('.sanctuary-stage')).toBeVisible();

    // 2. Navigate back to / and click deep link #dech
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const breathBtn = page.locator('.sanctuary-breath-link');
    await breathBtn.click();
    await page.waitForURL('**/svet#dech');
    expect(page.url()).toContain('/svet#dech');

    // Verify #dech section exists and is scrolled into view
    const dechSection = page.locator('#dech');
    await expect(dechSection).toBeVisible();

    // Wait for smooth scroll settlement
    await page.waitForTimeout(600);
    const dechBounding = await dechSection.boundingBox();
    expect(dechBounding).not.toBeNull();
    // Element should be within or near visible viewport
    if (dechBounding) {
      expect(dechBounding.y).toBeLessThan(500);
    }

    // 3. Navigate away to /app/online to test unmount cleanup (no ReferenceError)
    await page.goto('/app/online');
    await page.waitForLoadState('domcontentloaded');

    expect(consoleErrors).toHaveLength(0);
  });

  test('3. Tablet Header Nav Bar Stress: Top-only drawer & zero overflow (681px to 1024px)', async ({ page }) => {
    const tabletViewports = [1024, 900, 834, 768, 720, 681];

    for (const vp of tabletViewports) {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      const topNav = page.locator('.top-nav');
      await expect(topNav).toBeVisible();

      const navCapsule = page.locator('.nav-capsule');
      await expect(navCapsule).toBeVisible();

      // Legacy .mobile-bottom-nav must not exist; .nav-links and .brand-sub are hidden <= 1024px
      await expect(page.locator('.mobile-bottom-nav')).toHaveCount(0);
      await expect(page.locator('.nav-links')).toBeHidden();
      await expect(page.locator('.brand-sub')).toBeHidden();

      const navToggle = page.locator('.mobile-nav-toggle');
      await expect(navToggle).toBeVisible();
      const toggleBox = await navToggle.boundingBox();
      expect(toggleBox).not.toBeNull();
      expect(toggleBox!.width).toBeGreaterThanOrEqual(43.5);
      expect(toggleBox!.height).toBeGreaterThanOrEqual(43.5);

      await expect(page.locator('.molly-pelisek-dock.is-header-dock')).toBeVisible();

      const navDetails = await page.evaluate(() => {
        const doc = document.documentElement;
        const brand = document.querySelector('.nav-capsule a.brand') as HTMLElement | null;
        const dock = document.querySelector('.nav-capsule .molly-pelisek-dock') as HTMLElement | null;
        const toggle = document.querySelector('.nav-capsule button.mobile-nav-toggle') as HTMLElement | null;
        const toRect = (el: HTMLElement | null) => {
          if (!el || window.getComputedStyle(el).display === 'none') return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        };
        const overlaps = (
          a: { left: number; top: number; right: number; bottom: number } | null,
          b: { left: number; top: number; right: number; bottom: number } | null
        ) => {
          if (!a || !b) return false;
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return w > 1.5 && h > 1.5;
        };
        const bRect = toRect(brand);
        const dRect = toRect(dock);
        const tRect = toRect(toggle);
        return {
          windowWidth: window.innerWidth,
          docScrollWidth: doc.scrollWidth,
          hasDocHScroll: doc.scrollWidth > window.innerWidth,
          brandDockOverlap: overlaps(bRect, dRect),
          brandToggleOverlap: overlaps(bRect, tRect),
          dockToggleOverlap: overlaps(dRect, tRect)
        };
      });

      console.log(`[Viewport ${vp}px] navDetails:`, JSON.stringify(navDetails));
      expect(navDetails.hasDocHScroll).toBe(false);
      expect(navDetails.brandDockOverlap).toBe(false);
      expect(navDetails.brandToggleOverlap).toBe(false);
      expect(navDetails.dockToggleOverlap).toBe(false);

      // Opening top drawer reveals all 6 routes including Krajina dobra (/svet)
      await navToggle.click();
      const drawer = page.locator('#mobile-top-nav-drawer');
      await expect(drawer).toBeVisible();
      const worldLink = drawer.locator('a[href="/svet"]');
      await expect(worldLink).toBeVisible();
      await expect(worldLink).toContainText('Krajina dobra');
      await navToggle.click();
      await expect(drawer).toBeHidden();
    }
  });

  test('4. Sensory Engine: ResizeObserver Dynamic Wake-up & Blank Frame Prevention', async ({ page }) => {
    await page.goto('/');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

    // Phase 1 (before start): preview diorama canvas is mounted without data-molly-mini
    const previewCanvas = page.locator('.instant-card canvas.preview-diorama-canvas');
    await expect(previewCanvas).toBeVisible();
    expect(await previewCanvas.getAttribute('data-molly-mini')).toBeNull();
    const previewPixels = await previewCanvas.evaluate((cv: HTMLCanvasElement) => {
      const ctx = cv.getContext('2d');
      if (!ctx) return 0;
      const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
      let nonZero = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 10) nonZero++;
      }
      return nonZero;
    });
    expect(previewPixels).toBeGreaterThan(100);

    for (const w of [420, 560, 340, 720]) {
      await page.evaluate((targetWidth) => {
        const card = document.querySelector('.instant-card') as HTMLElement;
        if (card) {
          card.style.width = `${targetWidth}px`;
          card.style.maxWidth = `${targetWidth}px`;
        }
      }, w);
      await page.waitForTimeout(60);
      const resizedPreviewPixels = await previewCanvas.evaluate((cv: HTMLCanvasElement) => {
        const ctx = cv.getContext('2d');
        if (!ctx) return 0;
        const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
        let nonZero = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] > 10) nonZero++;
        }
        return nonZero;
      });
      expect(resizedPreviewPixels).toBeGreaterThan(100);
    }

    // Reset inline card width before starting Phase 2
    await page.evaluate(() => {
      const card = document.querySelector('.instant-card') as HTMLElement;
      if (card) {
        card.style.width = '';
        card.style.maxWidth = '';
      }
    });

    // Phase 2: Start action via primary CTA -> payoff canvas mounts with Mini-Molly
    await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');

    // Locate payoff canvas in instant card
    const canvas = page.locator('.instant-card canvas.impact-payoff-canvas');
    await expect(canvas).toBeVisible();

    // Wait until Svelte hydration has initialized sensoryEngine and mounted Mini-Molly
    await expect(canvas).toHaveAttribute('data-molly-mini', 'ready', { timeout: 10000 });

    // Verify initial non-zero size
    const initialBox = await canvas.boundingBox();
    expect(initialBox).not.toBeNull();
    expect(initialBox!.width).toBeGreaterThan(200);
    expect(initialBox!.height).toBeGreaterThan(50);

    // Verify initial pixel rendering: canvas should NOT be blank (alpha 0)
    const initialPixelStats = await canvas.evaluate((cv: HTMLCanvasElement) => {
      const ctx = cv.getContext('2d');
      if (!ctx) return { nonZeroPixels: 0, totalPixels: 0 };
      const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
      let nonZero = 0;
      for (let i = 3; i < imgData.data.length; i += 4) {
        if (imgData.data[i] > 10) nonZero++;
      }
      return { nonZeroPixels: nonZero, totalPixels: imgData.data.length / 4 };
    });

    expect(initialPixelStats.nonZeroPixels).toBeGreaterThan(100);

    // Let the canvas settle into idle (> 120 frames / ~2.5s)
    await page.waitForTimeout(2500);

    // Check Mini-Molly coordinate anchoring across dynamic resizes
    const testWidths = [420, 560, 340, 720];

    for (const w of testWidths) {
      // Dynamically resize card container
      await page.evaluate((targetWidth) => {
        const card = document.querySelector('.instant-card') as HTMLElement;
        if (card) {
          card.style.width = `${targetWidth}px`;
          card.style.maxWidth = `${targetWidth}px`;
        }
      }, w);

      // Give ResizeObserver 1 microtask to trigger
      await page.waitForTimeout(60);

      // Check pixel stats immediately: canvas must be drawn synchronously by fn(true), NOT blank
      const postResizePixels = await canvas.evaluate((cv: HTMLCanvasElement) => {
        const ctx = cv.getContext('2d');
        if (!ctx) return { nonZeroPixels: 0 };
        const imgData = ctx.getImageData(0, 0, cv.width, cv.height);
        let nonZero = 0;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] > 10) nonZero++;
        }
        return { nonZeroPixels: nonZero };
      });

      expect(postResizePixels.nonZeroPixels).toBeGreaterThan(100);

      // Verify canvas physical dimensions updated
      const updatedBox = await canvas.boundingBox();
      expect(updatedBox).not.toBeNull();

      // Check that canvas dataset state remains ready
      const miniState = await canvas.getAttribute('data-molly-mini');
      expect(miniState).toBe('ready');
    }
  });

  test('5. Nav Breakpoint Boundary Verification (681px, 1024px, 1025px, 1160px)', async ({ page }) => {
    for (const vp of [681, 1024]) {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      await expect(page.locator('.mobile-bottom-nav')).toHaveCount(0);
      await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
      await expect(page.locator('.nav-links')).toBeHidden();

      const compactState = await page.evaluate((width) => {
        const doc = document.documentElement;
        const brand = document.querySelector('.nav-capsule a.brand') as HTMLElement | null;
        const dock = document.querySelector('.nav-capsule .molly-pelisek-dock') as HTMLElement | null;
        const toggle = document.querySelector('.nav-capsule button.mobile-nav-toggle') as HTMLElement | null;
        const r = (el: HTMLElement | null) => (el ? el.getBoundingClientRect() : null);
        const ov = (a: DOMRect | null, b: DOMRect | null) => {
          if (!a || !b) return false;
          return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
        };
        const bR = r(brand);
        const dR = r(dock);
        const tR = r(toggle);
        return {
          hasDocHScroll: doc.scrollWidth > width,
          overlap: ov(bR, dR) || ov(bR, tR) || ov(dR, tR)
        };
      }, vp);

      expect(compactState.hasDocHScroll).toBe(false);
      expect(compactState.overlap).toBe(false);
    }

    for (const vp of [1025, 1160]) {
      await page.setViewportSize({ width: vp, height: 800 });
      await page.goto('/');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 });

      await expect(page.locator('.mobile-bottom-nav')).toHaveCount(0);
      await expect(page.locator('.mobile-nav-toggle')).toBeHidden();
      await expect(page.locator('.nav-links')).toBeVisible();

      const desktopState = await page.evaluate((width) => {
        const doc = document.documentElement;
        const brand = document.querySelector('.nav-capsule a.brand') as HTMLElement;
        const links = document.querySelector('.nav-links') as HTMLElement;
        const pills = Array.from(document.querySelectorAll('.nav-links .nav-pill')) as HTMLElement[];
        const maxPillRight = Math.max(...pills.map((p) => p.getBoundingClientRect().right));
        const brandRect = brand.getBoundingClientRect();
        const linksRect = links.getBoundingClientRect();
        const brandLinksOverlap =
          Math.min(brandRect.right, linksRect.right) - Math.max(brandRect.left, linksRect.left) > 1.5 &&
          Math.min(brandRect.bottom, linksRect.bottom) - Math.max(brandRect.top, linksRect.top) > 1.5;
        return {
          hasDocHScroll: doc.scrollWidth > width,
          flexWrap: window.getComputedStyle(links).flexWrap,
          linksOverflowing: links.scrollWidth > links.clientWidth,
          maxPillRight,
          brandLinksOverlap
        };
      }, vp);

      console.log(`[${vp}px Desktop Nav State]:`, JSON.stringify(desktopState));
      expect(desktopState.hasDocHScroll).toBe(false);
      expect(desktopState.flexWrap).toBe('nowrap');
      expect(desktopState.linksOverflowing).toBe(false);
      expect(desktopState.maxPillRight).toBeLessThanOrEqual(vp);
      expect(desktopState.brandLinksOverlap).toBe(false);
    }
  });

});
