import { test, expect, type Page } from '@playwright/test';
import { MOLLY_DEED_THANKS } from '../src/lib/mollyTypes.js';

/**
 * UI Declutter / Progressive Disclosure (R1) & Molly's calm voice (R2) Test Suite
 *
 * Covers:
 * - Deed celebration on /: Molly thanks, asks for nothing more and never covers the next-step buttons
 * - DG-3: Molly's petting whispers (Czech empathetic tone, zero punitive tone, zero arcade tokens)
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
  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20000 }).catch(() => { });
  await page.waitForTimeout(250);
}

/** Strict check with no tolerance: the document is not wider than its viewport. */
function fitsViewportWidth(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
}

const TOUCH_TARGET_VIEWPORTS = [
  ...MOBILE_VIEWPORTS,
  { width: 360, height: 800, label: '360x800 (Standard Android viewport)' }
];

test.describe('R2: Molly thanks for a deed and answers petting in a calm voice', () => {

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
  // Deed celebration: Molly thanks and asks for nothing more
  // =========================================================================

  for (const vp of [
    { width: 360, height: 800 },
    { width: 375, height: 667 },
    { width: 1440, height: 900 }
  ]) {
    test(`Deed celebration: Molly thanks, offers no feeding and nothing covers the next-step buttons (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await gotoHydrated(page, '/');

      const card = page.locator('.instant-card');
      const doneBtn = card.locator('.btn-studio-done');
      await expect(doneBtn).toHaveCount(0);
      await card.locator('.btn-studio-primary').dispatchEvent('click');
      await expect(doneBtn).toBeVisible();
      await doneBtn.click();

      const note = card.locator('.in-situ-celebration .molly-celebration-note');
      await expect(note).toBeVisible();
      await expect(note).toHaveText(/^\s*Molly děkuje\./);
      await expect(note.locator('a[href="/svet"]')).toBeVisible();

      // The card must not keep growing or shrinking once the celebration is on screen.
      const readCardHeight = () => card.evaluate((el) => el.getBoundingClientRect().height);
      const heightFirst = await readCardHeight();
      await page.waitForTimeout(600);
      const heightSecond = await readCardHeight();
      expect(
        Math.abs(heightSecond - heightFirst),
        `.instant-card height must stay put after the celebration appears (${heightFirst}px -> ${heightSecond}px)`
      ).toBeLessThanOrEqual(1);

      await expect(page.locator('.btn-inline-feed-molly')).toHaveCount(0);
      await expect(page.locator('.molly-inline-fed-badge')).toHaveCount(0);
      expect((await card.evaluate((el) => el.textContent)) || '').not.toMatch(/pamls/i);

      const nextBtn = card.locator('.in-situ-celebration .btn-next-deed');
      await expect(nextBtn).toBeVisible();
      await expect(card.locator('.in-situ-celebration button')).toHaveCount(2);

      // Molly steps aside first; a thanks whisper, if she shows one, is revealed only where she rests.
      const layer = page.locator('.molly-companion-layer');
      await expect(layer).toHaveAttribute('data-molly-settled', 'true', { timeout: 10_000 });
      await page.waitForTimeout(1200);
      await expect(layer).toHaveAttribute('data-molly-settled', 'true', { timeout: 10_000 });

      const overlaps = await page.evaluate(() => {
        const isShown = (el: Element | null): el is HTMLElement => {
          if (!el) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) return false;
          const r = el.getBoundingClientRect();
          return r.width >= 1 && r.height >= 1;
        };
        const movers: Array<{ label: string; rect: DOMRect }> = [];
        const actor = document.querySelector('.molly-roaming-actor');
        if (actor && !actor.classList.contains('is-docked') && isShown(actor)) {
          movers.push({ label: 'molly-roaming-actor', rect: actor.getBoundingClientRect() });
        }
        for (const bubble of document.querySelectorAll('.molly-whisper-bubble')) {
          if (isShown(bubble)) movers.push({ label: 'molly-whisper-bubble', rect: bubble.getBoundingClientRect() });
        }
        const hits: string[] = [];
        for (const btn of document.querySelectorAll('.instant-card .in-situ-celebration button')) {
          const br = btn.getBoundingClientRect();
          for (const mover of movers) {
            const w = Math.min(mover.rect.right, br.right) - Math.max(mover.rect.left, br.left);
            const h = Math.min(mover.rect.bottom, br.bottom) - Math.max(mover.rect.top, br.top);
            if (w > 0 && h > 0) {
              hits.push(`${mover.label}<->${String(btn.className).split(/\s+/).slice(0, 2).join('.')}(${Math.round(w * h)}px2)`);
            }
          }
        }
        return hits;
      });
      expect(overlaps, 'Neither Molly nor her whisper may cover a celebration button').toEqual([]);
    });
  }

  // =========================================================================
  // DG-3: Molly's petting whispers
  // =========================================================================

  test('DG-3.1: Petting Molly displays loving Czech whisper or toast', async ({ page }) => {
    await gotoHydrated(page, '/');
    const petBtn = page.locator('.molly-pelisek-dock .molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();
    await petBtn.click();

    // Verify whisper bubble or dock whisper is visible
    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisper).toBeVisible();

    const whisperText = await whisper.innerText();
    // Warm Czech text check: contains comforting calm words without tildes or Unicode emoji
    const warmWords = ['mrrr', 'předu', 'laskavost', 'pomoc', 'pomůžeš', 'hřeje', 'svět', 'kousek', 'klid', 'skutek', 'skutku', 'pohlazení', 'děkuji', 'blízkost', 'tichounce'];
    expect(whisperText, 'Petting whispers never speak of treats or rewards').not.toMatch(/pamls|dobrot|odměn/i);
    const hasWarmTone = warmWords.some(w => whisperText.toLowerCase().includes(w));
    expect(hasWarmTone, `Molly whisper text should be warm and supportive. Got: "${whisperText}"`).toBe(true);
    expect(whisperText).not.toContain('~');
    expect(/\p{Extended_Pictographic}/u.test(whisperText)).toBe(false);
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
      await page.evaluate(() => document.fonts.ready);

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

  test('PD-1.3: Card title sits above fold and primary CTA is reachable (>= 44px, zero clipping) on 360x660 across all energy modes', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await page.goto('/');

    const tabs = page.locator('.instant-card .energy-tab');
    await expect(tabs).toHaveCount(4);

    const primaryCta = page.locator('.instant-card .btn-studio-primary');
    const titleLoc = page.locator('.instant-card .action-title');

    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(100);

      await expect(titleLoc).toBeVisible();
      await expect(primaryCta).toBeVisible();
      const titleBox = await titleLoc.boundingBox();
      const ctaBox = await primaryCta.boundingBox();
      expect(titleBox).not.toBeNull();
      expect(ctaBox).not.toBeNull();
      expect(titleBox!.y + titleBox!.height).toBeLessThan(650);
      expect(ctaBox!.height).toBeGreaterThanOrEqual(44);
      expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(360);
    }
  });

  test('PD-1.4: Landing page zero horizontal overflow matrix across all 6 mobile viewports', async ({ page }) => {
    for (const vp of MOBILE_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await checkZeroHorizontalOverflow(page, `landing-${vp.label}`);
    }
  });

  test('PD-1.5: Verification info and share/report buttons are hidden by default and render inline without vertical stacking inside open details.how-toggle across mobile & desktop', async ({ page }) => {
    for (const vp of [{ width: 320, height: 568 }, { width: 360, height: 800 }, { width: 375, height: 667 }, { width: 1280, height: 800 }]) {
      await page.setViewportSize(vp);
      // The click below must come after hydration, which resets the details element.
      await gotoHydrated(page, '/');
      await page.evaluate(() => document.fonts.ready);

      const howToggle = page.locator('.instant-card details.how-toggle');
      const verifyFooter = page.locator('.instant-card .action-verify-footer');
      const verifyMeta = verifyFooter.locator('.verify-meta');

      // Default state: MUST be hidden
      await expect(howToggle).not.toHaveAttribute('open', '');
      await expect(verifyFooter).toBeHidden();

      // Expanded state: MUST be visible and inline (not stacked into 4 vertical flex items)
      await howToggle.locator('summary').click();
      await expect(howToggle).toHaveAttribute('open', '');
      await expect(verifyFooter).toBeVisible();
      await expect(verifyFooter).toContainText('Ověřeno:');
      await expect(verifyFooter).toContainText('Zdroj:');
      await expect(verifyFooter.locator('.broken-link-btn')).toBeVisible();

      const metaDisplay = await verifyMeta.evaluate((el) => {
        const cs = window.getComputedStyle(el);
        const chain = el.closest('.how-details-content')?.querySelector('.impact-chain-row');
        const trust = el.closest('.how-details-content')?.querySelector('.partner-trust-line');
        return {
          display: cs.display,
          flexDirection: cs.flexDirection,
          textAlign: cs.textAlign,
          chainDisplay: chain ? window.getComputedStyle(chain).display : 'block',
          trustDisplay: trust ? window.getComputedStyle(trust).display : 'block'
        };
      });
      expect(metaDisplay.display, `verify-meta must not use flex column on ${vp.width}px`).not.toBe('flex');
      expect(metaDisplay.chainDisplay, 'impact-chain-row must flow inline without orphaned flex arrows').toBe('block');
      expect(metaDisplay.trustDisplay, 'partner-trust-line must flow inline without orphaned flex dots').toBe('block');
      expect(metaDisplay.textAlign).toBe('left');

      await verifyFooter.scrollIntoViewIfNeeded();
      const boxes = await verifyFooter.evaluate((footer) => {
        const meta = footer.querySelector('.verify-meta');
        const actions = footer.querySelector('.verify-footer-actions');
        const mr = meta ? meta.getBoundingClientRect() : null;
        const ar = actions ? actions.getBoundingClientRect() : null;
        const fr = footer.getBoundingClientRect();
        return {
          metaBox: mr ? { x: mr.x, y: mr.y, width: mr.width, height: mr.height } : null,
          actionsBox: ar ? { x: ar.x, y: ar.y, width: ar.width, height: ar.height } : null,
          footerBox: { x: fr.x, y: fr.y, width: fr.width, height: fr.height }
        };
      });
      const { metaBox, actionsBox, footerBox } = boxes;
      expect(metaBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      // On >= 360px viewports, "Ověřeno: 11/2026 · Zdroj: Click and Feed ↗" stays on 1 compact row with 44px touch target (< 52px), never stacked lines (~80px)
      if (vp.width >= 360) {
        expect(metaBox!.height, `verify-meta height (${metaBox!.height}px) must stay compact on ${vp.width}px`).toBeLessThan(52);
      }
      // On desktop 1280x800, verify-meta and verify-footer-actions sit cleanly inside .action-verify-footer without horizontal overlap
      if (vp.width === 1280) {
        expect(footerBox.height).toBeLessThan(105);
        const horizontalOverlap =
          metaBox!.x < actionsBox!.x + actionsBox!.width &&
          metaBox!.x + metaBox!.width > actionsBox!.x;
        const verticalOverlap =
          metaBox!.y < actionsBox!.y + actionsBox!.height &&
          metaBox!.y + metaBox!.height > actionsBox!.y;
        expect(
          horizontalOverlap && verticalOverlap,
          `verify-meta (${JSON.stringify(metaBox)}) and verify-footer-actions (${JSON.stringify(actionsBox)}) must not overlap`
        ).toBe(false);
      }
      if (vp.width <= 680) {
        const brokenBox = await verifyFooter.locator('.mde-broken-btn').boundingBox();
        expect(brokenBox!.height).toBeGreaterThanOrEqual(44);
        expect(brokenBox!.width).toBeGreaterThanOrEqual(44);
      }
      await checkZeroHorizontalOverflow(page, `verify-footer-open-${vp.width}px`);

      // Toggle back closed: MUST be hidden again
      await howToggle.locator('summary').click();
      await expect(verifyFooter).toBeHidden();
    }
  });

  test('Home 360x660: card title stays above the fold and the primary CTA stays reachable while cycling ideas and on deep-linked actions', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 660 });
    await gotoHydrated(page, '/');

    const cycleBtn = page.locator('.instant-card .cycle-btn');
    const primaryCta = page.locator('.instant-card .btn-studio-primary');
    const titleLoc = page.locator('.instant-card .action-title');

    for (let cycle = 1; cycle <= 10; cycle++) {
      await cycleBtn.click();
      await page.waitForTimeout(60);
      const titleBox = await titleLoc.boundingBox();
      const ctaBox = await primaryCta.boundingBox();
      expect(titleBox).not.toBeNull();
      expect(ctaBox).not.toBeNull();
      expect(titleBox!.y + titleBox!.height, `Cycle ${cycle} title must be above fold`).toBeLessThan(650);
      expect(ctaBox!.height, `Cycle ${cycle} CTA height >= 44px`).toBeGreaterThanOrEqual(44);
      expect(ctaBox!.x + ctaBox!.width, `Cycle ${cycle} CTA within 360px`).toBeLessThanOrEqual(360);
    }

    // Actions with the longest titles and descriptions in the catalogue, plus ordinary ones.
    const stressActions = [
      'daruj_vlasy',
      'chodci_sobe',
      'freerice_ryze',
      'wikipedie_cz',
      'click-and-feed',
      'doucovani_deti'
    ];

    for (const actionId of stressActions) {
      await gotoHydrated(page, `/?action=${actionId}`);
      await expect(primaryCta).toBeVisible();
      const titleBox = await titleLoc.boundingBox();
      const ctaBox = await primaryCta.boundingBox();
      expect(titleBox).not.toBeNull();
      expect(ctaBox, `CTA bounding box for ?action=${actionId} should exist`).not.toBeNull();
      expect(titleBox!.y + titleBox!.height, `Action ${actionId} title must be above fold`).toBeLessThan(650);
      expect(ctaBox!.height, `Action ${actionId} CTA height >= 44px`).toBeGreaterThanOrEqual(44);
      expect(ctaBox!.x + ctaBox!.width, `Action ${actionId} CTA within 360px`).toBeLessThanOrEqual(360);
    }
  });

  test('Home: energy tabs are at least 44px tall on every mobile viewport', async ({ page }) => {
    for (const vp of TOUCH_TARGET_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const tabs = page.locator('.instant-card .energy-tab');
      await expect(tabs).toHaveCount(4);

      for (let i = 0; i < 4; i++) {
        const tab = tabs.nth(i);
        const box = await tab.boundingBox();
        expect(box, `Tab ${i} on ${vp.label} boundingBox`).not.toBeNull();
        const offsetHeight = await tab.evaluate((el) => (el as HTMLElement).offsetHeight);
        expect(box!.height, `Energy tab #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(offsetHeight, `Energy tab #${i} on ${vp.label} offsetHeight (${offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Home 320px: opening details, switching energy modes and opening the crisis panel never widen the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await gotoHydrated(page, '/');

    const detailsToggle = page.locator('.instant-card details.how-toggle summary');
    if (await detailsToggle.isVisible()) {
      await detailsToggle.click();
      await page.waitForTimeout(100);
      expect(await fitsViewportWidth(page), 'Drawer open must not cause overflow').toBe(true);
    }

    const tabs = page.locator('.instant-card .energy-tab');
    for (let i = 0; i < 4; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(60);
      expect(await fitsViewportWidth(page), `Mode ${i} must not cause overflow`).toBe(true);
    }

    const crisisBtn = page.locator('.footer-calm-actions .fc-crisis');
    if (await crisisBtn.isVisible()) {
      await crisisBtn.click();
      await page.waitForTimeout(100);
      expect(await fitsViewportWidth(page), 'Crisis panel open must not cause overflow').toBe(true);
      await page.locator('.crisis-panel .close-btn').click();
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

  test('Guided 320px and 375px: parameter drawer, parameter chips and the methodology table never widen the page', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 700 });
      await gotoHydrated(page, '/app/guided');

      expect(await fitsViewportWidth(page), `/app/guided at ${width}px initial state`).toBe(true);

      const drawerSummary = page.locator('.adaptive-params-drawer summary');
      if (await drawerSummary.isVisible()) {
        await drawerSummary.click();
        await page.waitForTimeout(100);
        expect(await fitsViewportWidth(page), `/app/guided at ${width}px with drawer open`).toBe(true);

        const chip = page.locator('details.adaptive-params-drawer .ap-pills button').first();
        await expect(chip).toBeVisible();
        await chip.click();
        await page.waitForTimeout(60);
        expect(await fitsViewportWidth(page), `/app/guided at ${width}px after chip click`).toBe(true);
      }

      const methTableWrap = page.locator('.methodology-table-wrap, .meth-table-wrap');
      if (await methTableWrap.isVisible()) {
        const wrapOverflow = await methTableWrap.evaluate((el) => window.getComputedStyle(el).overflowX);
        expect(['auto', 'scroll'].includes(wrapOverflow)).toBe(true);
      }
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

  test('Online catalog 360x800: first card primary CTA ends above 740px by default and under each category chip', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/app/online');

    const firstOnlineCta = page.locator('.grid .card .cta.primary').first();
    await expect(firstOnlineCta).toBeVisible();

    const ctaBox = await firstOnlineCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    const bottomY = ctaBox!.y + ctaBox!.height;
    expect(bottomY, `Default online CTA bottom (${bottomY.toFixed(2)}px) must be < 740px`).toBeLessThan(740);

    const chips = page.locator('.filter-toolbar .filter-chip');
    const chipCount = await chips.count();
    for (let c = 0; c < Math.min(chipCount, 4); c++) {
      await chips.nth(c).click();
      await page.waitForTimeout(100);

      const activeCta = page.locator('.grid .card .cta.primary').first();
      if (await activeCta.isVisible()) {
        const box = await activeCta.boundingBox();
        if (box) {
          expect(box.y + box.height, `Chip #${c} first CTA bottom must be < 740px`).toBeLessThan(740);
        }
      }
    }
  });

  test('Online catalog: card CTAs are at least 44px tall on every mobile viewport', async ({ page }) => {
    for (const vp of TOUCH_TARGET_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/app/online');

      const ctas = page.locator('.grid .card .cta');
      const count = await ctas.count();
      expect(count).toBeGreaterThan(0);

      // First four CTAs, primary and secondary alike.
      for (let i = 0; i < Math.min(count, 4); i++) {
        const cta = ctas.nth(i);
        await expect(cta).toBeVisible();
        const box = await cta.boundingBox();
        expect(box, `CTA #${i} bounding box on ${vp.label}`).not.toBeNull();
        const offsetHeight = await cta.evaluate((el) => (el as HTMLElement).offsetHeight);
        expect(box!.height, `/app/online CTA #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(offsetHeight, `/app/online CTA #${i} on ${vp.label} offsetHeight (${offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Online catalog 320px: scrolling the filter toolbar to its end and back never widens the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await gotoHydrated(page, '/app/online');

    const toolbar = page.locator('.filter-toolbar');
    await expect(toolbar).toBeVisible();

    await toolbar.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await page.waitForTimeout(100);
    expect(await fitsViewportWidth(page), '/app/online after filter toolbar scroll to end').toBe(true);

    await toolbar.evaluate((el) => {
      el.scrollLeft = 0;
    });
    await page.waitForTimeout(100);
    expect(await fitsViewportWidth(page), '/app/online after filter toolbar scroll to start').toBe(true);
  });

  // =========================================================================
  // PD-4: Help Map (/near) Mobile Layout
  // =========================================================================

  test('PD-4.1: Mobile view switcher cleanly toggles between List and Map on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/near');

    const switcher = page.locator('.mobile-tabs');
    await expect(switcher).toBeVisible();
    // Toggle to Map
    const mapBtn = switcher.locator('button', { hasText: 'Mapa' });
    await mapBtn.click();
    await page.waitForTimeout(200);

    // Map container must be visible
    await expect(page.locator('.map-frame .map-canvas')).toBeVisible();

    // Toggle back to List
    const listBtn = switcher.locator('button', { hasText: 'Seznam' });
    await listBtn.click();
    await page.waitForTimeout(200);
    await expect(page.locator('.place-card').first()).toBeVisible();

    await checkZeroHorizontalOverflow(page, 'near-mobile-switcher-375px');
  });

  test('PD-4.2: Location search, city jump, and radius pills are compact and zero-overflow', async ({ page }) => {
    for (const vp of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 412, height: 915 }]) {
      await page.setViewportSize(vp);
      await page.goto('/near');
      await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached' });

      await expect(page.locator('#near-location-query')).toBeVisible();
      await checkZeroHorizontalOverflow(page, `near-compact-controls-closed-${vp.width}px`);
      const filtersSummary = page.locator('details.near-filters-drawer > summary.near-filters-summary');
      await expect(filtersSummary).toBeVisible();
      const isOpen = await filtersSummary.evaluate((el) => Boolean((el.parentElement as HTMLDetailsElement | null)?.open));
      if (!isOpen) await filtersSummary.click();
      await expect(page.locator('#near-city-jump')).toBeVisible();
      await checkZeroHorizontalOverflow(page, `near-compact-controls-${vp.width}px`);
    }
  });

  test('Near 360x800: first place card starts above 520px across city jumps and radius pills', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/near');

    const firstPlace = page.locator('.place-card').first();
    await expect(firstPlace).toBeVisible();

    const placeBox = await firstPlace.boundingBox();
    expect(placeBox).not.toBeNull();
    expect(placeBox!.y, `First place card y (${placeBox!.y.toFixed(2)}px) must be < 520px`).toBeLessThan(520);

    const filtersDrawer = page.locator('details.near-filters-drawer');
    const filtersSummary = filtersDrawer.locator('> summary.near-filters-summary');
    const toggleDrawer = async (wantOpen: boolean) => {
      if (await filtersSummary.isVisible()) {
        const isOpen = await filtersDrawer.evaluate((el) => (el as HTMLDetailsElement).open);
        if (isOpen !== wantOpen) {
          await filtersSummary.click();
          if (wantOpen) {
            await expect(filtersDrawer).toHaveAttribute('open', '');
          } else {
            await expect(filtersDrawer).not.toHaveAttribute('open', '');
          }
        }
      }
    };

    await toggleDrawer(true);
    const citySelect = page.locator('#near-city-jump');
    await expect(citySelect).toBeVisible();
    for (const city of ['praha', 'brno', 'ostrava']) {
      await toggleDrawer(true);
      await citySelect.selectOption(city);
      await page.waitForTimeout(100);
      await toggleDrawer(false);
      const cardBox = await page.locator('.place-card').first().boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.y, `City ${city} first place card y (${cardBox!.y.toFixed(2)}px) must be < 520px`).toBeLessThan(520);
    }

    // Radius pills on Praha, where the short radii have dense coverage; the nearest-place banner may take 60px more.
    await toggleDrawer(true);
    await citySelect.selectOption('praha');
    await page.waitForTimeout(100);
    const radiusPills = page.locator('.radius-pill');
    const pillCount = await radiusPills.count();
    expect(pillCount).toBeGreaterThanOrEqual(3);
    for (let p = 0; p < Math.min(pillCount, 3); p++) {
      await toggleDrawer(true);
      await radiusPills.nth(p).click();
      await page.waitForTimeout(100);
      await toggleDrawer(false);
      const hasSmartBanner = await page.locator('.smart-nearest-banner').isVisible();
      const cardBox = await page.locator('.place-card').first().boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.y).toBeLessThan(hasSmartBanner ? 580 : 520);
    }
  });

  test('Near: List and Map tabs are at least 44px tall on every mobile viewport', async ({ page }) => {
    for (const vp of TOUCH_TARGET_VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/near');

      const mobileTabs = page.locator('.mobile-tabs button');
      await expect(mobileTabs).toHaveCount(2);

      for (let i = 0; i < 2; i++) {
        const btn = mobileTabs.nth(i);
        await expect(btn).toBeVisible();
        const box = await btn.boundingBox();
        expect(box, `Mobile tab #${i} bounding box on ${vp.label}`).not.toBeNull();
        const offsetHeight = await btn.evaluate((el) => (el as HTMLElement).offsetHeight);
        expect(box!.height, `/near mobile-tab #${i} on ${vp.label} height (${box!.height}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
        expect(offsetHeight, `/near mobile-tab #${i} on ${vp.label} offsetHeight (${offsetHeight}px) must be >= 44px`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Near 320px: switching between List and Map never widens the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await gotoHydrated(page, '/near');

    const mobileTabs = page.locator('.mobile-tabs button');
    await expect(mobileTabs).toHaveCount(2);

    await mobileTabs.nth(1).click();
    await page.waitForTimeout(200);
    expect(await fitsViewportWidth(page), '/near in Map view at 320px must not overflow').toBe(true);

    await mobileTabs.nth(0).click();
    await page.waitForTimeout(150);
    expect(await fitsViewportWidth(page), '/near in List view at 320px must not overflow').toBe(true);
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

  for (const vp of [{ width: 412, height: 915 }, { width: 430, height: 932 }]) {
    test(`Key routes at ${vp.width}px: document and body never exceed the viewport width`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ['/', '/app/guided', '/app/online', '/near', '/svet']) {
        await gotoHydrated(page, route);

        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const scrollWidth = docEl.scrollWidth;
          const clientWidth = docEl.clientWidth;

          let offendingSelector = '';
          if (scrollWidth > clientWidth) {
            for (const el of Array.from(document.querySelectorAll('*'))) {
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
            bodyScrollWidth: document.body ? document.body.scrollWidth : 0,
            offendingSelector
          };
        });

        expect(
          metrics.scrollWidth,
          `Route ${route} at ${vp.width}px has horizontal overflow: scrollWidth (${metrics.scrollWidth}) > clientWidth (${metrics.clientWidth}). Offender: ${metrics.offendingSelector}`
        ).toBeLessThanOrEqual(metrics.clientWidth);
        expect(metrics.bodyScrollWidth, `Route ${route} at ${vp.width}px: body is wider than the viewport`).toBeLessThanOrEqual(metrics.clientWidth);
      }
    });
  }

  test('PD-5.5: Krajina dobra (/svet) uses crisp SVG paws on dark pills, compact inline guide pill, and zero Molly dock overlap on 1280x800 & 375x667', async ({ page }) => {
    // 1. Desktop 1280x800 checks
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoHydrated(page, '/svet');

    const legendMolly = page.locator('.legend-chip.legend-molly');
    const sanctuaryPill = page.locator('.molly-sanctuary-pill');
    await expect(legendMolly.locator('svg.sanctuary-paw-svg')).toBeVisible();
    await expect(sanctuaryPill.locator('svg.sanctuary-paw-svg')).toBeVisible();
    expect(await legendMolly.innerText()).not.toContain('🐾');
    expect(await sanctuaryPill.innerText()).not.toContain('🐾');

    // Compact guide pill sits in the same row as legend chips when closed (not a full-width empty bar)
    const starBox = await page.locator('.legend-chip.legend-star').boundingBox();
    const guideSummary = page.locator('summary.guide-toggle-summary');
    const summaryBox = await guideSummary.boundingBox();
    expect(starBox).not.toBeNull();
    expect(summaryBox).not.toBeNull();
    expect(summaryBox!.width, 'Closed guide summary must be a compact pill, not full-width bar').toBeLessThan(200);
    expect(Math.abs(summaryBox!.y - starBox!.y), 'Guide pill must align in the same horizontal row as legend chips on 1280x800').toBeLessThanOrEqual(8);
    await expect(guideSummary.locator('.guide-chevron svg')).toBeVisible();
    expect(await guideSummary.innerText()).not.toContain('▸');

    // At scrollY = 0 on 1280x800, fixed .molly-pelisek-dock must NOT overlap Rychlé nápady or quick deed chips
    const dock = page.locator('.molly-pelisek-dock');
    const quickIdeasSummary = page.locator('.quick-ideas-summary');
    const firstQuickChip = page.locator('.qd-chip').first();
    if ((await dock.isVisible()) && (await quickIdeasSummary.isVisible())) {
      const dockBox = (await dock.boundingBox())!;
      for (const target of [quickIdeasSummary, firstQuickChip]) {
        if (await target.isVisible()) {
          const tBox = (await target.boundingBox())!;
          const overlapsX = dockBox.x < tBox.x + tBox.width && dockBox.x + dockBox.width > tBox.x;
          const overlapsY = dockBox.y < tBox.y + tBox.height && dockBox.y + dockBox.height > tBox.y;
          expect(
            overlapsX && overlapsY,
            `Molly dock (${JSON.stringify(dockBox)}) must not overlap RitualBar quick ideas (${JSON.stringify(tBox)}) at scrollY=0 on 1280x800`
          ).toBe(false);
        }
      }
    }

    // Expanding guide opens full-width panel below legend row WITHOUT teleporting summary pill out from under cursor
    await guideSummary.click();
    const guideToggle = page.locator('details.sanctuary-guide-toggle');
    await expect(guideToggle).toHaveAttribute('open', '');
    const openSummaryBox = (await guideSummary.boundingBox())!;
    expect(Math.abs(openSummaryBox.x - summaryBox!.x), 'Guide summary pill must not jump horizontally when opened').toBeLessThanOrEqual(2);
    expect(Math.abs(openSummaryBox.y - summaryBox!.y), 'Guide summary pill must not jump vertically when opened').toBeLessThanOrEqual(2);
    const stripBox = (await page.locator('.sanctuary-legend-strip').boundingBox())!;
    const panelBox = (await page.locator('.guide-toggle-panel').boundingBox())!;
    expect(panelBox.width).toBeGreaterThanOrEqual(stripBox.width - 40);
    expect(panelBox.y).toBeGreaterThanOrEqual(stripBox.y + stripBox.height - 2);
    await checkZeroHorizontalOverflow(page, 'svet-guide-open-1280x800');
    await guideSummary.click();

    // Clicking sanctuary pill triggers gentle-toast with crisp SVG paw instead of OS 🐾 emoji
    await sanctuaryPill.click();
    const toast = page.locator('.gentle-toast');
    await expect(toast).toBeVisible();
    await expect(toast.locator('svg.sanctuary-paw-svg')).toBeVisible();
    expect(await toast.innerText()).not.toContain('🐾');

    // 2. Mobile 375x667 checks (including AGENTS.md §1.2 >= 44x44 px touch targets)
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHydrated(page, '/svet');
    const mobileSummaryBox = (await guideSummary.boundingBox())!;
    const mobilePillBox = (await sanctuaryPill.boundingBox())!;
    expect(mobileSummaryBox.width, 'Closed guide summary must be a compact pill on 375x667').toBeLessThan(180);
    expect(mobileSummaryBox.width, 'Guide summary touch target width >= 44px on mobile').toBeGreaterThanOrEqual(44);
    expect(mobileSummaryBox.height, 'Guide summary touch target height >= 44px on mobile').toBeGreaterThanOrEqual(44);
    expect(mobilePillBox.width, 'Molly sanctuary pill touch target width >= 44px on mobile').toBeGreaterThanOrEqual(44);
    expect(mobilePillBox.height, 'Molly sanctuary pill touch target height >= 44px on mobile').toBeGreaterThanOrEqual(44);
    const mobileMollyBox = (await legendMolly.boundingBox())!;
    expect(Math.abs(mobileSummaryBox.y - mobileMollyBox.y), 'Guide pill sits inline next to Molly chip on 375x667').toBeLessThanOrEqual(8);
    await guideSummary.click();
    const mobileOpenSummaryBox = (await guideSummary.boundingBox())!;
    expect(Math.abs(mobileOpenSummaryBox.x - mobileSummaryBox.x), 'Mobile guide summary must stay stationary when opened').toBeLessThanOrEqual(2);
    await expect(page.locator('.guide-toggle-panel')).toBeVisible();
    await checkZeroHorizontalOverflow(page, 'svet-guide-open-375x667');
  });

});

test.describe('Molly reacts to a finished deed', () => {
  test('Finished deed on desktop: Molly purrs and anything she says beside the celebration is thanks, never a guide tip', async ({
    page
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/');
    const card = page.locator('.instant-card').first();
    await card.locator('.btn-studio-primary').dispatchEvent('click');
    const doneBtn = card.locator('.btn-studio-done');
    await expect(doneBtn).toBeVisible();

    // Every whisper Molly shows from now on, roaming bubble or dock bubble.
    await page.evaluate(() => {
      const seen: string[] = [];
      (window as unknown as { __aaWhispersAfterDeed: string[] }).__aaWhispersAfterDeed = seen;
      const note = () => {
        for (const el of document.querySelectorAll('.molly-whisper-bubble .whisper-text, .molly-dock-whisper .dock-whisper-text')) {
          const text = el.textContent?.trim();
          if (text && !seen.includes(text)) seen.push(text);
        }
      };
      new MutationObserver(note).observe(document.body, { subtree: true, childList: true, characterData: true });
    });

    await doneBtn.click();
    await expect(card.locator('.in-situ-celebration')).toBeVisible();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mood', 'purring');

    // Longer than the delay after which a page tip or a nudge to the main button would otherwise come.
    await page.waitForTimeout(3500);
    const whispers = await page.evaluate(
      () => (window as unknown as { __aaWhispersAfterDeed: string[] }).__aaWhispersAfterDeed
    );
    for (const text of whispers) {
      expect(MOLLY_DEED_THANKS, `whisper beside the celebration: "${text}"`).toContain(text);
    }
  });
});
