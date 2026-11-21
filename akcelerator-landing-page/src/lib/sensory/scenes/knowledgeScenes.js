/**
 * Procedural Canvas 2D scene renderers for knowledge, science, and education.
 */

/** @typedef {import('../../types/sensory.js').SceneRenderer} SceneRenderer */

import { clamp01, subP, lerp, easeOut } from '../graphics/math.js';
import {
  drawGlow,
  drawHeart,
  drawBird,
  drawStar,
  drawPaw,
  drawRoundRect,
  drawSteam,
  drawFlower
} from '../graphics/primitives.js';

/** @type {SceneRenderer} */
export function renderWikiInk(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Wikipedie: Otevřená encyklopedie s chybějícím faktem [?] -> Zlaté plnicí pero dopisující ověřený řádek a hvězdy poznání
    const bkY = cy - 14;
    const bkH = 40;
    const halfW = 46;

    c.fillStyle = '#fffbeb';
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(cx, bkY + 4);
    c.quadraticCurveTo(cx - halfW * 0.5, bkY - 3, cx - halfW, bkY + 1);
    c.lineTo(cx - halfW, bkY + bkH);
    c.quadraticCurveTo(cx - halfW * 0.5, bkY + bkH - 3, cx, bkY + bkH + 3);
    c.quadraticCurveTo(cx + halfW * 0.5, bkY + bkH - 3, cx + halfW, bkY + bkH);
    c.lineTo(cx + halfW, bkY + 1);
    c.quadraticCurveTo(cx + halfW * 0.5, bkY - 3, cx, bkY + 4);
    c.closePath();
    c.fill();
    c.stroke();

    // Hřbet knihy
    c.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    c.beginPath();
    c.moveTo(cx, bkY + 4);
    c.lineTo(cx, bkY + bkH + 3);
    c.stroke();

    // Řádky textu vlevo i vpravo
    for (let r = 0; r < 3; r++) {
      const ly = bkY + 11 + r * 9;
      c.strokeStyle = '#64748b';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx - 38, ly);
      c.lineTo(cx - 8, ly);
      c.stroke();
      if (r < 2) {
        c.beginPath();
        c.moveTo(cx + 8, ly);
        c.lineTo(cx + 36, ly);
        c.stroke();
      }
    }

    // Třetí řádek vpravo: p = 0 mezera s otazníkem -> p -> 1 zlaté pero píše smaragdový fakt
    const lineY = bkY + 29;
    const penP = easeOut(subP(p, 0.04, 0.78));
    if (penP < 0.35) {
      c.fillStyle = `rgba(217, 119, 6, ${1 - penP * 2.5})`;
      c.font = 'bold 9px sans-serif';
      c.fillText('[ ? ]', cx + 10, lineY + 3);
    }
    if (penP > 0.02) {
      const writeX = lerp(cx + 8, cx + 38, penP);
      c.strokeStyle = '#10b981';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(cx + 8, lineY);
      c.lineTo(writeX, lineY);
      c.stroke();

      // Hrot plnicího pera
      c.save();
      c.translate(writeX + 2, lineY - 2);
      c.rotate(-0.65);
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#78350f';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(5, -3.5);
      c.lineTo(15, -2);
      c.lineTo(15, 2);
      c.lineTo(5, 3.5);
      c.closePath();
      c.fill();
      c.stroke();
      c.restore();
    }

    if (p > 0.5) {
      const stP = easeOut(subP(p, 0.5, 1.0));
      drawStar(c, cx, bkY - 8 - stP * 4, 5.8 * stP, '#fde047');
      drawStar(c, cx + 24, bkY - 4 - stP * 3, 4.0 * stP, '#34d399');
    }
}

/** @type {SceneRenderer} */
export function renderCodeNodes(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Česko.Digital: Zřetelné izolované digitální uzly -> Propojená síť pomoci ve tvaru štítu/srdce s datovými pulsy
    const nodes = [
      [cx - 58, cy - 6],
      [cx - 28, cy - 18],
      [cx, cy - 8],
      [cx + 28, cy - 18],
      [cx + 58, cy - 6],
      [cx - 36, cy + 12],
      [cx, cy + 20],
      [cx + 36, cy + 12]
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 4],
      [1, 5], [2, 6], [3, 7]
    ];

    // Při p = 0 jemné čárkované čekající spoje, aby byla struktura sítě okamžitě čitelná
    c.save();
    c.setLineDash([2, 4]);
    c.strokeStyle = 'rgba(148, 163, 184, 0.24)';
    c.lineWidth = 1.1;
    edges.forEach(([a, b]) => {
      c.beginPath();
      c.moveTo(nodes[a][0], nodes[a][1]);
      c.lineTo(nodes[b][0], nodes[b][1]);
      c.stroke();
    });
    c.restore();

    edges.forEach(([a, b], idx) => {
      const eP = easeOut(subP(p, idx * 0.055, idx * 0.055 + 0.36));
      if (eP <= 0.01) return;
      const [x1, y1] = nodes[a];
      const [x2, y2] = nodes[b];
      const curX = lerp(x1, x2, eP);
      const curY = lerp(y1, y2, eP);
      c.strokeStyle = `rgba(56, 189, 248, ${0.32 + eP * 0.58})`;
      c.lineWidth = 1.9;
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(curX, curY);
      c.stroke();

      if (eP > 0.9 && idx % 3 === 0) {
        const u = red ? 0.5 : (wt * 1.2 + idx * 0.25) % 1;
        c.fillStyle = '#fde047';
        c.beginPath();
        c.arc(lerp(x1, x2, u), lerp(y1, y2, u), 2.2, 0, Math.PI * 2);
        c.fill();
      }
    });

    nodes.forEach(([nx, ny], idx) => {
      const nP = easeOut(subP(p, idx * 0.05, idx * 0.05 + 0.4));
      if (nP > 0.15) {
        drawGlow(c, nx, ny, 11 * nP, '#38bdf8', 0.38 * nP);
      }
      // Vnější prstenec terminálu + středový bod (výrazný i v klidovém stavu p = 0)
      c.fillStyle = '#072016';
      c.strokeStyle = nP > 0.1 ? (idx % 2 === 0 ? '#38bdf8' : '#34d399') : 'rgba(148, 163, 184, 0.72)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(nx, ny, 4.4 + nP * 0.8, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      c.fillStyle = nP > 0.1 ? '#fde047' : 'rgba(203, 213, 225, 0.75)';
      c.beginPath();
      c.arc(nx, ny, 1.7 + nP * 0.8, 0, Math.PI * 2);
      c.fill();
    });
}

/** @type {SceneRenderer} */
export function renderCosmosScience(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Zooniverse: Rozostřený oblak v hledáčku -> Zaostřený zelený zámek, měkká eliptická mlhovina a 3ramenná spirální galaxie se 14 hvězdami
    const focusP = easeOut(p);
    const galY = cy + 2;
    const padX = lerp(46, 38, focusP);
    const padY = lerp(22.5, 19.5, focusP);
    const brLen = 8.5;

    // 1. Měkká eliptická mlhovina uvnitř hledáčku bez ostrého okraje (p = 0 mlhavý oblak -> p -> 1 hluboké pole Hubble/JWST)
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(cx, galY);
    c.rotate(-0.14);
    c.scale(1.9, 0.88);
    const outerNebR = 20.5;
    const nebGrad = c.createRadialGradient(0, 0, 0, 0, 0, outerNebR);
    if (focusP > 0.1) {
      nebGrad.addColorStop(0, `rgba(254, 240, 138, ${(0.32 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.28, `rgba(244, 114, 182, ${(0.30 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.58, `rgba(56, 189, 248, ${(0.22 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(0.82, `rgba(129, 140, 248, ${(0.11 * focusP).toFixed(3)})`);
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      const preA = 0.18 + prep * 0.08;
      nebGrad.addColorStop(0, `rgba(148, 163, 184, ${preA.toFixed(3)})`);
      nebGrad.addColorStop(0.52, `rgba(100, 116, 139, ${(preA * 0.58).toFixed(3)})`);
      nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    c.fillStyle = nebGrad;
    c.beginPath();
    c.arc(0, 0, outerNebR, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 2. Rohové značky hledáčku
    c.strokeStyle = focusP > 0.25 ? '#34d399' : 'rgba(148, 163, 184, 0.55)';
    c.lineWidth = 1.8;
    [
      [-1, -1], [1, -1], [-1, 1], [1, 1]
    ].forEach(([dx, dy]) => {
      const rx = cx + dx * padX;
      const ry = galY + dy * padY;
      c.beginPath();
      c.moveTo(rx, ry - dy * brLen);
      c.lineTo(rx, ry);
      c.lineTo(rx - dx * brLen, ry);
      c.stroke();
    });

    // 3. Hluboké hvězdné pole v rozích hledáčku mimo dráhu ramen (5 polních hvězd + 9 hvězd podél ramen = 14 bodových hvězd)
    const deepFieldStars = [
      { dx: -30.5, dy: -11.8, r: 1.12, col: '#fef08a', spike: true, pre: true },
      { dx: 28.5, dy: -12.4, r: 0.92, col: '#bae6fd', spike: false, pre: true },
      { dx: -26.5, dy: 12.6, r: 0.82, col: '#ffffff', spike: false, pre: false },
      { dx: 31.0, dy: 11.4, r: 1.18, col: '#fde68a', spike: true, pre: true },
      { dx: 12.5, dy: -14.6, r: 0.72, col: '#fbcfe8', spike: false, pre: false }
    ];
    deepFieldStars.forEach((st, idx) => {
      const stP = st.pre ? Math.max(0.24 + prep * 0.1, focusP) : easeOut(subP(focusP, 0.15, 0.85));
      if (stP <= 0.02) return;
      const tw = red ? 1 : 0.8 + 0.2 * Math.sin(wt * 2.8 + idx * 1.4);
      const sx = cx + st.dx;
      const sy = galY + st.dy;
      c.save();
      c.globalAlpha = clamp01(stP * tw);
      c.fillStyle = st.col;
      c.beginPath();
      c.arc(sx, sy, st.r * (0.72 + 0.28 * focusP), 0, Math.PI * 2);
      c.fill();
      if (st.spike && focusP > 0.45) {
        const spLen = 3.2 * subP(focusP, 0.45, 1.0);
        c.strokeStyle = st.col;
        c.lineWidth = 0.8;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx - spLen, sy);
        c.lineTo(sx + spLen, sy);
        c.moveTo(sx, sy - spLen);
        c.lineTo(sx, sy + spLen);
        c.stroke();
      }
      c.restore();
    });

    // 4. Zaostřená 3ramenná spirální galaxie a 9 ostrých bodových hvězd podél ramen (celkem 14 hvězd různých velikostí a teplot)
    if (focusP > 0.05) {
      const armStarCols = ['#ffffff', '#fef08a', '#bae6fd', '#fbcfe8', '#fde047'];
      c.save();
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (let arm = 0; arm < 3; arm++) {
        const armCol = arm === 0 ? '#38bdf8' : arm === 1 ? '#f472b6' : '#a78bfa';
        c.strokeStyle = armCol;
        c.shadowColor = armCol;
        c.shadowBlur = 5.5 * focusP;
        c.globalAlpha = focusP * 0.86;
        c.lineWidth = 1.9;
        c.beginPath();
        for (let k = 0; k <= 20; k++) {
          const u = (k / 20) * focusP;
          const a = wt * 0.55 + (arm * Math.PI * 2) / 3 + u * 3.55;
          const rad = 2 + u * 22.5;
          const sx = cx + Math.cos(a) * rad * 1.22;
          const sy = galY + Math.sin(a) * rad * 0.58;
          if (k === 0) c.moveTo(sx, sy);
          else c.lineTo(sx, sy);
        }
        c.stroke();

        // 3 ostré bodové hvězdy v okolí každého ze 3 ramen (3 × 3 = 9)
        c.shadowBlur = 0;
        for (let sIdx = 0; sIdx < 3; sIdx++) {
          const uStar = 0.28 + sIdx * 0.27;
          const visP = easeOut(subP(focusP, uStar * 0.62, Math.min(1.0, uStar * 0.62 + 0.34)));
          if (visP <= 0.02) continue;
          const aOff = sIdx % 2 === 0 ? 0.2 : -0.22;
          const rOff = sIdx === 1 ? 2.1 : -1.4;
          const a = wt * 0.55 + (arm * Math.PI * 2) / 3 + uStar * 3.55 + aOff;
          const rad = 2 + uStar * 22.5 + rOff;
          const sx = cx + Math.cos(a) * rad * 1.22;
          const sy = galY + Math.sin(a) * rad * 0.58;
          const starIdx = arm * 3 + sIdx;
          const rDot = (0.62 + (starIdx % 3) * 0.22) * visP;
          const tw = red ? 1 : 0.82 + 0.18 * Math.sin(wt * 3.4 + starIdx * 1.1);
          c.globalAlpha = clamp01(visP * tw);
          c.fillStyle = armStarCols[starIdx % armStarCols.length];
          c.beginPath();
          c.arc(sx, sy, Math.max(0.3, rDot), 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
      drawGlow(c, cx, galY, Math.max(0.5, 11 * focusP), '#fde047', 0.28 * focusP);
      drawStar(c, cx, galY, 6.2 * focusP, '#fde047');
    }
}

/** @type {SceneRenderer} */
export function renderTutoringSpark(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Učíme online: Zašmodrchaná čmáranice a zhasnutá žárovka -> Jasná dráha poznání rozsvěcující žárovku
    const sparkP = easeOut(p);
    const bulbX = cx + 38;
    const bulbY = cy - 6;

    // Křivka na tabuli: p = 0 zmatené smyčky -> p = 1 čistá vzestupná trajektorie k žárovce
    c.strokeStyle = sparkP > 0.2 ? '#fde047' : 'rgba(148, 163, 184, 0.55)';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      const sx = lerp(cx - 56, bulbX - 14, u);
      const messyY = cy + 8 + Math.sin(u * 17) * 11 + Math.cos(u * 9) * 5;
      const cleanY = lerp(by - 10, bulbY + 4, Math.pow(u, 0.85));
      const sy = lerp(messyY, cleanY, sparkP);
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    }
    c.stroke();

    // Žárovka poznání
    const lit = easeOut(subP(p, 0.35, 0.95));
    if (lit > 0.05) {
      drawGlow(c, bulbX, bulbY, 28 * lit, '#fde047', 0.45 * lit);
      for (let r = 0; r < 6; r++) {
        const ra = (r * Math.PI) / 3 - Math.PI * 0.5;
        c.strokeStyle = `rgba(253, 224, 71, ${0.75 * lit})`;
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(bulbX + Math.cos(ra) * 13, bulbY + Math.sin(ra) * 13);
        c.lineTo(bulbX + Math.cos(ra) * (15 + 5 * lit), bulbY + Math.sin(ra) * (15 + 5 * lit));
        c.stroke();
      }
    }

    c.fillStyle = lit > 0.1 ? `rgba(254, 240, 138, ${0.25 + lit * 0.7})` : 'rgba(51, 65, 85, 0.5)';
    c.strokeStyle = lit > 0.1 ? '#fde047' : '#94a3b8';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(bulbX, bulbY, 9.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = '#94a3b8';
    c.fillRect(bulbX - 4, bulbY + 9, 8, 4.5);
}

/** @type {SceneRenderer} */
export function renderSchoolPencil(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Doučujte.cz: Sešit s otazníky -> Zlatá tužka kreslící vzestupnou křivku a hvězdy porozumění
    const nbX = cx - 44;
    const nbY = cy - 16;
    const nbW = 88;
    const nbH = 42;

    c.fillStyle = '#063729';
    c.strokeStyle = '#34d399';
    c.lineWidth = 1.6;
    drawRoundRect(c, nbX, nbY, nbW, nbH, 4);
    c.fill();
    c.stroke();

    // Linky v sešitě
    c.strokeStyle = 'rgba(110, 231, 183, 0.16)';
    c.lineWidth = 1;
    for (let l = 1; l <= 3; l++) {
      c.beginPath();
      c.moveTo(nbX + 8, nbY + l * 10);
      c.lineTo(nbX + nbW - 8, nbY + l * 10);
      c.stroke();
    }

    const penP = easeOut(subP(p, 0.04, 0.85));
    if (penP < 0.45) {
      c.fillStyle = `rgba(253, 230, 138, ${(1 - penP * 2) * 0.65})`;
      c.font = 'bold 12px sans-serif';
      c.fillText('?', cx - 22, cy + 8);
      c.fillText('?', cx + 10, cy + 4);
    }

    if (penP > 0.02) {
      const startX = nbX + 12;
      const startY = nbY + nbH - 9;
      const targetX = nbX + nbW - 14;
      const targetY = nbY + 10;
      const curX = lerp(startX, targetX, penP);
      const curY = lerp(startY, targetY, Math.pow(penP, 0.85));

      c.strokeStyle = '#fde047';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(startX, startY);
      c.quadraticCurveTo(lerp(startX, curX, 0.5), startY - 4 * penP, curX, curY);
      c.stroke();

      // Dřevěná tužka na špičce tahu
      c.save();
      c.translate(curX, curY);
      c.rotate(-0.7);
      c.fillStyle = '#fde68a';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(5, -2.8);
      c.lineTo(5, 2.8);
      c.closePath();
      c.fill();
      c.fillStyle = '#fbbf24';
      c.fillRect(5, -2.8, 13, 5.6);
      c.fillStyle = '#fb7185';
      c.fillRect(18, -2.8, 3.5, 5.6);
      c.restore();
    }

    if (p > 0.55) {
      drawStar(c, nbX + nbW - 14, nbY + 9, 5.5 * subP(p, 0.55, 1.0), '#fde047');
    }
}

