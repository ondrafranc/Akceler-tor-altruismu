import { test, expect, type Page, type Locator } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Opaque-Box UI/UX Rebuild Acceptance Test Suite
 *
 * Derived strictly from:
 * - ORIGINAL_REQUEST.md (R1-R5 & Acceptance Criteria)
 * - AGENTS.md § 1 & § 2.4
 * - PROJECT.md § Interface Contracts
 *
 * Covers Tiers 1-4 across all 7 routes x 3 viewports (360x800, 375x667, 1440x900).
 */

type RouteSpec = {
  path: string;
  slug: string;
  label: string;
};

type ViewportSpec = {
  name: string;
  width: number;
  height: number;
  isMobile: boolean;
};

type EmojiViolation = {
  kind: 'innerText' | 'textNode' | 'attribute';
  selector: string;
  char: string;
  codePoint: string;
  snippet: string;
};

type CollisionReport = {
  pair: string;
  overlapW: number;
  overlapH: number;
  area: number;
};

type RuntimeErrorBag = {
  consoleErrors: string[];
  pageErrors: string[];
};

const ROUTES: readonly RouteSpec[] = [
  { path: '/', slug: 'home', label: 'Domů' },
  { path: '/app', slug: 'app', label: 'Rozcestník' },
  { path: '/app/guided', slug: 'app-guided', label: 'Průvodce' },
  { path: '/app/online', slug: 'app-online', label: 'Katalog online' },
  { path: '/near', slug: 'near', label: 'V okolí' },
  { path: '/svet', slug: 'svet', label: 'Krajina dobra' },
  { path: '/submit', slug: 'submit', label: 'Přidat místo nebo akci' }
] as const;

const VIEWPORTS: readonly ViewportSpec[] = [
  { name: '360x800', width: 360, height: 800, isMobile: true },
  { name: '375x667', width: 375, height: 667, isMobile: true },
  { name: '1440x900', width: 1440, height: 900, isMobile: false }
] as const;

const NAV_ROUTE_HREFS = ['/', '/app/guided', '/app/online', '/near', '/svet', '/submit'] as const;

const SCREENSHOT_DIR = path.join('test-results', 'rebuild-screenshots');

/**
 * Authoritative Unicode emoji & decorative symbol detector.
 * Closes the 6-glyph gap (✦, ✕, ✓, ▸, ▾, ↻) missed by Extended_Pictographic alone
 * while keeping 0 false positives on Czech diacritics, dashes, quotes, dots, or →/←/↓.
 */
const FORBIDDEN_EMOJI_OR_GLYPH_RE =
  /[\p{Extended_Pictographic}\uFE0F\u200D\u20E3\u2726\u2727\u2728\u2795\u2713\u2714\u2715\u2716\u2605\u2606\u25B8\u25BE\u25B6\u25BC\u21BB\u21BA\u2197\u2139]|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]\uFE0F?\u20E3/u;

const ONE_BY_ONE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

async function setupPageEnvironment(page: Page): Promise<RuntimeErrorBag> {
  const errors: RuntimeErrorBag = {
    consoleErrors: [],
    pageErrors: []
  };

  await page.addInitScript(() => {
    try {
      if (!window.sessionStorage.getItem('__pw_clean_bootstrapped')) {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.sessionStorage.setItem('__pw_clean_bootstrapped', '1');
      }
    } catch {
      // Ignore storage access restriction if any
    }
  });

  // Deterministic CI/offline network handling for map tiles and Vercel edge scripts
  await page.route('https://*.tile.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG })
  );
  await page.route('https://*.basemaps.cartocdn.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG })
  );
  await page.route('**/_vercel/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );

  // Safely handle external target="_blank" deeds without navigating away or hitting live internet
  await page.context().route(/^https?:\/\/(?!localhost|127\.0\.0\.1)/, (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.includes('tile.openstreetmap.org') || reqUrl.includes('basemaps.cartocdn.com')) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: ONE_BY_ONE_PNG });
    }
    return route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html lang="cs"><body>Partner OK</body></html>'
    });
  });

  page.on('popup', (popup) => {
    void popup.close().catch(() => {});
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.pageErrors.push(err.message || String(err));
  });

  return errors;
}

async function gotoHydrated(page: Page, routePath: string): Promise<void> {
  let nearbyLoaded = routePath !== '/near';
  let communityLoaded = routePath !== '/near';

  const onResponse = (res: { url: () => string }) => {
    const u = res.url();
    if (u.includes('/api/nearby')) nearbyLoaded = true;
    if (u.includes('/api/community-nearby')) communityLoaded = true;
  };

  if (routePath === '/near') {
    page.on('response', onResponse);
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(routePath, { waitUntil: 'domcontentloaded' });
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (
        attempt < 2 &&
        (msg.includes('ECONNREFUSED') ||
          msg.includes('ERR_CONNECTION_REFUSED') ||
          msg.includes('ERR_CONNECTION_RESET'))
      ) {
        await page.waitForTimeout(500);
        continue;
      }
      throw err;
    }
  }
  if (lastError) throw lastError;

  await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);

  if (routePath === '/near') {
    const deadline = Date.now() + 5000;
    while ((!nearbyLoaded || !communityLoaded) && Date.now() < deadline) {
      await page.waitForTimeout(100);
    }
    page.off('response', onResponse);
    await page
      .locator('.places-stack .place-card, .places-empty, .leaflet-container')
      .first()
      .waitFor({ state: 'attached', timeout: 5000 })
      .catch(() => {});
  }

  // Wait > 400ms for Molly layout settle and initial canvas diorama paint
  await page.waitForTimeout(450);
}

function assertZeroRuntimeErrors(errors: RuntimeErrorBag, contextLabel: string): void {
  expect(
    errors.pageErrors,
    `[PageError] ${contextLabel}: ${errors.pageErrors.join(' | ')}`
  ).toEqual([]);
  expect(
    errors.consoleErrors,
    `[ConsoleError] ${contextLabel}: ${errors.consoleErrors.join(' | ')}`
  ).toEqual([]);
}

async function scanForbiddenEmojis(page: Page, rootSelector = 'body'): Promise<EmojiViolation[]> {
  return page.evaluate(
    ({ selector, reSource }) => {
      const root = document.querySelector(selector);
      if (!root) return [];

      const reSingle = new RegExp(reSource, 'u');
      const reGlobal = new RegExp(reSource, 'gu');
      const violations: EmojiViolation[] = [];

      function describeEl(el: Element | null): string {
        if (!el) return '(null)';
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
            : '';
        return `${tag}${id}${cls}`;
      }

      function isElVisible(el: Element): boolean {
        if (el.closest('details:not([open])') && !el.closest('summary')) return false;
        let cur: Element | null = el;
        while (cur && cur !== document.documentElement) {
          const cs = window.getComputedStyle(cur);
          if (
            cs.display === 'none' ||
            cs.visibility === 'hidden' ||
            parseFloat(cs.opacity) <= 0.01
          ) {
            return false;
          }
          cur = cur.parentElement;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0.5 && rect.height > 0.5;
      }

      function isSrOnlyReachable(el: Element): boolean {
        if (!el.closest('.sr-only')) return false;
        if (el.closest('details:not([open])') && !el.closest('summary')) return false;
        let cur: Element | null = el;
        while (cur && cur !== document.documentElement) {
          const cs = window.getComputedStyle(cur);
          if (cs.display === 'none' || cs.visibility === 'hidden') {
            return false;
          }
          if (!cur.classList.contains('sr-only') && parseFloat(cs.opacity) <= 0.01) {
            return false;
          }
          cur = cur.parentElement;
        }
        return true;
      }

      function collectMatches(
        kind: EmojiViolation['kind'],
        el: Element | null,
        text: string
      ): void {
        if (!text || !reSingle.test(text)) return;
        reGlobal.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = reGlobal.exec(text)) !== null) {
          const ch = match[0];
          // Plain typographic © / ® / ™ are permitted unless paired with emoji variation selector U+FE0F
          if (
            (ch === '\u00A9' || ch === '\u00AE' || ch === '\u2122') &&
            text.charCodeAt(match.index + ch.length) !== 0xfe0f
          ) {
            continue;
          }
          const cp = ch.codePointAt(0) ?? 0;
          violations.push({
            kind,
            selector: describeEl(el),
            char: ch,
            codePoint: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'),
            snippet: text.trim().slice(0, 80)
          });
        }
      }

      // 1. Rendered innerText on root (excluding third-party .leaflet-control-attribution)
      if (root instanceof HTMLElement) {
        let renderedText = root.innerText || '';
        const attributions = root.querySelectorAll('.leaflet-control-attribution');
        for (const attrEl of attributions) {
          if (attrEl instanceof HTMLElement) {
            const attrText = (attrEl.innerText || '').trim();
            if (attrText) {
              renderedText = renderedText.replace(attrText, '');
            }
          }
        }
        collectMatches('innerText', root, renderedText);
      }

      // 2. Text nodes (excluding svg/script/style/noscript/template & Leaflet attribution; keep reachable .sr-only)
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        if (
          parent &&
          !parent.closest('svg, script, style, noscript, template, .leaflet-control-attribution')
        ) {
          const txt = node.nodeValue || '';
          if (txt.trim() && (isElVisible(parent) || isSrOnlyReachable(parent))) {
            collectMatches('textNode', parent, txt);
          }
        }
        node = walker.nextNode();
      }

      // 3. Visible attributes and interactive element text (excluding Leaflet attribution)
      const attrEls = root.querySelectorAll(
        'button, a, [role="button"], input, textarea, select, summary, [aria-label], [title], img[alt], .leaflet-marker-icon, .leaflet-popup-content'
      );
      for (const el of attrEls) {
        if (el.closest('.leaflet-control-attribution')) continue;
        if (!isElVisible(el) && !isSrOnlyReachable(el)) continue;
        for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
          const val = el.getAttribute(attr);
          if (val) collectMatches('attribute', el, val);
        }
        if (
          el instanceof HTMLElement &&
          (el.classList.contains('leaflet-marker-icon') ||
            el.classList.contains('leaflet-popup-content'))
        ) {
          collectMatches('innerText', el, el.innerText || '');
        }
      }

      return violations;
    },
    { selector: rootSelector, reSource: FORBIDDEN_EMOJI_OR_GLYPH_RE.source }
  );
}

async function assertZeroBottomNav(page: Page, contextLabel: string): Promise<void> {
  const bottomNavCheck = await page.evaluate(() => {
    const legacyCount = document.querySelectorAll('.mobile-bottom-nav').length;
    const fixedBottomNavs: string[] = [];
    const navs = document.querySelectorAll('nav, [role="navigation"]');
    for (const nav of navs) {
      const cs = window.getComputedStyle(nav);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) {
        continue;
      }
      const r = nav.getBoundingClientRect();
      if (r.width <= 0.5 || r.height <= 0.5) continue;
      if (
        cs.position === 'fixed' &&
        r.bottom >= window.innerHeight - 8 &&
        r.top >= window.innerHeight - 120
      ) {
        fixedBottomNavs.push(`${nav.tagName.toLowerCase()}.${nav.className}`);
      }
    }
    return { legacyCount, fixedBottomNavs };
  });

  expect(bottomNavCheck.legacyCount, `${contextLabel}: .mobile-bottom-nav must not exist`).toBe(0);
  expect(
    bottomNavCheck.fixedBottomNavs,
    `${contextLabel}: no fixed bottom navigation bar allowed`
  ).toEqual([]);
}

async function assertZeroHeaderShield(page: Page, contextLabel: string): Promise<void> {
  const shieldFindings = await page.evaluate(() => {
    const capsule = document.querySelector('header.top-nav .nav-capsule');
    if (!capsule) return ['missing .nav-capsule'];
    const issues: string[] = [];
    const text = capsule instanceof HTMLElement ? capsule.innerText : capsule.textContent || '';
    if (text.includes('🛡️') || text.includes('\u{1F6E1}')) {
      issues.push('shield emoji inside .nav-capsule');
    }
    const shieldEls = capsule.querySelectorAll(
      '.crisis-trigger, .crisis-pill, .crisis-mobile-fab, svg.lucide-shield, svg.lucide-shield-alert, svg.lucide-shield-check, [aria-label*="Krizov" i]'
    );
    if (shieldEls.length > 0) {
      issues.push(`shield/crisis control inside .nav-capsule (${shieldEls.length})`);
    }
    return issues;
  });
  expect(shieldFindings, `${contextLabel}: zero shield icon inside .nav-capsule`).toEqual([]);
}

async function assertZeroOverflow(page: Page, contextLabel: string): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const maxScroll = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
    return {
      hasOverflow: maxScroll > doc.clientWidth + 1,
      scrollWidth: maxScroll,
      clientWidth: doc.clientWidth
    };
  });
  expect(
    overflow.hasOverflow,
    `[Horizontal Overflow] ${contextLabel}: scrollWidth=${overflow.scrollWidth} > clientWidth=${overflow.clientWidth}`
  ).toBe(false);
}

async function detectHeaderAndMollyCollisions(page: Page): Promise<CollisionReport[]> {
  return page.evaluate(() => {
    type RectBox = { left: number; top: number; right: number; bottom: number; width: number; height: number };

    function isVisible(el: Element | null): el is Element {
      if (!el) return false;
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    function intersect(a: RectBox, b: RectBox, tol = 1.5): { overlapW: number; overlapH: number; area: number } | null {
      const overlapW = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapH = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (overlapW > tol && overlapH > tol) {
        return { overlapW, overlapH, area: overlapW * overlapH };
      }
      return null;
    }

    function tagLabel(el: Element): string {
      const id = el.id ? `#${el.id}` : '';
      const cls =
        typeof el.className === 'string' && el.className.trim()
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
      return `${el.tagName.toLowerCase()}${id}${cls}`;
    }

    const reports: CollisionReport[] = [];

    // 1. Header internals pairwise + containment inside .nav-capsule
    const capsule = document.querySelector('header.top-nav .nav-capsule');
    const mollyDock = document.querySelector('.molly-pelisek-dock');
    let mollyHandledInHeader = false;

    if (capsule && isVisible(capsule)) {
      const capRect = capsule.getBoundingClientRect();
      const headerPeers: Element[] = [];
      for (const sel of [
        'a.brand',
        'button.mobile-nav-toggle',
        'nav.nav-links'
      ]) {
        const el = capsule.querySelector(sel);
        if (el && isVisible(el)) headerPeers.push(el);
      }

      if (mollyDock && isVisible(mollyDock)) {
        const mdRect = mollyDock.getBoundingClientRect();
        if (capsule.contains(mollyDock) || mdRect.top < capRect.bottom + 8) {
          headerPeers.push(mollyDock);
          mollyHandledInHeader = true;
        }
      }

      for (let i = 0; i < headerPeers.length; i++) {
        const a = headerPeers[i];
        const ra = a.getBoundingClientRect();
        const isContained = capsule.contains(a);
        const topOverflow = isContained && ra.top < capRect.top - 2;
        if (
          ra.left < capRect.left - 2 ||
          ra.right > capRect.right + 2 ||
          ra.bottom > capRect.bottom + 3 ||
          topOverflow
        ) {
          reports.push({
            pair: `header-bounds:${tagLabel(a)}`,
            overlapW: Math.max(0, ra.right - capRect.right, capRect.left - ra.left),
            overlapH: Math.max(
              0,
              ra.bottom - capRect.bottom,
              isContained ? capRect.top - ra.top : 0
            ),
            area: 10
          });
        }
        for (let j = i + 1; j < headerPeers.length; j++) {
          const b = headerPeers[j];
          if (a.contains(b) || b.contains(a)) continue;
          const hit = intersect(ra, b.getBoundingClientRect(), 1.5);
          if (hit) {
            reports.push({
              pair: `header:${tagLabel(a)}<->${tagLabel(b)}`,
              ...hit
            });
          }
        }
      }

      const navLinks = capsule.querySelector('nav.nav-links');
      if (navLinks && isVisible(navLinks)) {
        const pills = Array.from(navLinks.querySelectorAll('.nav-pill, a')).filter(isVisible);
        for (let i = 0; i < pills.length; i++) {
          for (let j = i + 1; j < pills.length; j++) {
            if (pills[i].contains(pills[j]) || pills[j].contains(pills[i])) continue;
            const hit = intersect(
              pills[i].getBoundingClientRect(),
              pills[j].getBoundingClientRect(),
              1.5
            );
            if (hit) {
              reports.push({
                pair: `nav-pill:${tagLabel(pills[i])}<->${tagLabel(pills[j])}`,
                ...hit
              });
            }
          }
        }
      }
    }

    // 2. Molly actors & whisper bubbles vs page content / pagination / CTA / crisis
    const mollyActors = Array.from(
      document.querySelectorAll('.molly-roaming-actor, .molly-whisper-bubble, .molly-dock-whisper')
    ).filter(isVisible);
    if (!mollyHandledInHeader && mollyDock && isVisible(mollyDock)) {
      mollyActors.push(mollyDock);
    }

    const targets = Array.from(
      document.querySelectorAll(
        [
          '.instant-card .btn-studio-primary',
          '.instant-card .btn-studio-done',
          '.instant-card .cycle-btn',
          '.instant-card .energy-tab',
          '.instant-card details.how-toggle summary',
          '.instant-card h1',
          '.instant-card h2',
          '.instant-card p',
          '.deck-header-bar',
          '.deck-indicator',
          '.deck-nav-prev',
          '.deck-nav-next',
          '.crisis-trigger',
          '.crisis-mobile-fab',
          'main h1',
          'main button',
          'main a.btn-studio-primary',
          '.site-footer .footer-brand',
          '.site-footer .footer-desc',
          '.site-footer .footer-heading',
          '.map-frame'
        ].join(', ')
      )
    ).filter(isVisible);

    for (const actor of mollyActors) {
      const ra = actor.getBoundingClientRect();
      for (const target of targets) {
        if (actor.contains(target) || target.contains(actor)) continue;
        if (target.closest('.molly-companion-layer')) continue;
        const hit = intersect(ra, target.getBoundingClientRect(), 1.5);
        if (hit) {
          reports.push({
            pair: `molly:${tagLabel(actor)}<->${tagLabel(target)}`,
            ...hit
          });
        }
      }
    }

    return reports;
  });
}

async function assertMobileTouchTargets(page: Page, contextLabel: string): Promise<number> {
  const result = await page.evaluate(() => {
    function isVisible(el: Element): boolean {
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    const selector = [
      'button',
      '[role="button"]',
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"])',
      'select',
      'textarea',
      'summary',
      'a.brand',
      'a.nav-pill',
      'a.mobile-drawer-link',
      'a.btn-studio-primary',
      'a.hero-btn',
      'a.fc-btn',
      'a.card',
      'a.q-pill',
      '.energy-tab',
      '.filter-chip',
      '.deck-nav-btn',
      '.molly-dock-pet-btn',
      '.molly-dock-toggle-btn',
      '.crisis-trigger',
      '.crisis-mobile-fab',
      'a'
    ].join(', ');

    const seen = new Set<Element>();
    const failures: Array<{ desc: string; width: number; height: number }> = [];
    let checkedCount = 0;

    for (const el of document.querySelectorAll(selector)) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (!isVisible(el)) continue;
      if (el.closest('.hp') || el.id === 'hp_company') continue;

      // Skip inline prose links inside body copy/lists/footer metadata
      if (
        el.tagName === 'A' &&
        !el.classList.contains('brand') &&
        !el.classList.contains('nav-pill') &&
        !el.classList.contains('mobile-drawer-link') &&
        !el.classList.contains('btn-studio-primary') &&
        !el.classList.contains('hero-btn') &&
        !el.classList.contains('fc-btn') &&
        !el.classList.contains('card') &&
        !el.classList.contains('q-pill') &&
        !el.classList.contains('energy-tab') &&
        !el.classList.contains('filter-chip') &&
        !el.classList.contains('deck-nav-btn') &&
        !el.classList.contains('crisis-trigger') &&
        !el.closest('#mobile-top-nav-drawer') &&
        el.closest('p, li, .footer-links, .verify-meta, .molly-celebration-note')
      ) {
        continue;
      }

      // Leaflet map attribution links are third-party library chrome inside .leaflet-control-attribution
      if (el.closest('.leaflet-control-attribution')) continue;

      checkedCount += 1;
      const r = el.getBoundingClientRect();
      if (r.width < 43.5 || r.height < 43.5) {
        const text = (el instanceof HTMLElement ? el.innerText : el.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 30);
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
        failures.push({
          desc: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}("${text}")`,
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10
        });
      }
    }

    return { checkedCount, failures };
  });

  expect(
    result.checkedCount,
    `[Touch Target] ${contextLabel}: expected at least 1 visible interactive control`
  ).toBeGreaterThan(0);
  expect(
    result.failures,
    `[Touch Target < 44x44px] ${contextLabel}: ${JSON.stringify(result.failures)}`
  ).toEqual([]);
  return result.checkedCount;
}

async function assertMobileInputFontSizes(page: Page, contextLabel: string): Promise<number> {
  const result = await page.evaluate(() => {
    function isVisible(el: Element): boolean {
      if (el.closest('details:not([open])') && !el.closest('summary')) return false;
      let cur: Element | null = el;
      while (cur && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (
          cs.display === 'none' ||
          cs.visibility === 'hidden' ||
          parseFloat(cs.opacity) <= 0.01
        ) {
          return false;
        }
        cur = cur.parentElement;
      }
      const r = el.getBoundingClientRect();
      return r.width > 0.5 && r.height > 0.5;
    }

    const failures: Array<{ desc: string; fontSize: number }> = [];
    let checkedCount = 0;
    const fields = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select'
    );
    for (const el of fields) {
      if (el.closest('.hp') || el.id === 'hp_company') continue;
      if (!isVisible(el)) continue;
      checkedCount += 1;
      const fs = parseFloat(window.getComputedStyle(el).fontSize);
      if (Number.isNaN(fs) || fs < 16) {
        const cls =
          typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
        failures.push({
          desc: `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls}`,
          fontSize: fs
        });
      }
    }
    return { checkedCount, failures };
  });

  expect(
    result.checkedCount,
    `[Input font-size] ${contextLabel}: expected at least 1 visible input/textarea/select`
  ).toBeGreaterThan(0);
  expect(
    result.failures,
    `[Input font-size < 16px] ${contextLabel}: ${JSON.stringify(result.failures)}`
  ).toEqual([]);
  return result.checkedCount;
}

async function assertNoFomoOrJargon(page: Page, routePath: string, contextLabel: string): Promise<void> {
  const check = await page.evaluate(() => {
    const ambientCount = document.querySelectorAll('.ambient-pulse-pill').length;
    const bodyText = document.body.innerText || '';
    const hasLegacyDukazy = /\bDůkazy\s+[ABC]\b/i.test(bodyText);
    const hasLegacySilne = /\bSilné důkazy\b/i.test(bodyText);
    const hasOverenyDopad = bodyText.includes('Ověřený dopad');
    return { ambientCount, hasLegacyDukazy, hasLegacySilne, hasOverenyDopad };
  });

  expect(check.ambientCount, `${contextLabel}: zero .ambient-pulse-pill`).toBe(0);
  expect(check.hasLegacyDukazy, `${contextLabel}: forbidden "Důkazy A/B/C" jargon`).toBe(false);
  expect(check.hasLegacySilne, `${contextLabel}: forbidden "Silné důkazy" jargon`).toBe(false);
  if (routePath === '/app/online') {
    expect(check.hasOverenyDopad, `${contextLabel}: must contain "Ověřený dopad"`).toBe(true);
  }
}

async function clickFirstVisible(locator: Locator): Promise<boolean> {
  const count = await locator.count();
  for (let i = 0; i < count; i++) {
    const item = locator.nth(i);
    if (await item.isVisible()) {
      await item.click();
      return true;
    }
  }
  return false;
}

// ============================================================================
// TIER 1: CORE CONTRACT MATRIX (All 7 Routes x 3 Viewports = 21 Cells)
// ============================================================================

test.describe('Tier 1: Core UI/UX Rebuild Contract Matrix (7 Routes x 3 Viewports)', () => {
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      test(`T1 [${route.slug} @ ${vp.name}]: 0 emojis, top-only nav, 0 collisions, 0 overflow, 0 errors`, async ({
        page
      }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const errors = await setupPageEnvironment(page);
        await gotoHydrated(page, route.path);

        const label = `${route.path} @ ${vp.name}`;

        // T1-1: Zero native Unicode emojis / decorative symbols + SVG icon rendering
        const emojiViolations = await scanForbiddenEmojis(page);
        expect(
          emojiViolations,
          `[Emoji/Glyph Violation] ${label}: ${JSON.stringify(emojiViolations)}`
        ).toEqual([]);

        const headerSvgCount = await page.locator('header.top-nav svg').count();
        expect(headerSvgCount, `${label}: header must render SVG icons`).toBeGreaterThan(0);

        // T1-2: Zero .mobile-bottom-nav and zero fixed bottom <nav>
        await assertZeroBottomNav(page, label);

        // T2-7: Zero shield icon inside .nav-capsule
        await assertZeroHeaderShield(page, label);

        // T1-3: Home mobile above-the-fold (360x800, 375x667)
        if (route.path === '/' && vp.isMobile) {
          const foldMetrics = await page.evaluate(() => {
            const header = document.querySelector('header.top-nav');
            const card = document.querySelector('.instant-card');
            const cta = document.querySelector('.instant-card .btn-studio-primary');
            const how = document.querySelector('.instant-card details.how-toggle') as HTMLDetailsElement | null;
            return {
              headerBottom: header ? header.getBoundingClientRect().bottom : 0,
              cardTop: card ? card.getBoundingClientRect().top : -1,
              cardVisible: Boolean(card && window.getComputedStyle(card).display !== 'none'),
              ctaBottom: cta ? cta.getBoundingClientRect().bottom : 99999,
              ctaVisible: Boolean(cta && cta.getBoundingClientRect().height > 0),
              howExists: Boolean(how),
              howOpen: Boolean(how?.open)
            };
          });

          expect(foldMetrics.cardVisible, `${label}: .instant-card must be visible`).toBe(true);
          expect(foldMetrics.ctaVisible, `${label}: primary CTA must be visible`).toBe(true);
          expect(
            foldMetrics.cardTop,
            `${label}: card top must sit below header bottom`
          ).toBeGreaterThanOrEqual(foldMetrics.headerBottom - 1);
          expect(
            foldMetrics.ctaBottom,
            `${label}: primary CTA bottom (${foldMetrics.ctaBottom}px) must fit above fold (${vp.height}px)`
          ).toBeLessThanOrEqual(vp.height);
          expect(foldMetrics.howExists, `${label}: details.how-toggle must exist`).toBe(true);
          expect(foldMetrics.howOpen, `${label}: details.how-toggle must start collapsed`).toBe(false);

          const cardSvgCount = await page.locator('.instant-card svg').count();
          expect(cardSvgCount, `${label}: .instant-card must render SVG icons`).toBeGreaterThan(0);
        }

        // T1-4: Zero bounding-box collisions in header & Molly vs page controls
        const collisions = await detectHeaderAndMollyCollisions(page);
        expect(
          collisions,
          `[Collisions] ${label}: ${JSON.stringify(collisions)}`
        ).toEqual([]);

        // T1-5: Zero horizontal overflow & zero console/page errors
        await assertZeroOverflow(page, label);
        assertZeroRuntimeErrors(errors, label);

        // T1-6: No FOMO ambient pills & no Důkazy A/B/C jargon
        await assertNoFomoOrJargon(page, route.path, label);

        // T1-7: Unified 1140px max-width centered container on desktop 1440x900
        if (!vp.isMobile) {
          const layoutMetrics = await page.evaluate((currentPath) => {
            function measure(el: Element | null) {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              const cs = window.getComputedStyle(el);
              return {
                width: Math.round(r.width * 10) / 10,
                left: Math.round(r.left * 10) / 10,
                rightDiff: Math.round((window.innerWidth - r.right) * 10) / 10,
                maxWidth: cs.maxWidth
              };
            }

            const capsule = document.querySelector('header.top-nav .nav-capsule');
            const footerInner = document.querySelector('footer.site-footer .footer-inner');
            const heroInner = currentPath === '/' ? document.querySelector('.hero-inner') : null;
            const homeContentWrap =
              currentPath === '/' ? document.querySelector('.content-wrap') : null;
            const subpageWrap =
              currentPath !== '/' && currentPath !== '/svet'
                ? document.querySelector('main .app-page, main .near-page, main .page, .content-wrap')
                : null;

            return {
              capsule: measure(capsule),
              footerInner: measure(footerInner),
              heroInner: measure(heroInner),
              homeContentWrap: measure(homeContentWrap),
              subpageWrap: measure(subpageWrap)
            };
          }, route.path);

          expect(layoutMetrics.capsule, `${label}: .nav-capsule must exist`).not.toBeNull();
          expect(layoutMetrics.capsule!.width).toBeLessThanOrEqual(1140 + 48);
          expect(
            Math.abs(layoutMetrics.capsule!.left - layoutMetrics.capsule!.rightDiff)
          ).toBeLessThanOrEqual(6);

          expect(layoutMetrics.footerInner, `${label}: .footer-inner must exist`).not.toBeNull();
          expect(layoutMetrics.footerInner!.width).toBeLessThanOrEqual(1140 + 48);
          expect(
            Math.abs(layoutMetrics.footerInner!.left - layoutMetrics.footerInner!.rightDiff)
          ).toBeLessThanOrEqual(6);

          if (route.path === '/') {
            expect(layoutMetrics.heroInner, `${label}: .hero-inner must exist`).not.toBeNull();
            expect(layoutMetrics.heroInner!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(layoutMetrics.heroInner!.left - layoutMetrics.heroInner!.rightDiff)
            ).toBeLessThanOrEqual(6);

            expect(
              layoutMetrics.homeContentWrap,
              `${label}: .content-wrap must exist`
            ).not.toBeNull();
            expect(layoutMetrics.homeContentWrap!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(
                layoutMetrics.homeContentWrap!.left - layoutMetrics.homeContentWrap!.rightDiff
              )
            ).toBeLessThanOrEqual(6);
          } else if (route.path !== '/svet') {
            expect(
              layoutMetrics.subpageWrap,
              `${label}: subpage container must exist`
            ).not.toBeNull();
            expect(layoutMetrics.subpageWrap!.width).toBeLessThanOrEqual(1140 + 48);
            expect(
              Math.abs(layoutMetrics.subpageWrap!.left - layoutMetrics.subpageWrap!.rightDiff)
            ).toBeLessThanOrEqual(6);
          }
        }
      });
    }
  }
});

// ============================================================================
// TIER 2: CATEGORY-PARTITION & BOUNDARY VALUE ANALYSIS (BVA)
// ============================================================================

test.describe('Tier 2: Breakpoints, Fold Budget, Touch Targets & Mobile Inputs', () => {
  test('T2-1: Header breakpoint BVA (360, 680, 681, 1024 vs 1025, 1440)', async ({ page }) => {
    const errors = await setupPageEnvironment(page);
    const widths = [360, 680, 681, 1024, 1025, 1440];

    await gotoHydrated(page, '/');

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      const label = `breakpoint ${width}px`;
      await assertZeroBottomNav(page, label);
      await assertZeroOverflow(page, label);
      await assertZeroHeaderShield(page, label);

      const state = await page.evaluate(() => {
        const toggle = document.querySelector('button.mobile-nav-toggle');
        const links = document.querySelector('nav.nav-links');
        const mollyDock = document.querySelector('.molly-pelisek-dock');
        const toggleVisible = Boolean(
          toggle &&
            window.getComputedStyle(toggle).display !== 'none' &&
            toggle.getBoundingClientRect().width > 0
        );
        const toggleRect = toggle ? toggle.getBoundingClientRect() : null;
        const linksVisible = Boolean(
          links &&
            window.getComputedStyle(links).display !== 'none' &&
            links.getBoundingClientRect().width > 0
        );
        const linksOverflow = links ? links.scrollWidth > links.clientWidth + 1 : false;
        const linkHrefs = links
          ? Array.from(links.querySelectorAll('a')).map((a) => a.getAttribute('href') || '')
          : [];
        const mollyDisplay = mollyDock ? window.getComputedStyle(mollyDock).display : 'missing';
        return {
          toggleVisible,
          toggleWidth: toggleRect?.width ?? 0,
          toggleHeight: toggleRect?.height ?? 0,
          linksVisible,
          linksOverflow,
          linkHrefs,
          mollyDisplay
        };
      });

      expect(state.mollyDisplay, `${label}: .molly-pelisek-dock must never be display:none`).not.toBe(
        'none'
      );
      expect(state.mollyDisplay, `${label}: .molly-pelisek-dock must exist`).not.toBe('missing');

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${label}: header collisions ${JSON.stringify(collisions)}`).toEqual([]);

      if (width <= 1024) {
        expect(state.toggleVisible, `${label}: .mobile-nav-toggle must be visible`).toBe(true);
        expect(state.toggleWidth, `${label}: toggle width >= 44`).toBeGreaterThanOrEqual(43.5);
        expect(state.toggleHeight, `${label}: toggle height >= 44`).toBeGreaterThanOrEqual(43.5);
        expect(state.linksVisible, `${label}: desktop .nav-links must be hidden`).toBe(false);
      } else {
        expect(state.toggleVisible, `${label}: .mobile-nav-toggle must be hidden`).toBe(false);
        expect(state.linksVisible, `${label}: desktop .nav-links must be visible`).toBe(true);
        expect(state.linksOverflow, `${label}: .nav-links must not overflow`).toBe(false);
        for (const href of NAV_ROUTE_HREFS) {
          expect(state.linkHrefs, `${label}: desktop nav must contain ${href}`).toContain(href);
        }
      }
    }

    assertZeroRuntimeErrors(errors, 'T2-1');
  });

  test('T2-2: Tightest mobile fold budget on / at 375x667', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const fold = await page.evaluate(() => {
      const preview = document.querySelector('.instant-card .deed-preview-stage');
      const cta = document.querySelector('.instant-card .btn-studio-primary');
      const how = document.querySelector('.instant-card details.how-toggle') as HTMLDetailsElement | null;
      const header = document.querySelector('header.top-nav');
      const card = document.querySelector('.instant-card');
      return {
        previewVisible: Boolean(preview && preview.getBoundingClientRect().height > 0),
        ctaBottom: cta ? cta.getBoundingClientRect().bottom : 9999,
        howExists: Boolean(how),
        howOpen: Boolean(how?.open),
        headerBottom: header ? header.getBoundingClientRect().bottom : 0,
        cardTop: card ? card.getBoundingClientRect().top : -1
      };
    });

    expect(fold.previewVisible).toBe(true);
    expect(fold.howExists).toBe(true);
    expect(fold.howOpen).toBe(false);
    expect(fold.cardTop).toBeGreaterThanOrEqual(fold.headerBottom - 1);
    expect(fold.ctaBottom).toBeLessThanOrEqual(667);

    const collisions = await detectHeaderAndMollyCollisions(page);
    expect(collisions).toEqual([]);
    assertZeroRuntimeErrors(errors, 'T2-2');
  });

  test('T2-3: Touch target minimum (>= 44x44px) across all 7 routes on 360x800 & 375x667', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of ROUTES) {
        await gotoHydrated(page, route.path);
        const checked = await assertMobileTouchTargets(page, `${route.path} @ ${vp.name}`);
        expect(checked, `${route.path} @ ${vp.name}: touch targets checked`).toBeGreaterThan(0);
      }
    }

    assertZeroRuntimeErrors(errors, 'T2-3');
  });

  test('T2-4: Mobile input font-size >= 16px across default & conditional drawers/modals', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of VIEWPORTS.filter((v) => v.isMobile)) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // /app/guided -> activate walk situation (or open details.local-drawer) so #guided-city-select is visible
      await gotoHydrated(page, '/app/guided');
      const walkCard = page.locator('.situation-card', { hasText: /procházce/i }).first();
      if (await walkCard.isVisible()) {
        await walkCard.click();
      } else {
        const localSummary = page.locator('details.local-drawer > summary').first();
        await expect(localSummary).toBeVisible();
        await localSummary.click();
      }
      await expect(page.locator('#guided-city-select')).toBeVisible();
      const guidedCount = await assertMobileInputFontSizes(
        page,
        `/app/guided (local drawer open) @ ${vp.name}`
      );
      expect(guidedCount).toBeGreaterThan(0);

      // /app/online -> #online-search
      await gotoHydrated(page, '/app/online');
      await expect(page.locator('#online-search')).toBeVisible();
      const onlineCount = await assertMobileInputFontSizes(page, `/app/online @ ${vp.name}`);
      expect(onlineCount).toBeGreaterThan(0);

      // /near -> expand any collapsed filter <details> drawers, then verify #near-location-query & selects
      await gotoHydrated(page, '/near');
      const nearSummaries = page.locator('main details > summary');
      const nearSumCount = await nearSummaries.count();
      for (let i = 0; i < nearSumCount; i++) {
        const s = nearSummaries.nth(i);
        if (await s.isVisible()) {
          const isOpen = await s.evaluate(
            (el) => Boolean((el.parentElement as HTMLDetailsElement | null)?.open)
          );
          if (!isOpen) await s.click();
        }
      }
      await expect(page.locator('#near-location-query')).toBeVisible();
      const nearCount = await assertMobileInputFontSizes(page, `/near @ ${vp.name}`);
      expect(nearCount).toBeGreaterThan(0);

      // /svet -> #ritual-deed-input + ProgressDashboard journal drawer (#backup-code-input)
      await gotoHydrated(page, '/svet');
      await expect(page.locator('#ritual-deed-input')).toBeVisible();
      const drawers = page.locator('.optional-drawers details.calm-drawer > summary');
      const dCount = await drawers.count();
      expect(dCount, `/svet @ ${vp.name}: calm-drawer summaries must exist`).toBeGreaterThan(0);
      const backupInput = page.locator('#backup-code-input');
      if (!(await backupInput.isVisible())) {
        for (let i = 0; i < dCount; i++) {
          await drawers.nth(i).click();
        }
      }
      await expect(backupInput).toBeVisible();
      const svetCount = await assertMobileInputFontSizes(
        page,
        `/svet (journal drawer open) @ ${vp.name}`
      );
      expect(svetCount).toBeGreaterThanOrEqual(2);

      // /submit -> default org inputs + Sousedská akce (#event_url, #event_start, #event_end) + optional-fields (#website, #email)
      await gotoHydrated(page, '/submit');
      const submitOrgCount = await assertMobileInputFontSizes(page, `/submit org @ ${vp.name}`);
      expect(submitOrgCount).toBeGreaterThan(0);
      const eventTab = page.locator('.tab', { hasText: /Sousedská akce/i });
      await expect(eventTab).toBeVisible();
      await eventTab.click();
      await expect(page.locator('#event_url')).toBeVisible();

      const optionalSummary = page.locator('details.optional-fields > summary');
      await expect(optionalSummary).toBeVisible();
      const optOpen = await optionalSummary.evaluate(
        (el) => Boolean((el.parentElement as HTMLDetailsElement | null)?.open)
      );
      if (!optOpen) {
        await optionalSummary.click();
      }
      await expect(page.locator('#website')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      const submitEventCount = await assertMobileInputFontSizes(
        page,
        `/submit event + optional @ ${vp.name}`
      );
      expect(submitEventCount).toBeGreaterThanOrEqual(4);

      // Global FeedbackModal -> #fb-textarea
      await page.locator('button.mobile-nav-toggle').click();
      await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Napsat názor/i }).click();
      await expect(page.locator('#fb-textarea')).toBeVisible();
      const fbCount = await assertMobileInputFontSizes(page, `FeedbackModal @ ${vp.name}`);
      expect(fbCount).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
    }

    assertZeroRuntimeErrors(errors, 'T2-4');
  });

  test('T2-5: SwipeDeck pagination boundaries & zero Molly overlap on /', async ({ page }) => {
    const errors = await setupPageEnvironment(page);

    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/');

      const indicator = page.locator('.deck-indicator').first();
      await expect(indicator).toBeVisible();
      const initialText = (await indicator.innerText()).trim();
      const match = initialText.match(/(\d+)\s*\/\s*(\d+)/);
      expect(match, `Unexpected deck indicator format: "${initialText}"`).not.toBeNull();
      const total = Number(match![2]);
      expect(total).toBeGreaterThan(1);
      expect(Number(match![1])).toBe(1);

      await page.locator('.deck-nav-next').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`2 / ${total}`);

      await page.locator('.deck-nav-prev').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`1 / ${total}`);

      // Wrap backwards from 1 / N -> N / N
      await page.locator('.deck-nav-prev').first().click();
      await page.waitForTimeout(200);
      await expect(indicator).toContainText(`${total} / ${total}`);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `Deck wrap @ ${vp.name}: ${JSON.stringify(collisions)}`).toEqual([]);
    }

    assertZeroRuntimeErrors(errors, 'T2-5');
  });

  test('T2-6: /svet legend strip & stationary "Jak to funguje" toggle invariant', async ({
    page
  }) => {
    const errors = await setupPageEnvironment(page);

    for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/svet');

      const legendStrip = page.locator('.sanctuary-legend-strip');
      await expect(legendStrip).toBeVisible();
      if (!vp.isMobile) {
        const legendBox = await legendStrip.boundingBox();
        expect(legendBox).not.toBeNull();
        expect(legendBox!.height).toBeLessThanOrEqual(52);
      }

      const guideSummary = page.locator('summary.guide-toggle-summary');
      await expect(guideSummary).toBeVisible();
      const beforeBox = await guideSummary.boundingBox();
      expect(beforeBox).not.toBeNull();

      await guideSummary.click();
      await expect(page.locator('#sanctuary-guide-panel')).toBeVisible();

      const afterBox = await guideSummary.boundingBox();
      expect(afterBox).not.toBeNull();
      expect(
        Math.abs(afterBox!.y - beforeBox!.y),
        `Toggle shifted vertically at ${vp.name}`
      ).toBeLessThanOrEqual(2.5);
      expect(
        Math.abs(afterBox!.x - beforeBox!.x),
        `Toggle shifted horizontally at ${vp.name}`
      ).toBeLessThanOrEqual(2.5);

      const emojiViolations = await scanForbiddenEmojis(page);
      expect(emojiViolations).toEqual([]);
    }

    assertZeroRuntimeErrors(errors, 'T2-6');
  });
});

// ============================================================================
// TIER 3: PAIRWISE COMBINATORIAL & INTERACTIVE STATE MATRIX
// ============================================================================

test.describe('Tier 3: Pairwise Interactive State & Component Matrix', () => {
  test('T3-1: (/ x 360x800 x Drawer Open) 6 routes + Crisis + Feedback + navigation', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const toggle = page.locator('button.mobile-nav-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const drawer = page.locator('#mobile-top-nav-drawer');
    await expect(drawer).toBeVisible();

    const headerBox = await page.locator('header.top-nav').boundingBox();
    const drawerBox = await drawer.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(drawerBox).not.toBeNull();
    expect(drawerBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);

    for (const href of NAV_ROUTE_HREFS) {
      await expect(drawer.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(drawer).toContainText('Tichá opora 24/7');
    await expect(drawer).toContainText('Napsat názor');

    const drawerEmoji = await scanForbiddenEmojis(page, '#mobile-top-nav-drawer');
    expect(drawerEmoji).toEqual([]);
    await assertMobileTouchTargets(page, 'mobile drawer open');
    await assertZeroOverflow(page, 'mobile drawer open');

    await drawer.locator('a[href="/near"]').click();
    await page.waitForURL('**/near');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toBeHidden();

    assertZeroRuntimeErrors(errors, 'T3-1');
  });

  test('T3-2: (/ x 375x667 x Two-Phase Card Anticipation -> Payoff)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const card = page.locator('.instant-card').first();
    await expect(card.locator('canvas.preview-diorama-canvas')).toBeVisible();
    await expect(card.locator('.btn-studio-done')).toHaveCount(0);

    const howToggle = card.locator('details.how-toggle');
    await expect(howToggle).not.toHaveAttribute('open', '');
    await howToggle.locator('summary').click();
    await expect(howToggle).toHaveAttribute('open', '');
    await expect(howToggle).toContainText('Ověřený dopad');
    await expect(howToggle).toContainText(/Sdílet odkaz/i);
    await expect(howToggle).toContainText(/Nahlásit chybu/i);

    const detailsEmoji = await scanForbiddenEmojis(page, '.instant-card');
    expect(detailsEmoji).toEqual([]);

    // Start the deed -> unlocks .btn-studio-done and .impact-payoff-canvas
    await card.locator('.btn-studio-primary').click();
    const doneBtn = card.locator('.btn-studio-done');
    await expect(doneBtn).toBeVisible();
    const doneBox = await doneBtn.boundingBox();
    expect(doneBox).not.toBeNull();
    expect(doneBox!.height).toBeGreaterThanOrEqual(43.5);
    await expect(card.locator('canvas.impact-payoff-canvas')).toBeVisible();

    const startedEmoji = await scanForbiddenEmojis(page, '.instant-card');
    expect(startedEmoji).toEqual([]);

    // Complete deed -> unlocks celebration / payoff cleanly
    await doneBtn.click();
    await page.waitForTimeout(300);
    await expect(card.locator('.inline-celebration-card, .molly-celebration-note').first()).toBeVisible();

    const postEmoji = await scanForbiddenEmojis(page);
    expect(postEmoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-2 post-completion');
    assertZeroRuntimeErrors(errors, 'T3-2');
  });

  test('T3-3: (/ x 360x800 x Molly Roaming vs Docked & Whisper)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const petBtn = page.locator('.molly-dock-pet-btn');
    await expect(petBtn).toBeVisible();
    await petBtn.click();
    await page.waitForTimeout(250);

    const whisper = page.locator('.molly-whisper-bubble, .molly-dock-whisper').first();
    await expect(whisper).toBeVisible();
    const headerBox = await page.locator('header.top-nav').boundingBox();
    const whisperBox = await whisper.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(whisperBox).not.toBeNull();
    expect(whisperBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 2);

    const collisions = await detectHeaderAndMollyCollisions(page);
    expect(collisions).toEqual([]);

    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);

    // Toggle docked mode ("Pelíšek")
    const dockToggle = page.locator('.molly-dock-toggle-btn');
    await dockToggle.click();
    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-mode', 'docked');
    const postDockCollisions = await detectHeaderAndMollyCollisions(page);
    expect(postDockCollisions).toEqual([]);

    assertZeroRuntimeErrors(errors, 'T3-3');
  });

  test('T3-4: (/app/online x 360x800 x Filter + Search + Details)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/app/online');

    const evidenceFilter = page.locator('.filter-chip', { hasText: 'Ověřený dopad (A)' });
    await expect(evidenceFilter).toBeVisible();
    await evidenceFilter.click();

    const search = page.locator('#online-search');
    await search.fill('útulek');
    await page.waitForTimeout(200);

    await assertMobileInputFontSizes(page, 'T3-4 /app/online');
    await assertNoFomoOrJargon(page, '/app/online', 'T3-4 /app/online');
    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-4 /app/online');
    assertZeroRuntimeErrors(errors, 'T3-4');
  });

  test('T3-5: (/app/guided x 375x667 x Situation + City Select + Recommendation)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/app/guided');

    const walkBtn = page.locator('.situation-card', { hasText: /procházce/i }).first();
    await walkBtn.click();
    await expect(page.locator('#guided-city-select')).toBeVisible();

    const howToggle = page.locator('#personal-plan details.how-toggle').first();
    if (await howToggle.isVisible()) {
      await howToggle.locator('summary').click();
    }

    await assertMobileInputFontSizes(page, 'T3-5 /app/guided');
    await assertNoFomoOrJargon(page, '/app/guided', 'T3-5 /app/guided');
    const emoji = await scanForbiddenEmojis(page);
    expect(emoji).toEqual([]);
    await assertZeroOverflow(page, 'T3-5 /app/guided');
    assertZeroRuntimeErrors(errors, 'T3-5');
  });

  test('T3-6: (/near x 360x800 x Mobile Controls + Leaflet SVG Pins + PlaceCard)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/near');

    // Verify "+ Přidat" and "Sdílet výřez" are accessible on mobile with >= 44x44 targets
    const addLink = page.locator('main a[href="/submit"]', { hasText: /Přidat/i }).first();
    const shareViewBtn = page.locator('main button', { hasText: /Sdílet/i }).first();
    await expect(addLink).toBeVisible();
    await expect(shareViewBtn).toBeVisible();

    const addBox = await addLink.boundingBox();
    const shareBox = await shareViewBtn.boundingBox();
    expect(addBox!.height).toBeGreaterThanOrEqual(43.5);
    expect(shareBox!.height).toBeGreaterThanOrEqual(43.5);

    // Verify list view PlaceCards have 0 emojis
    await expect(page.locator('.place-card').first()).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);

    // Switch to Mapa tab -> verify Leaflet renders SVG pin icons without emojis
    const mapTab = page.locator('.mobile-tabs button', { hasText: /Mapa/i }).first();
    await mapTab.click();
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
    await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 5000 });

    const markerSvgCount = await page.locator('.leaflet-marker-icon svg').count();
    expect(markerSvgCount, '/near Leaflet markers must use SVG icons').toBeGreaterThan(0);

    const mapEmojis = await scanForbiddenEmojis(page);
    expect(mapEmojis).toEqual([]);
    await assertZeroOverflow(page, 'T3-6 /near map');
    assertZeroRuntimeErrors(errors, 'T3-6');
  });

  test('T3-7: (/svet x 360x800 x Atmosphere Controls + Lake Handover + RitualBar)', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/svet');

    await expect(page.locator('.molly-companion-layer')).toHaveAttribute('data-molly-home', 'lake');
    await expect
      .poll(
        async () => {
          return page.evaluate(() => {
            const actor = document.querySelector('.molly-roaming-actor');
            if (!actor) return true;
            const cs = window.getComputedStyle(actor);
            return (
              cs.display === 'none' ||
              cs.visibility === 'hidden' ||
              parseFloat(cs.opacity) <= 0.01
            );
          });
        },
        { timeout: 5000 }
      )
      .toBe(true);

    // Verify .atmosphere-controls presence, touch targets, and non-overlap against legend strip
    await expect(page.locator('.atmosphere-controls')).toBeVisible();
    await expect(page.locator('.sanctuary-legend-strip')).toBeVisible();
    const atmoOverlap = await page.evaluate(() => {
      const atmo = document.querySelector('.atmosphere-controls');
      const legend = document.querySelector('.sanctuary-legend-strip');
      if (!atmo || !legend) return true;
      const a = atmo.getBoundingClientRect();
      const l = legend.getBoundingClientRect();
      return Math.min(a.right, l.right) - Math.max(a.left, l.left) > 1.5 &&
        Math.min(a.bottom, l.bottom) - Math.max(a.top, l.top) > 1.5;
    });
    expect(atmoOverlap).toBe(false);

    await assertMobileTouchTargets(page, 'T3-7 /svet');
    await assertMobileInputFontSizes(page, 'T3-7 /svet');

    // Open DeedInspectorModal via .explore-deed-btn and check for zero emojis
    await page.locator('.explore-deed-btn').click();
    await expect(page.locator('.memory-whisper[role="dialog"]')).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertZeroOverflow(page, 'T3-7 /svet modal');
    assertZeroRuntimeErrors(errors, 'T3-7');
  });

  test('T3-8: (/submit x 360x800 x Tabs, Inputs >= 16px & Quick Pills)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/submit');

    await assertMobileInputFontSizes(page, 'T3-8 org');
    await page.locator('.tab', { hasText: /Sousedská akce/i }).click();
    await page.locator('details.optional-fields > summary').click();
    await assertMobileInputFontSizes(page, 'T3-8 event + optional');
    await assertMobileTouchTargets(page, 'T3-8');

    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertZeroOverflow(page, 'T3-8');
    assertZeroRuntimeErrors(errors, 'T3-8');
  });

  test('T3-9: (Global Modals x 360x800 x ImmediateHelp & FeedbackModal)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    // 1. ImmediateHelp modal via mobile nav drawer (closes via .close-btn)
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Tichá opora 24\/7/i }).click();
    const crisisDialog = page.locator('[role="dialog"][aria-label*="Krizov" i], .crisis-panel[role="dialog"]').first();
    await expect(crisisDialog).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertMobileTouchTargets(page, 'ImmediateHelp modal');
    await assertZeroOverflow(page, 'ImmediateHelp modal');
    await crisisDialog.locator('.close-btn').click();
    await expect(crisisDialog).toBeHidden();

    // 2. FeedbackModal via mobile nav drawer
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer').getByRole('button', { name: /Napsat názor/i }).click();
    const fbDialog = page.locator('[role="dialog"][aria-labelledby="fb-title"]');
    await expect(fbDialog).toBeVisible();
    await expect(page.locator('#fb-textarea')).toBeVisible();
    expect(await scanForbiddenEmojis(page)).toEqual([]);
    await assertMobileInputFontSizes(page, 'FeedbackModal');
    await assertMobileTouchTargets(page, 'FeedbackModal');
    await assertZeroOverflow(page, 'FeedbackModal');
    await page.keyboard.press('Escape');
    await expect(fbDialog).toBeHidden();

    assertZeroRuntimeErrors(errors, 'T3-9');
  });

  test('T3-10: (/near x Desktop & Mobile) Zero popup clipping, zero "Jemný podklad" overlap, active sheet outside map', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Desktop (1440x900 & 1025x800): "Na mapě" and direct pin click keep .leaflet-popup 100% inside .leaflet-container
    //    with zero overlap against .tile-switch-btn ("Jemný podklad") or .leaflet-control-zoom, and .map-active-sheet hidden.
    for (const vp of [
      { width: 1440, height: 900, label: '1440x900' },
      { width: 1025, height: 800, label: '1025x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/near');
      await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10_000 });
      await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 5000 });

      const cards = page.locator('.places-stack .place-card');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        await cards.nth(i).locator('button', { hasText: 'Na mapě' }).click();
        await page.waitForTimeout(200);

        await expect(page.locator('.leaflet-popup')).toBeVisible();
        await expect(page.locator('.map-active-sheet')).toBeHidden();
        await expect(page.locator('.search-area-btn')).toHaveCount(0);

        const popupGeo = await page.evaluate(() => {
          const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
          const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
          const closeBtn = document.querySelector('.leaflet-popup-close-button')?.getBoundingClientRect();
          const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
          const zoomCtrl = document.querySelector('.leaflet-control-zoom')?.getBoundingClientRect();
          if (!container || !popup || !tileBtn || !zoomCtrl) return null;

          const ov = (a: DOMRect, b: DOMRect) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;

          return {
            clippedTop: popup.top < container.top - 1,
            clippedBottom: popup.bottom > container.bottom + 1,
            clippedLeft: popup.left < container.left - 1,
            clippedRight: popup.right > container.right + 1,
            overlapsTileBtn: ov(popup, tileBtn) || Boolean(closeBtn && ov(closeBtn, tileBtn)),
            overlapsZoom: ov(popup, zoomCtrl),
            popupHeight: Math.round(popup.height),
            topMargin: Math.round(popup.top - container.top)
          };
        });

        expect(popupGeo, `${vp.label} card #${i} popup geometry`).not.toBeNull();
        expect(popupGeo!.clippedTop, `${vp.label} card #${i} popup clipped top`).toBe(false);
        expect(popupGeo!.clippedBottom, `${vp.label} card #${i} popup clipped bottom`).toBe(false);
        expect(popupGeo!.clippedLeft, `${vp.label} card #${i} popup clipped left`).toBe(false);
        expect(popupGeo!.clippedRight, `${vp.label} card #${i} popup clipped right`).toBe(false);
        expect(popupGeo!.overlapsTileBtn, `${vp.label} card #${i} popup overlaps Jemný podklad`).toBe(false);
        expect(popupGeo!.overlapsZoom, `${vp.label} card #${i} popup overlaps zoom control`).toBe(false);
      }

      // Direct marker click on map also auto-pans without clipping or overlapping "Jemný podklad"
      await page.locator('.leaflet-marker-icon').nth(1).click({ force: true });
      await page.waitForTimeout(350);
      await expect(page.locator('.leaflet-popup')).toBeVisible();
      const markerClickGeo = await page.evaluate(() => {
        const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
        const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
        const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
        if (!container || !popup || !tileBtn) return null;
        const overlapsTileBtn =
          Math.min(popup.right, tileBtn.right) - Math.max(popup.left, tileBtn.left) > 1.5 &&
          Math.min(popup.bottom, tileBtn.bottom) - Math.max(popup.top, tileBtn.top) > 1.5;
        return {
          insideContainer:
            popup.top >= container.top - 1 &&
            popup.bottom <= container.bottom + 1 &&
            popup.left >= container.left - 1 &&
            popup.right <= container.right + 1,
          overlapsTileBtn
        };
      });
      expect(markerClickGeo).toEqual({ insideContainer: true, overlapsTileBtn: false });
      expect(await scanForbiddenEmojis(page)).toEqual([]);

      if (vp.width === 1440) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await cards.first().locator('button', { hasText: 'Na mapě' }).click();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'near-popup__1440x900.png'),
          fullPage: false
        });
      }
    }

    // 2. Mobile & Tablet (820x960, 375x667, 360x800): .map-active-sheet renders cleanly BELOW .leaflet-container
    for (const vp of [
      { width: 820, height: 960, label: '820x960' },
      { width: 375, height: 667, label: '375x667' },
      { width: 360, height: 800, label: '360x800' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHydrated(page, '/near');

      await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
      await page.waitForTimeout(250);

      const sheet = page.locator('.map-active-sheet[aria-label="Vybrané místo na mapě"]');
      await expect(sheet).toBeVisible();
      await expect(page.locator('.leaflet-popup')).toHaveCount(0);

      const mobileGeo = await page.evaluate(() => {
        const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
        const mapFrame = document.querySelector('.map-frame')?.getBoundingClientRect();
        const activeSheet = document.querySelector('.map-active-sheet')?.getBoundingClientRect();
        if (!container || !mapFrame || !activeSheet) return null;
        const overlapsContainer =
          Math.min(activeSheet.right, container.right) - Math.max(activeSheet.left, container.left) > 1 &&
          Math.min(activeSheet.bottom, container.bottom) - Math.max(activeSheet.top, container.top) > 1;
        return {
          overlapsContainer,
          belowMapFrame: activeSheet.top >= mapFrame.bottom - 1
        };
      });

      expect(mobileGeo, `${vp.label} active sheet placement`).toEqual({
        overlapsContainer: false,
        belowMapFrame: true
      });

      // Verify map controls (.tile-switch-btn, .leaflet-container) stay strictly beneath sticky header.top-nav stacking context
      const headerHitOk = await page.evaluate(() => {
        const cap = document.querySelector('header.top-nav .nav-capsule');
        if (!cap) return false;
        const r = cap.getBoundingClientRect();
        const hit = document.elementFromPoint(r.right - 22, r.top + r.height * 0.5);
        return Boolean(hit && cap.contains(hit));
      });
      expect(headerHitOk, `${vp.label} sticky header must remain above map controls`).toBe(true);

      await assertZeroOverflow(page, `T3-10 /near active sheet @ ${vp.label}`);
      if (vp.width <= 680) {
        await assertMobileTouchTargets(page, `T3-10 /near active sheet @ ${vp.label}`);
      }
      if (vp.width === 360) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'near-sheet__360x800.png'),
          fullPage: false
        });
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-10');
  });

  test('T3-11: (Mobile 360x800 & 375x667) Full brand name legibility without ellipsis even with MollyDock tip indicator', async ({
    page
  }) => {
    test.setTimeout(60_000);
    const errors = await setupPageEnvironment(page);

    for (const vp of [
      { width: 360, height: 800, label: '360x800' },
      { width: 375, height: 667, label: '375x667' }
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.evaluate(() => {
        try {
          sessionStorage.removeItem('aa_molly_hints_v1');
        } catch {}
      });
      await gotoHydrated(page, '/submit');

      // Wait until Molly's deferred route tip dot appears inside MollyDock (widest mobile dock state)
      for (let i = 0; i < 20; i++) {
        if ((await page.locator('[data-testid="molly-tip-dot"]').count()) > 0) break;
        await page.waitForTimeout(300);
      }
      await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();

      const brandMetrics = await page.evaluate(() => {
        const brand = document.querySelector('header.top-nav a.brand') as HTMLElement | null;
        const brandText = document.querySelector('header.top-nav .brand-text') as HTMLElement | null;
        const brandWord = document.querySelector('header.top-nav .brand-word') as HTMLElement | null;
        const brandAccent = document.querySelector('header.top-nav .brand-accent') as HTMLElement | null;
        const dock = document.querySelector('header.top-nav .molly-pelisek-dock') as HTMLElement | null;
        if (!brand || !brandText || !brandWord || !brandAccent || !dock) return null;

        const bRect = brand.getBoundingClientRect();
        const dRect = dock.getBoundingClientRect();
        const textCs = window.getComputedStyle(brandText);
        const wordCs = window.getComputedStyle(brandWord);
        const accentCs = window.getComputedStyle(brandAccent);

        return {
          wordText: brandWord.innerText.trim(),
          accentText: brandAccent.innerText.trim(),
          wordClipped: brandWord.scrollWidth > brandWord.clientWidth + 1,
          accentClipped: brandAccent.scrollWidth > brandAccent.clientWidth + 1,
          textClipped: brandText.scrollWidth > brandText.clientWidth + 1,
          hasEllipsis:
            textCs.textOverflow === 'ellipsis' ||
            wordCs.textOverflow === 'ellipsis' ||
            accentCs.textOverflow === 'ellipsis',
          gapToDock: Math.round((dRect.left - bRect.right) * 10) / 10,
          brandWidth: Math.round(bRect.width * 10) / 10,
          brandHeight: Math.round(bRect.height * 10) / 10
        };
      });

      expect(brandMetrics, `${vp.label} brand metrics`).not.toBeNull();
      expect(brandMetrics!.wordText).toBe('Akcelerátor');
      expect(brandMetrics!.accentText).toBe('altruismu');
      expect(brandMetrics!.wordClipped, `${vp.label} Akcelerátor clipped`).toBe(false);
      expect(brandMetrics!.accentClipped, `${vp.label} altruismu clipped`).toBe(false);
      expect(brandMetrics!.textClipped, `${vp.label} .brand-text clipped`).toBe(false);
      expect(brandMetrics!.hasEllipsis, `${vp.label} must not use ellipsis`).toBe(false);
      expect(brandMetrics!.gapToDock, `${vp.label} positive gap before MollyDock`).toBeGreaterThanOrEqual(4);
      expect(brandMetrics!.brandWidth).toBeGreaterThanOrEqual(44);
      expect(brandMetrics!.brandHeight).toBeGreaterThanOrEqual(44);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${vp.label} header collisions with tip dot`).toEqual([]);
      await assertMobileTouchTargets(page, `T3-11 @ ${vp.label}`);
      await assertZeroOverflow(page, `T3-11 @ ${vp.label}`);

      if (vp.width === 360) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, 'header-tip-dot__360x800.png'),
          fullPage: false
        });
      }
    }

    assertZeroRuntimeErrors(errors, 'T3-11');
  });

  test('T3-12: (/near Race & Interaction Stress) Pin centering > 120ms, slow API & ?place= deep link, manual drag after popup, and keyboard Enter on mobile pin', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Mobile 360x800: Clicking "Na mapě" must keep active pin centered after > 120ms resizeTimer
    //    and keep .mobile-tabs cleanly below sticky header.top-nav
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(350);

    const mobilePinCenter = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const pin = document.querySelector('.aa-map-pin.is-active')?.getBoundingClientRect();
      const header = document.querySelector('header.top-nav')?.getBoundingClientRect();
      const tabs = document.querySelector('.mobile-tabs')?.getBoundingClientRect();
      if (!container || !pin || !header || !tabs) return null;
      const pinCx = pin.left + pin.width * 0.5;
      const pinCy = pin.top + pin.height * 0.5;
      const mapCx = container.left + container.width * 0.5;
      const mapCy = container.top + container.height * 0.5;
      return {
        dx: Math.round(Math.abs(pinCx - mapCx)),
        dy: Math.round(Math.abs(pinCy - mapCy)),
        tabsBelowHeader: tabs.top >= header.bottom - 3
      };
    });
    expect(mobilePinCenter, '360x800 active pin metrics').not.toBeNull();
    expect(mobilePinCenter!.dx, '360x800 active pin horizontally centered after 350ms').toBeLessThanOrEqual(24);
    expect(mobilePinCenter!.dy, '360x800 active pin vertically centered after 350ms').toBeLessThanOrEqual(24);
    expect(mobilePinCenter!.tabsBelowHeader, '360x800 .mobile-tabs must not be chopped behind sticky header').toBe(true);

    // Pressing Enter on a focused marker on mobile (<= 980px) must NOT open .leaflet-popup
    const secondPin = page.locator('.leaflet-marker-icon').nth(1);
    await secondPin.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    expect(await page.locator('.leaflet-popup').count(), 'Mobile Enter on marker must not open .leaflet-popup').toBe(0);
    await expect(page.locator('.map-active-sheet')).toBeVisible();

    // 2. Desktop 1440x900: Clicking "Na mapě" must NOT swallow the user's subsequent manual map drag
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(250);
    await expect(page.locator('.leaflet-popup')).toBeVisible();

    const mapBox = await page.locator('.leaflet-container').boundingBox();
    expect(mapBox).not.toBeNull();
    // Drag map ~420px across screen (> 2.5 km in Prague at zoom 15) in a single gesture
    const startX = mapBox!.x + mapBox!.width * 0.78;
    const startY = mapBox!.y + mapBox!.height * 0.65;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let step = 1; step <= 8; step++) {
      await page.mouse.move(startX - step * 52, startY - step * 18, { steps: 2 });
    }
    await page.mouse.up();
    await page.waitForTimeout(250);
    await expect(
      page.locator('.search-area-btn'),
      'Single manual drag after "Na mapě" must reveal "Hledat v této oblasti mapy"'
    ).toBeVisible();

    const searchBtnVsFoot = await page.evaluate(() => {
      const searchBtn = document.querySelector('.search-area-btn')?.getBoundingClientRect();
      const footHint = document.querySelector('.map-foot-hint')?.getBoundingClientRect();
      if (!searchBtn || !footHint) return false;
      return (
        Math.min(searchBtn.right, footHint.right) - Math.max(searchBtn.left, footHint.left) > 1.5 &&
        Math.min(searchBtn.bottom, footHint.bottom) - Math.max(searchBtn.top, footHint.top) > 1.5
      );
    });
    expect(searchBtnVsFoot, '.search-area-btn must never overlap .map-foot-hint').toBe(false);

    // Clicking a visible marker while .search-area-btn is shown must auto-pan popup clear of .search-area-btn
    const inViewMarkerIdx = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      if (!container) return -1;
      const pins = Array.from(document.querySelectorAll('.leaflet-marker-icon'));
      let bestIdx = -1;
      let maxY = -Infinity;
      pins.forEach((el, idx) => {
        const r = el.getBoundingClientRect();
        if (
          r.left > container.left + 20 &&
          r.right < container.right - 20 &&
          r.top > container.top + 20 &&
          r.bottom < container.bottom - 10 &&
          r.top > maxY
        ) {
          maxY = r.top;
          bestIdx = idx;
        }
      });
      return bestIdx;
    });
    if (inViewMarkerIdx >= 0) {
      await page.locator('.leaflet-marker-icon').nth(inViewMarkerIdx).click({ force: true });
      await page.waitForTimeout(350);
      await expect(page.locator('.leaflet-popup')).toBeVisible();
      const overlapsSearchBtn = await page.evaluate(() => {
        const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
        const searchBtn = document.querySelector('.search-area-btn')?.getBoundingClientRect();
        if (!popup || !searchBtn) return false;
        return (
          Math.min(popup.right, searchBtn.right) - Math.max(popup.left, searchBtn.left) > 1.5 &&
          Math.min(popup.bottom, searchBtn.bottom) - Math.max(popup.top, searchBtn.top) > 1.5
        );
      });
      expect(overlapsSearchBtn, 'Popup must clear .search-area-btn at bottom of map').toBe(false);
    }

    // 3. Desktop 1440x900 with slow /api/nearby: clicking "Na mapě" before /api/nearby finishes must keep popup centered
    let delayNearby = true;
    const slowHandler = async (route: { continue: () => Promise<void> }) => {
      if (delayNearby) {
        await new Promise((r) => setTimeout(r, 380));
      }
      await route.continue();
    };
    await page.route('**/api/nearby**', slowHandler);
    await page.goto('/near', { waitUntil: 'domcontentloaded' });
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.locator('.leaflet-marker-icon').first().waitFor({ state: 'attached', timeout: 10_000 });
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(650);
    delayNearby = false;
    await page.unroute('**/api/nearby**', slowHandler);

    const slowApiGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      const pin = document.querySelector('.aa-map-pin.is-active')?.getBoundingClientRect();
      if (!container || !popup || !pin) return null;
      return {
        popupInside:
          popup.top >= container.top - 1 &&
          popup.bottom <= container.bottom + 1 &&
          popup.left >= container.left - 1 &&
          popup.right <= container.right + 1,
        pinHorizOffset: Math.round(Math.abs(pin.left + pin.width * 0.5 - (container.left + container.width * 0.5)))
      };
    });
    expect(slowApiGeo, 'Slow /api/nearby popup & pin state').not.toBeNull();
    expect(slowApiGeo!.popupInside, 'Slow /api/nearby popup contained inside map').toBe(true);
    expect(
      slowApiGeo!.pinHorizOffset,
      'Slow /api/nearby completion must not zoom/pan away from selected place'
    ).toBeLessThanOrEqual(24);

    // 4. Deep-link /near?place=curated:praha-nadeje on 1440x900 opens centered popup > 200ms after boot
    await gotoHydrated(page, '/near?place=curated%3Apraha-nadeje');
    await page.waitForTimeout(250);
    await expect(page.locator('.leaflet-popup')).toBeVisible();
    const deepLinkGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      if (!container || !popup) return false;
      return (
        popup.top >= container.top - 1 &&
        popup.bottom <= container.bottom + 1 &&
        popup.left >= container.left - 1 &&
        popup.right <= container.right + 1
      );
    });
    expect(deepLinkGeo, 'Deep-link ?place= popup contained inside map').toBe(true);

    assertZeroRuntimeErrors(errors, 'T3-12');
  });

  test('T3-13: (/near Long quickMission, Bottom-Center Marker vs .search-area-btn & Dynamic Resize 1025->360->1280)', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    // 1. Seed a community submission with a 420-char quickMission and verify popup containment at 981x800
    await page.setViewportSize({ width: 981, height: 800 });
    await gotoHydrated(page, '/near');
    await page.evaluate(() => {
      const longMission =
        'Přines čisté zimní bundy, rukavice, ponožky, deky, spacáky a trvanlivé potraviny pro lidi bez domova. '.repeat(
          4
        ) + 'Předání probíhá přímo u recepce každý všední den odpoledne bez předchozí registrace.';
      localStorage.setItem(
        'aa_my_pending_submissions_v1',
        JSON.stringify([
          {
            id: 'comm:test-long-mission',
            name: 'Komunitní šatník a nízkoprahové centrum Karlín – dlouhý popis pomoci',
            lat: 50.0915,
            lon: 14.4515,
            kind: 'org',
            category: 'Komunitní šatník',
            address_label: 'Sokolovská 112, Praha 8 - Karlín',
            website: 'https://example.org/satnik',
            quickMission: longMission,
            status: 'pending'
          }
        ])
      );
    });
    await gotoHydrated(page, '/near');
    await page.locator('#near-list-filter').fill('Karlín – dlouhý');
    await page.waitForTimeout(150);
    const longCard = page.locator('.place-card', { hasText: 'Karlín – dlouhý' }).first();
    await expect(longCard).toBeVisible();
    await longCard.locator('button', { hasText: 'Na mapě' }).click();
    await page.waitForTimeout(300);

    const longPopupGeo = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const popup = document.querySelector('.leaflet-popup-content-wrapper')?.getBoundingClientRect();
      const tileBtn = document.querySelector('.tile-switch-btn')?.getBoundingClientRect();
      const zoomCtrl = document.querySelector('.leaflet-control-zoom')?.getBoundingClientRect();
      if (!container || !popup || !tileBtn || !zoomCtrl) return null;
      const ov = (a: DOMRect, b: DOMRect) =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
      return {
        inside:
          popup.top >= container.top - 1 &&
          popup.bottom <= container.bottom + 1 &&
          popup.left >= container.left - 1 &&
          popup.right <= container.right + 1,
        overlapsTile: ov(popup, tileBtn),
        overlapsZoom: ov(popup, zoomCtrl),
        height: Math.round(popup.height)
      };
    });
    expect(longPopupGeo, '981x800 420-char quickMission popup geometry').toEqual({
      inside: true,
      overlapsTile: false,
      overlapsZoom: false,
      height: expect.any(Number)
    });

    // Clear filter and test dynamic resize: 1025 -> 980 -> 360 (city jump to Brno while map hidden) -> 1280
    await page.evaluate(() => localStorage.removeItem('aa_my_pending_submissions_v1'));
    await page.setViewportSize({ width: 1025, height: 800 });
    await gotoHydrated(page, '/near');
    await page.locator('.place-card').first().locator('button', { hasText: 'Na mapě' }).click();
    await expect(page.locator('.leaflet-popup')).toBeVisible();

    await page.setViewportSize({ width: 980, height: 800 });
    await page.waitForTimeout(200);
    await expect(page.locator('.leaflet-popup')).toHaveCount(0);
    await expect(page.locator('.mobile-tabs')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    await page.waitForTimeout(150);
    const filtersSummary = page.locator('details.near-filters-drawer > summary.near-filters-summary');
    if (await filtersSummary.isVisible()) {
      const isOpen = await filtersSummary.evaluate((el) => Boolean((el.parentElement as HTMLDetailsElement)?.open));
      if (!isOpen) await filtersSummary.click();
    }
    await page.locator('#near-city-jump').selectOption('brno');
    await page.waitForTimeout(400);

    // Resize back to desktop 1280x900 after changing city while map was display:none
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(350);
    const desktopAfterResize = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container')?.getBoundingClientRect();
      const activeSheet = document.querySelector('.map-active-sheet');
      const sheetVisible = Boolean(
        activeSheet &&
          window.getComputedStyle(activeSheet).display !== 'none' &&
          activeSheet.getBoundingClientRect().height > 0
      );
      const pinsInView = Array.from(document.querySelectorAll('.leaflet-marker-icon')).filter((el) => {
        if (!container) return false;
        const r = el.getBoundingClientRect();
        return r.right > container.left && r.left < container.right && r.bottom > container.top && r.top < container.bottom;
      }).length;
      return {
        mapWidth: container ? Math.round(container.width) : 0,
        mapHeight: container ? Math.round(container.height) : 0,
        sheetVisible,
        pinsInView
      };
    });
    expect(desktopAfterResize.mapWidth).toBeGreaterThan(400);
    expect(desktopAfterResize.mapHeight).toBeGreaterThanOrEqual(420);
    expect(desktopAfterResize.sheetVisible).toBe(false);
    expect(desktopAfterResize.pinsInView, 'Brno pins visible inside desktop map after resize from hidden mobile list').toBeGreaterThan(0);

    assertZeroRuntimeErrors(errors, 'T3-13');
  });

  test('T3-14: (Header Brand BVA 320px..1024px) Zero ellipsis, zero clipping & zero collision with 3-digit treats + tip dot + docked/follow state', async ({
    page
  }) => {
    test.setTimeout(90_000);
    const errors = await setupPageEnvironment(page);

    await page.setViewportSize({ width: 360, height: 800 });
    await gotoHydrated(page, '/');
    await page.evaluate(() => {
      localStorage.setItem(
        'aa_molly_companion_v1',
        JSON.stringify({
          mode: 'roaming',
          mood: 'happy',
          treatsFedTotal: 128,
          treatsFedToday: 3,
          availableTreats: 2,
          giftDeeds: 8,
          petCount: 5,
          followMouse: true,
          lastDayKey: new Date().toISOString().slice(0, 10)
        })
      );
      localStorage.setItem('aa_molly_follow_mouse', 'true');
      sessionStorage.removeItem('aa_molly_hints_v1');
    });
    await gotoHydrated(page, '/submit');
    for (let i = 0; i < 20; i++) {
      if ((await page.locator('[data-testid="molly-tip-dot"]').count()) > 0) break;
      await page.waitForTimeout(300);
    }
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();
    // Toggle docked ("Procházka" is wider than "Pelíšek"!) while pendingTip remains active!
    await page.locator('.molly-dock-toggle-btn').click();
    await page.waitForTimeout(100);
    await expect(page.locator('[data-testid="molly-tip-dot"]')).toBeVisible();
    await expect(page.locator('[data-testid="molly-treat-count"]')).toContainText('128');

    for (const width of [320, 360, 375, 480, 481, 680, 681, 768, 821, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(200);

      const m = await page.evaluate(() => {
        const brand = document.querySelector('header.top-nav a.brand') as HTMLElement | null;
        const brandText = document.querySelector('header.top-nav .brand-text') as HTMLElement | null;
        const brandWord = document.querySelector('header.top-nav .brand-word') as HTMLElement | null;
        const brandAccent = document.querySelector('header.top-nav .brand-accent') as HTMLElement | null;
        const dock = document.querySelector('header.top-nav .molly-pelisek-dock') as HTMLElement | null;
        if (!brand || !brandText || !brandWord || !brandAccent || !dock) return null;
        const bRect = brand.getBoundingClientRect();
        const dRect = dock.getBoundingClientRect();
        return {
          textClipped: brandText.scrollWidth > brandText.clientWidth + 1,
          wordClipped: brandWord.scrollWidth > brandWord.clientWidth + 1,
          accentClipped: brandAccent.scrollWidth > brandAccent.clientWidth + 1,
          gapToDock: Math.round((dRect.left - bRect.right) * 10) / 10
        };
      });

      expect(m, `${width}px brand metrics`).not.toBeNull();
      expect(m!.textClipped, `${width}px .brand-text clipped/truncated`).toBe(false);
      expect(m!.wordClipped, `${width}px Akcelerátor clipped`).toBe(false);
      expect(m!.accentClipped, `${width}px altruismu clipped`).toBe(false);
      expect(m!.gapToDock, `${width}px gap before MollyDock >= 4px`).toBeGreaterThanOrEqual(4);

      const collisions = await detectHeaderAndMollyCollisions(page);
      expect(collisions, `${width}px header collisions`).toEqual([]);
      if (width <= 480) {
        await assertMobileTouchTargets(page, `T3-14 @ ${width}px`);
      }
      const docOverflow = await page.evaluate(
        () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1
      );
      expect(docOverflow, `${width}px horizontal overflow`).toBe(false);
    }

    assertZeroRuntimeErrors(errors, 'T3-14');
  });
});

// ============================================================================
// TIER 4: REAL-WORLD MOBILE JOURNEY & VISUAL JUDGE SCREENSHOT SUITE
// ============================================================================

test.describe('Tier 4: End-to-End Mobile Journey & Visual Judge Screenshot Capture', () => {
  test('T4-1: First-visit mobile journey (360x800): / deed -> earn treat -> /svet feed Molly', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const errors = await setupPageEnvironment(page);
    await gotoHydrated(page, '/');

    const card = page.locator('.instant-card').first();
    const cta = card.locator('.btn-studio-primary');
    await expect(cta).toBeVisible();
    const ctaBox = await cta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(800);

    // Cycle to next tip (1 / N -> 2 / N)
    const indicator = page.locator('.deck-indicator').first();
    await expect(indicator).toContainText(/^1\s*\//);
    const cycled = await clickFirstVisible(page.locator('.instant-card .cycle-btn, .deck-nav-next'));
    expect(cycled).toBe(true);
    await page.waitForTimeout(200);
    await expect(indicator).toContainText(/^2\s*\//);

    // Open Jak to funguje, start & complete deed
    await card.locator('details.how-toggle summary').click();
    await expect(card.locator('details.how-toggle')).toContainText('Ověřený dopad');
    await cta.click();
    await expect(card.locator('.btn-studio-done')).toBeVisible();
    await card.locator('.btn-studio-done').click();
    await page.waitForTimeout(300);

    const treatsBeforeFeed = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );

    // Navigate via mobile top nav drawer to /svet and feed Molly
    await page.locator('button.mobile-nav-toggle').click();
    await page.locator('#mobile-top-nav-drawer a[href="/svet"]').click();
    await page.waitForURL('**/svet');
    await page.locator('.app-shell[data-hydrated="true"]').waitFor({ state: 'attached', timeout: 20_000 });
    await page.waitForTimeout(450);

    const mollyPill = page.locator('.molly-sanctuary-pill');
    await expect(mollyPill).toBeVisible();
    await mollyPill.click();
    await page.waitForTimeout(250);

    const treatsAfterFeed = Number(
      (await page.locator('.molly-companion-layer').getAttribute('data-molly-treats')) || '0'
    );
    expect(treatsAfterFeed).toBeGreaterThan(treatsBeforeFeed);
    expect(treatsAfterFeed).toBeGreaterThan(0);

    expect(await scanForbiddenEmojis(page)).toEqual([]);
    expect(await detectHeaderAndMollyCollisions(page)).toEqual([]);
    await assertZeroOverflow(page, 'T4-1');
    assertZeroRuntimeErrors(errors, 'T4-1');
  });

  test('T4-2: Visual judge screenshot capture across all 7 routes x 3 viewports (21 cells)', async ({
    page
  }) => {
    test.setTimeout(120_000);
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const errors = await setupPageEnvironment(page);

    for (const route of ROUTES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await gotoHydrated(page, route.path);

        // Ensure zero overflow & zero emojis before screenshot capture
        await assertZeroOverflow(page, `screenshot ${route.path} @ ${vp.name}`);
        expect(
          await scanForbiddenEmojis(page),
          `screenshot ${route.path} @ ${vp.name} emoji check`
        ).toEqual([]);

        const baseName = `${route.slug}__${vp.name}`;
        const viewportShotPath = path.join(SCREENSHOT_DIR, `${baseName}.png`);
        await page.screenshot({
          path: viewportShotPath,
          fullPage: false
        });
        expect(fs.existsSync(viewportShotPath), `Missing screenshot: ${viewportShotPath}`).toBe(
          true
        );
        expect(
          fs.statSync(viewportShotPath).size,
          `Empty screenshot: ${viewportShotPath}`
        ).toBeGreaterThan(0);

        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        if (scrollHeight > vp.height && scrollHeight <= 8000) {
          const fullShotPath = path.join(SCREENSHOT_DIR, `${baseName}__full.png`);
          await page.screenshot({
            path: fullShotPath,
            fullPage: true
          });
          expect(fs.existsSync(fullShotPath), `Missing full screenshot: ${fullShotPath}`).toBe(
            true
          );
          expect(
            fs.statSync(fullShotPath).size,
            `Empty full screenshot: ${fullShotPath}`
          ).toBeGreaterThan(0);
        }
      }
    }

    assertZeroRuntimeErrors(errors, 'T4-2');
  });
});
