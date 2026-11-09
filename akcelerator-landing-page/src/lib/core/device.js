/**
 * Device heuristics, low-power adaptations, canvas rendering optimizations,
 * motion preferences, and shared orientation listeners.
 */

const win = () => typeof window !== 'undefined';

/**
 * Checks whether user prefers reduced motion.
 * @returns {boolean}
 */
export const prefersReducedMotion = () =>
  !!(win() && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

/** @type {boolean | null} */
let cachedLowPower = null;

/**
 * Heuristika pro slabší zařízení (telefony, levné tablety, in-app prohlížeče, úsporný režim dat).
 * Na nich vypínáme drahé `shadowBlur` záře a snižujeme rozlišení pláten, aby animace nesekaly.
 * Výsledek se cachuje — zařízení se během session nemění.
 * @returns {boolean}
 */
export function isLowPowerDevice() {
  if (cachedLowPower !== null) return cachedLowPower;
  if (!win()) return false;
  try {
    const nav = /** @type {any} */ (navigator);
    const coarse = !!window.matchMedia?.('(pointer: coarse)').matches;
    const narrow = (window.innerWidth || 1280) <= 820;
    const cores = Number(nav.hardwareConcurrency) || 4;
    const devMem = Number(nav.deviceMemory) || 4;
    const saveData = !!nav.connection?.saveData;
    cachedLowPower = saveData || cores <= 2 || devMem <= 2 || coarse || (narrow && cores <= 4);
  } catch {
    cachedLowPower = false;
  }
  return cachedLowPower;
}

/**
 * Maximální devicePixelRatio pro animovaná plátna (Retina 3× by zbytečně čtyřnásobila počet pixelů).
 * @returns {number}
 */
export function getCanvasDprCap() {
  return isLowPowerDevice() ? 1.5 : 2;
}

/**
 * Na slabších zařízeních udělá z `shadowBlur` no-op pro konkrétní 2D kontext.
 * Gaussovský rozmaz stínu se počítá na CPU při každém vykreslení tvaru a je hlavní příčinou sekání
 * částicových scén na telefonech. Barvy, tvary i aditivní záře (`lighter`) zůstávají zachované.
 * @param {CanvasRenderingContext2D | null | undefined} ctx
 * @returns {CanvasRenderingContext2D | null | undefined}
 */
export function optimizeCanvasContext(ctx) {
  if (!ctx || !isLowPowerDevice()) return ctx;
  try {
    Object.defineProperty(ctx, 'shadowBlur', {
      configurable: true,
      get: () => 0,
      set: () => {}
    });
  } catch {}
  return ctx;
}

/**
 * Normalizovaný krok snímku vůči 60 fps (1 = 16,7 ms). Omezený, aby se po přepnutí záložky
 * nebo zaseknutí hlavního vlákna částice „neteleportovaly“.
 * @param {number} dtMs
 * @returns {number}
 */
export function frameStep(dtMs) {
  if (!Number.isFinite(dtMs) || dtMs <= 0) return 1;
  return Math.max(0.25, Math.min(3, dtMs / 16.667));
}

/**
 * Shared singleton DeviceOrientation state across all canvases (H4 / AUDIT #5).
 */
export let sharedOrientationGx = 0;
let sharedOrientationListening = false;

/**
 * Initializes passive device orientation listener once across all visual canvases.
 */
export function ensureSharedOrientation() {
  if (sharedOrientationListening || !win()) return;
  try {
    window.addEventListener(
      'deviceorientation',
      (e) => {
        if (typeof e?.gamma === 'number') {
          sharedOrientationGx = Math.max(-0.42, Math.min(0.42, e.gamma * 0.01));
        }
      },
      { passive: true }
    );
    sharedOrientationListening = true;
  } catch {}
}

/**
 * Returns the current horizontal tilt gravity factor [-0.42, 0.42].
 * @returns {number}
 */
export function getSharedOrientationGx() {
  return sharedOrientationGx;
}

/**
 * Safe vibration invocation that ignores errors on unsupported devices.
 * @param {VibratePattern} v
 */
export function safeVibrate(v) {
  try {
    navigator.vibrate?.(v);
  } catch {}
}
