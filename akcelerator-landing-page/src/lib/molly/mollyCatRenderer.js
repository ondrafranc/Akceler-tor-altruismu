/**
 * Procedural 2D Canvas Tortoiseshell Cat ("Želvovinová kočka Molly") Renderer.
 * High-DPI procedural rendering extracted from MollyCompanion.svelte.
 *
 * Visual specifications:
 * - Velvety dark chocolate-obsidian body (#1e1714) with asymmetric tortoiseshell patches (amber #f59e0b, rust #ea580c, honey #fde68a)
 * - Chimney-blaze face split, pink/terracotta nose, 6 spring-physics whiskers, independent twitching ears
 * - Soft breathing chest, 4 animated walking paws, 6-control-point harmonic Bézier tail
 * - Expressive emerald eyes (#84cc16 / #bef264) tracking pointer or curving into ^ ^ arcs
 */

/**
 * @typedef {{
 *   vx: number,
 *   vy: number,
 *   behavior: string,
 *   eatTimer: number,
 *   petBlissTimer: number,
 *   currentState: { mode: string, mood: string },
 *   facing: number,
 *   walkCycle: number,
 *   flyingTreat?: { p: number } | null,
 *   pouncePhase: number,
 *   groomPhase: number,
 *   accessories: { collar?: boolean, bell?: boolean, flower?: boolean, star?: boolean },
 *   pointerX: number,
 *   pointerY: number,
 *   posX: number,
 *   posY: number,
 *   blinkProgress: number,
 *   firefly?: { x: number, y: number, phase: number } | null,
 *   hearts: Array<{ x: number, y: number, vx: number, vy: number, alpha: number, scale: number, color: string }>,
 *   stardust: Array<{ x: number, y: number, vx: number, vy: number, alpha: number, size: number, twinkle: number, color: string }>,
 *   frameK: number,
 *   isFollowingMouse?: boolean
 * }} MollyCatRenderState
 */

/**
 * Procedurally draws the tortoiseshell cat Molly onto a 2D canvas context.
 *
 * @param {CanvasRenderingContext2D | null} [ctx]
 * @param {number} [w] Logical canvas width
 * @param {number} [h] Logical canvas height
 * @param {number} [nowSec] Current animation timestamp in seconds
 * @param {MollyCatRenderState | null} [state] Dynamic physics & interaction state
 */
export function drawMollyCat(ctx, w, h, nowSec, state) {
  if (!ctx || !state) return;
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const cx = w * 0.5;
  const groundY = h - 10;
  const speed = Math.hypot(state.vx, state.vy);
  const isWalking = state.behavior === 'WALK_ROAM' && speed > 0.25;
  const isGrooming = state.behavior === 'GROOM';
  const isEating = state.eatTimer > 0 || state.behavior === 'CATCH_TREAT';
  const isBliss =
    state.petBlissTimer > 0 ||
    state.behavior === 'PET_BLISS' ||
    state.currentState?.mood === 'purring' ||
    state.currentState?.mood === 'breathing';
  const isSleeping = state.currentState?.mode === 'docked' || state.currentState?.mood === 'sleeping';

  // Soft warm ground shadow & golden aura
  const shadowGrad = ctx.createRadialGradient(
    cx,
    groundY + 2,
    2,
    cx,
    groundY + 2,
    36
  );
  shadowGrad.addColorStop(
    0,
    isEating || isBliss
      ? 'rgba(251, 191, 36, 0.32)'
      : 'rgba(10, 18, 14, 0.42)'
  );
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2, 34, 7.2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, groundY);
  ctx.scale(state.facing, 1);

  const breathScale =
    state.currentState?.mood === 'breathing'
      ? 1 + Math.sin(nowSec * 1.4) * 0.065
      : 1 + Math.sin(nowSec * 2.4) * 0.025;
  const walkBob = isWalking ? Math.abs(Math.sin(state.walkCycle * 2)) * -3.2 : 0;
  const isChasingStar = state.behavior === 'CHASE_STAR';
  const isFollowingMouse = Boolean(state.isFollowingMouse);
  const leapOffset =
    state.behavior === 'CATCH_TREAT' && state.flyingTreat
      ? Math.sin(state.flyingTreat.p * Math.PI) * -14
      : isChasingStar && state.pouncePhase > 0
        ? -Math.sin(Math.min(1, state.pouncePhase) * Math.PI) * 16
        : 0;

  ctx.translate(0, walkBob + leapOffset);

  // 1. 6-Control-Point Harmonic Bézier Tail (Obsidian with amber/rust/honey tortoiseshell rings)
  const tailFreq = isChasingStar
    ? 6.2
    : isBliss || isEating
      ? 5.2
      : isFollowingMouse
        ? 4.8
        : isWalking
          ? 3.8
          : 2.1;
  const tailAmp = isChasingStar
    ? 13
    : isBliss || isEating
      ? 11
      : isFollowingMouse
        ? 9.5
        : 7.5;
  const w1 = Math.sin(nowSec * tailFreq) * tailAmp;
  const w2 = Math.cos(nowSec * tailFreq * 0.85 - 0.8) * (tailAmp * 1.15);

  const t0x = -18;
  const t0y = -12;
  const t1x = -34;
  const t1y = -16 + w1 * 0.35;
  const t2x = -44 + w1 * 0.5;
  const t2y = -32 + w2 * 0.5;
  const t3x = -36 + w2 * 0.8;
  const t3y = -48 + w1 * 0.4;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Base obsidian tail
  ctx.strokeStyle = '#1e1714';
  ctx.lineWidth = 8.2;
  ctx.beginPath();
  ctx.moveTo(t0x, t0y);
  ctx.bezierCurveTo(t1x, t1y, t2x, t2y, t3x, t3y);
  ctx.stroke();

  // Rust patch on mid-tail
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 6.4;
  ctx.beginPath();
  ctx.moveTo((t0x + t1x) * 0.5, (t0y + t1y) * 0.5);
  ctx.quadraticCurveTo(t1x, t1y, (t1x + t2x) * 0.5, (t1y + t2y) * 0.5);
  ctx.stroke();

  // Honey-amber tip
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 5.4;
  ctx.beginPath();
  ctx.moveTo((t1x + t2x) * 0.5, (t1y + t2y) * 0.5);
  ctx.quadraticCurveTo(t2x, t2y, t3x, t3y);
  ctx.stroke();

  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(t3x, t3y, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Back Paws (Animated during walk)
  const legSwingA = isWalking ? Math.sin(state.walkCycle) * 6.5 : 0;
  const legSwingB = isWalking ? -Math.sin(state.walkCycle) * 6.5 : 0;

  // Back-left paw (obsidian with rust ankle)
  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.ellipse(-13 + legSwingB * 0.7, -3, 5.2, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back-right paw (amber patch)
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(-5 + legSwingA * 0.7, -2.2, 5.2, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Velvety Chocolate-Obsidian Body (#1e1714) with Asymmetric Tortoiseshell Patches
  ctx.save();
  ctx.scale(breathScale, 2 - breathScale);
  ctx.fillStyle = '#1e1714';
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (isWalking) {
    ctx.ellipse(-2, -16, 21, 13.5, -0.06, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-2, -17, 18.5, 15.5, -0.15, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Clip to body for tortoiseshell mottling (amber #f59e0b, rust #ea580c, honey #fde68a)
  ctx.beginPath();
  if (isWalking) {
    ctx.ellipse(-2, -16, 20.6, 13.1, -0.06, 0, Math.PI * 2);
  } else {
    ctx.ellipse(-2, -17, 18.1, 15.1, -0.15, 0, Math.PI * 2);
  }
  ctx.clip();

  // Rust saddle patch
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(-9, -22, 10, 7.5, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Amber flank patch
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(5, -14, 9.5, 6.8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Honey chest & shoulder flecks
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(11, -18, 5.8, 7.2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(-14, -11, 6.2, 5.0, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 4. Front Paws (Animated walking, grooming or star pouncing)
  if (isGrooming) {
    // Lifted ginger paw washing cheek
    const lickY = -24 + Math.sin(state.groomPhase * 7) * 3.2;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(15, lickY, 4.8, 3.4, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(17.5, lickY - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (isChasingStar && state.pouncePhase > 0.08 && state.pouncePhase < 0.92) {
    // Playfully reaching up with paws to catch the fluttering star
    const reachY = -12 - Math.sin(state.pouncePhase * Math.PI) * 14;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(10, reachY, 5.0, 3.8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e1714';
    ctx.beginPath();
    ctx.ellipse(15, reachY + 2, 4.8, 3.6, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Front-left paw (ginger-amber)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(7 + legSwingA, -2.2, 5.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.ellipse(8.6 + legSwingA, -1.6, 2.4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front-right supporting paw (obsidian with honey toes)
  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.ellipse(13 + legSwingB, -2, 5.0, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(15 + legSwingB, -1.5, 2.1, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Head with Chimney-Blaze Split & Independent Twitching Ears
  const headX = isWalking ? 13 : 9;
  const headY = isWalking ? -29 : -32;

  // 4B. Dárky za pamlsky: smaragdový obojek + zlatý zvoneček (hlava je kreslí přes horní okraj)
  if (state.accessories?.collar) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(headX - 1, headY + 10.5, 9.5, 3.6, 0, 0.05 * Math.PI, 0.95 * Math.PI);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(167, 243, 208, 0.85)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.ellipse(headX - 1, headY + 10, 9.5, 3.6, 0, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  if (state.accessories?.bell) {
    const bellSwing = isWalking ? Math.sin(state.walkCycle * 2) * 1.2 : Math.sin(nowSec * 2) * 0.4;
    const bx = headX - 1 + bellSwing;
    const bellY = headY + 15.6;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(bx, bellY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(bx - 0.9, bellY - 0.9, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bx - 1.4, bellY + 0.9, 2.8, 0.7);
  }
  const headTilt = isGrooming
    ? 0.16
    : state.behavior === 'CHASE_FIREFLY'
      ? -0.12
      : Math.sin(nowSec * 1.5) * 0.04;

  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(headTilt);

  // Independent ear twitches + dynamic ear bounce physics
  const earBounce = isWalking ? Math.sin(state.walkCycle * 2) * 0.12 : 0;
  const leftEarTwitch =
    isChasingStar
      ? Math.sin(nowSec * 16) * 0.16 + earBounce
      : (Math.sin(nowSec * 3.1) > 0.9 ? Math.sin(nowSec * 20) * 0.12 : 0) + earBounce;
  const rightEarTwitch =
    isChasingStar
      ? Math.cos(nowSec * 14) * -0.18 - earBounce
      : (Math.cos(nowSec * 2.7) > 0.88 ? Math.cos(nowSec * 19) * -0.14 : 0) - earBounce;

  // Left ear (Obsidian with honey tuft)
  ctx.save();
  ctx.rotate(leftEarTwitch);
  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.moveTo(-12, -6);
  ctx.lineTo(-15, -22);
  ctx.lineTo(-3, -13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.moveTo(-10.5, -8);
  ctx.lineTo(-12.8, -18.5);
  ctx.lineTo(-5.2, -12.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right ear (Rust-amber tortoiseshell)
  ctx.save();
  ctx.rotate(rightEarTwitch);
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(3, -13);
  ctx.lineTo(15, -22);
  ctx.lineTo(12, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(5.2, -12.2);
  ctx.lineTo(12.6, -18.5);
  ctx.lineTo(10.2, -8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Rounded head cranium
  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14.8, 13.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Signature Chimney-Blaze Split on Face
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, 14.8, 13.2, 0, 0, Math.PI * 2);
  ctx.clip();

  // Right side of face: warm amber (#f59e0b) & rust (#ea580c) blaze
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(-0.5, -15);
  ctx.lineTo(16, -15);
  ctx.lineTo(16, 15);
  ctx.lineTo(1.2, 15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(9, -6, 6.5, 5.5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Honey cheek patch & eyebrow spot
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(6.5, 4.5, 5.5, 4.2, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-5.2, -5.8, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. Expressive Emerald Eyes (#84cc16 / #bef264)
  const relPtrX = (state.pointerX - state.posX) * state.facing;
  const relPtrY = state.pointerY - (state.posY - 32);
  const gazeAngle = Math.atan2(relPtrY, relPtrX);
  const gazeDist = Math.min(1.8, Math.hypot(relPtrX, relPtrY) / 140);
  const lookDX = Math.cos(gazeAngle) * gazeDist;
  const lookDY = Math.sin(gazeAngle) * gazeDist;

  if (isBliss || isEating || isSleeping || state.blinkProgress > 0.65) {
    // Blissful ^ ^ arcs or peaceful sleeping eyelids
    ctx.strokeStyle = isSleeping ? '#fde68a' : '#bef264';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    [-5.6, 5.6].forEach((ex) => {
      ctx.beginPath();
      if (isSleeping) {
        ctx.arc(ex, 0.5, 3.4, 0.15 * Math.PI, 0.85 * Math.PI);
      } else {
        ctx.arc(ex, 0.2, 3.5, 1.15 * Math.PI, 1.85 * Math.PI);
      }
      ctx.stroke();
    });
  } else {
    const pupilW =
      state.behavior === 'CHASE_FIREFLY' || state.currentState.mood === 'playful'
        ? 2.5
        : 1.75;
    [-5.6, 5.6].forEach((ex) => {
      // Emerald iris with subtle lime glow
      ctx.fillStyle = 'rgba(190, 242, 100, 0.32)';
      ctx.beginPath();
      ctx.ellipse(ex, -0.4, 5.0, 4.7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(ex, -0.4, 3.8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner lime ring
      ctx.fillStyle = '#bef264';
      ctx.beginPath();
      ctx.ellipse(ex, -0.4, 2.9, 2.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil tracking pointer / firefly
      ctx.fillStyle = '#090d08';
      ctx.beginPath();
      ctx.ellipse(
        ex + lookDX,
        -0.4 + lookDY,
        pupilW,
        2.6,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Catchlight specular sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 1.1, -1.6, 1.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1.1, 0.8, 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. Pink/Terracotta Nose & Cute Mouth
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.moveTo(-2.2, 3.2);
  ctx.lineTo(2.2, 3.2);
  ctx.lineTo(0, 5.4);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fda4af';
  ctx.lineWidth = 1.25;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 5.3);
  ctx.quadraticCurveTo(-2.2, 7.4, -4.0, 6.0);
  ctx.moveTo(0, 5.3);
  ctx.quadraticCurveTo(2.2, 7.4, 4.0, 6.0);
  ctx.stroke();

  if (isEating) {
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 6.6, 2.1 + Math.sin(nowSec * 22) * 0.8, 0, Math.PI);
    ctx.fill();
  }

  // 8. 6 Spring-Physics Whiskers (3 on each side)
  ctx.strokeStyle = 'rgba(254, 243, 199, 0.85)';
  ctx.lineWidth = 1.0;
  const whiskerSpring = Math.sin(nowSec * (isBliss ? 9 : 3.4)) * 1.4 - state.vy * 0.35;
  [-1, 1].forEach((dir) => {
    [-1, 0, 1].forEach((row) => {
      const wy0 = 4.4 + row * 1.7;
      const wx0 = dir * 7.2;
      const wx1 = dir * 19.5;
      const wy1 = wy0 + row * 2.2 + whiskerSpring * (row + 1.5) * 0.4;
      ctx.beginPath();
      ctx.moveTo(wx0, wy0);
      ctx.quadraticCurveTo((wx0 + wx1) * 0.5, wy0 - 1.2, wx1, wy1);
      ctx.stroke();
    });
  });

  // 8B. Květinová korunka (dárek za 25 pamlsků) mezi oušky
  if (state.accessories?.flower) {
    /** @type {Array<[number, number, string]>} */
    const blossoms = [
      [-7.5, -11.2, '#f9a8d4'],
      [-2.6, -13.0, '#fde68a'],
      [2.6, -13.0, '#c4b5fd'],
      [7.5, -11.2, '#f9a8d4']
    ];
    for (const [fx, fy, col] of blossoms) {
      ctx.fillStyle = col;
      for (let pi = 0; pi < 4; pi++) {
        const pa = pi * (Math.PI / 2) + 0.4;
        ctx.beginPath();
        ctx.arc(fx + Math.cos(pa) * 1.5, fy + Math.sin(pa) * 1.5, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(fx, fy, 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore(); // end head

  // 8C. Zářivá hvězdička (dárek za 50 pamlsků) vznášející se nad hlavou
  if (state.accessories?.star) {
    const sx = headX;
    const sy = headY - 25 + Math.sin(nowSec * 1.8) * 1.6;
    ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    for (let si = 0; si < 10; si++) {
      const rad = si % 2 === 0 ? 4.4 : 1.9;
      const a = -Math.PI / 2 + (si * Math.PI) / 5 + nowSec * 0.6;
      const px = sx + Math.cos(a) * rad;
      const py = sy + Math.sin(a) * rad;
      if (si === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 9. Floating Firefly when in CHASE_FIREFLY state
  if (state.firefly) {
    const fx = state.firefly.x;
    const fy = state.firefly.y + Math.sin(nowSec * 5 + state.firefly.phase) * 5;
    const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 12);
    fg.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    fg.addColorStop(0.45, 'rgba(251, 191, 36, 0.45)');
    fg.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 10. Rising Golden & Pink Hearts when petted or fed
  if (Array.isArray(state.hearts)) {
    for (let i = state.hearts.length - 1; i >= 0; i--) {
      const hItem = state.hearts[i];
      if (!hItem) continue;
      hItem.x += hItem.vx * state.frameK;
      hItem.y += hItem.vy * state.frameK;
      hItem.alpha *= Math.pow(0.96, state.frameK);
      if (hItem.alpha < 0.05) {
        state.hearts.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = hItem.alpha;
      ctx.fillStyle = hItem.color;
      const r = 4.8 * hItem.scale;
      const hx = hItem.x;
      const hy = hItem.y;
      ctx.beginPath();
      ctx.moveTo(hx, hy + r * 0.35);
      ctx.bezierCurveTo(
        hx - r,
        hy - r * 0.4,
        hx - r * 1.1,
        hy + r * 0.6,
        hx,
        hy + r * 1.25
      );
      ctx.bezierCurveTo(
        hx + r * 1.1,
        hy + r * 0.6,
        hx + r,
        hy - r * 0.4,
        hx,
        hy + r * 0.35
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // 10B. Shower of Stardust Sparkles when Molly catches a star
  if (Array.isArray(state.stardust)) {
    for (let i = state.stardust.length - 1; i >= 0; i--) {
      const sp = state.stardust[i];
      if (!sp) continue;
      sp.x += sp.vx * state.frameK;
      sp.y += sp.vy * state.frameK;
      sp.vy += 0.08 * state.frameK; // gentle stardust gravity
      sp.twinkle += 0.25 * state.frameK;
      sp.alpha *= Math.pow(0.94, state.frameK);
      if (sp.alpha < 0.05) {
        state.stardust.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      const s = Math.max(0.8, sp.size * (0.8 + Math.sin(sp.twinkle) * 0.35));
      // 4-point diamond star sparkle
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y - s * 2.2);
      ctx.quadraticCurveTo(sp.x, sp.y, sp.x + s * 2.2, sp.y);
      ctx.quadraticCurveTo(sp.x, sp.y, sp.x, sp.y + s * 2.2);
      ctx.quadraticCurveTo(sp.x, sp.y, sp.x - s * 2.2, sp.y);
      ctx.quadraticCurveTo(sp.x, sp.y, sp.x, sp.y - s * 2.2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, s * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
}
