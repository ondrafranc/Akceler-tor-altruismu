<script>
  import { onMount, onDestroy } from 'svelte';
  import {
    mollyState,
    mollyEvents,
    petMolly,
    toggleMollyPelisek
  } from '$lib/mollyStore.js';
  import { prefersReducedMotion } from '$lib/sensoryEngine.js';

  let catCanvas = null;
  let petBtnEl = null;
  let toggleBtnEl = null;
  let rafId = 0;
  let mounted = false;
  const LOGICAL_W = 110;
  const LOGICAL_H = 96;

  // Roaming actor state
  let behavior = 'IDLE_SIT'; // 'WALK_ROAM' | 'IDLE_SIT' | 'GROOM' | 'CHASE_FIREFLY' | 'CATCH_TREAT' | 'PET_BLISS'
  let behaviorTimer = 4.2;
  let posX = 240;
  let posY = 620;
  let targetX = 320;
  let targetY = 620;
  let vx = 0;
  let vy = 0;
  let facing = 1; // 1 = right, -1 = left
  let walkCycle = 0;
  let groomPhase = 0;
  let eatTimer = 0;
  let petBlissTimer = 0;
  let perchedOnLedge = false;

  // Pointer tracking for emerald eyes & button avoidance
  let pointerX = 640;
  let pointerY = 380;
  let blinkTimer = 3.6;
  let blinkProgress = 0;

  // Ambient firefly & heart particles around Molly
  let firefly = null; // { x, y, vx, vy, phase, alpha }
  let hearts = []; // { x, y, vy, scale, alpha, color }
  let flyingTreat = null; // { x0, y0, cx, cy, x1, y1, p, icon, color, name }

  // Whisper bubble visibility
  let activeWhisper = null;
  let whisperHideTimer = null;

  let unsubEvents = null;
  let unsubState = null;
  let currentState = {
    mode: 'roaming',
    mood: 'curious',
    treatsFedTotal: 0,
    treatsFedToday: 0,
    lastTreat: null,
    petCount: 0,
    whisper: null
  };

  function showWhisperBubble(whisperObj, durationMs = 4200) {
    if (!whisperObj?.text) return;
    activeWhisper = whisperObj;
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    whisperHideTimer = setTimeout(() => {
      activeWhisper = null;
    }, durationMs);
  }

  function spawnHeartBurst(count = 6) {
    const colors = ['#fbbf24', '#f472b6', '#fde68a', '#34d399'];
    for (let i = 0; i < count; i++) {
      hearts.push({
        x: (Math.random() - 0.5) * 44,
        y: -26 - Math.random() * 16,
        vx: (Math.random() - 0.5) * 0.9,
        vy: -0.75 - Math.random() * 0.65,
        scale: 0.75 + Math.random() * 0.45,
        alpha: 1,
        color: colors[i % colors.length]
      });
    }
    if (hearts.length > 18) {
      hearts = hearts.slice(-18);
    }
  }

  function launchViewportTreatToMolly(treat) {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    let startX = vw * 0.5;
    let startY = vh * 0.44;

    const activeStage = document.querySelector(
      '.card-effect-stage canvas.impact-payoff-canvas, .sanctuary-canvas, .instant-card'
    );
    if (activeStage) {
      const rect = activeStage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        startX = rect.left + rect.width * 0.5;
        startY = rect.top + rect.height * 0.5;
      }
    }

    const destX =
      currentState.mode === 'docked'
        ? vw <= 680
          ? vw - 65
          : 235
        : posX;
    const destY =
      currentState.mode === 'docked'
        ? vw <= 680
          ? vh - 85
          : vh - 34
        : posY - 22;

    flyingTreat = {
      x0: startX,
      y0: startY,
      cx: (startX + destX) * 0.5,
      cy: Math.max(48, Math.min(startY, destY) - 120),
      x1: destX,
      y1: destY,
      p: 0,
      icon: treat?.icon || '🐟',
      color: treat?.color || '#f59e0b',
      name: treat?.name || 'lososová granulka pro Molly'
    };

    behavior = 'CATCH_TREAT';
    behaviorTimer = 2.8;
    eatTimer = 1.8;
    spawnHeartBurst(7);
  }

  function pickSafeTarget(avoidPointer = false) {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;

    // On Desktop (>= 1024px), Molly can perch on card ledges ("jako Sponka dříve") or stroll the bottom catwalk
    if (vw >= 1024 && !avoidPointer && Math.random() < 0.52) {
      const candidates = document.querySelectorAll(
        '.instant-card, .bento-card, .sanctuary-stage, .highlight-card'
      );
      for (const el of candidates) {
        const r = el.getBoundingClientRect();
        if (
          r.top > 115 &&
          r.top < vh - 140 &&
          r.width > 240 &&
          r.left > 24 &&
          r.right < vw - 24
        ) {
          const candX = Math.max(
            90,
            Math.min(vw - 90, r.left + r.width * (0.72 + (Math.random() - 0.5) * 0.16))
          );
          const candY = r.top + 6;
          const distToPtr = Math.hypot(candX - pointerX, candY - pointerY);
          if (distToPtr > 120) {
            targetX = candX;
            targetY = candY;
            perchedOnLedge = true;
            return;
          }
        }
      }
    }

    perchedOnLedge = false;
    const safeMinX = vw <= 680 ? 54 : 310;
    const safeMaxX = vw <= 680 ? Math.max(120, vw - 130) : Math.max(420, vw - 240);
    const baseBottomY = vw <= 680 ? vh - 78 : vh - 26;

    let nextX = safeMinX + Math.random() * Math.max(60, safeMaxX - safeMinX);
    if (avoidPointer && Math.abs(nextX - pointerX) < 150) {
      nextX = pointerX < vw * 0.5 ? safeMaxX - 24 : safeMinX + 24;
    }
    targetX = Math.max(48, Math.min(vw - 56, nextX));
    targetY = Math.max(120, Math.min(vh - 22, baseBottomY));
  }

  function chooseNextBehavior() {
    const roll = Math.random();
    if (roll < 0.42) {
      behavior = 'WALK_ROAM';
      behaviorTimer = 3.5 + Math.random() * 3.0;
      pickSafeTarget(false);
    } else if (roll < 0.68) {
      behavior = 'IDLE_SIT';
      behaviorTimer = 3.2 + Math.random() * 2.8;
    } else if (roll < 0.86) {
      behavior = 'GROOM';
      behaviorTimer = 2.8 + Math.random() * 2.0;
    } else {
      behavior = 'CHASE_FIREFLY';
      behaviorTimer = 3.4 + Math.random() * 2.0;
      const dir = Math.random() > 0.5 ? 1 : -1;
      firefly = {
        x: dir * (36 + Math.random() * 30),
        y: -34 - Math.random() * 24,
        vx: -dir * 0.35,
        vy: -0.15,
        phase: Math.random() * 6.28,
        alpha: 1
      };
    }
  }

  /**
   * High-DPI Procedural 2D Canvas Tortoiseshell Cat ("Želvovinová kočka Molly")
   * - Velvety dark chocolate-obsidian body (#1e1714) with asymmetric tortoiseshell patches (amber #f59e0b, rust #ea580c, honey #fde68a)
   * - Chimney-blaze face split, pink/terracotta nose, 6 spring-physics whiskers, independent twitching ears
   * - Soft breathing chest, 4 animated walking paws, 6-control-point harmonic Bézier tail
   * - Expressive emerald eyes (#84cc16 / #bef264) tracking pointer or curving into ^ ^ arcs
   */
  function drawMollyCat(ctx, w, h, nowSec) {
    ctx.clearRect(0, 0, w, h);
    ctx.save();

    const cx = w * 0.5;
    const groundY = h - 22;
    const speed = Math.hypot(vx, vy);
    const isWalking = behavior === 'WALK_ROAM' && speed > 0.25;
    const isGrooming = behavior === 'GROOM';
    const isEating = eatTimer > 0 || behavior === 'CATCH_TREAT';
    const isBliss =
      petBlissTimer > 0 ||
      behavior === 'PET_BLISS' ||
      currentState.mood === 'purring' ||
      currentState.mood === 'breathing';
    const isSleeping = currentState.mode === 'docked' || currentState.mood === 'sleeping';

    // Soft warm ground shadow & golden aura
    const shadowGrad = ctx.createRadialGradient(
      cx,
      groundY + 4,
      2,
      cx,
      groundY + 4,
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
    ctx.ellipse(cx, groundY + 4, 34, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(cx, groundY);
    ctx.scale(facing, 1);

    const breathScale =
      currentState.mood === 'breathing'
        ? 1 + Math.sin(nowSec * 1.4) * 0.065
        : 1 + Math.sin(nowSec * 2.4) * 0.025;
    const walkBob = isWalking ? Math.abs(Math.sin(walkCycle * 2)) * -3.2 : 0;
    const leapOffset =
      behavior === 'CATCH_TREAT' && flyingTreat
        ? Math.sin(flyingTreat.p * Math.PI) * -14
        : 0;

    ctx.translate(0, walkBob + leapOffset);

    // 1. 6-Control-Point Harmonic Bézier Tail (Obsidian with amber/rust/honey tortoiseshell rings)
    const tailFreq = isBliss || isEating ? 5.2 : isWalking ? 3.8 : 2.1;
    const tailAmp = isBliss || isEating ? 11 : 7.5;
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
    const legSwingA = isWalking ? Math.sin(walkCycle) * 6.5 : 0;
    const legSwingB = isWalking ? -Math.sin(walkCycle) * 6.5 : 0;

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

    // 4. Front Paws (Animated walking or grooming)
    if (isGrooming) {
      // Lifted ginger paw washing cheek
      const lickY = -24 + Math.sin(groomPhase * 7) * 3.2;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(15, lickY, 4.8, 3.4, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(17.5, lickY - 1, 2.2, 0, Math.PI * 2);
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
    const headTilt = isGrooming
      ? 0.16
      : behavior === 'CHASE_FIREFLY'
        ? -0.12
        : Math.sin(nowSec * 1.5) * 0.04;

    ctx.save();
    ctx.translate(headX, headY);
    ctx.rotate(headTilt);

    // Independent ear twitches
    const leftEarTwitch =
      Math.sin(nowSec * 3.1) > 0.9 ? Math.sin(nowSec * 20) * 0.12 : 0;
    const rightEarTwitch =
      Math.cos(nowSec * 2.7) > 0.88 ? Math.cos(nowSec * 19) * -0.14 : 0;

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
    const relPtrX = (pointerX - posX) * facing;
    const relPtrY = pointerY - (posY - 32);
    const gazeAngle = Math.atan2(relPtrY, relPtrX);
    const gazeDist = Math.min(1.8, Math.hypot(relPtrX, relPtrY) / 140);
    const lookDX = Math.cos(gazeAngle) * gazeDist;
    const lookDY = Math.sin(gazeAngle) * gazeDist;

    if (isBliss || isEating || isSleeping || blinkProgress > 0.65) {
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
        behavior === 'CHASE_FIREFLY' || currentState.mood === 'playful'
          ? 2.5
          : 1.75;
      [-5.6, 5.6].forEach((ex) => {
        // Emerald iris with subtle lime glow
        ctx.fillStyle = '#84cc16';
        ctx.shadowColor = '#bef264';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(ex, -0.4, 3.8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

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
    const whiskerSpring = Math.sin(nowSec * (isBliss ? 9 : 3.4)) * 1.4 - vy * 0.35;
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

    ctx.restore(); // end head

    // 9. Floating Firefly when in CHASE_FIREFLY state
    if (firefly) {
      const fx = firefly.x;
      const fy = firefly.y + Math.sin(nowSec * 5 + firefly.phase) * 5;
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
    for (let i = hearts.length - 1; i >= 0; i--) {
      const hItem = hearts[i];
      hItem.x += hItem.vx;
      hItem.y += hItem.vy;
      hItem.alpha *= 0.96;
      if (hItem.alpha < 0.05) {
        hearts.splice(i, 1);
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

    ctx.restore();
  }

  function pointInRect(x, y, rect) {
    return (
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }

  function handleWindowResize() {
    if (typeof window === 'undefined') return;
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const baseBottomY = vh <= 620 ? vh - 14 : vw <= 680 ? vh - 78 : vh - 26;
    const minX = 55;
    const maxX = Math.max(minX, vw - 55);

    if ((vw < 1024 || vh <= 700) && perchedOnLedge) {
      perchedOnLedge = false;
      posY = baseBottomY;
      targetY = baseBottomY;
    }

    posX = Math.max(minX, Math.min(maxX, posX));
    targetX = Math.max(minX, Math.min(maxX, targetX));
    if (!perchedOnLedge) {
      posY = Math.max(96, Math.min(vh - 14, baseBottomY));
      targetY = posY;
    } else {
      posY = Math.max(96, Math.min(vh - 22, posY));
      targetY = Math.max(96, Math.min(vh - 22, targetY));
    }
  }

  function handleWindowPointerMove(e) {
    pointerX = e.clientX;
    pointerY = e.clientY;

    // Button Avoidance: if pointer moves near an interactive element close to Molly, she hops to a safe spot
    if (currentState.mode === 'roaming') {
      const distToMolly = Math.hypot(pointerX - posX, pointerY - (posY - 24));
      if (distToMolly < 92) {
        const el = e.target;
        if (
          el &&
          typeof el.closest === 'function' &&
          el.closest('button, a, input, select, textarea, [role="button"]') &&
          !el.closest('.molly-pelisek-dock')
        ) {
          behavior = 'WALK_ROAM';
          behaviorTimer = 2.4;
          pickSafeTarget(true);
          ensureLoopRunning();
        }
      }
    }
  }

  function handleWindowPointerDown(e) {
    const el = e.target;
    if (el && typeof el.closest === 'function') {
      // Native clicks inside .molly-pelisek-dock are handled directly by its buttons
      if (el.closest('.molly-pelisek-dock')) {
        return;
      }
      // Never intercept clicks on any page interactive control or canvas stage
      if (
        el.closest(
          'button, a, input, select, textarea, label, summary, [role="button"], .sanctuary-viewport, canvas.impact-payoff-canvas'
        )
      ) {
        return;
      }
    }

    if (currentState.mode !== 'roaming') return;
    const dist = Math.hypot(e.clientX - posX, e.clientY - (posY - 26));
    if (dist < 44) {
      triggerPetInteraction();
    }
  }

  let ensureLoopRunning = () => {};

  function triggerPetInteraction() {
    petBlissTimer = 2.6;
    behavior = 'PET_BLISS';
    behaviorTimer = 2.8;
    spawnHeartBurst(8);
    petMolly();
    ensureLoopRunning();
  }

  let handleVisibilityChange = null;

  onMount(() => {
    mounted = true;
    handleWindowResize();
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    posX = vw <= 680 ? Math.min(Math.max(55, vw - 88), 220) : 340;
    posY = vh <= 620 ? vh - 14 : vw <= 680 ? vh - 78 : vh - 26;
    targetX = posX;
    targetY = posY;

    let lastTime = performance.now();
    const reduced = prefersReducedMotion();

    const renderCatFrame = (nowSec) => {
      if (!catCanvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(LOGICAL_W * dpr);
      const targetH = Math.round(LOGICAL_H * dpr);
      if (catCanvas.width !== targetW || catCanvas.height !== targetH) {
        catCanvas.width = targetW;
        catCanvas.height = targetH;
      }
      const ctx = catCanvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMollyCat(ctx, LOGICAL_W, LOGICAL_H, nowSec);
      }
    };

    const tick = (now) => {
      if (typeof document !== 'undefined' && document.hidden) {
        rafId = 0;
        return;
      }
      const dt = Math.min(0.06, Math.max(0.008, (now - lastTime) * 0.001));
      lastTime = now;
      const nowSec = now * 0.001;

      if (eatTimer > 0) eatTimer = Math.max(0, eatTimer - dt);
      if (petBlissTimer > 0) petBlissTimer = Math.max(0, petBlissTimer - dt);

      // Natural eye blink every 3.2 - 5.2s
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkProgress = Math.min(1, blinkProgress + dt * 9);
        if (blinkProgress >= 1) {
          blinkTimer = 3.2 + Math.random() * 2.2;
          blinkProgress = 0;
        }
      }

      // Flying treat arc update
      if (flyingTreat) {
        flyingTreat.p = Math.min(
          1,
          flyingTreat.p + dt * (reduced ? 3.5 : 1.85)
        );
        if (flyingTreat.p >= 1) {
          eatTimer = 1.4;
          spawnHeartBurst(6);
          flyingTreat = null;
        }
      }

      // Roaming physics
      if (currentState.mode === 'roaming' && !reduced) {
        behaviorTimer -= dt;
        if (behaviorTimer <= 0) {
          chooseNextBehavior();
        }

        if (behavior === 'WALK_ROAM') {
          const dx = targetX - posX;
          const dy = targetY - posY;
          const dist = Math.hypot(dx, dy);
          if (dist > 4) {
            const maxSpd = perchedOnLedge ? 115 : 88;
            vx = (dx / dist) * Math.min(maxSpd, dist * 3.2);
            vy = (dy / dist) * Math.min(maxSpd, dist * 3.2);
            posX += vx * dt;
            posY += vy * dt;
            if (Math.abs(vx) > 2) {
              facing = vx >= 0 ? 1 : -1;
            }
            walkCycle += dt * 9.5;
          } else {
            vx *= 0.7;
            vy *= 0.7;
            behavior = 'IDLE_SIT';
            behaviorTimer = 3.2;
          }
        } else {
          vx *= 0.8;
          vy *= 0.8;
          if (behavior === 'GROOM') {
            groomPhase += dt;
          }
          if (behavior === 'CHASE_FIREFLY' && firefly) {
            firefly.x += firefly.vx;
            firefly.y += Math.sin(nowSec * 4) * 0.35;
          } else {
            firefly = null;
          }
        }
      }

      renderCatFrame(nowSec);

      const hasActiveTransient =
        Boolean(flyingTreat) || eatTimer > 0 || petBlissTimer > 0 || hearts.length > 0;

      // H4: Pause RAF loop when docked or under reduced-motion with no active transient animation
      if ((currentState.mode === 'docked' || reduced) && !hasActiveTransient) {
        rafId = 0;
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    ensureLoopRunning = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    unsubState = mollyState.subscribe((val) => {
      currentState = val;
      if (val.whisper && val.whisper.ts !== activeWhisper?.ts) {
        showWhisperBubble(val.whisper, 4200);
      }
      ensureLoopRunning();
    });

    unsubEvents = mollyEvents.subscribe((ev) => {
      if (!ev) return;
      if (ev.type === 'feed' || ev.type === 'spark') {
        launchViewportTreatToMolly(ev.treat);
      } else if (ev.type === 'pet') {
        petBlissTimer = 2.6;
        spawnHeartBurst(7);
      } else if (ev.type === 'wake') {
        behavior = 'WALK_ROAM';
        behaviorTimer = 3.2;
        pickSafeTarget(false);
        spawnHeartBurst(5);
      }
      ensureLoopRunning();
    });

    window.addEventListener('pointermove', handleWindowPointerMove, {
      passive: true
    });
    window.addEventListener('pointerdown', handleWindowPointerDown, {
      passive: true
    });
    window.addEventListener('resize', handleWindowResize, {
      passive: true
    });

    handleVisibilityChange = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else {
        ensureLoopRunning();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    renderCatFrame(performance.now() * 0.001);
    ensureLoopRunning();
  });

  onDestroy(() => {
    if (rafId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
    }
    if (whisperHideTimer) clearTimeout(whisperHideTimer);
    unsubEvents?.();
    unsubState?.();
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerdown', handleWindowPointerDown);
      window.removeEventListener('resize', handleWindowResize);
    }
    if (typeof document !== 'undefined' && handleVisibilityChange) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  $: flyingTreatPos = flyingTreat
    ? (() => {
        const u = 1 - flyingTreat.p;
        const p = flyingTreat.p;
        return {
          x:
            u * u * flyingTreat.x0 +
            2 * u * p * flyingTreat.cx +
            p * p * flyingTreat.x1,
          y:
            u * u * flyingTreat.y0 +
            2 * u * p * flyingTreat.cy +
            p * p * flyingTreat.y1,
          icon: flyingTreat.icon,
          color: flyingTreat.color
        };
      })()
    : null;
</script>

<div
  class="molly-companion-layer"
  data-molly-mode={$mollyState.mode}
  data-molly-mood={$mollyState.mood}
  data-molly-treats={$mollyState.treatsFedTotal}
>
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {activeWhisper ? activeWhisper.text : ''}
  </div>
  <!-- Letící dobrota přes obrazovku přímo k Molly -->
  {#if flyingTreatPos}
    <div
      class="molly-flying-treat"
      style="transform: translate3d({flyingTreatPos.x.toFixed(1)}px, {flyingTreatPos.y.toFixed(1)}px, 0); --treat-color: {flyingTreatPos.color};"
      aria-hidden="true"
    >
      <span class="treat-emoji">{flyingTreatPos.icon}</span>
    </div>
  {/if}

  <!-- Volně se toulající želvovinová kočka Molly (pointer-events: none, nikdy neblokuje kliknutí) -->
  <div
    class="molly-roaming-actor"
    class:is-docked={$mollyState.mode === 'docked'}
    class:is-perched={perchedOnLedge}
    style="transform: translate3d({(posX - 55).toFixed(1)}px, {(posY - 82).toFixed(1)}px, 0);"
    aria-hidden="true"
  >
    {#if activeWhisper && $mollyState.mode === 'roaming'}
      <div class="molly-whisper-bubble">
        <span class="whisper-icon">{activeWhisper.icon || '🐾'}</span>
        <span class="whisper-text">{activeWhisper.text}</span>
      </div>
    {/if}

    <canvas
      bind:this={catCanvas}
      class="molly-cat-canvas"
      width="110"
      height="96"
    ></canvas>
  </div>

  <!-- Klidový pelíšek Dock — uživatel má Molly vždy plně pod kontrolou -->
  <div
    class="molly-pelisek-dock"
    class:is-docked={$mollyState.mode === 'docked'}
    role="region"
    aria-label="Patronka Molly a klidový pelíšek"
  >
    {#if activeWhisper && $mollyState.mode === 'docked'}
      <div class="molly-dock-whisper">
        <span>{activeWhisper.icon || '🐾'} {activeWhisper.text}</span>
      </div>
    {/if}

    <button
      bind:this={petBtnEl}
      type="button"
      class="molly-dock-pet-btn"
      on:pointerdown|stopPropagation
      on:click|stopPropagation={triggerPetInteraction}
      title="Pohladit želvovinovou kočku Molly (spustí předení)"
    >
      <span class="molly-avatar-badge" aria-hidden="true">
        <span class="tortie-ear-left"></span>
        <span class="tortie-ear-right"></span>
        <span class="tortie-face">
          <span class="tortie-eye"></span>
          <span class="tortie-eye"></span>
        </span>
      </span>
      <span class="molly-dock-label">
        Molly
        <strong class="molly-treat-counter" data-testid="molly-treat-count">
          {$mollyState.treatsFedTotal} {$mollyState.lastTreat?.icon || '🐟'}
        </strong>
      </span>
    </button>

    <button
      bind:this={toggleBtnEl}
      type="button"
      class="molly-dock-toggle-btn"
      on:pointerdown|stopPropagation
      on:click|stopPropagation={toggleMollyPelisek}
      aria-pressed={$mollyState.mode === 'docked'}
      title={$mollyState.mode === 'docked'
        ? 'Vypustit Molly z pelíšku na procházku po stránce'
        : 'Uložit Molly do klidového pelíšku'}
    >
      {$mollyState.mode === 'docked' ? '✨ Toulat se' : '🧺 Pelíšek'}
    </button>
  </div>
</div>

<style>
  .molly-companion-layer {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 940;
    overflow: hidden;
  }

  .molly-roaming-actor {
    position: fixed;
    top: 0;
    left: 0;
    width: 110px;
    height: 96px;
    pointer-events: none;
    user-select: none;
    will-change: transform;
    transition: opacity 0.28s ease;
  }

  .molly-roaming-actor.is-docked {
    opacity: 0;
    transform: translate3d(-200px, -200px, 0) scale(0.5) !important;
  }

  .molly-cat-canvas {
    width: 110px;
    height: 96px;
    display: block;
    pointer-events: none;
    filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
  }

  .molly-whisper-bubble {
    position: absolute;
    bottom: 88px;
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 230px;
    padding: 6px 11px;
    border-radius: 14px;
    background: rgba(12, 22, 18, 0.94);
    border: 1px solid rgba(251, 191, 36, 0.48);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.45);
    color: #fef3c7;
    font-size: 0.74rem;
    font-weight: 600;
    line-height: 1.3;
    display: flex;
    align-items: center;
    gap: 6px;
    pointer-events: none;
    animation: mollyBubbleIn 0.24s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .whisper-icon {
    flex-shrink: 0;
    font-size: 0.88rem;
  }

  .whisper-text {
    overflow-wrap: anywhere;
  }

  .molly-flying-treat {
    position: fixed;
    top: -14px;
    left: -14px;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(
      circle,
      rgba(254, 243, 199, 0.95) 0%,
      var(--treat-color, #f59e0b) 68%,
      rgba(245, 158, 11, 0) 100%
    );
    box-shadow: 0 0 18px var(--treat-color, #f59e0b);
    pointer-events: none;
    z-index: 945;
  }

  .treat-emoji {
    font-size: 1rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  /* Klidový pelíšek Dock */
  .molly-pelisek-dock {
    position: fixed;
    bottom: 14px;
    left: 158px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 5px;
    border-radius: 999px;
    background: rgba(14, 23, 19, 0.9);
    border: 1px solid rgba(251, 191, 36, 0.35);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.38);
    backdrop-filter: blur(10px);
    pointer-events: auto;
    z-index: 941;
    transition: border-color 0.2s ease, transform 0.2s ease;
  }

  .molly-pelisek-dock.is-docked {
    border-color: rgba(52, 211, 153, 0.48);
    background: rgba(12, 26, 20, 0.94);
  }

  .molly-dock-whisper {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: max-content;
    max-width: 240px;
    padding: 6px 10px;
    border-radius: 12px;
    background: rgba(12, 22, 18, 0.95);
    border: 1px solid rgba(251, 191, 36, 0.45);
    color: #fef3c7;
    font-size: 0.73rem;
    font-weight: 600;
    pointer-events: none;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
  }

  .molly-dock-pet-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 9px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #f8fafc;
    font-family: inherit;
    font-size: 0.76rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .molly-dock-pet-btn:hover {
    background: rgba(251, 191, 36, 0.14);
  }

  .molly-avatar-badge {
    position: relative;
    width: 18px;
    height: 16px;
    display: inline-block;
    flex-shrink: 0;
  }

  .tortie-ear-left,
  .tortie-ear-right {
    position: absolute;
    top: 0;
    width: 6px;
    height: 6px;
    border-radius: 2px 5px 0 0;
  }

  .tortie-ear-left {
    left: 1px;
    background: #1e1714;
    border: 1px solid rgba(253, 230, 138, 0.45);
    transform: rotate(-14deg);
  }

  .tortie-ear-right {
    right: 1px;
    background: #ea580c;
    transform: rotate(14deg);
  }

  .tortie-face {
    position: absolute;
    bottom: 0;
    left: 1px;
    right: 1px;
    height: 13px;
    border-radius: 999px;
    background: linear-gradient(90deg, #1e1714 0%, #1e1714 50%, #f59e0b 50%, #ea580c 100%);
    border: 1px solid rgba(253, 230, 138, 0.55);
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 0 2px;
  }

  .tortie-eye {
    width: 3.5px;
    height: 3.5px;
    border-radius: 999px;
    background: #bef264;
    box-shadow: 0 0 4px #84cc16;
  }

  .molly-dock-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .molly-treat-counter {
    color: #fde68a;
    font-weight: 800;
    background: rgba(245, 158, 11, 0.16);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 0.72rem;
  }

  .molly-dock-toggle-btn {
    padding: 4px 9px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.06);
    color: #d1fae5;
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.18s ease, border-color 0.18s ease;
  }

  .molly-dock-toggle-btn:hover {
    background: rgba(52, 211, 153, 0.18);
    border-color: rgba(52, 211, 153, 0.45);
  }

  @keyframes mollyBubbleIn {
    from {
      opacity: 0;
      transform: translate(-50%, 6px) scale(0.94);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0) scale(1);
    }
  }

  @media (min-width: 681px) and (max-width: 1024px) {
    .molly-whisper-bubble {
      bottom: 16px;
      left: 98px;
      transform: none;
      max-width: 210px;
    }
  }

  @media (max-width: 680px) {
    .molly-pelisek-dock {
      left: auto;
      right: 8px;
      bottom: calc(62px + env(safe-area-inset-bottom, 0px));
      transform: scale(0.84);
      transform-origin: bottom right;
      pointer-events: auto;
      opacity: 0.94;
      backdrop-filter: none;
    }

    .molly-roaming-actor {
      transform: scale(0.84);
      transform-origin: bottom center;
    }
  }

  @media (max-height: 700px) {
    .molly-pelisek-dock {
      bottom: 6px;
      transform: scale(0.78);
      transform-origin: bottom right;
      pointer-events: auto;
      opacity: 0.92;
    }

    .molly-roaming-actor {
      pointer-events: none;
      opacity: 0.88;
    }
  }

  @media (max-width: 680px) and (max-height: 700px) {
    .molly-pelisek-dock {
      bottom: calc(60px + env(safe-area-inset-bottom, 0px));
    }
  }
</style>

