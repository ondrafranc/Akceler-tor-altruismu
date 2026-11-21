import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MICRO_ACTIONS } from '$lib/data/micro-actions.js';
import { ACTION_EFFECT_CATALOG, resolveActionEffectSpec } from '$lib/sensory/catalog/catalogResolver.js';
import { mountImpactCanvas } from '$lib/sensory/canvas/impactCanvasEngine.js';
import {
  savePendingPartnerReturn,
  readPendingPartnerRecord,
  consumePendingPartnerReturn,
  getPendingPartnerReturnRemainingMs
} from '$lib/features/actions/services/partnerReturnService.js';
import { get } from 'svelte/store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../../src');

const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF]/u;

/** @typedef {import('$lib/types/sensory.js').ImpactCanvasElement} ImpactCanvasElement */

function createMockCanvas(width = 320, height = 118, initialClasses = ['impact-payoff-canvas']) {
  /** @type {{ op: 'save' | 'restore' }[]} */
  const ops = [];
  /** @type {Map<string, string>} */
  const attrs = new Map();
  /** @type {Map<string, EventListener>} */
  const listeners = new Map();
  const classes = new Set(initialClasses);
  const gradientStub = { addColorStop: () => {} };
  const ctx = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowColor: 'transparent',
    shadowBlur: 0,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    save: () => ops.push({ op: 'save' }),
    restore: () => ops.push({ op: 'restore' }),
    scale: () => {},
    translate: () => {},
    rotate: () => {},
    setTransform: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    bezierCurveTo: () => {},
    arc: () => {},
    ellipse: () => {},
    rect: () => {},
    roundRect: () => {},
    fill: () => {},
    stroke: () => {},
    clip: () => {},
    setLineDash: () => {},
    fillText: () => {},
    strokeText: () => {},
    createLinearGradient: () => gradientStub,
    createRadialGradient: () => gradientStub
  };

  return /** @type {ImpactCanvasElement} */ (/** @type {unknown} */ ({
    width,
    height,
    isConnected: true,
    parentNode: {},
    getContext: (/** @type {string} */ t) => (t === '2d' ? ctx : null),
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    setAttribute: (/** @type {string} */ k, /** @type {string} */ v) => attrs.set(k, String(v)),
    getAttribute: (/** @type {string} */ k) => (attrs.has(k) ? attrs.get(k) : null),
    hasAttribute: (/** @type {string} */ k) => attrs.has(k),
    removeAttribute: (/** @type {string} */ k) => attrs.delete(k),
    addEventListener: (/** @type {string} */ k, /** @type {EventListener} */ fn) => listeners.set(k, fn),
    removeEventListener: (/** @type {string} */ k) => listeners.delete(k),
    classList: {
      add: (/** @type {string} */ c) => classes.add(c),
      remove: (/** @type {string} */ c) => classes.delete(c),
      contains: (/** @type {string} */ c) => classes.has(c)
    }
  }));
}

describe('M2 Regressions (Unit)', () => {
  /** @type {FrameRequestCallback[]} */
  let rafQueue = [];
  /** @type {typeof globalThis.window} */
  let origWindow;
  /** @type {typeof globalThis.requestAnimationFrame} */
  let origRaf;
  /** @type {typeof globalThis.cancelAnimationFrame} */
  let origCancelRaf;

  beforeEach(() => {
    rafQueue = [];
    origWindow = globalThis.window;
    origRaf = globalThis.requestAnimationFrame;
    origCancelRaf = globalThis.cancelAnimationFrame;

    globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
      devicePixelRatio: 1,
      matchMedia: () => ({ matches: false }),
      addEventListener: () => {}
    }));
    globalThis.requestAnimationFrame = (cb) => {
      rafQueue.push(cb);
      return rafQueue.length;
    };
    globalThis.cancelAnimationFrame = () => {};
  });

  afterEach(() => {
    globalThis.window = origWindow;
    globalThis.requestAnimationFrame = origRaf;
    globalThis.cancelAnimationFrame = origCancelRaf;
  });

  function stepFrames(count = 80, stepMs = 16) {
    let now = 1000;
    for (let i = 0; i < count; i++) {
      const next = rafQueue.shift();
      if (!next) break;
      now += stepMs;
      next(now);
    }
  }

  it('partnerReturnService isolates surfacePrefix without consuming records from other surfaces', () => {
    const brontosaurus = MICRO_ACTIONS.find((a) => a.id === 'brontosaurus_vikend');
    savePendingPartnerReturn(brontosaurus, 'home');

    expect(getPendingPartnerReturnRemainingMs(0, { surfacePrefix: 'guided' })).toBe(0);
    expect(consumePendingPartnerReturn(0, { surfacePrefix: 'guided' })).toBeNull();

    // Home record must still be intact and unconsumed
    const stillPending = readPendingPartnerRecord();
    expect(stillPending?.id).toBe('brontosaurus_vikend');
    expect(stillPending?.surface).toBe('home');
    expect(stillPending?.consumed).toBeFalsy();

    const homeConsumed = consumePendingPartnerReturn(0, { surfacePrefix: 'home' });
    expect(homeConsumed?.id).toBe('brontosaurus_vikend');

    // Guided prefix matches guided_best / guided_alt / guided_local
    savePendingPartnerReturn(brontosaurus, 'guided_alt');
    expect(consumePendingPartnerReturn(0, { surfacePrefix: 'online' })).toBeNull();
    const guidedConsumed = consumePendingPartnerReturn(0, { surfacePrefix: 'guided' });
    expect(guidedConsumed?.id).toBe('brontosaurus_vikend');
    expect(guidedConsumed?.surface).toBe('guided_alt');
  });

  it('all 45 MICRO_ACTIONS have consistent non-climax reward targets (no 0.65 drop) and donio_utulky has crowdfunding spec', () => {
    expect(MICRO_ACTIONS.length).toBe(45);

    // Check donio_utulky has dedicated 100% crowdfunding spec instead of 25g kibble copy
    const donioSpec = ACTION_EFFECT_CATALOG.donio_utulky;
    expect(donioSpec.target).toBe(100);
    expect(donioSpec.staticMetric).toBe(true);
    expect(donioSpec.format(100)).toContain('100 %');
    expect(donioSpec.format(100)).not.toContain('g v misce');

    for (const action of MICRO_ACTIONS) {
      const spec = resolveActionEffectSpec(action);
      const cv = createMockCanvas();
      let latestVal = null;
      const cleanup = mountImpactCanvas(cv, {
        action,
        climax: false,
        onWeightUpdate: (val) => {
          latestVal = val;
        }
      });
      stepFrames(80);
      expect(latestVal, `Action ${action.id} must emit full spec.target (${spec.target}) in non-climax state`).toBe(
        spec.target
      );
      cleanup();
    }
  });

  it('all 45 MICRO_ACTIONS have active Czech verb CTAs, zero generic Otevřít/noun-only starts, and zero emojis', () => {
    const ACTIVE_VERB_START_RE =
      /^(Nakrmit|Nastavit|Stáhnout|Upravit|Začít|Potěšit|Vybrat|Zapojit|Najít|Nahrát|Zjistit|Ověřit|Darovat|Podpořit|Udělat|Nahlásit|Poslechnout|Přidat|Spustit|Označit|Podepsat|Pomoct|Uložit|Vyzkoušet|Přečíst|Zachránit|Nabídnout|Přihlásit|Přeměnit)\b/;
    const FORBIDDEN_START_RE = /^(Mapa akcí|Informace|Podmínky|Detail|Kalendář|Inspirace|Jak funguje|Otevřít)\b/;

    for (const action of MICRO_ACTIONS) {
      expect(typeof action.cta).toBe('string');
      expect(action.cta.trim().length).toBeGreaterThan(3);
      expect(EMOJI_RE.test(action.cta)).toBe(false);
      expect(FORBIDDEN_START_RE.test(action.cta), `Forbidden/generic CTA start on ${action.id}: ${action.cta}`).toBe(
        false
      );
      expect(ACTIVE_VERB_START_RE.test(action.cta), `Expected active Czech verb on ${action.id}: ${action.cta}`).toBe(
        true
      );
      expect(action.ctaLabel).toBe(action.cta);
    }
  });

  it('ActionCard.svelte keeps its completion labels and thanks from Molly without any feeding', () => {
    const actionCardSrc = readFileSync(
      path.resolve(srcDir, 'lib/features/actions/components/ActionCard.svelte'),
      'utf8'
    );
    expect(actionCardSrc).toContain('Molly děkuje.');
    expect(actionCardSrc).toContain('Mám hotovo');
    expect(actionCardSrc).toContain('Přehrát');
    expect(actionCardSrc).not.toContain('btn-inline-feed-molly');
  });
});
