/**
 * Procedural Canvas 2D scene renderers for nature and ecology.
 */

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

export function renderForestBloom(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🌳 Sázíme budoucnost: Drobná sazenička na holině mezi pařezy -> Mohutný rozvětvený smaragdový dub
  const groundY = by - 2;
  const treeP = easeOut(p);

  // Dva malé pařezy po stranách na holině
  c.fillStyle = '#5c2d0c';
  c.fillRect(cx - 52, groundY - 5, 9, 5);
  c.fillRect(cx + 44, groundY - 5, 9, 5);

  // Kmen a větve rostoucí ze sazeničky
  const trunkH = lerp(12, 30, treeP);
  c.strokeStyle = '#78350f';
  c.lineWidth = lerp(2.2, 5.5, treeP);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx, groundY);
  c.lineTo(cx, groundY - trunkH);
  c.stroke();

  if (treeP < 0.25) {
    // Dva malé lístky sazeničky (p = 0)
    c.fillStyle = '#4ade80';
    c.beginPath();
    c.ellipse(cx - 5, groundY - trunkH, 5, 2.5, -0.4, 0, Math.PI * 2);
    c.ellipse(cx + 5, groundY - trunkH, 5, 2.5, 0.4, 0, Math.PI * 2);
    c.fill();
  } else {
    const canP = easeOut(subP(treeP, 0.2, 1.0));
    c.lineWidth = 2.6 * canP;
    c.beginPath();
    c.moveTo(cx, groundY - trunkH * 0.65);
    c.lineTo(cx - 14 * canP, groundY - trunkH - 4 * canP);
    c.moveTo(cx, groundY - trunkH * 0.72);
    c.lineTo(cx + 14 * canP, groundY - trunkH - 4 * canP);
    c.stroke();

    /** @type {Array<[number, number, number, string]>} */
    const clusters = [
      [0, -10, 16, '#059669'],
      [-15, -4, 12.5, '#10b981'],
      [15, -4, 12.5, '#10b981'],
      [-9, -15, 12, '#34d399'],
      [9, -15, 12, '#34d399'],
      [0, -19, 11, '#6ee7b7']
    ];
    clusters.forEach(([dx, dy, r, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(cx + dx * canP, groundY - trunkH + dy * canP, r * canP, 0, Math.PI * 2);
      c.fill();
    });
  }
}

export function renderFruitTree(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🍎 Na ovoce: Holé jarní větve a prázdný špendlík -> Zelená koruna s 6 červenými jablky a zlatým mapovým špendlíkem
  const groundY = by - 2;
  const tx = cx - 10;
  const leafP = easeOut(subP(p, 0.02, 0.55));
  const appleP = easeOut(subP(p, 0.35, 0.98));

  // Kmen a holé větve (viditelné při p = 0)
  c.strokeStyle = '#78350f';
  c.lineWidth = 4.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(tx, groundY);
  c.lineTo(tx, groundY - 24);
  c.stroke();
  c.lineWidth = 2.2;
  [
    [-14, -36], [0, -40], [14, -36], [-18, -28], [18, -28]
  ].forEach(([bx, byOff]) => {
    c.beginPath();
    c.moveTo(tx, groundY - 22);
    c.lineTo(tx + bx, groundY + byOff);
    c.stroke();
  });

  if (leafP > 0.02) {
      /** @type {Array<[number, number, number, string]>} */ ([
      [0, -34, 15, '#10b981'],
      [-13, -29, 12, '#059669'],
      [13, -29, 12, '#059669'],
      [0, -41, 11, '#34d399']
    ]).forEach(([dx, dy, r, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(tx + dx * leafP, groundY + dy, r * leafP, 0, Math.PI * 2);
      c.fill();
    });
  }

  if (appleP > 0.05) {
    [
      [-10, -28], [10, -28], [0, -39], [-6, -35], [7, -34], [0, -26]
    ].forEach(([ax, ay]) => {
      c.fillStyle = '#f43f5e';
      c.beginPath();
      c.arc(tx + ax, groundY + ay, 3.3 * appleP, 0, Math.PI * 2);
      c.fill();
    });
  }

  // Mapový špendlík Na ovoce vpravo
  const pinX = cx + 38;
  const pinY = cy + 6;
  c.fillStyle = appleP > 0.2 ? '#fbbf24' : 'rgba(148, 163, 184, 0.35)';
  c.strokeStyle = appleP > 0.2 ? '#fde047' : '#64748b';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(pinX, pinY - 8, 7.5, Math.PI * 0.85, Math.PI * 2.15);
  c.lineTo(pinX, pinY + 5);
  c.closePath();
  c.fill();
  c.stroke();
}

export function renderButterflyLens(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🦋 iNaturalist: Kulatá přírodovědecká lupa nad složenou siluetou -> Zaostřený otakárek s prokreslenými křídly a ostruhami
  const lensP = easeOut(p);
  const flap = lerp(0.24, 0.94 + Math.sin(wt * 3.4) * 0.08, lensP);
  const lx = cx - 4;
  const ly = cy + 1;
  const lr = 26;

  // Rukojeť a mosazno-smaragdová obroučka lupy
  c.strokeStyle = '#b45309';
  c.lineWidth = 4.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(lx + 18.5, ly + 18.5);
  c.lineTo(lx + 31, ly + 29);
  c.stroke();

  c.fillStyle = lensP > 0.2 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.07)';
  c.strokeStyle = lensP > 0.2 ? '#34d399' : '#94a3b8';
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(lx, ly, lr, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Ostřicí značky kolem lupy při určení druhu
  if (lensP > 0.25) {
    const fA = subP(lensP, 0.25, 0.85);
    c.strokeStyle = `rgba(110, 231, 183, ${0.7 * fA})`;
    c.lineWidth = 1.5;
    [-1, 1].forEach((dx) => {
      [-1, 1].forEach((dy) => {
        const bx = lx + dx * (lr + 5);
        const byL = ly + dy * (lr - 4);
        c.beginPath();
        c.moveTo(bx, byL - dy * 5);
        c.lineTo(bx, byL);
        c.lineTo(bx - dx * 5, byL);
        c.stroke();
      });
    });
  }

  // Motýl otakárek (špičatá přední křídla + zadní křídla s ostruhou a červenomodrými očky)
  [-1, 1].forEach((dir) => {
    const wSpan = 19 * flap;
    // Zadní křídlo s ostruhou
    c.fillStyle = lensP > 0.15 ? '#fde047' : '#64748b';
    c.strokeStyle = lensP > 0.15 ? '#1e1b4b' : '#475569';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(lx + dir * 1.2, ly + 1);
    c.bezierCurveTo(lx + dir * wSpan * 0.78, ly + 1, lx + dir * wSpan * 0.82, ly + 13, lx + dir * wSpan * 0.45, ly + 15);
    c.lineTo(lx + dir * wSpan * 0.52, ly + 19); // Ostruha otakárka
    c.lineTo(lx + dir * wSpan * 0.3, ly + 15);
    c.quadraticCurveTo(lx + dir * 2, ly + 12, lx + dir * 1.2, ly + 4);
    c.closePath();
    c.fill();
    c.stroke();

    // Přední vznešeně protažené křídlo
    c.fillStyle = lensP > 0.15 ? '#facc15' : '#94a3b8';
    c.beginPath();
    c.moveTo(lx + dir * 1.2, ly - 3);
    c.bezierCurveTo(lx + dir * wSpan * 0.45, ly - 16, lx + dir * wSpan * 1.08, ly - 15, lx + dir * wSpan, ly - 3);
    c.bezierCurveTo(lx + dir * wSpan * 0.9, ly + 4, lx + dir * wSpan * 0.4, ly + 4, lx + dir * 1.2, ly + 1);
    c.closePath();
    c.fill();
    c.stroke();

    // Kresba oček na křídlech při zaostření
    if (lensP > 0.3) {
      c.fillStyle = '#38bdf8';
      c.beginPath();
      c.arc(lx + dir * wSpan * 0.55, ly + 9, 1.9 * lensP, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f43f5e';
      c.beginPath();
      c.arc(lx + dir * wSpan * 0.35, ly + 11.5, 1.6 * lensP, 0, Math.PI * 2);
      c.fill();
    }
  });

  // Tělíčko a tykadla
  c.fillStyle = '#0f172a';
  drawRoundRect(c, lx - 1.4, ly - 9, 2.8, 19, 1.4);
  c.fill();
  c.strokeStyle = '#fde68a';
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(lx, ly - 9);
  c.quadraticCurveTo(lx - 5, ly - 16, lx - 8, ly - 15);
  c.moveTo(lx, ly - 9);
  c.quadraticCurveTo(lx + 5, ly - 16, lx + 8, ly - 15);
  c.stroke();
}

export function renderWaterSpring(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 💧 eSTUDÁNKY: Lesní studánka pod šindelovou stříškou zanesená listím -> Křišťálový pramen, kruhy na vodě a kapradí
  const cleanP = easeOut(p);
  const spP = easeOut(subP(cleanP, 0.05, 0.94));
  const poolY = by - 13;
  const ridgeY = cy - 25.5;
  const eaveY = cy - 6.5;
  const postHalfX = 36.5;
  const eaveHalfX = 46.5;

  const drawMossTuft = (mx, my, scaleM, lit) => {
    c.save();
    c.fillStyle = lit ? '#16a34a' : '#14532d';
    [
      [-2.3, 0.4, 2.5, 1.4],
      [0, -0.3, 2.9, 1.65],
      [2.3, 0.35, 2.4, 1.35]
    ].forEach(([ox, oy, rx, ry]) => {
      c.beginPath();
      c.ellipse(mx + ox * scaleM, my + oy * scaleM, rx * scaleM, ry * scaleM, 0, 0, Math.PI * 2);
      c.fill();
    });
    if (lit) {
      c.fillStyle = '#4ade80';
      [
        [-1.3, -0.2, 1.6, 0.85],
        [1.1, -0.35, 1.8, 0.95]
      ].forEach(([ox, oy, rx, ry]) => {
        c.beginPath();
        c.ellipse(mx + ox * scaleM, my + oy * scaleM, rx * scaleM, ry * scaleM, 0, 0, Math.PI * 2);
        c.fill();
      });
    }
    c.restore();
  };

  // Pomocník pro vykreslení pravého lesního kapradí (zakřivený stonek s 5–6 páry lístků pinnae plynule se zužujícími až ke špičce)
  const drawFernFrond = (dir, baseX, baseY, spanF, riseF, ctrlXF, ctrlYF, pairs, unfurlF, stemCol, leafColA, leafColB, swayX) => {
    const x0 = baseX;
    const y0 = baseY;
    const x1 = baseX + dir * ctrlXF * (0.64 + 0.36 * unfurlF) + swayX * 0.45;
    const y1 = baseY - ctrlYF * (0.58 + 0.42 * unfurlF);
    const x2 = baseX + dir * spanF * (0.52 + 0.48 * unfurlF) + swayX;
    const y2 = baseY - riseF * (0.52 + 0.48 * unfurlF);

    c.save();
    for (let k = 0; k < pairs; k++) {
      const tPair = k / Math.max(1, pairs - 1);
      const u = 0.14 + tPair * 0.76;
      const mu = 1 - u;
      const bx = mu * mu * x0 + 2 * mu * u * x1 + u * u * x2;
      const byPt = mu * mu * y0 + 2 * mu * u * y1 + u * u * y2;
      const dx = 2 * mu * (x1 - x0) + 2 * u * (x2 - x1);
      const dy = 2 * mu * (y1 - y0) + 2 * u * (y2 - y1);
      const len = Math.hypot(dx, dy) || 1;
      const tx = dx / len;
      const ty = dy / len;
      const nx = -ty * dir;
      const ny = tx * dir;

      const env = Math.sin(Math.PI * (0.18 + 0.72 * tPair)) * (1 - 0.24 * tPair);
      const pLen = 10.2 * env * (0.62 + 0.38 * unfurlF);
      const pWid = 2.3 * env * (0.68 + 0.32 * unfurlF);

      [-1, 1].forEach((side) => {
        const vx = tx * 0.58 + nx * side * 0.82;
        const vy = ty * 0.58 + ny * side * 0.82;
        const pxN = -vy;
        const pyN = vx;
        const tipX = bx + vx * pLen;
        const tipY = byPt + vy * pLen;

        c.fillStyle = side === -1 ? leafColA : leafColB;
        c.beginPath();
        c.moveTo(bx, byPt);
        c.quadraticCurveTo(
          bx + vx * pLen * 0.45 + pxN * pWid,
          byPt + vy * pLen * 0.45 + pyN * pWid,
          tipX,
          tipY
        );
        c.quadraticCurveTo(
          bx + vx * pLen * 0.45 - pxN * pWid,
          byPt + vy * pLen * 0.45 - pyN * pWid,
          bx,
          byPt
        );
        c.closePath();
        c.fill();
      });
    }

    // Koncový vrcholový lístek plynule navazující na poslední pár pinnae
    const endDx = x2 - x1;
    const endDy = y2 - y1;
    const endLen = Math.hypot(endDx, endDy) || 1;
    const etx = endDx / endLen;
    const ety = endDy / endLen;
    const tipExt = 5.4 * (0.64 + 0.36 * unfurlF);
    c.fillStyle = leafColA;
    c.beginPath();
    c.moveTo(x2 - etx * 1.2, y2 - ety * 1.2);
    c.quadraticCurveTo(x2 + etx * tipExt * 0.42 - ety * 1.5, y2 + ety * tipExt * 0.42 + etx * 1.5, x2 + etx * tipExt, y2 + ety * tipExt);
    c.quadraticCurveTo(x2 + etx * tipExt * 0.42 + ety * 1.5, y2 + ety * tipExt * 0.42 - etx * 1.5, x2 - etx * 1.2, y2 - ety * 1.2);
    c.closePath();
    c.fill();

    // Pružné vřeteno (stonek) kapradiny
    c.strokeStyle = stemCol;
    c.lineWidth = 1.55;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo(x1, y1, x2, y2);
    c.stroke();
    c.restore();
  };

  // 1. Jemné prosvětlení pod stříškou studánky (p -> 1)
  if (cleanP > 0.04) {
    const roofLight = c.createLinearGradient(cx, ridgeY + 2, cx, poolY + 4);
    roofLight.addColorStop(0, `rgba(253, 230, 138, ${(0.18 * cleanP).toFixed(3)})`);
    roofLight.addColorStop(1, 'rgba(56, 189, 248, 0)');
    c.fillStyle = roofLight;
    c.beginPath();
    c.moveTo(cx, ridgeY + 2);
    c.lineTo(cx + 45, poolY + 2);
    c.lineTo(cx - 45, poolY + 2);
    c.closePath();
    c.fill();
  }

  // 2. Pravé vícečetné lesní kapradí rozvíjející se po obou stranách studánky
  const fernUnfurl = lerp(0.5 + prep * 0.08, 1.0, cleanP);
  [-1, 1].forEach((dir) => {
    const sway = red ? 0 : Math.sin(wt * 1.9 + (dir > 0 ? 1.2 : 0)) * (1.2 + cleanP * 1.6);
    const isLit = cleanP > 0.14;
    // Spodní doprovodný vějíř kapradí (5 párů lístků)
    drawFernFrond(
      dir,
      cx + dir * 41,
      poolY + 6,
      29,
      14,
      14,
      12,
      5,
      fernUnfurl,
      isLit ? '#059669' : '#14532d',
      isLit ? '#10b981' : 'rgba(21, 128, 61, 0.72)',
      isLit ? '#047857' : 'rgba(20, 83, 45, 0.72)',
      sway * 0.7
    );
    // Hlavní vzrostlý vějíř kapradí (6 párů lístků pinnae po každé straně až ke špičce)
    drawFernFrond(
      dir,
      cx + dir * 38,
      poolY + 2,
      39,
      31,
      16,
      24,
      6,
      fernUnfurl,
      isLit ? '#34d399' : '#166534',
      isLit ? '#6ee7b7' : 'rgba(34, 197, 94, 0.62)',
      isLit ? '#10b981' : 'rgba(22, 101, 52, 0.68)',
      sway
    );
  });

  // 3. Zadní oblouk mechové kamenné obruby a vodní hladina (za sloupky stříšky pro věrnou 3D hloubku)
  for (let s = 0; s < 7; s++) {
    const a = Math.PI + (s / 6) * Math.PI;
    const kx = cx + Math.cos(a) * 39.5;
    const ky = poolY + Math.sin(a) * 10.2;
    c.fillStyle = s % 2 === 0 ? '#475569' : '#64748b';
    c.strokeStyle = 'rgba(203, 213, 225, 0.32)';
    c.lineWidth = 0.9;
    c.beginPath();
    c.ellipse(kx, ky, 6.8, 3.8, (s - 3) * 0.08, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    if (s === 1 || s === 5) {
      drawMossTuft(kx + (s === 1 ? 1.5 : -1.5), ky - 2.0, 0.9, cleanP > 0.15);
    }
  }

  // Vnitřní stín studánky + hladina (zakalená podzimní -> křišťálově tyrkysová)
  c.fillStyle = '#0f172a';
  c.beginPath();
  c.ellipse(cx, poolY + 0.5, 36.8, 9.6, 0, 0, Math.PI * 2);
  c.fill();

  const murkyGrad = c.createRadialGradient(cx, poolY, 2, cx, poolY + 1, 36);
  murkyGrad.addColorStop(0, '#332d26');
  murkyGrad.addColorStop(1, '#1c242b');
  c.fillStyle = murkyGrad;
  c.beginPath();
  c.ellipse(cx, poolY + 0.8, 35.2, 8.8, 0, 0, Math.PI * 2);
  c.fill();

  if (cleanP > 0.01) {
    c.save();
    c.globalAlpha = clamp01(cleanP);
    const clearGrad = c.createRadialGradient(cx, poolY - 1, 2, cx, poolY + 1, 36);
    clearGrad.addColorStop(0, '#bae6fd');
    clearGrad.addColorStop(0.42, '#38bdf8');
    clearGrad.addColorStop(0.82, '#0284c7');
    clearGrad.addColorStop(1, '#0369a1');
    c.fillStyle = clearGrad;
    c.beginPath();
    c.ellipse(cx, poolY + 0.8, 35.2, 8.8, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  // 4. Soustředné tyrkysové kruhy na hladině
  if (cleanP <= 0.05) {
    c.strokeStyle = `rgba(148, 163, 184, ${(0.22 + prep * 0.14).toFixed(3)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx, poolY + 0.8, 12 + prep * 3, 2.8, 0, 0, Math.PI * 2);
    c.stroke();
  } else {
    for (let rIdx = 0; rIdx < 3; rIdx++) {
      const ph = red ? (rIdx + 0.5) / 3 : (wt * 0.52 + rIdx / 3) % 1;
      const ripRx = 6 + ph * 26 * spP;
      const ripRy = Math.max(1.2, ripRx * 0.23);
      c.strokeStyle = rIdx === 0 ? '#e0f2fe' : '#7dd3fc';
      c.save();
      c.globalAlpha = clamp01((1 - ph * 0.78) * 0.65 * spP);
      c.lineWidth = 1.25;
      c.beginPath();
      c.ellipse(cx, poolY + 0.8, ripRx, ripRy, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }

  // 5. Spadané podzimní listí na zakalené vodě (p = 0) odplouvající do stran (p -> 1)
  if (cleanP < 0.72) {
    const leafA = clamp01(1 - cleanP * 1.42);
    const autumnLeaves = [
      { x: -18, y: -1.8, rot: -0.35, col: '#b45309', s: 5.4 },
      { x: -6, y: 2.2, rot: 0.42, col: '#d97706', s: 5.8 },
      { x: 5, y: -2.4, rot: -0.18, col: '#92400e', s: 5.0 },
      { x: 14, y: 1.8, rot: 0.58, col: '#ca8a04', s: 5.5 },
      { x: 22, y: -1.2, rot: -0.48, col: '#c2410c', s: 4.8 }
    ];
    c.save();
    c.globalAlpha = leafA;
    autumnLeaves.forEach((lf) => {
      const drift = 1 + cleanP * 0.92;
      const lx = cx + lf.x * drift;
      const ly = poolY + 0.8 + lf.y;
      c.save();
      c.translate(lx, ly);
      c.rotate(lf.rot + cleanP * (lf.x < 0 ? -0.4 : 0.4));
      c.fillStyle = lf.col;
      c.beginPath();
      c.moveTo(-lf.s, 0);
      c.quadraticCurveTo(0, -lf.s * 0.56, lf.s, 0);
      c.quadraticCurveTo(0, lf.s * 0.56, -lf.s, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(254, 243, 199, 0.38)';
      c.lineWidth = 0.75;
      c.beginPath();
      c.moveTo(-lf.s * 0.75, 0);
      c.lineTo(lf.s * 0.75, 0);
      c.stroke();
      c.restore();
    });
    c.restore();
  }

  // 6. Dřevěná stříška české lesní studánky (dva trámové sloupky na břehu studánky, vzpěry a šindelový štít)
  const postFill = cleanP > 0.15 ? '#92400e' : '#3f2d20';
  const postStroke = cleanP > 0.15 ? '#fbbf24' : 'rgba(148, 163, 184, 0.36)';
  c.save();
  // Vzpěry (tesařské pásky) a vodorovný vazný trám
  c.strokeStyle = cleanP > 0.15 ? '#b45309' : '#4a3525';
  c.lineWidth = 2.3;
  c.lineCap = 'round';
  [-1, 1].forEach((dir) => {
    c.beginPath();
    c.moveTo(cx + dir * postHalfX, eaveY + 9);
    c.lineTo(cx + dir * (postHalfX - 8.5), eaveY + 1.5);
    c.stroke();
  });
  c.fillStyle = cleanP > 0.15 ? '#78350f' : '#332419';
  c.fillRect(cx - postHalfX - 2, eaveY - 0.5, postHalfX * 2 + 4, 3);

  // Dva dřevěné sloupky ukotvené na bočním břehu studánky
  [-1, 1].forEach((dir) => {
    const px = cx + dir * postHalfX - 2.3;
    c.fillStyle = postFill;
    c.strokeStyle = postStroke;
    c.lineWidth = 0.95;
    drawRoundRect(c, px, eaveY, 4.6, poolY + 1.5 - eaveY, 1.2);
    c.fill();
    c.stroke();
  });

  // Vnitřní stín štítu stříšky
  c.fillStyle = cleanP > 0.15 ? '#2b1b10' : '#17120e';
  c.beginPath();
  c.moveTo(cx - eaveHalfX + 3, eaveY + 3);
  c.lineTo(cx, ridgeY + 2);
  c.lineTo(cx + eaveHalfX - 3, eaveY + 3);
  c.closePath();
  c.fill();

  // Šindelová sedlová stříška
  const roofGrad = c.createLinearGradient(cx, ridgeY - 2, cx, eaveY + 6);
  if (cleanP > 0.15) {
    roofGrad.addColorStop(0, '#d97706');
    roofGrad.addColorStop(1, '#92400e');
  } else {
    roofGrad.addColorStop(0, '#573d28');
    roofGrad.addColorStop(1, '#3b291b');
  }
  c.fillStyle = roofGrad;
  c.strokeStyle = cleanP > 0.15 ? '#fde68a' : 'rgba(148, 163, 184, 0.45)';
  c.lineWidth = 1.35;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(cx - eaveHalfX, eaveY + 3.5);
  c.lineTo(cx, ridgeY - 1.5);
  c.lineTo(cx + eaveHalfX, eaveY + 3.5);
  c.lineTo(cx + eaveHalfX - 2.8, eaveY + 6.5);
  c.lineTo(cx, ridgeY + 3.5);
  c.lineTo(cx - eaveHalfX + 2.8, eaveY + 6.5);
  c.closePath();
  c.fill();
  c.stroke();

  // Jemná kresba dřevěných šindelů a vyřezávaná špička ve štítu
  c.strokeStyle = cleanP > 0.15 ? 'rgba(254, 243, 199, 0.34)' : 'rgba(203, 213, 225, 0.16)';
  c.lineWidth = 1;
  [-1, 1].forEach((dir) => {
    for (let sh = 1; sh <= 3; sh++) {
      const u = sh / 4;
      const sx = lerp(cx, cx + dir * eaveHalfX, u);
      const sy = lerp(ridgeY - 1, eaveY + 3.5, u);
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx - dir * 2, sy + 2.8);
      c.stroke();
    }
  });
  c.fillStyle = cleanP > 0.15 ? '#fde68a' : '#78716c';
  c.beginPath();
  c.moveTo(cx, ridgeY - 4.5);
  c.lineTo(cx + 2.2, ridgeY - 1.5);
  c.lineTo(cx, ridgeY + 1);
  c.lineTo(cx - 2.2, ridgeY - 1.5);
  c.closePath();
  c.fill();
  c.restore();

  // 7. Vyšší 3obloukový jiskřící křišťálový pramen a stoupající kapky vody (p -> 1)
  if (spP > 0.02) {
    drawGlow(c, cx, poolY - 13, Math.max(0.5, 31 * spP), '#38bdf8', 0.42 * spP);
    const shimmer = red ? 0 : Math.sin(wt * 4.2) * 1.3;

    // Jemný vodní závoj u vývěru pramene
    c.save();
    const veilGrad = c.createLinearGradient(cx, poolY - 26 * spP, cx, poolY + 1);
    veilGrad.addColorStop(0, `rgba(224, 242, 254, ${(0.22 * spP).toFixed(3)})`);
    veilGrad.addColorStop(1, `rgba(125, 211, 252, ${(0.42 * spP).toFixed(3)})`);
    c.fillStyle = veilGrad;
    c.beginPath();
    c.moveTo(cx - 4.5 * spP, poolY + 1);
    c.quadraticCurveTo(cx + shimmer * 0.45, poolY - 27.5 * spP, cx + 4.5 * spP, poolY + 1);
    c.closePath();
    c.fill();
    c.restore();

    // Dva boční parabolické křišťálové oblouky pramene dopadající zpět do tůňky
    [-1, 1].forEach((dir) => {
      c.save();
      c.strokeStyle = '#7dd3fc';
      c.shadowColor = '#38bdf8';
      c.shadowBlur = 6 * spP;
      c.lineWidth = 2.15;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx + dir * 1.4, poolY + 0.8);
      c.quadraticCurveTo(
        cx + dir * (12 * spP) + shimmer * 0.25,
        poolY - 37 * spP,
        cx + dir * (23.5 * spP),
        poolY + 1.0
      );
      c.stroke();
      c.restore();
    });

    // Hlavní vyšší středový křišťálový výtrysk pod štítem studánky (čistý jeden proud bez dvojité vidličky)
    const crestX = cx + shimmer * 0.65;
    const crestY = poolY - 27.5 * spP;
    c.save();
    c.strokeStyle = '#e0f2fe';
    c.shadowColor = '#bae6fd';
    c.shadowBlur = 8 * spP;
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, poolY + 1.0);
    c.quadraticCurveTo(cx - shimmer * 0.35, poolY - 15 * spP, crestX, crestY);
    c.stroke();
    c.restore();

    // Stoupající perlivé kapky vody kolem koruny pramene
    const drops = [
      { dx: -13, peak: 20, ph: 0.1 },
      { dx: -5.5, peak: 25, ph: 0.45 },
      { dx: 0, peak: 29.5, ph: 0.78 },
      { dx: 5.8, peak: 24.5, ph: 0.28 },
      { dx: 13.5, peak: 19.5, ph: 0.62 },
      { dx: -19.5, peak: 11.5, ph: 0.85 },
      { dx: 19.5, peak: 11.5, ph: 0.36 }
    ];
    drops.forEach((dr, idx) => {
      const du = red ? 0.65 : (wt * 0.85 + dr.ph) % 1;
      const arcEnv = Math.sin(du * Math.PI);
      const dropR = Math.max(0.4, (1.1 + (idx % 2) * 0.42) * spP * (0.55 + 0.45 * arcEnv));
      const dx = cx + dr.dx * spP * (0.45 + 0.55 * du);
      const dy = poolY - 2 - dr.peak * spP * arcEnv;
      c.fillStyle = idx === 2 ? '#fef9c3' : idx % 2 === 0 ? '#ffffff' : '#bae6fd';
      c.beginPath();
      c.arc(dx, dy, dropR, 0, Math.PI * 2);
      c.fill();
    });

    if (spP > 0.5) {
      drawStar(c, crestX, crestY - 0.5, 4.4 * subP(spP, 0.5, 1.0), '#ffffff');
    }
  }

  // 8. Přední oblouk mechové kamenné obruby (uzavírá hladinu i paty sloupků v prostorovém 3D kamenném věnci)
  for (let s = 0; s < 8; s++) {
    const a = (s / 7) * Math.PI;
    const kx = cx + Math.cos(a) * 39.5;
    const ky = poolY + 0.8 + Math.sin(a) * 10.2;
    const stoneGrad = c.createLinearGradient(kx, ky - 4, kx, ky + 4);
    stoneGrad.addColorStop(0, cleanP > 0.15 ? '#94a3b8' : '#64748b');
    stoneGrad.addColorStop(1, '#334155');
    c.fillStyle = stoneGrad;
    c.strokeStyle = cleanP > 0.15 ? 'rgba(186, 230, 253, 0.45)' : 'rgba(148, 163, 184, 0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(kx, ky, 7.1, 4.0, (3.5 - s) * 0.06, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Sametové polštářky lesního mechu kopírující horní oblouk kamenů
    if (s === 1 || s === 3 || s === 6) {
      drawMossTuft(kx + (s === 3 ? 0.8 : -0.8), ky - 2.1, 1.0, cleanP > 0.15);
    }
  }
}

export function renderCompostSprout(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🌱 Kompost Mapko: Kopeček živé hlíny se slupkami a semínkem -> Kořínky živin a vyrůstající zlatá slunečnice
  const moundY = by + 1;
  const growP = easeOut(p);

  c.fillStyle = '#5c2d0c';
  c.strokeStyle = '#92400e';
  c.lineWidth = 1.3;
  c.beginPath();
  c.ellipse(cx, moundY, 46, 13, 0, Math.PI, Math.PI * 2);
  c.fill();
  c.stroke();

  // Organické slupky a lístek (p = 0) měnící se ve zlaté živiny a kořínky v půdě
  if (growP < 0.5) {
    const orgA = 1 - growP * 1.85;
    c.strokeStyle = `rgba(251, 146, 60, ${0.85 * orgA})`;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(cx - 15, moundY - 7, 5, 0.2, 2.5);
    c.stroke();
    c.strokeStyle = `rgba(244, 63, 94, ${0.78 * orgA})`;
    c.beginPath();
    c.arc(cx + 14, moundY - 6, 4.5, 0.7, 2.9);
    c.stroke();
    // Spící zlaté semínko v hlíně (žádná rušivá svislá čárka při p = 0!)
    c.fillStyle = `rgba(253, 224, 71, ${0.75 + prep * 0.25})`;
    c.beginPath();
    c.ellipse(cx, moundY - 7, 3.2, 2.0, -0.2, 0, Math.PI * 2);
    c.fill();
  } else {
    c.strokeStyle = 'rgba(253, 224, 71, 0.52)';
    c.lineWidth = 1.3;
    [-15, 0, 15].forEach((rx) => {
      c.beginPath();
      c.moveTo(cx, moundY - 9);
      c.quadraticCurveTo(cx + rx * 0.5, moundY - 5, cx + rx, moundY - 2);
      c.stroke();
    });
  }

  // Klíčící stonek, listy a slunečnice (vyrůstá plynule z nuly po zahájení!)
  if (growP > 0.02) {
    const stemH = growP * 35;
    const sway = Math.sin(wt * 2) * 2 * growP;
    c.strokeStyle = '#4ade80';
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, moundY - 9);
    c.quadraticCurveTo(cx + sway * 0.5, moundY - 9 - stemH * 0.5, cx + sway, moundY - 9 - stemH);
    c.stroke();

    if (growP > 0.18) {
      const lP = subP(growP, 0.18, 0.75);
      c.fillStyle = '#22c55e';
      c.beginPath();
      c.ellipse(cx - 8.5 * lP, moundY - 9 - stemH * 0.52, 8 * lP, 3.8 * lP, -0.4, 0, Math.PI * 2);
      c.ellipse(cx + 8.5 * lP, moundY - 9 - stemH * 0.52, 8 * lP, 3.8 * lP, 0.4, 0, Math.PI * 2);
      c.fill();
    }

    if (growP > 0.48) {
      const fP = easeOut(subP(growP, 0.48, 1.0));
      const fx = cx + sway;
      const fy = moundY - 9 - stemH;
      drawGlow(c, fx, fy, 18 * fP, '#fde047', 0.32 * fP);
      c.fillStyle = '#fde047';
      for (let k = 0; k < 10; k++) {
        const a = (k * Math.PI * 2) / 10 + wt * 0.3;
        c.beginPath();
        c.ellipse(fx + Math.cos(a) * 6.8 * fP, fy + Math.sin(a) * 6.8 * fP, 4.2 * fP, 2.1 * fP, a, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#78350f';
      c.beginPath();
      c.arc(fx, fy, 4.2 * fP, 0, Math.PI * 2);
      c.fill();
    }
  }
}

export function renderEcoCleanup(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🧤 Trash Hero / Ukliďme Česko: Zřetelné odpadky na holé pěšině -> Čistá rozkvetlá louka s vlčími máky, chrpami a motýlkem
  const groundY = by - 3;
  const trashFade = 1 - easeOut(subP(p, 0, 0.52));
  const bloomP = easeOut(subP(p, 0.12, 0.96));

  // Pěšina
  c.strokeStyle = bloomP > 0.25 ? 'rgba(52, 211, 153, 0.5)' : 'rgba(148, 163, 184, 0.35)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 64, groundY);
  c.quadraticCurveTo(cx, groundY - 2, cx + 64, groundY);
  c.stroke();

  if (trashFade > 0.02) {
    c.save();
    c.globalAlpha = trashFade;
    // 1. Nakloněná zmačkaná plechovka vlevo
    c.save();
    c.translate(cx - 40, groundY - 6);
    c.rotate(-0.22);
    c.fillStyle = '#94a3b8';
    c.strokeStyle = '#e2e8f0';
    c.lineWidth = 1.2;
    drawRoundRect(c, -8, -5, 16, 10, 2);
    c.fill();
    c.stroke();
    c.strokeStyle = '#475569';
    c.beginPath();
    c.moveTo(-2, -5);
    c.lineTo(-2, 5);
    c.stroke();
    c.restore();

    // 2. Zmuchlaný obal uprostřed
    c.fillStyle = '#cbd5e1';
    c.strokeStyle = '#64748b';
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(cx - 8, groundY - 1);
    c.lineTo(cx - 4, groundY - 11);
    c.lineTo(cx + 3, groundY - 8);
    c.lineTo(cx + 9, groundY - 12);
    c.lineTo(cx + 11, groundY - 2);
    c.closePath();
    c.fill();
    c.stroke();

    // 3. Odhozená plastová láhev s hrdlem vpravo
    c.save();
    c.translate(cx + 36, groundY - 5);
    c.rotate(0.18);
    c.fillStyle = 'rgba(148, 163, 184, 0.38)';
    c.strokeStyle = '#cbd5e1';
    c.lineWidth = 1.3;
    drawRoundRect(c, -9, -4.5, 16, 9, 3);
    c.fill();
    c.stroke();
    c.fillStyle = '#fb7185';
    c.fillRect(7, -2.5, 4, 5);
    c.restore();
    c.restore();
  }

  if (bloomP > 0.02) {
    // Stébla svěží trávy
    c.strokeStyle = '#10b981';
    c.lineWidth = 1.6;
    for (let g = -6; g <= 6; g++) {
      const gxB = cx + g * 10;
      const gh = (7 + (Math.abs(g) % 3) * 4) * bloomP;
      c.beginPath();
      c.moveTo(gxB, groundY);
      c.quadraticCurveTo(gxB + Math.sin(wt * 2 + g) * 2, groundY - gh * 0.6, gxB + (g % 2 === 0 ? 2 : -2), groundY - gh);
      c.stroke();
    }
    // 5 lučních květů (vlčí máky, chrpy, kopretina)
    const fls = [
      { x: cx - 48, h: 20, col: '#f43f5e', cen: '#1e293b' },
      { x: cx - 24, h: 26, col: '#38bdf8', cen: '#fde047' },
      { x: cx, h: 30, col: '#ffffff', cen: '#f59e0b' },
      { x: cx + 24, h: 25, col: '#f43f5e', cen: '#fde047' },
      { x: cx + 48, h: 21, col: '#38bdf8', cen: '#fde047' }
    ];
    fls.forEach((f, idx) => {
      const fP = easeOut(subP(bloomP, idx * 0.08, idx * 0.08 + 0.65));
      if (fP <= 0.02) return;
      const sway = Math.sin(wt * 2.2 + idx) * 2;
      const fy = groundY - f.h * fP;
      c.strokeStyle = '#34d399';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(f.x, groundY);
      c.quadraticCurveTo(f.x + sway * 0.5, groundY - f.h * 0.5 * fP, f.x + sway, fy);
      c.stroke();
      drawFlower(c, f.x + sway, fy, 5.8 * fP, f.col, f.cen);
    });

    if (bloomP > 0.65) {
      drawBird(c, cx + 14 + Math.sin(wt * 2.5) * 4, groundY - 34, Math.sin(wt * 6), 5.5 * subP(bloomP, 0.65, 1.0), '#fde047');
    }
  }
}

