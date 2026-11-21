/**
 * Procedural Canvas 2D math & easing helpers.
 */

/**
 * @param {number} v
 * @returns {number}
 */
export const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * @param {number} p
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export const subP = (p, a, b) => clamp01((p - a) / Math.max(0.0001, b - a));

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * @param {number} t
 * @returns {number}
 */
export const easeOut = (t) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};
