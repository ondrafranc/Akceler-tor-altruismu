import { test, expect } from '@playwright/test';

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
  'Pustit starost po vodě'
];

test('root sets strict security headers without unsafe-eval', async ({ request, baseURL }) => {
  const res = await request.get(baseURL! + '/');
  expect(res.status()).toBe(200);
  const h = res.headers();
  expect(h['content-security-policy']).toBeDefined();
  expect(h['content-security-policy']).not.toContain('unsafe-eval');
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
  await page.locator('.instant-card .done-btn').click();
  await expect(page.locator('.celebration-card')).toBeVisible();
  await expect(page.locator('.celebration-card')).toContainText('Klidné poděkování');

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
