/**
 * Procedural Canvas 2D scene renderers for health, blood, and vital support.
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
export function renderBloodDrop(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Darování krve: 3D rubínová kapka vlevo a 3 tichá srdce vpravo -> 3 pulsující EKG linie života rozsvěcující 3 hřejivá srdce
    const dropX = cx - 58;
    const dropFloat = red ? 0 : Math.sin(wt * 2.2) * 1.1;
    const dropY = cy + dropFloat;
    const lanes = [
      { idx: 0, hx: cx + 46, hy: cy - 20, syOff: -3.4, qrsU: 0.45, heartCol: '#f43f5e', glowCol: '#fbbf24' },
      { idx: 1, hx: cx + 49, hy: cy, syOff: 0, qrsU: 0.51, heartCol: '#f43f5e', glowCol: '#fde047' },
      { idx: 2, hx: cx + 46, hy: cy + 20, syOff: 3.4, qrsU: 0.47, heartCol: '#fb7185', glowCol: '#fbbf24' }
    ];

    const traceTeardropPath = () => {
      c.beginPath();
      c.moveTo(0, -14);
      c.bezierCurveTo(-10.5, 1, -9.8, 12.5, 0, 12.5);
      c.bezierCurveTo(9.8, 12.5, 10.5, 1, 0, -14);
      c.closePath();
    };

    /**
     * @param {number} u
     * @param {number} qrsCenter
     * @param {number} amp
     */
    const ecgWaveOffset = (u, qrsCenter, amp) => {
      const loc = (u - (qrsCenter - 0.14)) / 0.28;
      if (loc < 0 || loc > 1) return 0;
      if (loc < 0.16) return -2.1 * Math.sin((loc / 0.16) * Math.PI) * amp;
      if (loc < 0.25) return 0;
      if (loc < 0.33) return lerp(0, 2.8, (loc - 0.25) / 0.08) * amp;
      if (loc < 0.46) return lerp(2.8, -9.4, (loc - 0.33) / 0.13) * amp;
      if (loc < 0.58) return lerp(-9.4, 4.4, (loc - 0.46) / 0.12) * amp;
      if (loc < 0.67) return lerp(4.4, 0, (loc - 0.58) / 0.09) * amp;
      if (loc < 0.75) return 0;
      if (loc < 0.95) return -2.6 * Math.sin(((loc - 0.75) / 0.20) * Math.PI) * amp;
      return 0;
    };

    /**
     * @param {number} qrsCenter
     * @param {number} maxU
     */
    const buildLaneUs = (qrsCenter, maxU) => {
      const baseSteps = 44;
      const us = [];
      for (let s = 0; s <= baseSteps; s++) {
        const u = s / baseSteps;
        if (u < maxU) us.push(u);
      }
      [0.25, 0.33, 0.46, 0.58, 0.67].forEach((kLoc) => {
        const ku = qrsCenter - 0.14 + kLoc * 0.28;
        if (ku > 0 && ku < maxU) us.push(ku);
      });
      us.push(maxU);
      us.sort((a, b) => a - b);
      return us;
    };

    /**
     * @param {(typeof lanes)[number]} ln
     * @param {number} u
     * @param {number} amp
     * @param {number} [sxOverride]
     */
    const sampleLanePoint = (ln, u, amp, sxOverride) => {
      const sx = sxOverride ?? dropX + 11.5;
      const sy = dropY + ln.syOff;
      const ex = ln.hx - 8.2;
      const ey = ln.hy;
      const x = lerp(sx, ex, u);
      const fanT = clamp01(u / 0.32);
      const smoothFan = fanT * fanT * (3 - 2 * fanT);
      const baseY = lerp(sy, ey, smoothFan);
      return { x, y: baseY + ecgWaveOffset(u, ln.qrsU, amp) };
    };

    // Jemná kapkovitá tlaková vlna za rubínovou kapkou (nekříží linie života kružnicí)
    drawGlow(c, dropX, dropY + 1.5, 20 + prep * 4 + p * 8, '#f43f5e', 0.32 + prep * 0.1 + p * 0.22);
    if (p > 0.08) {
      const ringP = easeOut(subP(p, 0.08, 0.88));
      const pulseScale = 1.14 + ringP * 0.22 + (red ? 0 : Math.sin(wt * 3.2) * 0.03 * ringP);
      c.save();
      c.translate(dropX, dropY + 0.5);
      c.scale(pulseScale, pulseScale);
      c.strokeStyle = `rgba(253, 164, 175, ${(0.34 * ringP).toFixed(3)})`;
      c.lineWidth = 1.05 / pulseScale;
      traceTeardropPath();
      c.stroke();
      c.restore();
    }

    lanes.forEach((ln, i) => {
      const lineP = easeOut(subP(p, 0.02 + i * 0.05, 0.64 + i * 0.05));
      const fullUs = buildLaneUs(ln.qrsU, 1.0);

      // 1. Klidové nezapálené EKG dráhy (p = 0 jemný náznak čekajícího pulsu)
      c.save();
      c.setLineDash([2.5, 3]);
      c.strokeStyle = `rgba(148, 163, 184, ${(0.28 + prep * 0.1) * (1 - lineP * 0.65)})`;
      c.lineWidth = 1.25;
      c.lineJoin = 'round';
      c.beginPath();
      fullUs.forEach((u, idx) => {
        const pt = sampleLanePoint(ln, u, 0.48 + prep * 0.14, dropX + 11.5);
        if (idx === 0) c.moveTo(pt.x, pt.y);
        else c.lineTo(pt.x, pt.y);
      });
      c.stroke();
      c.restore();

      // 2. Zářící růžovo-zlato-smaragdové linie života s ostrým QRS vrcholem (p -> 1)
      if (lineP > 0.015) {
        const sx = dropX + 7.5;
        const ex = ln.hx - 7.2;
        const lg = c.createLinearGradient(sx, ln.hy, ex, ln.hy);
        lg.addColorStop(0, '#fb7185');
        lg.addColorStop(0.50, '#fde047');
        lg.addColorStop(1, '#34d399');

        c.save();
        c.strokeStyle = lg;
        c.shadowColor = '#fb7185';
        c.shadowBlur = 5.5 * lineP;
        c.lineWidth = 2.15;
        c.lineCap = 'round';
        c.lineJoin = 'round';
        c.beginPath();
        const activeUs = buildLaneUs(ln.qrsU, lineP);
        activeUs.forEach((u, idx) => {
          const pt = sampleLanePoint(ln, u, 1.0, sx);
          if (idx === 0) c.moveTo(pt.x, pt.y);
          else c.lineTo(pt.x, pt.y);
        });
        c.stroke();
        c.restore();

        if (lineP > ln.qrsU) {
          const peakPt = sampleLanePoint(ln, ln.qrsU - 0.0112, 1.0, sx);
          drawGlow(c, peakPt.x, peakPt.y + 3, Math.max(0.5, 9.5 * subP(lineP, ln.qrsU, 1.0)), '#fde047', 0.22 * lineP);
        }

        if (lineP > 0.82 && !red) {
          const pu = (wt * 0.72 + i * 0.33) % 1;
          const bPt = sampleLanePoint(ln, pu, 1.0, sx);
          c.fillStyle = '#fef08a';
          c.beginPath();
          c.arc(bPt.x, bPt.y, 1.8, 0, Math.PI * 2);
          c.fill();
        }
      }

      // 3. Tři srdce vpravo: p = 0 klidový obrys -> p -> 1 zářící hřejivá bijící srdce
      const hP = easeOut(subP(p, 0.36 + i * 0.08, 0.90 + i * 0.05));
      const rBase = 5.8;
      const hyTop = ln.hy - rBase * 0.55;
      if (hP < 0.95) {
        c.save();
        c.fillStyle = `rgba(15, 23, 42, ${0.38 * (1 - hP)})`;
        c.strokeStyle = `rgba(203, 213, 225, ${(0.5 + prep * 0.12) * (1 - hP * 0.85)})`;
        c.lineWidth = 1.35;
        c.beginPath();
        c.moveTo(ln.hx, hyTop + rBase * 0.35);
        c.bezierCurveTo(ln.hx - rBase, hyTop - rBase * 0.4, ln.hx - rBase * 1.1, hyTop + rBase * 0.6, ln.hx, hyTop + rBase * 1.25);
        c.bezierCurveTo(ln.hx + rBase * 1.1, hyTop + rBase * 0.6, ln.hx + rBase, hyTop - rBase * 0.4, ln.hx, hyTop + rBase * 0.35);
        c.fill();
        c.stroke();
        c.restore();
      }
      if (hP > 0.04) {
        const beat = 1 + (red ? 0 : Math.sin(wt * 4.3 + i * 0.9) * 0.08 * hP);
        const rLit = 6.5 * hP * beat;
        const litTopY = ln.hy - rLit * 0.55;
        drawGlow(c, ln.hx, ln.hy, Math.max(0.5, 16 * hP), ln.glowCol, 0.28 * hP);
        drawGlow(c, ln.hx, ln.hy, Math.max(0.5, 10 * hP), '#f43f5e', 0.22 * hP);
        drawHeart(c, ln.hx, litTopY, rLit, i === 1 ? '#e11d48' : '#f43f5e');
        c.save();
        c.strokeStyle = `rgba(254, 240, 138, ${(0.58 * hP).toFixed(3)})`;
        c.lineWidth = 0.9;
        c.beginPath();
        c.moveTo(ln.hx, litTopY + rLit * 0.35);
        c.bezierCurveTo(ln.hx - rLit, litTopY - rLit * 0.4, ln.hx - rLit * 1.1, litTopY + rLit * 0.6, ln.hx, litTopY + rLit * 1.25);
        c.bezierCurveTo(ln.hx + rLit * 1.1, litTopY + rLit * 0.6, ln.hx + rLit, litTopY - rLit * 0.4, ln.hx, litTopY + rLit * 0.35);
        c.stroke();
        c.restore();
        // Jemný hřejivý odlesk na horním laloku srdce
        c.fillStyle = `rgba(255, 255, 255, ${0.72 * hP})`;
        c.beginPath();
        c.arc(ln.hx - rLit * 0.34, litTopY + rLit * 0.22, Math.max(0.4, 1.25 * hP), 0, Math.PI * 2);
        c.fill();
      }
    });

    // 4. Zářivá 3D rubínová kapka krve vlevo (překrývá počátek linií života pro plynulé vyústění)
    c.save();
    c.translate(dropX, dropY);
    const dropGrad = c.createRadialGradient(-3.2, -1, 1, 0, 2, 14.5);
    dropGrad.addColorStop(0, '#ffe4e6');
    dropGrad.addColorStop(0.28, '#fb7185');
    dropGrad.addColorStop(0.68, '#e11d48');
    dropGrad.addColorStop(1, '#881337');
    c.fillStyle = dropGrad;
    c.strokeStyle = 'rgba(254, 205, 211, 0.56)';
    c.lineWidth = 1;
    traceTeardropPath();
    c.fill();
    c.stroke();

    c.fillStyle = 'rgba(255, 255, 255, 0.76)';
    c.beginPath();
    c.ellipse(-3.3, 1.5, 1.9, 4.1, -0.24, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(253, 224, 71, 0.34)';
    c.beginPath();
    c.arc(3.4, 6.8, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();
}

/** @type {SceneRenderer} */
export function renderDnaHelix(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Registr kostní dřeně: Dva oddělené nespojené řetězce -> 100% molekulární shoda a sepnutá dvoušroubovice
    const rungs = 15;
    const sep = (1 - easeOut(p)) * 13;
    const spanH = Math.min(82, spanX * 0.72);

    for (let s = 0; s < 2; s++) {
      c.strokeStyle = s === 0 ? '#c084fc' : p > 0.3 ? '#34d399' : '#38bdf8';
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 28; k++) {
        const u = k / 28;
        const x = lerp(cx - spanH, cx + spanH, u);
        const angle = wt * 2.1 + u * Math.PI * 2.6 + (s === 1 ? Math.PI : 0);
        const y = cy + 2 + Math.sin(angle) * 14 + (s === 0 ? -sep : sep);
        if (k === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    for (let k = 0; k < rungs; k++) {
      const u = k / (rungs - 1);
      const x = lerp(cx - spanH, cx + spanH, u);
      const angle = wt * 2.1 + u * Math.PI * 2.6;
      const y1 = cy + 2 + Math.sin(angle) * 14 - sep;
      const y2 = cy + 2 + Math.sin(angle + Math.PI) * 14 + sep;
      const zipP = easeOut(subP(p, u * 0.55, u * 0.55 + 0.42));

      const mid1 = lerp(y1, (y1 + y2) * 0.5, 0.32 + zipP * 0.68);
      const mid2 = lerp(y2, (y1 + y2) * 0.5, 0.32 + zipP * 0.68);
      c.strokeStyle = zipP > 0.8 ? 'rgba(253, 224, 71, 0.85)' : 'rgba(167, 139, 250, 0.45)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, y1);
      c.lineTo(x, mid1);
      c.moveTo(x, y2);
      c.lineTo(x, mid2);
      c.stroke();

      c.fillStyle = '#c084fc';
      c.beginPath();
      c.arc(x, y1, 2.7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = zipP > 0.5 ? '#34d399' : '#38bdf8';
      c.beginPath();
      c.arc(x, y2, 2.7, 0, Math.PI * 2);
      c.fill();
    }
    if (p > 0.65) {
      drawStar(c, cx, cy - 20, 5.2 * subP(p, 0.65, 1.0), '#fde047');
    }
}

/** @type {SceneRenderer} */
export function renderHairSilk(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Daruj vlasy: Svázaný cop vlevo -> Hedvábné zlatavě růžové prameny splývající do květinové koruny
    const leftX = cx - 64;
    const rightX = cx + 44;
    const flowP = easeOut(subP(p, 0, 0.82));

    // Hedvábné prameny prodlužující se z copu do koruny
    const curEndX = lerp(leftX + 26, rightX, flowP);
    for (let s = 0; s < 5; s++) {
      c.strokeStyle = s % 2 === 0 ? '#fbbf24' : '#f472b6';
      c.lineWidth = 2.3;
      c.lineCap = 'round';
      c.beginPath();
      for (let step = 0; step <= 24; step++) {
        const u = step / 24;
        const x = lerp(leftX, curEndX, u);
        const bundlePinch = Math.min(1, u * 4);
        const wave = Math.sin(u * 6 - wt * 2.4 + s * 0.65) * (3 + flowP * 8) * bundlePinch;
        const spread = (s - 2) * (1.2 + bundlePinch * (1.5 + flowP * 2.2));
        const y = cy + 2 + wave + spread;
        if (step === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    // Zlatá stuha u copu vlevo
    c.fillStyle = '#fde047';
    drawRoundRect(c, leftX + 4, cy - 6, 5, 16, 2);
    c.fill();

    // Květinová koruna / paruka rozkvétající vpravo (p -> 1)
    const crownP = easeOut(subP(p, 0.45, 1.0));
    if (crownP > 0.05) {
      drawGlow(c, rightX - 6, cy + 2, 24 * crownP, '#fde047', 0.3 * crownP);
      drawFlower(c, rightX - 18, cy - 10, 5 * crownP, '#ffffff', '#fde047');
      drawFlower(c, rightX - 4, cy - 14, 6 * crownP, '#fbcfe8', '#f59e0b');
      drawFlower(c, rightX + 8, cy - 8, 4.8 * crownP, '#ffffff', '#34d399');
    }
}

/** @type {SceneRenderer} */
export function renderEcgRescue(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Aplikace Záchranka: Slabá křivka a zhasnuté AED -> Živý PQRST srdeční tep a GPS maják AED
    const leftX = cx - spanX + 10;
    const aedX = cx + spanX - 28;
    const ecgEnd = aedX - 22;
    const ecgY = cy + 4;

    // Jemná souřadnicová mřížka
    c.strokeStyle = 'rgba(52, 211, 153, 0.12)';
    c.lineWidth = 1;
    for (let x = leftX; x <= ecgEnd; x += 22) {
      c.beginPath();
      c.moveTo(x, cy - 20);
      c.lineTo(x, by - 4);
      c.stroke();
    }

    // PQRST křivka s plynulou amplitudou (p: 0 -> 1)
    const amp = lerp(0.12, 1.0, easeOut(p));
    const midEcg = (leftX + ecgEnd) * 0.5;
    c.save();
    c.strokeStyle = p > 0.15 ? '#34d399' : 'rgba(244, 63, 94, 0.55)';
    c.shadowColor = p > 0.15 ? '#34d399' : '#f43f5e';
    c.shadowBlur = 4 + p * 7;
    c.lineWidth = 1.8 + p * 1.0;
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(leftX, ecgY);
    c.lineTo(midEcg - 28, ecgY);
    c.lineTo(midEcg - 20, ecgY - 6 * amp);
    c.lineTo(midEcg - 13, ecgY);
    c.lineTo(midEcg - 7, ecgY + 9 * amp);
    c.lineTo(midEcg, ecgY - 27 * amp);
    c.lineTo(midEcg + 8, ecgY + 14 * amp);
    c.lineTo(midEcg + 16, ecgY);
    c.lineTo(midEcg + 24, ecgY - 7 * amp);
    c.lineTo(midEcg + 32, ecgY);
    c.lineTo(ecgEnd, ecgY);
    c.stroke();
    c.restore();

    if (p > 0.1) {
      const sweepU = red ? 0.5 : (wt * 0.65) % 1;
      const dotX = lerp(leftX, ecgEnd, sweepU);
      drawGlow(c, midEcg, ecgY - 8 * amp, 18 * p, '#34d399', 0.3 * p);
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(dotX, ecgY, 2.4, 0, Math.PI * 2);
      c.fill();
    }

    // AED lokátor s GPS kruhy
    const aedP = easeOut(subP(p, 0.2, 0.95));
    if (aedP > 0.05) {
      for (let r = 1; r <= 2; r++) {
        const rad = 14 + r * 7 * aedP + (red ? 0 : (wt * 8) % 6);
        c.strokeStyle = `rgba(52, 211, 153, ${(0.42 * aedP) / r})`;
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(aedX, ecgY - 2, rad, 0, Math.PI * 2);
        c.stroke();
      }
    }

    c.fillStyle = aedP > 0.1 ? '#059669' : '#1e293b';
    c.strokeStyle = aedP > 0.1 ? '#6ee7b7' : '#64748b';
    c.lineWidth = 1.6;
    drawRoundRect(c, aedX - 11, ecgY - 13, 22, 22, 5);
    c.fill();
    c.stroke();
    drawHeart(c, aedX, ecgY - 4, 5.5, aedP > 0.1 ? '#fde047' : '#94a3b8');
}

/** @type {SceneRenderer} */
export function renderMindWave(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Nevypusť duši: Chaotické zašmodrchané klubko myšlenek -> Plynulé rozpletení do klidné harmonické vlny
    const untangle = easeOut(p);
    const pts = 52;
    const waveSpan = Math.min(96, spanX * 0.82);

    // Doprovodné harmonické vlny klidu při rozplétání
    if (untangle > 0.25) {
      const compA = subP(untangle, 0.25, 1.0);
      ['#34d399', '#fde047'].forEach((col, idx) => {
        c.save();
        c.strokeStyle = col;
        c.globalAlpha = 0.55 * compA;
        c.lineWidth = 1.7;
        c.beginPath();
        for (let i = 0; i <= 36; i++) {
          const u = i / 36;
          const x = lerp(cx - waveSpan, cx + waveSpan, u);
          const y = cy + 2 + Math.sin(u * Math.PI * 3 - wt * 2.0 + (idx + 1) * 1.1) * (11 * compA);
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
        c.restore();
      });
    }

    // Hlavní spojitá křivka: p = 0 Lissajousův uzel -> p = 1 klidná sinusoida
    const lineGrad = c.createLinearGradient(cx - waveSpan, cy, cx + waveSpan, cy);
    lineGrad.addColorStop(0, '#818cf8');
    lineGrad.addColorStop(0.5, untangle > 0.4 ? '#6ee7b7' : '#a78bfa');
    lineGrad.addColorStop(1, untangle > 0.6 ? '#fde047' : '#818cf8');

    c.strokeStyle = lineGrad;
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i <= pts; i++) {
      const u = i / pts;
      const knotX = cx + Math.cos(u * 21.5 + wt * 0.6) * 23 + Math.sin(u * 35) * 9;
      const knotY = cy + 2 + Math.sin(u * 25.5 + wt * 0.6) * 16 + Math.cos(u * 15) * 6;
      const waveX = lerp(cx - waveSpan, cx + waveSpan, u);
      const waveY = cy + 2 + Math.sin(u * Math.PI * 3 - wt * 2.0) * 12;
      const x = lerp(knotX, waveX, untangle);
      const y = lerp(knotY, waveY, untangle);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();

    if (untangle > 0.6) {
      drawStar(c, cx, cy - 18, 4.8 * subP(untangle, 0.6, 1.0), '#fde047');
    }
}

/** @type {SceneRenderer} */
export function renderBreathLotus(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Opatruj.se: Zavřené poupě na klidné hladině -> Rozkvetlý 7lístkový lotos s dechovými kruhy
    const baseL = by - 8;
    const bloom = easeOut(p);
    const breath = 1 + Math.sin(wt * 1.6) * 0.06;

    // Kruhy na vodní hladině
    for (let r = 1; r <= 3; r++) {
      const ripR = (18 + r * 14 * (0.4 + bloom * 0.6)) * breath;
      c.strokeStyle = `rgba(45, 212, 191, ${(0.18 + bloom * 0.3) / r})`;
      c.lineWidth = 1.3;
      c.beginPath();
      c.ellipse(cx, baseL + 2, ripR, ripR * 0.22, 0, 0, Math.PI * 2);
      c.stroke();
    }

    if (bloom > 0.15) {
      drawGlow(c, cx, baseL - 14, 28 * bloom, '#fde68a', 0.38 * bloom);
    }

    // 7 okvětních lístků otevírajících se z poupěte
    const angles = [-1.15, -0.78, -0.38, 0, 0.38, 0.78, 1.15];
    angles.forEach((ang, idx) => {
      c.save();
      c.translate(cx, baseL);
      const spread = lerp(0.08, 1.0, bloom) * breath;
      c.rotate(ang * spread);
      c.fillStyle =
        idx === 3 ? '#fde68a' : Math.abs(idx - 3) === 1 ? '#5eead4' : Math.abs(idx - 3) === 2 ? '#2dd4bf' : '#0d9488';
      c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(-7.5, -14, 0, -26 - (idx === 3 ? 3 : 0));
      c.quadraticCurveTo(7.5, -14, 0, 0);
      c.fill();
      c.stroke();
      c.restore();
    });

    if (bloom > 0.5) {
      drawStar(c, cx, baseL - 32, 4.5 * subP(bloom, 0.5, 1.0), '#fde047');
    }
}

