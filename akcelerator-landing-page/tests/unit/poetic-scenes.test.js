import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MICRO_ACTIONS } from '$lib/data/micro-actions.js';
import { ACTION_EFFECT_CATALOG } from '$lib/sensory/catalog/catalogResolver.js';
import { mountImpactCanvas } from '$lib/sensory/canvas/impactCanvasEngine.js';
import { impactCanvas } from '$lib/sensory/canvas/impactCanvasAction.js';
import { triggerCanvasBurst } from '$lib/sensory/canvas/controllerRegistry.js';

const Sensory = {
  ACTION_EFFECT_CATALOG,
  mountImpactCanvas,
  impactCanvas,
  triggerCanvasBurst
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../../src');

function createMockCanvas(width = 380, height = 86, initialClasses = ['preview-diorama-canvas']) {
  const ops = [];
  const attrs = new Map();
  const listeners = new Map();
  const classes = new Set(initialClasses);

  const gradientStub = {
    addColorStop: () => { }
  };

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
    scale: (sx, sy) => ops.push({ op: 'scale', sx, sy }),
    translate: (tx, ty) => ops.push({ op: 'translate', tx, ty }),
    rotate: (rad) => ops.push({ op: 'rotate', rad }),
    setTransform: (...args) => ops.push({ op: 'setTransform', args }),
    clearRect: (x, y, w, h) => ops.push({ op: 'clearRect', x, y, w, h }),
    fillRect: (x, y, w, h) => ops.push({ op: 'fillRect', x, y, w, h, fillStyle: ctx.fillStyle }),
    strokeRect: (x, y, w, h) => ops.push({ op: 'strokeRect', x, y, w, h, strokeStyle: ctx.strokeStyle }),
    beginPath: () => ops.push({ op: 'beginPath' }),
    closePath: () => ops.push({ op: 'closePath' }),
    moveTo: (x, y) => ops.push({ op: 'moveTo', x, y }),
    lineTo: (x, y) => ops.push({ op: 'lineTo', x, y, strokeStyle: ctx.strokeStyle }),
    quadraticCurveTo: (cpx, cpy, x, y) => ops.push({ op: 'quadraticCurveTo', cpx, cpy, x, y }),
    bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) =>
      ops.push({ op: 'bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y }),
    arc: (x, y, r, s, e, ccw) => {
      if (r < 0 || !Number.isFinite(r)) {
        throw new Error(`Invalid arc radius: ${r}`);
      }
      ops.push({ op: 'arc', x, y, r, s, e, ccw, fillStyle: ctx.fillStyle });
    },
    ellipse: (x, y, rx, ry, rot, s, e) => {
      if (rx < 0 || ry < 0 || !Number.isFinite(rx) || !Number.isFinite(ry)) {
        throw new Error(`Invalid ellipse radii: ${rx}, ${ry}`);
      }
      ops.push({ op: 'ellipse', x, y, rx, ry, rot, s, e });
    },
    rect: (x, y, w, h) => ops.push({ op: 'rect', x, y, w, h }),
    roundRect: (x, y, w, h, r) => ops.push({ op: 'roundRect', x, y, w, h, r }),
    fill: () => ops.push({ op: 'fill', fillStyle: ctx.fillStyle, alpha: ctx.globalAlpha }),
    stroke: () =>
      ops.push({
        op: 'stroke',
        strokeStyle: ctx.strokeStyle,
        lineWidth: ctx.lineWidth,
        alpha: ctx.globalAlpha
      }),
    clip: () => ops.push({ op: 'clip' }),
    setLineDash: (d) => ops.push({ op: 'setLineDash', d }),
    fillText: (text, x, y) => ops.push({ op: 'fillText', text, x, y }),
    strokeText: (text, x, y) => ops.push({ op: 'strokeText', text, x, y }),
    createLinearGradient: () => gradientStub,
    createRadialGradient: () => gradientStub
  };

  let getContextCalls = 0;

  return {
    width,
    height,
    isConnected: true,
    parentNode: {},
    ops,
    attrs,
    listeners,
    get getContextCalls() {
      return getContextCalls;
    },
    getContext(type) {
      if (type !== '2d') return null;
      getContextCalls++;
      return ctx;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width, height };
    },
    setAttribute(k, v) {
      attrs.set(k, String(v));
    },
    getAttribute(k) {
      return attrs.has(k) ? attrs.get(k) : null;
    },
    hasAttribute(k) {
      return attrs.has(k);
    },
    removeAttribute(k) {
      attrs.delete(k);
    },
    classList: {
      add: (...tokens) => tokens.forEach((t) => classes.add(t)),
      remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
      contains: (t) => classes.has(t),
      toArray: () => [...classes]
    },
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    removeEventListener(type) {
      listeners.delete(type);
    }
  };
}

describe('Poetic 2-Phase Deed Transformations & Preview Diorama', () => {
  let rafQueue = [];
  let nextRafId = 1;
  let mockNow = 0;
  let prevRaf;
  let prevCaf;
  let prevWindow;

  function stepFrames(count = 1, dtMs = 16.667) {
    for (let i = 0; i < count; i++) {
      const batch = rafQueue.splice(0, rafQueue.length);
      if (batch.length === 0) break;
      mockNow += dtMs;
      for (const item of batch) {
        item.cb(mockNow);
      }
    }
  }

  beforeEach(() => {
    rafQueue = [];
    nextRafId = 1;
    mockNow = 0;
    prevRaf = globalThis.requestAnimationFrame;
    prevCaf = globalThis.cancelAnimationFrame;
    prevWindow = globalThis.window;

    globalThis.requestAnimationFrame = (cb) => {
      const id = nextRafId++;
      rafQueue.push({ id, cb });
      return id;
    };
    globalThis.cancelAnimationFrame = (id) => {
      rafQueue = rafQueue.filter((item) => item.id !== id);
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = prevRaf;
    globalThis.cancelAnimationFrame = prevCaf;
    if (prevWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = prevWindow;
    }
  });

  it('removes dead drawCanvasMiniMolly helper and maps all 45 MICRO_ACTIONS to unique poetic scene modes and Czech preview cues', () => {
    expect('drawCanvasMiniMolly' in Sensory).toBe(false);
    const engineSource = readFileSync(path.resolve(srcDir, 'lib/sensory/canvas/impactCanvasEngine.js'), 'utf8');
    expect(engineSource).not.toContain('drawCanvasMiniMolly');
    expect(existsSync(path.resolve(srcDir, 'lib/sensoryEngine.js'))).toBe(false);

    const cardSource = readFileSync(
      path.resolve(srcDir, 'lib/features/actions/components/ActionCard.svelte'),
      'utf8'
    );
    expect(cardSource).toContain('class:preview-diorama-canvas={stageMode === "preview"}');
    expect(cardSource).not.toContain('preview-diorama-svg');

    expect(MICRO_ACTIONS.length).toBe(45);
    const seenModes = new Set();
    for (const action of MICRO_ACTIONS) {
      const spec = Sensory.ACTION_EFFECT_CATALOG[action.id];
      expect(spec, `Missing ACTION_EFFECT_CATALOG entry for ${action.id}`).toBeDefined();
      expect(seenModes.has(spec.mode), `Duplicate scene mode ${spec.mode} for ${action.id}`).toBe(false);
      seenModes.add(spec.mode);
      expect(cardSource, `Missing custom preview cue in ActionCard.svelte for ${action.id}`).toContain(
        action.id
      );
    }
    expect(seenModes.size).toBe(45);
  });

  it('renders all 45 MICRO_ACTIONS plus volunteer/fallback actions across preview, started, and climax states without Geometry/NaN errors', () => {
    const testActions = [
      ...MICRO_ACTIONS,
      { id: 'local_volunteer_spot', title: 'Sousedská výpomoc', category: 'community' },
      null,
      'unknown_custom_mode'
    ];

    for (const action of testActions) {
      // 1. Preview mode (Before state p = 0 -> primed p = 0.14)
      const previewCv = createMockCanvas(380, 86);
      const cleanPreview = Sensory.mountImpactCanvas(previewCv, {
        action,
        preview: true,
        primed: false,
        silent: true
      });
      expect(previewCv.ops.length).toBeGreaterThan(10);
      expect(previewCv.getAttribute('data-molly-mini')).toBeNull();
      expect(previewCv.getAttribute('data-molly-treat')).toBeNull();
      expect(previewCv.getAttribute('data-molly-arcs')).toBeNull();
      expect(previewCv.listeners.has('pointerdown')).toBe(false);

      cleanPreview.setPrimed(true);
      stepFrames(6);
      cleanPreview();

      // 2. Climax mode (0 -> 1 metamorphosis across frames)
      const payoffCv = createMockCanvas(320, 118);
      const cleanPayoff = Sensory.mountImpactCanvas(payoffCv, {
        action,
        climax: true
      });
      stepFrames(72);
      expect(payoffCv.ops.length).toBeGreaterThan(50);
      cleanPayoff();
    }
  });

  it('climax: true animates s_barvou_ven from unsplit white beam (p = 0) into full 6-color rainbow dispersion (p = 1) and replays on triggerCanvasBurst', () => {
    const sBarvou = MICRO_ACTIONS.find((a) => a.id === 's_barvou_ven');
    const cv = createMockCanvas(320, 118);
    const reportedMetrics = [];

    const actionHandle = Sensory.impactCanvas(cv, {
      action: sBarvou,
      climax: true,
      onWeightUpdate: (val, formatted) => reportedMetrics.push({ val, formatted })
    });

    // Synchronous target metric reported immediately for fast UI badges
    expect(reportedMetrics.some((m) => m.val === 7)).toBe(true);

    const rainbowColors = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
    const countRainbowStrokes = () =>
      cv.ops.filter(
        (o) => o.op === 'stroke' && o.lineWidth > 2 && rainbowColors.includes(o.strokeStyle)
      ).length;

    // Frame 0 (p = 0): white-gold beam touches prism, 0 rainbow dispersion rays yet!
    expect(countRainbowStrokes()).toBe(0);

    // Advance 35 frames (~p = 0.89) -> all 6 rainbow dispersion rays are actively drawn
    cv.ops.length = 0;
    stepFrames(35);
    expect(countRainbowStrokes()).toBeGreaterThan(60);

    // Advance past completion + 95 settled frames -> loop auto-sleeps (zero rAF drain)
    stepFrames(140);
    expect(rafQueue.length).toBe(0);

    // Clicking "✨ Impuls" (triggerCanvasBurst) resets p = 0 and replays 0 -> 1!
    cv.ops.length = 0;
    Sensory.triggerCanvasBurst(cv, true);
    expect(cv.getAttribute('data-molly-arcs')).toBe('1');
    expect(rafQueue.length).toBe(1);

    // First frame of replay starts near p = 0.015, then blooms back into full rainbow
    stepFrames(1);
    const earlyStrokes = countRainbowStrokes();
    cv.ops.length = 0;
    stepFrames(50);
    const fullReplayStrokes = countRainbowStrokes();
    expect(fullReplayStrokes).toBeGreaterThan(earlyStrokes);

    actionHandle.destroy();
  });

  it('impactCanvas preview mode updates primed in-place without recreating canvas context and auto-sleeps when idle', () => {
    const action = MICRO_ACTIONS[0];
    const cv = createMockCanvas(380, 86);

    const handle = Sensory.impactCanvas(cv, {
      action,
      preview: true,
      primed: false,
      silent: true
    });
    expect(cv.getContextCalls).toBe(1);
    // Regression guard: preview canvas must never gain payoff height class or Molly mini-stage marker
    expect(cv.classList.contains('preview-diorama-canvas')).toBe(true);
    expect(cv.classList.contains('impact-payoff-canvas')).toBe(false);
    expect(cv.getAttribute('data-molly-mini')).toBeNull();

    // Let idle preview auto-sleep after > 90 settled frames
    stepFrames(100);
    expect(rafQueue.length).toBe(0);

    // Hovering card/CTA sets primed: true -> wakes loop WITHOUT calling setup()/getContext() again
    handle.update({
      action,
      preview: true,
      primed: true,
      silent: true
    });
    expect(cv.getContextCalls).toBe(1);
    expect(rafQueue.length).toBe(1);

    // Preview canvas is immune to global triggerCanvasBurst
    Sensory.triggerCanvasBurst(null, true);
    expect(cv.getAttribute('data-molly-arcs')).toBeNull();

    handle.destroy();
  });

  it('snaps climax directly to p = 1 on frame 0 without scheduling rAF when prefers-reduced-motion is active', () => {
    globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
      devicePixelRatio: 1,
      matchMedia: (q) => ({ matches: q.includes('prefers-reduced-motion') }),
      addEventListener: () => { }
    }));

    const sBarvou = MICRO_ACTIONS.find((a) => a.id === 's_barvou_ven');
    const cv = createMockCanvas(320, 118);
    const rainbowColors = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];

    const cleanup = Sensory.mountImpactCanvas(cv, {
      action: sBarvou,
      climax: true
    });

    // Under prefers-reduced-motion, frame 0 immediately draws the completed rainbow (p = 1) and schedules 0 rAF loops
    const rainbowStrokes = cv.ops.filter(
      (o) => o.op === 'stroke' && rainbowColors.includes(o.strokeStyle)
    ).length;
    expect(rainbowStrokes).toBe(6);
    expect(rafQueue.length).toBe(0);

    cleanup();
  });

  it('preserves strict delayed gratification in primed preview (p = 0.14) without leaking rainbow dispersion or premature tree canopy', () => {
    const sBarvou = MICRO_ACTIONS.find((a) => a.id === 's_barvou_ven');
    const rainbowColors = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
    const previewPrism = createMockCanvas(380, 52);
    const cleanPrism = Sensory.mountImpactCanvas(previewPrism, {
      action: sBarvou,
      preview: true,
      primed: true,
      silent: true
    });
    stepFrames(15);
    const leakedRainbow = previewPrism.ops.filter(
      (o) => o.op === 'stroke' && rainbowColors.includes(o.strokeStyle)
    );
    expect(leakedRainbow.length).toBe(0);
    // Compact mobile preview (< 72px) uses legible centered scale (0.88) while desktop (>= 72px) uses gallery scale (0.96)
    expect(previewPrism.ops.some((o) => o.op === 'scale' && Math.abs(o.sx - 0.88) < 0.01)).toBe(
      true
    );
    cleanPrism();

    const naOvoce = MICRO_ACTIONS.find((a) => a.id === 'na_ovoce_strom');
    const previewTree = createMockCanvas(380, 92);
    const cleanTree = Sensory.mountImpactCanvas(previewTree, {
      action: naOvoce,
      preview: true,
      primed: true,
      silent: true
    });
    stepFrames(15);
    expect(previewTree.ops.some((o) => o.op === 'scale' && Math.abs(o.sx - 0.96) < 0.01)).toBe(
      true
    );
    const canopyCols = ['#10b981', '#059669', '#34d399'];
    const leakedCanopy = previewTree.ops.filter(
      (o) => o.op === 'fill' && canopyCols.includes(o.fillStyle)
    );
    expect(leakedCanopy.length).toBe(0);
    cleanTree();
  });

  it('paces climax metamorphosis across real wall-clock time on 120Hz displays and replays 0 -> 1 on canvas pointerdown tap', () => {
    const sBarvou = MICRO_ACTIONS.find((a) => a.id === 's_barvou_ven');
    const rainbowColors = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
    const cv = createMockCanvas(320, 124);
    const countRainbowStrokes = () =>
      cv.ops.filter(
        (o) => o.op === 'stroke' && o.lineWidth > 2 && rainbowColors.includes(o.strokeStyle)
      ).length;

    const cleanup = Sensory.mountImpactCanvas(cv, {
      action: sBarvou,
      climax: true
    });

    // Simulate 10 frames on a 120Hz display (~83ms wall time): still in pure Before state during card fade-in
    cv.ops.length = 0;
    stepFrames(10, 8.333);
    expect(countRainbowStrokes()).toBe(0);

    // Advance remaining ~1.1s at 120Hz (135 frames) + settle frames -> full rainbow bloom then auto-sleep
    stepFrames(330, 8.333);
    expect(rafQueue.length).toBe(0);

    // Tapping the completed celebration canvas ("Dotkni se pro jiskru") replays 0 -> 1 from unsplit beam!
    const onDown = cv.listeners.get('pointerdown');
    expect(typeof onDown).toBe('function');
    cv.ops.length = 0;
    onDown({ clientX: 160, clientY: 60 });
    expect(cv.getAttribute('data-molly-arcs')).toBe('1');
    expect(rafQueue.length).toBe(1);

    stepFrames(1, 16.667);
    expect(countRainbowStrokes()).toBe(0);

    cv.ops.length = 0;
    stepFrames(55, 16.667);
    expect(countRainbowStrokes()).toBeGreaterThan(60);

    cleanup();
  });

  it('upgrades water_spring, blood_drop, and cosmos_science with balanced save/restore, delayed gratification, and full climax details', () => {
    const assertSaveRestoreBalanced = (ops) => {
      const saves = ops.filter((o) => o.op === 'save').length;
      const restores = ops.filter((o) => o.op === 'restore').length;
      expect(saves).toBeGreaterThan(0);
      expect(saves).toBe(restores);
    };

    // 1. water_spring (estudanky_pramen): wooden rooflet + autumn leaves -> 3-arc crystal fountain + multi-leaflet ferns
    const estudanky = MICRO_ACTIONS.find((a) => a.id === 'estudanky_pramen');
    const spPreview = createMockCanvas(380, 86);
    const cleanSpPrev = Sensory.mountImpactCanvas(spPreview, {
      action: estudanky,
      preview: true,
      primed: false,
      silent: true
    });
    assertSaveRestoreBalanced(spPreview.ops);
    // Test primed = true settled at rawP = 0.14 (hovering card/CTA before starting)
    cleanSpPrev.setPrimed(true);
    spPreview.ops.length = 0;
    stepFrames(35);
    spPreview.ops.length = 0;
    stepFrames(1);
    assertSaveRestoreBalanced(spPreview.ops);
    // Delayed gratification: no crystal fountain arcs in primed preview, while all 5 autumn leaves rest on murky pool
    const prevFountainArcs = spPreview.ops.filter(
      (o) => o.op === 'stroke' && o.lineWidth > 2 && ['#7dd3fc', '#e0f2fe'].includes(o.strokeStyle)
    );
    expect(prevFountainArcs.length).toBe(0);
    const prevAutumnLeaves = spPreview.ops.filter(
      (o) => o.op === 'fill' && ['#b45309', '#d97706', '#92400e', '#ca8a04', '#c2410c'].includes(o.fillStyle)
    );
    expect(prevAutumnLeaves.length).toBe(5);
    cleanSpPrev();

    // Intermediate started state (climax: false -> rawP ramps to 0.25) across all 3 upgraded scenes
    for (const act of [
      estudanky,
      MICRO_ACTIONS.find((a) => a.id === 'darovani_krve'),
      MICRO_ACTIONS.find((a) => a.id === 'zooniverse_veda')
    ]) {
      const startedCv = createMockCanvas(320, 118);
      const cleanStarted = Sensory.mountImpactCanvas(startedCv, { action: act, climax: false });
      startedCv.ops.length = 0;
      stepFrames(60);
      startedCv.ops.length = 0;
      stepFrames(1);
      assertSaveRestoreBalanced(startedCv.ops);
      cleanStarted();
    }

    // Climax at p = 1 (via reduced-motion instant settle)
    globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
      devicePixelRatio: 1,
      matchMedia: (q) => ({ matches: q.includes('prefers-reduced-motion') }),
      addEventListener: () => { }
    }));

    const spClimax = createMockCanvas(320, 118);
    const cleanSpClimax = Sensory.mountImpactCanvas(spClimax, { action: estudanky, climax: true });
    assertSaveRestoreBalanced(spClimax.ops);
    const climaxFountainArcs = spClimax.ops.filter(
      (o) => o.op === 'stroke' && o.lineWidth > 2 && ['#7dd3fc', '#e0f2fe'].includes(o.strokeStyle)
    );
    expect(climaxFountainArcs.length).toBe(3);
    // Multi-leaflet forest ferns: 4 fronds * (5..6 paired pinnae + apical tip) >= 44 emerald leaflet fills
    const fernLeafletFills = spClimax.ops.filter(
      (o) => o.op === 'fill' && ['#6ee7b7', '#10b981', '#047857'].includes(o.fillStyle)
    );
    expect(fernLeafletFills.length).toBeGreaterThanOrEqual(44);
    cleanSpClimax();

    // 2. blood_drop (darovani_krve): left ruby droplet (cx - 58) -> 3 QRS lifelines -> 3 glowing hearts on right (cx + 46..49)
    const krev = MICRO_ACTIONS.find((a) => a.id === 'darovani_krve');
    const krPreview = createMockCanvas(380, 86);
    const cleanKrPrev = Sensory.mountImpactCanvas(krPreview, {
      action: krev,
      preview: true,
      primed: true,
      silent: true
    });
    assertSaveRestoreBalanced(krPreview.ops);
    const leakedLifelines = krPreview.ops.filter((o) => o.op === 'stroke' && o.lineWidth > 2);
    expect(leakedLifelines.length).toBe(0);
    cleanKrPrev();

    const krClimax = createMockCanvas(320, 118);
    const cleanKrClimax = Sensory.mountImpactCanvas(krClimax, { action: krev, climax: true });
    assertSaveRestoreBalanced(krClimax.ops);
    const activeLifelines = krClimax.ops.filter(
      (o) => o.op === 'stroke' && Math.abs(o.lineWidth - 2.15) < 0.05
    );
    expect(activeLifelines.length).toBe(3);
    // Pulse ring uses a teardrop bezier path, never a circular arc slicing across the lifelines
    const petriRingStrokes = krClimax.ops.filter(
      (o) => o.op === 'stroke' && String(o.strokeStyle).startsWith('rgba(253, 164, 175')
    );
    expect(petriRingStrokes.length).toBe(1);
    const litHeartFills = krClimax.ops.filter(
      (o) => o.op === 'fill' && ['#fb7185', '#f43f5e', '#e11d48'].includes(o.fillStyle)
    );
    expect(litHeartFills.length).toBe(3);
    cleanKrClimax();

    // 3. cosmos_science (zooniverse_veda): soft radial-gradient elliptical nebula (no hard flat ellipse) + 3 spiral arms + 14 pinpoint stars
    const zoo = MICRO_ACTIONS.find((a) => a.id === 'zooniverse_veda');
    const zooPreview = createMockCanvas(240, 50); // Compact/narrow boundary check
    const cleanZooPrev = Sensory.mountImpactCanvas(zooPreview, {
      action: zoo,
      preview: true,
      primed: true,
      silent: true
    });
    assertSaveRestoreBalanced(zooPreview.ops);
    const leakedArms = zooPreview.ops.filter(
      (o) => o.op === 'stroke' && ['#38bdf8', '#f472b6', '#a78bfa'].includes(o.strokeStyle)
    );
    expect(leakedArms.length).toBe(0);
    cleanZooPrev();

    const zooClimax = createMockCanvas(320, 118);
    const cleanZooClimax = Sensory.mountImpactCanvas(zooClimax, { action: zoo, climax: true });
    assertSaveRestoreBalanced(zooClimax.ops);
    // Nebula glow must use radial gradient under elliptical transform, never a flat-filled sharp ellipse
    expect(zooClimax.ops.filter((o) => o.op === 'ellipse').length).toBe(0);
    const spiralArms = zooClimax.ops.filter(
      (o) => o.op === 'stroke' && ['#38bdf8', '#f472b6', '#a78bfa'].includes(o.strokeStyle)
    );
    expect(spiralArms.length).toBe(3);
    const starColors = ['#ffffff', '#fef08a', '#bae6fd', '#fbcfe8', '#fde047', '#fde68a'];
    const pinpointStars = zooClimax.ops.filter(
      (o) => o.op === 'arc' && o.r > 0.25 && o.r <= 1.35 && starColors.includes(o.fillStyle)
    );
    const galaxySpecificStars = zooClimax.ops.filter(
      (o) => o.op === 'arc' && o.r > 0.25 && o.r <= 1.35 && ['#ffffff', '#fef08a', '#bae6fd', '#fbcfe8', '#fde047'].includes(o.fillStyle)
    );
    expect(galaxySpecificStars.length).toBe(13); // 13 in white/gold/cyan/rose + 1 in #fde68a = 14 pinpoint stars!
    expect(pinpointStars.length).toBeGreaterThanOrEqual(14);
    cleanZooClimax();
  });

  it('renders zvire_v_nouzi (wildlife_rescue) cleanly across preview, started, and climax states with static 34-station metric and zero spine-face or underground clipping bugs', () => {
    const zvire = MICRO_ACTIONS.find((a) => a.id === 'zvire_v_nouzi');
    expect(zvire).toBeDefined();

    const spec = Sensory.ACTION_EFFECT_CATALOG.zvire_v_nouzi;
    expect(spec.mode).toBe('wildlife_rescue');
    expect(spec.staticMetric).toBe(true);
    expect(spec.format(34)).toBe('34 stanic v pohotovosti');

    const assertSaveRestoreBalanced = (ops) => {
      const saves = ops.filter((o) => o.op === 'save').length;
      const restores = ops.filter((o) => o.op === 'restore').length;
      expect(saves).toBeGreaterThan(0);
      expect(saves).toBe(restores);
    };

    // 1. Mobile compact preview (46px) & Desktop preview (92px): hedgehog + bird rest above ground, zero premature climax heart
    for (const previewH of [46, 92]) {
      const prevCv = createMockCanvas(380, previewH);
      const cleanPrev = Sensory.mountImpactCanvas(prevCv, {
        action: zvire,
        preview: true,
        primed: false,
        silent: true
      });
      assertSaveRestoreBalanced(prevCv.ops);
      expect(prevCv.classList.contains('impact-payoff-canvas')).toBe(false);
      expect(prevCv.getAttribute('data-molly-mini')).toBeNull();

      // Verify zero spines plunge below hedgehog ground origin (y > 2 in local hedgehog coords)
      const undergroundSpineVertices = prevCv.ops.filter(
        (o) => o.op === 'lineTo' && typeof o.y === 'number' && o.y > 4 && o.y < 25
      );
      expect(undergroundSpineVertices.length).toBe(0);

      cleanPrev.setPrimed(true);
      prevCv.ops.length = 0;
      stepFrames(12);
      assertSaveRestoreBalanced(prevCv.ops);
      cleanPrev();
    }

    // 2. Started state (climax: false): reports full 34 stations immediately (never stuck at 22)
    const startedMetrics = [];
    const startedCv = createMockCanvas(320, 118, ['impact-payoff-canvas']);
    const startedHandle = Sensory.impactCanvas(startedCv, {
      action: zvire,
      climax: false,
      silent: true,
      onWeightUpdate: (val, formatted) => startedMetrics.push({ val, formatted })
    });
    stepFrames(80);
    expect(startedMetrics.length).toBeGreaterThan(0);
    expect(startedMetrics.every((m) => m.val === 34 && m.formatted === '34 stanic v pohotovosti')).toBe(
      true
    );
    assertSaveRestoreBalanced(startedCv.ops);
    startedHandle.destroy();

    // 3. Climax state (p = 1 via reduced motion): uncurled hedgehog with paws, separate eye/nose subpaths, bird, and rescue heart
    globalThis.window = /** @type {Window & typeof globalThis} */ (/** @type {unknown} */ ({
      devicePixelRatio: 1,
      matchMedia: (q) => ({ matches: q.includes('prefers-reduced-motion') }),
      addEventListener: () => {}
    }));

    const climaxCv = createMockCanvas(320, 118, ['impact-payoff-canvas']);
    const cleanClimax = Sensory.mountImpactCanvas(climaxCv, {
      action: zvire,
      climax: true
    });
    assertSaveRestoreBalanced(climaxCv.ops);

    // Every arc call must follow its own beginPath (never two consecutive arcs in one subpath)
    for (let i = 1; i < climaxCv.ops.length; i++) {
      if (climaxCv.ops[i].op === 'arc') {
        expect(climaxCv.ops[i - 1].op).toBe('beginPath');
      }
    }

    // Hedgehog paws (#d97706) + sanctuary cradle strokes + warm yellow heart (#fde047) are all rendered
    const pawFills = climaxCv.ops.filter((o) => o.op === 'fill' && o.fillStyle === '#d97706');
    expect(pawFills.length).toBe(2);
    const cradleStrokes = climaxCv.ops.filter(
      (o) => o.op === 'stroke' && String(o.strokeStyle).startsWith('rgba(110, 231, 183')
    );
    expect(cradleStrokes.length).toBe(2);
    cleanClimax();
  });
});
