/**
 * Sanctuary Lake & Water Reflection 2D Canvas Renderer.
 * High-performance rendering for lake mist, breathing aura, water ripples,
 * and specular star/lantern reflections on the mirror pond (/svet).
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   w: number,
 *   h: number,
 *   speed: number,
 *   phase: number
 * }} MistCloud
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   rx: number,
 *   maxRx: number,
 *   speed: number,
 *   alpha: number,
 *   lineWidth: number,
 *   color: string
 * }} WaterRipple
 */

/**
 * Renders drifting lake mist clouds over the mirror pond.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {{
 *   mistClouds: MistCloud[],
 *   width: number,
 *   height: number,
 *   t: number,
 *   k: number,
 *   isNight: boolean,
 *   reducedMotion: boolean
 * } | null} [params]
 */
export function drawLakeMist(ctx, params) {
  if (!ctx || !params) return;
  const { mistClouds, width, height, t, k, isNight, reducedMotion } = params;
  if (!Array.isArray(mistClouds)) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const mc of mistClouds) {
    if (!reducedMotion) {
      mc.x += mc.speed * k;
      if (mc.x > 1.25) mc.x = -0.25;
      if (mc.x < -0.25) mc.x = 1.25;
    }
    const mx = mc.x * width;
    const my = mc.y * height + Math.sin(t * 0.5 + mc.phase) * 4;
    const mw = mc.w * width;
    const mh = mc.h * height;
    const mistGrad = ctx.createRadialGradient(
      mx,
      my,
      4,
      mx,
      my,
      mw * 0.55
    );
    mistGrad.addColorStop(
      0,
      isNight
        ? 'rgba(110, 231, 183, 0.085)'
        : 'rgba(254, 249, 235, 0.13)'
    );
    mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.ellipse(mx, my, mw * 0.55, mh, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Renders the pulsing breathing sanctuary aura on the pond.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {{
 *   width: number,
 *   height: number,
 *   breathScale: number
 * } | null} [params]
 */
export function drawBreathingPondAura(ctx, params) {
  if (!ctx || !params) return;
  const { width, height, breathScale } = params;
  const pulseR = width * (0.16 + (breathScale - 0.86) * 0.24);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const bg = ctx.createRadialGradient(
    width * 0.5,
    height * 0.62,
    8,
    width * 0.5,
    height * 0.62,
    pulseR
  );
  bg.addColorStop(0, 'rgba(253, 230, 138, 0.32)');
  bg.addColorStop(0.5, 'rgba(52, 211, 153, 0.16)');
  bg.addColorStop(1, 'rgba(52, 211, 153, 0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(
    width * 0.5,
    height * 0.62,
    pulseR,
    pulseR * 0.42,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();
}

/**
 * Renders shimmering water-stroke column reflections on the pond below a sky star.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {{
 *   sx: number,
 *   height: number,
 *   t: number,
 *   i: number,
 *   hScale: number,
 *   starY: number
 * } | null} [params]
 */
export function drawStarLakeReflection(ctx, params) {
  if (!ctx || !params) return;
  const { sx, height, t, i, hScale, starY } = params;
  const ry = height * (0.6 + (0.48 - Math.min(0.46, starY)) * 0.44);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let row = 0; row < 4; row++) {
    const rowY = ry + row * 4.5;
    const waveX = sx + Math.sin(t * 2.8 + i + row * 1.3) * (3 + row * 1.4);
    const halfW = (13 - row * 2.2) * hScale;
    ctx.strokeStyle = `rgba(253, 230, 138, ${(0.36 - row * 0.07).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(waveX - halfW, rowY);
    ctx.lineTo(waveX + halfW, rowY);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders concentric bioluminescent water ripples on the lake surface and advances their life.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {{
 *   waterRipples: WaterRipple[],
 *   width: number,
 *   height: number,
 *   k: number
 * } | null} [params]
 */
export function drawWaterRipples(ctx, params) {
  if (!ctx || !params || !Array.isArray(params.waterRipples)) return;
  const { waterRipples, width, height, k } = params;
  for (let i = waterRipples.length - 1; i >= 0; i--) {
    const rp = waterRipples[i];
    rp.rx += rp.speed * k;
    const lifeFrac = rp.rx / rp.maxRx;
    if (lifeFrac >= 1 || rp.alpha < 0.015) {
      waterRipples.splice(i, 1);
      continue;
    }
    const curAlpha = rp.alpha * (1 - lifeFrac);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, curAlpha));
    ctx.strokeStyle = rp.color;
    ctx.lineWidth = rp.lineWidth;
    ctx.beginPath();
    ctx.ellipse(
      rp.x * width,
      rp.y * height,
      rp.rx,
      rp.rx * 0.29,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Renders soft translucent warm underwater reflection pool & shimmering reflection strokes below a floating paper lantern.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {{
 *   bobX: number,
 *   bobY: number,
 *   poolR: number,
 *   totalScale: number,
 *   t: number,
 *   i: number,
 *   meta: { glow: string }
 * } | null} [params]
 */
export function drawLanternWaterReflection(ctx, params) {
  if (!ctx || !params) return;
  const { bobX, bobY, poolR, totalScale, t, i, meta } = params;
  // Soft translucent warm underwater reflection pool (zero opaque saucer!)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pg = ctx.createRadialGradient(
    bobX,
    bobY + 6,
    1,
    bobX,
    bobY + 6,
    poolR
  );
  pg.addColorStop(0, 'rgba(255, 251, 235, 0.56)');
  pg.addColorStop(0.28, 'rgba(251, 191, 36, 0.26)');
  pg.addColorStop(0.62, meta.glow.replace(/0\.\d+\)/, '0.14)'));
  pg.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.ellipse(bobX, bobY + 7, poolR, poolR * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Delicate shimmering reflection strokes below the lantern
  for (let wr = 0; wr < 3; wr++) {
    const wy = bobY + 8 + wr * 3.6 * totalScale;
    const wx = bobX + Math.sin(t * 3.1 + i + wr) * 2.5;
    const ww = (10 - wr * 2.4) * totalScale;
    ctx.strokeStyle = `rgba(254, 243, 199, ${(0.38 - wr * 0.1).toFixed(3)})`;
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wx - ww, wy);
    ctx.lineTo(wx + ww, wy);
    ctx.stroke();
  }
  ctx.restore();
}
