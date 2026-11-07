import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const origGoto = page.goto.bind(page);
  page.goto = async (url, options) => {
    const res = await origGoto(url, options);
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 15000 });
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

test('root sets strict security headers without unsafe-eval', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/');
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h['content-security-policy']).toBeDefined();
  expect(h['content-security-policy']).not.toContain('unsafe-eval');
  expect(h['content-security-policy']).toMatch(/script-src[^;]*'nonce-/);
  expect(h['content-security-policy']).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['permissions-policy']).toContain('geolocation=(self)');
});

test('all core routes return 200, render Krajina dobra navigation, and contain zero cringe/meta copy', async ({ page }) => {
  for (const route of ['/', '/app', '/app/guided', '/app/online', '/near', '/submit', '/svet']) {
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator('.top-nav')).toBeVisible();
    await expect(page.locator('.top-nav')).toContainText('Krajina dobra');
    await expect(page.locator('.world-count')).toHaveCount(0);
    await expect(page.locator('.crisis-pill')).toBeVisible();

    const visibleBodyText = await page.locator('body').innerText();
    for (const phrase of BANNED_RENDERED_COPY) {
      expect(visibleBodyText, `Route ${route} should not contain "${phrase}"`).not.toContain(phrase);
    }
  }
});

test('home mood tabs start with shelter bowl, rotate 4 distinct actions, and connect to deed-lit Krajina dobra + breathing', async ({ page }) => {
  await page.goto('/');

  // Painterly backdrop present & old fate slider absent
  await expect(page.locator('.hero-painted-backdrop')).toBeAttached();
  await expect(page.locator('.fate-compare')).toHaveCount(0);

  // External portals are tucked inside a closed drawer by default
  const portalsDrawer = page.locator('details.home-portals-drawer');
  await expect(portalsDrawer).toBeVisible();
  await expect(portalsDrawer).not.toHaveAttribute('open', '');

  // Ensure corporate B2B portal and dead domains are completely absent
  const pageHtml = await page.content();
  for (const forbidden of ['dobrokruh.cz', 'knihobudka.cz', 'novovlasko.cz', 'knihovnaveci.cz', 'zmapujto.cz']) {
    expect(pageHtml).not.toContain(forbidden);
  }

  // Studio Card opens on direct shelter help and rotates 4 distinct recommendations
  await expect(page.locator('.instant-card')).toBeVisible();
  await expect(page.locator('.instant-card .action-title')).toContainText('Naplnit misku');

  const tabs = page.locator('.instant-card .energy-tab');
  await expect(tabs).toHaveCount(4);

  const seenTitles = new Set<string>();
  for (let i = 0; i < 4; i++) {
    await tabs.nth(i).click();
    const title = (await page.locator('.instant-card .action-title').innerText()).trim();
    expect(title.length).toBeGreaterThan(5);
    expect(title).not.toContain('undefined');
    seenTitles.add(title);
  }
  expect(seenTitles.size).toBe(4);

  // Complete a step -> Calm Non-Pressuring Celebration Modal -> Krajina dobra (/svet)
  const homePrimaryBtnText = await page.locator('.instant-card .btn-studio-primary').innerText();
  expect(homePrimaryBtnText).not.toContain('Začít pomáhat (Začít pomáhat');
  await page.locator('.instant-card .done-btn').click();
  await expect(page.locator('.celebration-card')).toBeVisible();
  await expect(page.locator('.celebration-card')).toContainText('Klidné poděkování');
  const winTitleText = (await page.locator('.celebration-card .win-title').innerText()).trim();
  expect(winTitleText).not.toMatch(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);

  const svetBtn = page.locator('.celebration-card a[href*="/svet"]');
  await expect(svetBtn).toBeVisible();
  await svetBtn.click();

  await expect(page).toHaveURL(/\/svet/);
  await expect(page.locator('.sanctuary-viewport')).toBeVisible();
  await expect(page.locator('canvas.sanctuary-canvas')).toBeVisible();
  await expect(page.locator('img.art-layer.twilight')).toBeAttached();
  // Always at full sunlit beauty from second 1 (dawn layer visible, zero locked levels!)
  await expect(page.locator('img.art-layer.dawn')).toHaveAttribute('style', /opacity:\s*0\.88/);
  await expect(page.locator('.elements-grid')).toHaveCount(0);

  // Exploring a real deed light in Krajina dobra opens the interactive Deed Card
  await page.locator('.explore-deed-btn').click();
  const deedDialog = page.locator('.memory-whisper');
  await expect(deedDialog).toBeVisible();
  await expect(deedDialog.locator('.mw-btn-link')).toBeVisible();
  await deedDialog.locator('.mw-close').click();

  // Lighting a real offline good deed works immediately
  await page.locator('.ritual-bar input[type="text"]').fill('Pomoc sousedce s nákupem');
  await page.locator('.ritual-send-btn').click();
  await expect(page.locator('.gentle-toast')).toBeVisible();

  // Calming Breathing Exercise (#dech) works & starts guided rhythm
  const breathSection = page.locator('#dech.breathing-sanctuary');
  await expect(breathSection).toBeVisible();
  await expect(breathSection.locator('.pattern-card')).toHaveCount(3);
  await breathSection.locator('.breath-cta.start').click();
  await expect(breathSection.locator('.breath-cta.stop')).toBeVisible();
  await expect(breathSection.locator('.phase-sec')).toBeVisible();
  await breathSection.locator('.breath-cta.stop').click();
});

test('near map renders OpenStreetMap tiles, displays curated pins, and limits initial list to 3 cards', async ({ page }) => {
  await page.goto('/near');
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.aa-map-pin').first()).toBeVisible({ timeout: 10000 });

  // Progressive disclosure: 3 place cards shown initially until user asks for more
  await expect(page.locator('.places-stack .place-card')).toHaveCount(3);
  await page.locator('.near-more-wrap .calm-more-btn').click();
  const expandedCount = await page.locator('.places-stack .place-card').count();
  expect(expandedCount).toBeGreaterThan(3);

  const tileUrls = await page.locator('.leaflet-tile-pane img').evaluateAll((imgs) =>
    imgs.map((el) => (el as HTMLImageElement).src)
  );
  for (const src of tileUrls) {
    expect(src).not.toContain('cartocdn');
    expect(src).toContain('openstreetmap');
  }
});

test('guided live compass rotates recommendations, auto-opens local places when outdoor, and /app/online reveals cards progressively', async ({ page }) => {
  await page.goto('/app/guided');

  // Default situation is couch ('couch') -> local places drawer is closed initially
  const localDrawer = page.locator('details.local-drawer');
  await expect(localDrawer).not.toHaveAttribute('open', '');

  const situationCards = page.locator('.situation-card');
  await expect(situationCards).toHaveCount(5);

  const guidedTitles = new Set<string>();
  for (let i = 0; i < 5; i++) {
    await situationCards.nth(i).click();
    const recTitle = (await page.locator('.highlight-card .rec-title').innerText()).trim();
    expect(recTitle.length).toBeGreaterThan(5);
    guidedTitles.add(recTitle);
  }
  expect(guidedTitles.size).toBeGreaterThanOrEqual(4);

  // Clicking 'walk' (index 2) automatically opens local places drawer
  await situationCards.nth(2).click();
  await expect(localDrawer).toHaveAttribute('open', '');

  await page.locator('#guided-city-select').selectOption('brno');
  await expect(page.locator('.local-section h3').first()).toContainText('Brno');

  // /app/online shows 3 cards initially, expands by +6, and expands to all 45 verified actions
  await page.goto('/app/online');
  const cards = page.locator('.grid .card');
  await expect(cards).toHaveCount(3);

  await page.locator('.calm-more-btn').click();
  await expect(cards).toHaveCount(9);

  await page.locator('.link-show-all').click();
  await expect(cards).toHaveCount(45);

  // Verify all 45 card titles strip leading emojis cleanly (including ZWJ sequences like 🧑‍🏫 and 💇‍♀️)
  const allOnlineTitles = await page.locator('.grid .card .card-title').allInnerTexts();
  expect(allOnlineTitles.length).toBe(45);
  for (const t of allOnlineTitles) {
    expect(t.trim(), `Title "${t}" still has leading emoji/ZWJ`).toMatch(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]/i);
  }

  const onlineHtml = await page.content();
  for (const deadDomain of ['dobrokruh.cz', 'knihobudka.cz', 'novovlasko.cz', 'knihovnaveci.cz', 'zmapujto.cz', 'mapamisto.cz', 'redukuj.cz']) {
    expect(onlineHtml).not.toContain(deadDomain);
  }
});

test('calm UX guard: zero stacked callout clutter on cards and interactive Krajina dobra atmosphere + canvas effects work', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/');
  // Ensure old cluttered inner boxes are completely gone from .instant-card
  await expect(page.locator('.instant-card .action-self-benefit')).toHaveCount(0);
  await expect(page.locator('.instant-card .action-reassurance')).toHaveCount(0);
  await expect(page.locator('.bento-meta')).toHaveCount(0);
  // How-to steps stay collapsed until requested
  await expect(page.locator('.instant-card details.how-toggle')).not.toHaveAttribute('open', '');

  await page.goto('/svet');
  // Dawn mode active by default
  await expect(page.locator('img.art-layer.dawn')).toHaveAttribute('style', /opacity:\s*0\.88/);
  // Switch to Hvězdná noc -> dawn layer fades to 0, aurora & stars canvas renders cleanly
  await page.locator('button:has-text("Hvězdná noc")').click();
  await expect(page.locator('img.art-layer.dawn')).toHaveAttribute('style', /opacity:\s*0(?:\b|;)/);

  // Quick deed whisper chip triggers light bloom & toast without errors
  await page.locator('.qd-chip').first().click();
  await expect(page.locator('.gentle-toast')).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test('standardized GoodAction cards, Evidence A/B/C badges, verified sources, and broken-link report work across surfaces', async ({ page }) => {
  await page.goto('/');

  // Practical decision intents on homepage
  const energyTabs = page.locator('.instant-card .energy-tab');
  await expect(energyTabs.nth(0)).toContainText('Mám 2 min');
  await expect(energyTabs.nth(1)).toContainText('Mám 15 min');
  await expect(energyTabs.nth(2)).toContainText('Osobně');
  await expect(energyTabs.nth(3)).toContainText('Dlouhodobě');

  // Standardized 6-part card metadata on homepage
  await expect(page.locator('.instant-card .evidence-pill')).toContainText('Důkazy');
  await expect(page.locator('.instant-card .impact-benefit-line')).toContainText('Přínos');
  await expect(page.locator('.instant-card .partner-trust-line')).toContainText('Bez registrace na našem webu');
  await expect(page.locator('.instant-card .action-verify-footer')).toContainText('Ověřeno:');
  await expect(page.locator('.instant-card .action-verify-footer')).toContainText('Zdroj:');

  // Clicking "Nahlásit nefunkční odkaz" opens the pre-filled FeedbackModal
  await page.locator('.instant-card .broken-link-btn').click();
  const feedbackDialog = page.locator('.modal-backdrop[role="dialog"]');
  await expect(feedbackDialog).toBeVisible();
  await expect(feedbackDialog.locator('textarea')).toHaveValue(/Hlášení k aktivitě/);
  await feedbackDialog.locator('button[aria-label="Zavřít"]').click();
  await expect(feedbackDialog).toBeHidden();

  // Dual brand identity in both navbar and footer
  await expect(page.locator('.top-nav .brand')).toContainText('Pomáháme lidem pomáhat');
  await expect(page.locator('.site-footer .footer-brand')).toContainText('Pomáháme lidem pomáhat');

  // Verified statistics with primary source in .quiet-hope
  await expect(page.locator('.quiet-hope')).toContainText('17 400 tun jídla ročně');
  await expect(page.locator('.quiet-hope')).toContainText('Primární zdroj');

  // Action initiation tracking: clicking primary CTA highlights completion button and updates 6-stage funnel
  const doneBtn = page.locator('.instant-card .done-btn');
  await expect(doneBtn).not.toHaveClass(/initiated/);
  await expect(doneBtn).toContainText('Už mám hotovo');
  await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
  await expect(doneBtn).toHaveClass(/initiated/);
  await expect(doneBtn).toContainText('Dokončeno');
  await doneBtn.click();
  const funnelCounts = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('aa_funnel_counts_v1') || '{}')
  );
  expect(funnelCounts.action_started).toBeGreaterThanOrEqual(1);
  expect(funnelCounts.action_completed_self_reported).toBeGreaterThanOrEqual(1);
  expect(funnelCounts.real_world_conversion).toBeGreaterThanOrEqual(1);
});

test('/near never renders 0 míst v okolí, preserves verified orgs with website filter, and handles empty search edge case', async ({ page }) => {
  await page.goto('/near');

  // Never starts at 0 míst v okolí
  const countHeading = page.locator('.count-heading');
  await expect(countHeading).not.toContainText('0 míst v okolí');
  await expect(page.locator('.place-card .pc-verified').first()).toContainText('Ověřená organizace');

  // Clicking "⚡ S přímým webem" still keeps verified organizations visible (never 0)
  await page.locator('button:has-text("⚡ S přímým webem")').click();
  await expect(page.locator('.places-stack .place-card').first()).toBeVisible();
  await expect(countHeading).not.toContainText('0 míst v okolí');

  // Search box is visible when >3 places or query active; test non-existent search query edge case
  const searchInput = page.locator('.list-filters input[type="search"]');
  await expect(searchInput).toBeVisible();
  await searchInput.fill('xyznonexistentplace999');

  // Empty fallback explains why, offers nearest verified centers, and 1-click reset restores cards
  const emptyFallback = page.locator('.near-empty-fallback');
  await expect(emptyFallback).toBeVisible();
  await expect(emptyFallback.locator('.nv-item')).toHaveCount(3);
  await emptyFallback.locator('.near-empty-actions button').click();
  await expect(page.locator('.places-stack .place-card').first()).toBeVisible();
});

test('/app/guided adaptive parameters, Evidence Tier A filter, and methodology table work', async ({ page }) => {
  await page.goto('/app/guided');

  // Guided primary CTA is clean (never double-wrapped) and how-toggle starts collapsed
  const guidedCtaText = await page.locator('.highlight-card .btn-gold-action').innerText();
  expect(guidedCtaText).not.toContain('Začít pomáhat (Začít pomáhat');
  await expect(page.locator('.highlight-card details.how-toggle')).toBeVisible();
  await expect(page.locator('.highlight-card details.how-toggle')).not.toHaveAttribute('open', '');

  // Contextual Step 3 question adapts when topic is selected
  const adaptiveBlock = page.locator('.adaptive-step-block');
  await expect(adaptiveBlock).toContainText('3. Komu chceš dnes nejvíc pomoct?');
  await page.locator('.topic-pills .topic-pill:has-text("Zvířata")').click();
  await expect(adaptiveBlock).toContainText('3. Chceš zůstat úplně anonymní?');

  // Open adaptive parameters drawer and filter by Evidence Tier A and C
  const paramsDrawer = page.locator('details.adaptive-params-drawer');
  await paramsDrawer.locator('summary').click();
  await paramsDrawer.locator('button:has-text("A · Silné důkazy")').click();
  await expect(page.locator('.highlight-card .rec-evidence-pill')).toContainText('Důkazy A');
  await paramsDrawer.locator('button:has-text("C · Komunitní smysl")').click();
  await expect(page.locator('.highlight-card .rec-evidence-pill')).toContainText('Důkazy C');

  // Methodology drawer has 5-row table & GiveWell / EA CZ links
  const methDrawer = page.locator('details.methodology-drawer');
  await methDrawer.locator('summary').click();
  await expect(methDrawer.locator('.meth-table tbody tr')).toHaveCount(5);
  await expect(methDrawer).toContainText('GiveWell');
  await expect(methDrawer).toContainText('Efektivní altruismus ČR');

  // Saved topic from /app/guided renders non-empty topic label on homepage .personal-values-pill
  await page.goto('/');
  const personalPill = page.locator('.instant-card .personal-values-pill');
  await expect(personalPill).toBeVisible();
  await personalPill.click();
  await expect(personalPill).toContainText('Tvoje témata (Zvířata)');

  // Narrow 320px mobile viewport on /app/guided with how-toggle expanded has zero horizontal overflow
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/app/guided');
  await page.locator('.highlight-card details.how-toggle summary').click();
  await expect(page.locator('.highlight-card details.how-toggle')).toHaveAttribute('open', '');
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('/app/online Evidence A filter and /svet 3 semantic light types + post-deed rest reassurance work', async ({ page }) => {
  await page.goto('/app/online');
  await page.locator('.filters-bar .filter-chip:has-text("Důkazy A")').click();
  await expect(page.locator('.grid .card .card-evidence-badge').first()).toContainText('Důkazy A');
  await expect(page.locator('.grid .card .card-verify-footer').first()).toContainText('Ověřeno:');

  await page.goto('/svet');
  const ritualModes = page.locator('.ritual-modes .ritual-pill');
  await expect(ritualModes).toHaveCount(3);
  await expect(ritualModes.nth(0)).toContainText('Lucerna · Osobní skutek');
  await expect(ritualModes.nth(1)).toContainText('Hvězda · Inspirace');
  await expect(ritualModes.nth(2)).toContainText('Vlna · Pomoc druhému');

  // Select Vlna · Pomoc druhému and submit a deed -> verify post-deed rest reassurance
  await ritualModes.nth(2).click();
  await page.locator('.ritual-bar input[type="text"]').fill('Pomoc sousedce s nákupem');
  await page.locator('.ritual-send-btn').click();
  await expect(page.locator('.gentle-toast')).toContainText(
    'Dnes jsi udělal něco dobrého. Nemusíš dělat nic dalšího. Můžeš si chvíli odpočinout.'
  );
});

test('v10 Mobile App-Shell (360x800), PWA icons, deep-linking (?action= & #action=), and return-tab dopamine loop', async ({ page, request }) => {
  // 1. Verify PWA binary PNG icons return 200 and valid PNG magic bytes
  for (const iconPath of ['/icon-192.png', '/icon-512.png', '/apple-touch-icon-czech.png', '/favicon-czech.png']) {
    const res = await request.get(iconPath);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
    const buf = await res.body();
    expect(buf.slice(0, 4).toString('hex')).toBe('89504e47');
  }

  // Desktop (1280x800) and Unfolded OnePlus Open (820x960) keep .mobile-bottom-nav hidden
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('.mobile-bottom-nav')).toBeHidden();
  await page.setViewportSize({ width: 820, height: 960 });
  await expect(page.locator('.mobile-bottom-nav')).toBeHidden();

  // 2. Mobile 360x800 & 360x660 (In-App Browser) viewport checks
  await page.setViewportSize({ width: 360, height: 660 });
  await page.goto('/');
  const topNavBox = await page.locator('.top-nav').boundingBox();
  const heroTitleBox = await page.locator('.hero-title').boundingBox();
  const cardBox660 = await page.locator('.instant-card').boundingBox();
  const ctaBox660 = await page.locator('.instant-card .btn-studio-primary').boundingBox();
  const doneBox660 = await page.locator('.instant-card .btn-studio-done').boundingBox();
  expect(topNavBox).not.toBeNull();
  expect(heroTitleBox).not.toBeNull();
  expect(cardBox660).not.toBeNull();
  expect(ctaBox660).not.toBeNull();
  expect(doneBox660).not.toBeNull();
  // Hero title and instant-card must NOT be clipped above the screen or hidden behind .top-nav
  expect(heroTitleBox!.y).toBeGreaterThanOrEqual(topNavBox!.y + topNavBox!.height - 4);
  expect(cardBox660!.y).toBeGreaterThanOrEqual(topNavBox!.y + topNavBox!.height);
  // Zero horizontal clipping inside .hero-stage on 360x660
  expect(heroTitleBox!.x + heroTitleBox!.width).toBeLessThanOrEqual(360);
  expect(cardBox660!.x + cardBox660!.width).toBeLessThanOrEqual(360);
  expect(ctaBox660!.x + ctaBox660!.width).toBeLessThanOrEqual(360);
  expect(doneBox660!.x + doneBox660!.width).toBeLessThanOrEqual(360);
  // Primary CTA fits above the fold even in a 360x660 Instagram/TikTok in-app browser
  expect(ctaBox660!.y + ctaBox660!.height).toBeLessThan(650);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  // Bottom nav is visible with 5 tabs; floating feedback/crisis pills are hidden
  const bottomNav = page.locator('.mobile-bottom-nav');
  await expect(bottomNav).toBeVisible();
  await expect(bottomNav.locator('.mb-tab')).toHaveCount(5);
  await expect(page.locator('.feedback-pill')).toBeHidden();
  await expect(page.locator('.crisis-pill')).toBeHidden();

  // Primary CTA and Done button inside .instant-card are 100% inside 360px width and above the fold (y + height < 740)
  const cardBox800 = await page.locator('.instant-card').boundingBox();
  const primaryCta = page.locator('.instant-card .btn-studio-primary');
  const doneBtn800 = page.locator('.instant-card .btn-studio-done');
  await expect(primaryCta).toBeVisible();
  const ctaBox = await primaryCta.boundingBox();
  const doneBox = await doneBtn800.boundingBox();
  expect(cardBox800).not.toBeNull();
  expect(ctaBox).not.toBeNull();
  expect(doneBox).not.toBeNull();
  expect(cardBox800!.x + cardBox800!.width).toBeLessThanOrEqual(360);
  expect(ctaBox!.x + ctaBox!.width).toBeLessThanOrEqual(360);
  expect(doneBox!.x + doneBox!.width).toBeLessThanOrEqual(360);
  expect((ctaBox?.y || 0) + (ctaBox?.height || 0)).toBeLessThan(740);

  // Úkol 1: Top bar is clean on mobile (.mobile-header-actions removed; moved to .footer-calm-actions)
  await expect(page.locator('.mobile-header-actions')).toHaveCount(0);
  await expect(page.locator('.instant-body > .action-impact-summary')).toBeHidden();
  await expect(page.locator('.instant-body > .action-verify-footer')).toBeHidden();

  // Footer calm actions toggle crisis panel above bottom nav
  await page.locator('.footer-calm-actions .fc-crisis').click();
  await expect(page.locator('.crisis-panel')).toBeVisible();
  await page.locator('.crisis-panel .close-btn').click();
  await expect(page.locator('.crisis-panel')).toBeHidden();

  // Úkol 2: Sound mute toggle & ambient pulse pill
  await expect(page.locator('.instant-card .ambient-pulse-pill')).toBeVisible();
  const muteBtn = page.locator('.instant-card .sound-mute-btn');
  await expect(muteBtn).toBeVisible();
  await muteBtn.click();
  const isMutedVal = await page.evaluate(() => localStorage.getItem('aa_sound_muted'));
  expect(isMutedVal).toBe('1');

  // Úkol 2: Hold-to-Spark 600ms charge sets --spark-charge and .spark-ready
  await page.locator('.instant-card .btn-studio-primary').dispatchEvent('pointerdown');
  await page.waitForTimeout(640);
  await expect(page.locator('.instant-card .btn-studio-primary')).toHaveClass(/spark-ready/);
  await page.locator('.instant-card .btn-studio-primary').dispatchEvent('pointerleave');

  // 3. Deep-link /?action=click-and-feed, #action=wikipedie_cz, and interaction with personal values filter
  await page.evaluate(() => localStorage.setItem('aa_values', JSON.stringify(['animals'])));
  await page.goto('/?action=wikipedie_cz');
  await expect(page.locator('.instant-card .action-title')).toContainText('Opravit překlep nebo doplnit fakt na české Wikipedii');

  // Toggling personal values filter unpins the deep-linked action and filters by saved topic ('animals')
  const personalPill = page.locator('.instant-card .personal-values-pill');
  await expect(personalPill).toBeVisible();
  await personalPill.click();
  await expect(page.locator('.instant-card .action-title')).not.toContainText('Opravit překlep nebo doplnit fakt na české Wikipedii');

  // Navigating between /?action=click-and-feed, /?action=doucovani_deti (ZWJ emoji), and #action=wikipedie_cz
  await page.goto('/?action=doucovani_deti');
  const zwjHomeTitle = (await page.locator('.instant-card .action-title').innerText()).trim();
  expect(zwjHomeTitle).toMatch(/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ0-9]/i);

  await page.goto('/?action=click-and-feed');
  await expect(page.locator('.instant-card .action-title')).toContainText('Naplnit misku v českém útulku jedním klikem');
  await page.evaluate(() => {
    window.location.hash = '#action=wikipedie_cz';
  });
  await expect(page.locator('.instant-card .action-title')).toContainText('Opravit překlep nebo doplnit fakt na české Wikipedii');

  // Direct link copy button (inside <details class="how-toggle"> on mobile)
  await page.locator('.instant-card details.how-toggle summary').click();
  const shareBtn = page.locator('.instant-card .mobile-details-extra .mde-share-btn');
  await expect(shareBtn).toBeVisible();
  await shareBtn.click();
  await expect(shareBtn).toContainText('✓ Odkaz zkopírován');
  await page.locator('.instant-card details.how-toggle summary').click();

  // 4. Return-tab instant dopamine prompt on visibilitychange (with >3s guard + 2D canvas kibble physics)
  await page.goto('/?action=click-and-feed');
  await page.locator('.instant-card .btn-studio-primary').dispatchEvent('click');
  const returnStrip = page.locator('.return-dopamine-strip');
  // Immediate return (< 3s) does NOT trigger the prompt
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(returnStrip).toBeHidden();

  // Return after > 3 seconds triggers the celebratory prompt with 2D canvas kibble payoff
  await page.waitForTimeout(3050);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(returnStrip).toBeVisible();
  await expect(returnStrip).toContainText('Vítej zpět!');
  await expect(returnStrip.locator('canvas.impact-payoff-canvas')).toBeVisible();
  await expect(returnStrip.locator('.impact-payoff-badge')).toContainText('v misce');
  const returnStripBox = await returnStrip.boundingBox();
  expect(returnStripBox).not.toBeNull();
  expect(returnStripBox!.x + returnStripBox!.width).toBeLessThanOrEqual(360);
  await returnStrip.locator('.return-dopamine-btn').click();
  await expect(returnStrip).toBeHidden();
  await expect(page.locator('.celebration-backdrop')).toHaveCount(0);

  // In-App Browser full page reload return loop: restores non-default action from sessionStorage('aa_pending_return_v1')
  await page.evaluate(() => {
    const payload = JSON.stringify({
      id: 'wikipedie_cz',
      title: 'Opravit překlep nebo doplnit fakt na české Wikipedii',
      category: 'education',
      ts: Date.now() - 4500
    });
    sessionStorage.setItem('aa_pending_return_v1', payload);
    localStorage.setItem('aa_pending_return_v1', payload);
  });
  await page.goto('/');
  await expect(page.locator('.instant-card .action-title')).toContainText('Opravit překlep nebo doplnit fakt na české Wikipedii');
  await expect(returnStrip).toBeVisible();
  await expect(returnStrip.locator('canvas.impact-payoff-canvas')).toBeVisible();
  await expect(returnStrip.locator('.impact-payoff-badge')).toContainText('Světelná stopa');
  await returnStrip.locator('.return-dopamine-btn').click();
  await expect(returnStrip).toBeHidden();

  // 5. /svet on 360x800: .seed-ceremony-banner (both from localStorage and direct ?seed= URL) and .memory-whisper do NOT overlap canvas.world-canvas
  await page.evaluate(() => localStorage.removeItem('aa_completed_steps_v2'));
  await page.goto('/svet?seed=zvirata_utulek_online&title=Naplnit%20misku');
  const canvasBox = await page.locator('canvas.world-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  const seedBanner = page.locator('.seed-ceremony-banner');
  await expect(seedBanner).toBeVisible();
  await expect(seedBanner).toContainText('Naplnit misku');
  const seedBox = await seedBanner.boundingBox();
  expect(seedBox).not.toBeNull();
  // Seed banner is stacked below canvas on mobile (seedBox.y >= canvasBox.y + canvasBox.height - 2)
  expect(seedBox!.y).toBeGreaterThanOrEqual(canvasBox!.y + canvasBox!.height - 2);
  await seedBanner.locator('.seed-auto-btn').click();
  await expect(seedBanner).toBeHidden();

  await page.locator('.explore-deed-btn').click();
  const whisper = page.locator('.memory-whisper');
  await expect(whisper).toBeVisible();
  const whisperBox = await whisper.boundingBox();
  expect(whisperBox).not.toBeNull();
  expect(whisperBox!.y).toBeGreaterThanOrEqual(canvasBox!.y + canvasBox!.height - 2);

  // Tapping stage while .memory-whisper is open dismisses .memory-whisper without planting an accidental wish
  await page.locator('.sanctuary-viewport').click({ position: { x: 20, y: 20 } });
  await expect(whisper).toBeHidden();

  // 6. /near on 360x800: first .place-card has y < 520 (above the fold)
  await page.goto('/near');
  const firstPlace = page.locator('.place-card').first();
  await expect(firstPlace).toBeVisible();
  const placeBox = await firstPlace.boundingBox();
  expect(placeBox).not.toBeNull();
  expect(placeBox!.y).toBeLessThan(520);

  // 7. /app/guided on 360x800: .situation-grid is a compact 2-column CSS grid & preview bar is visible
  await page.goto('/app/guided');
  const sitGridDisplay = await page.locator('.situation-grid').evaluate((el) => getComputedStyle(el).display);
  expect(sitGridDisplay).toBe('grid');
  const sitGridBox = await page.locator('.situation-grid').boundingBox();
  expect(sitGridBox).not.toBeNull();
  expect(sitGridBox!.height).toBeLessThan(180);
  await expect(page.locator('.mobile-guided-preview-bar')).toBeVisible();

  // 8. /app/online on 360x800: first card primary CTA is visible above the fold (y + height < 740)
  await page.goto('/app/online');
  const firstOnlineCta = page.locator('.grid .card .cta.primary').first();
  await expect(firstOnlineCta).toBeVisible();
  const onlineCtaBox = await firstOnlineCta.boundingBox();
  expect(onlineCtaBox).not.toBeNull();
  expect(onlineCtaBox!.y + onlineCtaBox!.height).toBeLessThan(740);

  // 9. Zero horizontal overflow on 360x800 across all 5 main routes + 320px long ?title= edge case on /svet
  for (const route of ['/', '/app/online', '/near', '/svet', '/app/guided']) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow, `Horizontal overflow on ${route}`).toBe(false);
  }

  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/svet?seed=pomoc_sousedovi_s_nakupem');
  await expect(page.locator('.seed-ceremony-banner')).toContainText('Pomoc sousedovi s nakupem');
  await page.goto(
    '/svet?seed=custom&title=' +
      encodeURIComponent('Velmi dlouhý název dobrého skutku pro kontrolu zalomení textu bez přetékání na úzkém displeji 320px')
  );
  const narrowSeedBox = await page.locator('.seed-ceremony-banner').boundingBox();
  expect(narrowSeedBox).not.toBeNull();
  expect(narrowSeedBox!.x + narrowSeedBox!.width).toBeLessThanOrEqual(320);
  const narrowOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(narrowOverflow).toBe(false);
});

test('bespoke 2D Canvas + Web Audio special effects work for all activity types across Desktop, Tablet, and Mobile and all surfaces (/, /app/online, /app/guided, /near, SmallWinCelebration)', async ({
  page
}) => {
  // 1. Verify bespoke scenes and dynamic Czech badges across diverse activities
  const activityExpectations = [
    { id: 'zvirata_utulek_online', scene: 'kibble', badgePart: 'v misce' },
    { id: 'freerice_ryze', scene: 'rice', badgePart: 'zrnek rýže' },
    { id: 'birdlife_ptaci_pasti', scene: 'birds_glass', badgePart: 'ochranných bodů skla' },
    { id: 'zvire_v_nouzi', scene: 'wildlife_rescue', badgePart: 'stanic v pohotovosti' },
    { id: 'missing_maps', scene: 'satellite_map', badgePart: 'budov v mapě' },
    { id: 'cesko_digital_micro', scene: 'code_nodes', badgePart: 'propojených uzlů' },
    { id: 'chodci_sobe', scene: 'safe_crosswalk', badgePart: 'opravená bariéra' },
    { id: 'darovani_krve', scene: 'blood_drop', badgePart: 'zachráněné životy' },
    { id: 'daruj_vlasy', scene: 'hair_silk', badgePart: 'vlasů na paruku' },
    { id: 'opatruj_se_nudz', scene: 'breath_lotus', badgePart: 'min klidu mysli' },
    { id: 'sazime_budoucnost', scene: 'forest_bloom', badgePart: 'strom pro krajinu' },
    { id: 'trash_hero_uklid', scene: 'eco_cleanup', badgePart: 'sebraných kusů' },
    { id: 'letters_seniors', scene: 'senior_letter', badgePart: 'rozhovor proti samotě' },
    { id: 'knihobudka_kniha', scene: 'book_booth', badgePart: 'kniha pro sousedy' },
    { id: 'zooniverse_veda', scene: 'cosmos_science', badgePart: 'snímků pro vědu' },
    { id: 'wikipedie_cz', scene: 'wiki_ink', badgePart: 'zpřesněný článek' },
    { id: 'estudanky_pramen', scene: 'water_spring', badgePart: 'vyčištěná studánka' },
    { id: 'potravinova_banka', scene: 'food_bank', badgePart: 'porcí jídla' },
    { id: 'kola_pro_afriku', scene: 'wheels_motion', badgePart: 'kolo pro školáka' },
    { id: 'krabice_od_bot', scene: 'shoebox_gift', badgePart: 'dárek pro dítě' },
    { id: 'dobry_andel', scene: 'angel_wings', badgePart: 'přímo rodině' }
  ];

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?action=zvirata_utulek_online');
  await expect(page.locator('.instant-card .btn-studio-primary')).toHaveAttribute('data-hold-spark', 'true');

  // Open on-demand special effect preview on homepage
  await page.locator('.instant-card .effect-spark-btn').click();
  await expect(page.locator('.instant-card .card-effect-stage')).toBeVisible();

  for (const exp of activityExpectations) {
    await page.goto(`/?action=${exp.id}`);
    const stage = page.locator('.instant-card .card-effect-stage');
    if (!(await stage.isVisible())) {
      await page.locator('.instant-card .effect-spark-btn').click();
    }
    await expect(stage).toHaveAttribute('data-scene', exp.scene);
    await expect(stage.locator('.impact-payoff-badge')).toContainText(exp.badgePart);
    const canvas = stage.locator('canvas.impact-payoff-canvas');
    await expect(canvas).toBeVisible();

    // Verify non-empty rendered 2D canvas pixels and pointer tap burst
    await canvas.click({ position: { x: 150, y: 46 } });
    const hasPixels = await canvas.evaluate((c: HTMLCanvasElement) => {
      const ctx = c.getContext('2d');
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] > 0) return true;
      }
      return false;
    });
    expect(hasPixels, `Canvas should draw non-empty pixels for ${exp.id}`).toBe(true);
  }

  // 2. Verify all surfaces (/app/online, /app/guided, /near, SmallWinCelebration) across Desktop (1280x900), Tablet (820x1180), and Mobile (360x800)
  const viewports = [
    { name: 'Desktop', width: 1280, height: 900 },
    { name: 'Tablet', width: 820, height: 1180 },
    { name: 'Mobile', width: 360, height: 800 }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // A) /app/online: Hold-to-Spark attribute, ✨ effect stage, ambient pulse, and SmallWinCelebration canvas
    await page.goto('/app/online');
    const firstCard = page.locator('.grid .card').first();
    await expect(firstCard.locator('.cta.primary')).toHaveAttribute('data-hold-spark', 'true');
    await expect(page.locator('.ambient-pulse-pill').first()).toBeVisible();

    await firstCard.locator('.effect-spark-btn').click();
    await expect(firstCard.locator('.card-effect-stage canvas.impact-payoff-canvas')).toBeVisible();
    await expect(firstCard.locator('.card-effect-stage .impact-payoff-badge')).toBeVisible();

    const onlineOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(onlineOverflow, `Overflow on /app/online (${vp.name})`).toBe(false);

    // Trigger SmallWinCelebration modal from /app/online and verify its bespoke 2D Canvas payoff
    await firstCard.locator('.cta.secondary').click();
    const modal = page.locator('.celebration-backdrop');
    await expect(modal).toBeVisible();
    await expect(modal.locator('canvas.impact-payoff-canvas')).toBeVisible();
    await expect(modal.locator('.impact-payoff-badge')).toBeVisible();
    await modal.locator('.btn-more').click();
    await expect(modal).toBeHidden();

    // B) /app/guided: Hold-to-Spark attribute, ✨ effect stage, ambient pulse, partner-return strip
    await page.goto('/app/guided');
    const highlightCard = page.locator('.highlight-card');
    await expect(highlightCard.locator('.btn-gold-action')).toHaveAttribute('data-hold-spark', 'true');
    await expect(highlightCard.locator('.ambient-pulse-pill')).toBeVisible();

    await highlightCard.locator('.effect-spark-btn').click();
    await expect(highlightCard.locator('.card-effect-stage canvas.impact-payoff-canvas')).toBeVisible();

    const guidedOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(guidedOverflow, `Overflow on /app/guided (${vp.name})`).toBe(false);

    // C) /near: Hold-to-Spark attribute, ✨ effect stage on place cards, direct place share, ambient pulse
    await page.goto('/near');
    const firstPlaceCard = page.locator('.place-card').first();
    await expect(firstPlaceCard).toBeVisible();
    await firstPlaceCard.locator('.effect-spark-btn').click();
    await expect(firstPlaceCard.locator('.card-effect-stage canvas.impact-payoff-canvas')).toBeVisible();
    await expect(page.locator('.ambient-pulse-pill').first()).toBeVisible();
    await firstPlaceCard.locator('.pc-share-btn').click();
    await expect(firstPlaceCard.locator('.pc-share-btn')).toContainText('✓ Odkaz zkopírován');

    const nearOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(nearOverflow, `Overflow on /near (${vp.name})`).toBe(false);
  }

  // 3. Partner-return dopamine loop on /app/online, /app/guided, and /near
  for (const surfaceRoute of ['/app/online', '/app/guided', '/near']) {
    await page.evaluate(() => {
      const payload = JSON.stringify({
        id: 'freerice_ryze',
        title: 'Darovat rýži lidem v nouzi hraním slovního kvízu',
        category: 'poverty',
        ts: Date.now() - 5000
      });
      sessionStorage.setItem('aa_pending_return_v1', payload);
      localStorage.setItem('aa_pending_return_v1', payload);
    });
    await page.goto(surfaceRoute);
    const strip = page.locator('.return-dopamine-strip');
    await expect(strip).toBeVisible();
    await expect(strip.locator('canvas.impact-payoff-canvas')).toBeVisible();
    await expect(strip.locator('.impact-payoff-badge')).toContainText('zrnek rýže');
    await strip.locator('.btn-return-dismiss').click();
    await expect(strip).toBeHidden();
  }
});
