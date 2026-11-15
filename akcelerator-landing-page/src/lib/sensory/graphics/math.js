/**
 * Procedural Canvas 2D math & easing helpers.
 */

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const subP = (p, a, b) => clamp01((p - a) / Math.max(0.0001, b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};
