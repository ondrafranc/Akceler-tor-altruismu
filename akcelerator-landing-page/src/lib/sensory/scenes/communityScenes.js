/**
 * Procedural Canvas 2D scene renderers for community, solidarity, and civic care.
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

export function renderPrismSupport(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🌈 S barvou ven: Broušený skleněný hranol rozkládající soustředěný bílý paprsek do 6barevného spektra
  const rainbow = ['#fb7185', '#fb923c', '#facc15', '#34d399', '#38bdf8', '#c084fc'];
  const px0 = cx - 8;
  const apexY = cy - 25;
  const baseY = by - 3;
  const halfB = 26;

  // 1. Příchozí soustředěný bílo-zlatý paprsek zleva na levou stěnu hranolu
  const entryX = px0 - halfB * 0.52;
  const entryY = lerp(apexY, baseY, 0.52);
  const inStartX = cx - spanX - 24;
  const inStartY = entryY + 9;

  const beamGrad = c.createLinearGradient(inStartX, inStartY, entryX, entryY);
  beamGrad.addColorStop(0, 'rgba(254, 249, 195, 0.05)');
  beamGrad.addColorStop(0.35, `rgba(254, 249, 195, ${0.72 + prep * 0.18})`);
  beamGrad.addColorStop(1, '#ffffff');
  c.save();
  c.strokeStyle = beamGrad;
  c.shadowColor = '#fde68a';
  c.shadowBlur = 10;
  c.lineWidth = 3.1 + prep * 0.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(inStartX, inStartY);
  c.lineTo(entryX, entryY);
  c.stroke();
  c.restore();

  drawGlow(c, entryX, entryY, 11 + prep * 5 + p * 6, '#fef08a', 0.34 + prep * 0.14 + p * 0.2);

  // 2. Disperzní duhový vějíř vycházející z pravé stěny hranolu (p: 0 -> 1)
  if (p > 0.01) {
    const fanGlow = easeOut(subP(p, 0.15, 1.0));
    drawGlow(c, px0 + 46, cy - 2, 46 * fanGlow, '#38bdf8', 0.16 * fanGlow);
    rainbow.forEach((col, i) => {
      const beamP = easeOut(subP(p, 0.08 + i * 0.045, 0.86 + i * 0.025));
      if (beamP <= 0.005) return;
      const exitFrac = 0.36 + i * 0.065;
      const exitX = px0 + halfB * exitFrac;
      const exitY = lerp(apexY, baseY, exitFrac);
      const targetX = cx + spanX + 20;
      const spreadY = cy - 23 + i * 8.8 + Math.sin(wt * 2.2 + i * 0.7) * 1.8;
      const curX = lerp(exitX, targetX, beamP);
      const curY = lerp(exitY, spreadY, beamP);

      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = col;
      c.shadowColor = col;
      c.shadowBlur = 9;
      c.lineWidth = 2.4 + beamP * 1.1;
      c.globalAlpha = 0.25 + beamP * 0.72;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(exitX, exitY);
      c.lineTo(curX, curY);
      c.stroke();
      c.restore();

      if (beamP > 0.78) {
        const spA = subP(beamP, 0.78, 1.0);
        drawStar(c, lerp(exitX, curX, 0.72 + (i % 2) * 0.14), lerp(exitY, curY, 0.72 + (i % 2) * 0.14), 2.8 * spA, col);
      }
    });
  }

  // 3. Tělo skleněného hranolu s vnitřním lomem světla a broušenou fazetou
  const glassGrad = c.createLinearGradient(px0 - halfB, apexY, px0 + halfB, baseY);
  glassGrad.addColorStop(0, `rgba(224, 242, 254, ${0.24 + p * 0.18})`);
  glassGrad.addColorStop(0.5, `rgba(186, 230, 253, ${0.14 + p * 0.14})`);
  glassGrad.addColorStop(1, `rgba(56, 189, 248, ${0.22 + p * 0.18})`);
  c.fillStyle = glassGrad;
  c.beginPath();
  c.moveTo(px0, apexY);
  c.lineTo(px0 - halfB, baseY);
  c.lineTo(px0 + halfB, baseY);
  c.closePath();
  c.fill();

  // Vnitřní lom paprsku uvnitř krystalu (p = 0 jemný náznak, prep probouzí krystal, p -> 1 plná interní disperze)
  const intP = Math.max(prep * 0.45, easeOut(subP(p, 0, 0.35)));
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const f = 0.4 + k * 0.13;
    const rx = px0 + halfB * f;
    const ry = lerp(apexY, baseY, f);
    const endIntX = lerp(lerp(entryX, rx, 0.55), rx, intP);
    const endIntY = lerp(lerp(entryY, ry, 0.55), ry, intP);
    c.strokeStyle = k === 0 ? '#fde68a' : k === 1 ? '#ffffff' : '#7dd3fc';
    c.globalAlpha = 0.16 + intP * 0.65;
    c.lineWidth = 1.6 + intP * 0.8;
    c.beginPath();
    c.moveTo(entryX, entryY);
    c.lineTo(endIntX, endIntY);
    c.stroke();
  }
  c.restore();

  // Vnitřní broušená hrana a křišťálový obrys
  c.strokeStyle = `rgba(255, 255, 255, ${0.28 + p * 0.25})`;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px0, apexY + 7);
  c.lineTo(px0 - halfB + 7, baseY - 4);
  c.lineTo(px0 + halfB - 7, baseY - 4);
  c.closePath();
  c.stroke();

  c.strokeStyle = p > 0.2 ? '#bae6fd' : 'rgba(186, 230, 253, 0.72)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(px0, apexY);
  c.lineTo(px0 - halfB, baseY);
  c.lineTo(px0 + halfB, baseY);
  c.closePath();
  c.stroke();

  if (p > 0.5) {
    drawStar(c, px0, apexY - 2, 4.2 * subP(p, 0.5, 1.0), '#ffffff');
  }
}

export function renderSatelliteMap(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🗺️ Missing Maps / Lékaři bez hranic: Topografický terén s nezmapovanými obrysy -> Satelitní radar mapující budovy a cesty
  const leftX = cx - spanX + 8;
  const rightX = cx + spanX - 8;
  const topY = cy - 24;
  const botY = by - 2;

  // Topografické vrstevnice
  c.strokeStyle = 'rgba(45, 212, 191, 0.14)';
  c.lineWidth = 1;
  for (let r = 0; r < 3; r++) {
    c.beginPath();
    c.ellipse(cx - 18 + r * 16, cy + 2, 76 - r * 18, 22 - r * 4, 0.12, 0, Math.PI * 2);
    c.stroke();
  }

  const buildings = [
    { x: cx - 78, y: cy - 12, bw: 20, bh: 14 },
    { x: cx - 44, y: cy + 6, bw: 22, bh: 15 },
    { x: cx - 10, y: cy - 16, bw: 26, bh: 17, clinic: true },
    { x: cx + 28, y: cy + 4, bw: 20, bh: 14 },
    { x: cx + 60, y: cy - 10, bw: 22, bh: 16 }
  ];

  const sweepOsc = p >= 0.99 && !red ? Math.sin(wt * 1.4) * 10 : 0;
  const scanX = clamp01(p) > 0 ? lerp(leftX + 6, rightX, easeOut(p)) + sweepOsc : leftX + 6;

  // Cesty propojující zmapované budovy
  for (let i = 0; i < buildings.length - 1; i++) {
    const b1 = buildings[i];
    const b2 = buildings[i + 1];
    const roadP = clamp01((scanX - (b1.x + b1.bw * 0.5)) / Math.max(12, b2.x - b1.x));
    c.save();
    c.strokeStyle = roadP > 0 ? `rgba(251, 191, 36, ${0.25 + roadP * 0.6})` : 'rgba(148, 163, 184, 0.18)';
    c.lineWidth = roadP > 0 ? 1.8 : 1;
    if (roadP <= 0) c.setLineDash([3, 3]);
    c.beginPath();
    c.moveTo(b1.x + b1.bw / 2, b1.y + b1.bh / 2);
    c.lineTo(b2.x + b2.bw / 2, b1.y + b1.bh / 2 + (b2.y - b1.y) * Math.max(0.2, roadP));
    c.stroke();
    c.restore();
  }

  // Půdorysy budov (p = 0 čárkované šedé -> po průchodu radaru ostré smaragdové vektory)
  buildings.forEach((b) => {
    const bP = clamp01((scanX - b.x) / 22);
    c.save();
    if (bP <= 0.02) {
      c.setLineDash([3, 3]);
      c.strokeStyle = 'rgba(148, 163, 184, 0.48)';
      c.fillStyle = 'rgba(15, 23, 42, 0.35)';
      c.lineWidth = 1.2;
    } else {
      c.strokeStyle = b.clinic ? '#fde047' : '#6ee7b7';
      c.fillStyle = b.clinic
        ? `rgba(16, 185, 129, ${0.25 + bP * 0.35})`
        : `rgba(16, 185, 129, ${0.18 + bP * 0.3})`;
      c.lineWidth = 1.8;
    }
    c.fillRect(b.x, b.y, b.bw, b.bh);
    c.strokeRect(b.x, b.y, b.bw, b.bh);
    c.restore();

    if (bP > 0.5) {
      const cxB = b.x + b.bw / 2;
      const cyB = b.y + b.bh / 2;
      if (b.clinic) {
        c.fillStyle = '#fde047';
        c.fillRect(cxB - 1.5, cyB - 5, 3, 10);
        c.fillRect(cxB - 5, cyB - 1.5, 10, 3);
        drawGlow(c, cxB, cyB, 16 * bP, '#fde047', 0.35 * bP);
      } else {
        c.fillStyle = '#6ee7b7';
        c.beginPath();
        c.arc(cxB, cyB, 2 * bP, 0, Math.PI * 2);
        c.fill();
      }
    }
  });

  // Radarový paprsek
  const trailW = 28;
  const scanGrad = c.createLinearGradient(scanX - trailW, 0, scanX, 0);
  scanGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
  scanGrad.addColorStop(1, `rgba(52, 211, 153, ${0.18 + p * 0.24})`);
  c.fillStyle = scanGrad;
  c.fillRect(Math.max(leftX, scanX - trailW), topY, trailW, botY - topY);

  c.save();
  c.strokeStyle = '#22d3ee';
  c.shadowColor = '#22d3ee';
  c.shadowBlur = 8;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(scanX, topY - 2);
  c.lineTo(scanX, botY + 2);
  c.stroke();
  c.restore();
}

export function renderDoveAppeal(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // ✍️ Amnesty apel: Chladné mříže vězení -> Zlatý tah podpisu rozestupující mříže a vzlétající holubice s ratolestí
  const openP = easeOut(subP(p, 0.1, 0.85));
  const doveRise = easeOut(p);
  const doveY = lerp(cy + 7, cy - 5, doveRise) + Math.sin(wt * 3.2) * 2.0;

  // Silueta holubice s rozepjatými perutěmi (jednotná čistá křivka bez rušivých vnitřních švů)
  c.save();
  c.translate(cx - 2, doveY);
  if (doveRise > 0.15) {
    drawGlow(c, 2, -2, 30 * doveRise, '#fde68a', 0.36 * doveRise);
  }
  const flap = Math.sin(wt * 5.2) * (1.8 + doveRise * 4.5);
  // Zadní peruť
  c.fillStyle = doveRise > 0.12 ? '#e2e8f0' : '#64748b';
  c.beginPath();
  c.moveTo(2, -2);
  c.bezierCurveTo(-4, -15 + flap * 0.7, 6, -21 + flap * 0.7, 11, -15 + flap * 0.7);
  c.quadraticCurveTo(9, -7, 5, -1);
  c.closePath();
  c.fill();

  // Tělo, vějířovitý ocásek, hlavička a hlavní peruť
  c.fillStyle = doveRise > 0.12 ? '#ffffff' : '#94a3b8';
  c.strokeStyle = doveRise > 0.12 ? '#fde047' : 'rgba(148, 163, 184, 0.6)';
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(15, -4); // Zobáček
  c.quadraticCurveTo(13, -9, 8, -7); // Hlavička
  c.quadraticCurveTo(4, -5, 1, -3); // Šíje
  c.bezierCurveTo(-12, -19 + flap, -22, -16 + flap, -17, -6 + flap * 0.5); // Přední peruť
  c.quadraticCurveTo(-11, -2, -5, 0);
  c.lineTo(-18, 4); // Horní hrana ocásku
  c.quadraticCurveTo(-16, 8, -12, 8); // Vějíř ocásku
  c.lineTo(-3, 4);
  c.quadraticCurveTo(6, 6, 12, 0); // Hruď
  c.quadraticCurveTo(14, -2, 15, -4);
  c.closePath();
  c.fill();
  c.stroke();

  // Očko holubice
  c.fillStyle = '#0f172a';
  c.beginPath();
  c.arc(10.5, -5, 1.1, 0, Math.PI * 2);
  c.fill();

  // Olivová ratolest v zobáčku (p -> 1)
  if (doveRise > 0.25) {
    const spP = subP(doveRise, 0.25, 0.85);
    c.strokeStyle = '#34d399';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(15, -3.5);
    c.quadraticCurveTo(21, -6, 26, -1);
    c.stroke();
    c.fillStyle = '#4ade80';
    c.beginPath();
    c.ellipse(20.5, -5.5, 2.8 * spP, 1.3 * spP, -0.45, 0, Math.PI * 2);
    c.ellipse(24.5, -2, 2.8 * spP, 1.3 * spP, 0.4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();

  // Železné mříže: střední pruty se rozestupují a rozplývají do zlatých jisker
  for (let b = -2; b <= 2; b++) {
    const isMid = Math.abs(b) <= 1;
    const spreadX = isMid ? b * openP * 15 : b * openP * 3;
    const bx = cx + b * 15 + spreadX;
    const gapHalf = isMid ? openP * 24 : 0;
    const alpha = isMid ? Math.max(0.05, 1 - openP * 0.95) : 0.68 - openP * 0.32;
    c.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(bx, cy - 23);
    c.lineTo(bx, cy - gapHalf);
    c.moveTo(bx, cy + gapHalf);
    c.lineTo(bx, by - 4);
    c.stroke();
  }

  // Zlatý kaligrafický tah podpisu a jiskry svobody
  if (p > 0.02) {
    const sigP = easeOut(subP(p, 0.02, 0.55));
    c.strokeStyle = '#fde047';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 36, by - 9);
    c.quadraticCurveTo(cx - 8, by - 18, lerp(cx - 36, cx + 36, sigP), by - 10);
    c.stroke();
    if (openP > 0.45) {
      drawStar(c, cx + 24, cy - 16, 4.2 * subP(openP, 0.45, 1.0), '#fde047');
    }
  }
}

export function renderSeniorLetter(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 👵 Dopis seniorovi: Zavřená šedá obálka v šeru -> Otevírající se klopa, vysouvající se vřelý dopis a srdce
  const envW = 58;
  const envH = 32;
  const envX = cx - envW / 2;
  const envY = by - envH - 4;
  const flapP = easeOut(subP(p, 0, 0.45));
  const letterP = easeOut(subP(p, 0.25, 0.88));

  if (letterP > 0.05) {
    drawGlow(c, cx, envY, 34 * letterP, '#fbbf24', 0.38 * letterP);
  }

  // Zadní kapsa obálky + otevírající se horní klopa
  c.fillStyle = flapP > 0.2 ? '#fed7aa' : '#475569';
  c.fillRect(envX, envY, envW, envH);

  if (flapP > 0.5) {
    c.fillStyle = '#fdba74';
    c.strokeStyle = '#fb923c';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(envX, envY);
    c.lineTo(cx, envY - 16 * subP(flapP, 0.5, 1.0));
    c.lineTo(envX + envW, envY);
    c.closePath();
    c.fill();
    c.stroke();
  }

  // Vysouvající se psaný dopis
  if (letterP > 0.02) {
    const lTop = envY + 4 - letterP * 18;
    c.fillStyle = '#fffbeb';
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 1.3;
    c.fillRect(envX + 7, lTop, envW - 14, 24);
    c.strokeRect(envX + 7, lTop, envW - 14, 24);
    c.strokeStyle = '#d97706';
    c.lineWidth = 1.2;
    for (let r = 0; r < 2; r++) {
      c.beginPath();
      c.moveTo(envX + 12, lTop + 6 + r * 5);
      c.lineTo(envX + envW - 12, lTop + 6 + r * 5);
      c.stroke();
    }
  }

  // Přední sklady obálky
  c.fillStyle = p > 0.15 ? '#fff7ed' : '#cbd5e1';
  c.strokeStyle = p > 0.15 ? '#fb923c' : '#64748b';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(envX, envY);
  c.lineTo(cx, envY + envH * 0.58);
  c.lineTo(envX + envW, envY);
  c.lineTo(envX + envW, envY + envH);
  c.lineTo(envX, envY + envH);
  c.closePath();
  c.fill();
  c.stroke();

  // Zavřená klopa (p < 0.5)
  if (flapP <= 0.5) {
    c.fillStyle = '#e2e8f0';
    c.strokeStyle = '#64748b';
    c.beginPath();
    c.moveTo(envX, envY);
    c.lineTo(cx, lerp(envY + 17, envY, flapP * 2));
    c.lineTo(envX + envW, envY);
    c.closePath();
    c.fill();
    c.stroke();
  }

  if (p > 0.45) {
    const hP = subP(p, 0.45, 1.0);
    drawHeart(c, cx, envY - 22 - hP * 4, 6 * hP, '#fb7185');
    drawHeart(c, cx + 22, envY - 14 - hP * 3, 4.2 * hP, '#fde047');
  }
}

export function renderOwlShield(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🧓 Moudrá Sovička: Telefon obklopený podvodnými vykřičníky -> Ochranná křídla sovy ve tvaru štítu a zelená fajfka
  const shP = easeOut(p);
  const phW = 24;
  const phH = 38;
  const phY = cy - phH / 2 + 2;

  // Varovné phishingové trojúhelníky mizící s příchodem štítu
  if (shP < 0.75) {
    const warnA = (1 - shP * 1.3) * 0.85;
    [-40, 40].forEach((wx, idx) => {
      const wy = cy + (idx === 0 ? -6 : 6);
      c.strokeStyle = `rgba(251, 113, 133, ${Math.max(0, warnA)})`;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(cx + wx, wy - 7);
      c.lineTo(cx + wx - 7, wy + 6);
      c.lineTo(cx + wx + 7, wy + 6);
      c.closePath();
      c.stroke();
    });
  }

  // Křídla moudré sovy rozvíjející se do ochranného štítu
  if (shP > 0.04) {
    drawGlow(c, cx, cy + 2, 32 * shP, '#2dd4bf', 0.32 * shP);
    const wingW = 14 + shP * 20;
    c.fillStyle = `rgba(45, 212, 191, ${0.18 + shP * 0.22})`;
    c.strokeStyle = '#5eead4';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, phY - 6 * shP);
    c.quadraticCurveTo(cx + wingW, phY + 2, cx + wingW * 0.85, phY + phH * 0.65);
    c.quadraticCurveTo(cx + wingW * 0.4, phY + phH + 7 * shP, cx, phY + phH + 9 * shP);
    c.quadraticCurveTo(cx - wingW * 0.4, phY + phH + 7 * shP, cx - wingW * 0.85, phY + phH * 0.65);
    c.quadraticCurveTo(cx - wingW, phY + 2, cx, phY - 6 * shP);
    c.fill();
    c.stroke();
  }

  // Telefon uprostřed
  c.fillStyle = '#0f172a';
  c.strokeStyle = shP > 0.3 ? '#fde047' : '#94a3b8';
  c.lineWidth = 1.8;
  drawRoundRect(c, cx - phW / 2, phY, phW, phH, 4);
  c.fill();
  c.stroke();

  // Oči sovičky / zelená fajfka bezpečí na displeji
  if (shP < 0.4) {
    c.strokeStyle = '#fb7185';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx, phY + 11);
    c.lineTo(cx, phY + 21);
    c.moveTo(cx, phY + 25);
    c.lineTo(cx, phY + 27);
    c.stroke();
  } else {
    const ckP = subP(shP, 0.4, 0.95);
    c.strokeStyle = '#34d399';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(cx - 6, cy + 2);
    c.lineTo(cx - 1.5, cy + 6.5);
    c.lineTo(lerp(cx - 1.5, cx + 7, ckP), lerp(cy + 6.5, cy - 3.5, ckP));
    c.stroke();
  }
}

export function renderMemoryWave(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🎙️ Paměť národa: Tiché archivní cívky s prověšeným páskem -> Otáčející se zlaté cívky a živá hlasová vlna
  const playP = easeOut(p);
  const rDist = 42;
  const rY = cy + 3;
  const rot = playP > 0.02 ? wt * 2.8 + playP * 4 : 0;

  // Magnetofonový pásek: p = 0 prověšený -> p = 1 napnutý
  const sag = (1 - playP) * 7;
  c.strokeStyle = playP > 0.1 ? '#fbbf24' : 'rgba(148, 163, 184, 0.45)';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(cx - rDist, rY - 13);
  c.quadraticCurveTo(cx, rY - 13 + sag, cx + rDist, rY - 13);
  c.stroke();

  // Dvě archivní cívky
  [-rDist, rDist].forEach((dx) => {
    c.fillStyle = 'rgba(15, 23, 42, 0.65)';
    c.strokeStyle = playP > 0.1 ? '#fde047' : '#94a3b8';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx + dx, rY, 13, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    for (let s = 0; s < 3; s++) {
      const a = rot + (s * Math.PI * 2) / 3;
      c.beginPath();
      c.moveTo(cx + dx + Math.cos(a) * 3, rY + Math.sin(a) * 3);
      c.lineTo(cx + dx + Math.cos(a) * 11, rY + Math.sin(a) * 11);
      c.stroke();
    }
    c.fillStyle = playP > 0.1 ? '#fbbf24' : '#64748b';
    c.beginPath();
    c.arc(cx + dx, rY, 3, 0, Math.PI * 2);
    c.fill();
  });

  // Hlasová stopa vyprávění uprostřed
  if (playP > 0.05) {
    for (let b = -4; b <= 4; b++) {
      const wave = Math.abs(Math.sin(wt * 3.8 + b * 0.75));
      const bh = (4 + wave * 18) * playP;
      c.fillStyle = Math.abs(b) % 2 === 0 ? '#fde047' : '#34d399';
      drawRoundRect(c, cx + b * 5.2 - 1.6, rY + 2 - bh / 2, 3.2, bh, 1.5);
      c.fill();
    }
    if (playP > 0.6) {
      drawStar(c, cx, cy - 19, 4.5 * subP(playP, 0.6, 1.0), '#fde047');
    }
  }
}

export function renderBookBooth(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 📚 Knihobudka: Zavřená pouliční skříňka s 1 osamělou knihou -> Otevřená dvířka, plné police barevných knih a hvězdy příběhů
  const cabW = 46;
  const cabH = 36;
  const cabX = cx - cabW / 2;
  const cabY = by - cabH - 6;
  const openP = easeOut(subP(p, 0, 0.5));
  const fillP = easeOut(subP(p, 0.18, 0.92));

  // Sloupek a dřevěná skříňka se stříškou
  c.fillStyle = '#78350f';
  c.fillRect(cx - 3, cabY + cabH, 6, 7);
  c.fillStyle = '#1e1b18';
  c.strokeStyle = '#d97706';
  c.lineWidth = 2;
  c.fillRect(cabX, cabY, cabW, cabH);
  c.strokeRect(cabX, cabY, cabW, cabH);

  // Police uprostřed
  c.strokeStyle = '#b45309';
  c.beginPath();
  c.moveTo(cabX + 2, cabY + cabH * 0.52);
  c.lineTo(cabX + cabW - 2, cabY + cabH * 0.52);
  c.stroke();

  // Stříška knihobudky
  c.fillStyle = '#f59e0b';
  c.beginPath();
  c.moveTo(cx - cabW * 0.65, cabY + 1);
  c.lineTo(cx, cabY - 12);
  c.lineTo(cx + cabW * 0.65, cabY + 1);
  c.closePath();
  c.fill();

  // 1 výchozí kniha (p = 0) + 9 přibývajících barevných hřbetů (p -> 1)
  const cols = ['#94a3b8', '#10b981', '#fb7185', '#38bdf8', '#fbbf24', '#a78bfa', '#34d399', '#f97316', '#fde047', '#ec4899'];
  for (let i = 0; i < 10; i++) {
    const bP = i === 0 ? 1 : easeOut(subP(fillP, (i - 1) * 0.08, (i - 1) * 0.08 + 0.35));
    if (bP <= 0.01) continue;
    const shelf = i < 5 ? 0 : 1;
    const idx = i % 5;
    const bx = cabX + 5 + idx * 7.4;
    const shelfBase = shelf === 0 ? cabY + cabH * 0.52 - 1 : cabY + cabH - 2;
    const bh = (11 + (i % 3) * 1.8) * bP;
    c.fillStyle = i === 0 && p < 0.2 ? '#94a3b8' : cols[i];
    c.fillRect(bx, shelfBase - bh, 5.8, bh);
  }

  // Skleněná křídla dvířek otevírající se do stran
  const doorW = (cabW / 2) * lerp(1, 0.38, openP);
  c.fillStyle = 'rgba(186, 230, 253, 0.16)';
  c.strokeStyle = 'rgba(253, 230, 138, 0.65)';
  c.lineWidth = 1.2;
  c.fillRect(cabX - openP * doorW, cabY, doorW, cabH);
  c.strokeRect(cabX - openP * doorW, cabY, doorW, cabH);
  c.fillRect(cabX + cabW - doorW + openP * doorW, cabY, doorW, cabH);
  c.strokeRect(cabX + cabW - doorW + openP * doorW, cabY, doorW, cabH);

  if (p > 0.55) {
    const sP = subP(p, 0.55, 1.0);
    drawStar(c, cx, cabY - 17, 5 * sP, '#fde047');
  }
}

export function renderParcelShare(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 📦 Nevyhazujto: Dva zhasnuté sousední domky a krabice v koutě -> Rozsvícená okna a balíček letící obloukem k sousedovi
  const hY = by - 4;
  const leftH = cx - 54;
  const rightH = cx + 54;
  const arcP = easeOut(subP(p, 0.08, 0.88));

  [
    { x: leftH, lit: subP(p, 0, 0.25) },
    { x: rightH, lit: subP(p, 0.65, 1.0) }
  ].forEach((house) => {
    c.fillStyle = '#1e293b';
    c.strokeStyle = house.lit > 0.2 ? '#6ee7b7' : '#64748b';
    c.lineWidth = 1.6;
    c.fillRect(house.x - 14, hY - 20, 28, 20);
    c.strokeRect(house.x - 14, hY - 20, 28, 20);
    c.fillStyle = house.lit > 0.2 ? '#059669' : '#334155';
    c.beginPath();
    c.moveTo(house.x - 18, hY - 20);
    c.lineTo(house.x, hY - 33);
    c.lineTo(house.x + 18, hY - 20);
    c.closePath();
    c.fill();
    c.fillStyle = house.lit > 0.1 ? `rgba(253, 224, 71, ${0.25 + house.lit * 0.75})` : '#0f172a';
    c.fillRect(house.x - 5, hY - 14, 10, 9);
  });

  // Tečkovaná dráha sdílení
  if (arcP > 0.02) {
    c.save();
    c.setLineDash([3, 3]);
    c.strokeStyle = 'rgba(52, 211, 153, 0.65)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(leftH + 18, hY - 10);
    c.quadraticCurveTo(cx, hY - 46, lerp(leftH + 18, rightH - 18, arcP), hY - 10);
    c.stroke();
    c.restore();
  }

  // Balíček se stuhou letící od levého k pravému domku
  const u = arcP;
  const pxB = (1 - u) * (1 - u) * (leftH + 20) + 2 * (1 - u) * u * cx + u * u * (rightH - 20);
  const pyB = (1 - u) * (1 - u) * (hY - 8) + 2 * (1 - u) * u * (hY - 48) + u * u * (hY - 8);
  c.save();
  c.translate(pxB, pyB);
  c.rotate(Math.sin(u * Math.PI) * 0.18);
  c.fillStyle = '#fde68a';
  c.strokeStyle = '#d97706';
  c.lineWidth = 1.4;
  c.fillRect(-7, -6, 14, 12);
  c.strokeRect(-7, -6, 14, 12);
  c.fillStyle = '#10b981';
  c.fillRect(-1.8, -6, 3.6, 12);
  c.restore();

  if (p > 0.7) {
    drawHeart(c, cx, hY - 34, 5.5 * subP(p, 0.7, 1.0), '#fde047');
  }
}

export function renderPhoneRecycle(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 📱 Remobil: Prasklý odložený mobil -> Recyklační proud mědi a zlata měnící se v charitativní minci a lístek
  const phX = cx - 28;
  const phY = cy + 2;
  const coinX = cx + 28;
  const recP = easeOut(p);

  // Starý telefon vlevo
  c.fillStyle = '#1e293b';
  c.strokeStyle = recP > 0.2 ? '#34d399' : '#64748b';
  c.lineWidth = 1.8;
  drawRoundRect(c, phX - 12, phY - 19, 24, 38, 4);
  c.fill();
  c.stroke();

  // Prasklina na displeji (p = 0) mizící s recyklací
  if (recP < 0.7) {
    c.strokeStyle = `rgba(148, 163, 184, ${(1 - recP * 1.3) * 0.75})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(phX - 8, phY - 10);
    c.lineTo(phX + 1, phY - 2);
    c.lineTo(phX - 3, phY + 4);
    c.lineTo(phX + 7, phY + 11);
    c.stroke();
  }

  // Recyklační oblouk částic mědi a zlata do mince a zeleného lístku vpravo
  if (recP > 0.04) {
    c.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(phX + 14, phY - 8);
    c.quadraticCurveTo(cx, phY - 26, lerp(phX + 14, coinX - 10, recP), phY - 6);
    c.stroke();

    for (let k = 0; k < 5; k++) {
      const u = ((recP * 1.4 + k * 0.2 + wt * 0.35) % 1) * Math.min(1, recP * 1.2);
      const mx = (1 - u) * (1 - u) * (phX + 12) + 2 * (1 - u) * u * cx + u * u * coinX;
      const my = (1 - u) * (1 - u) * phY + 2 * (1 - u) * u * (phY - 28) + u * u * phY;
      c.fillStyle = k % 2 === 0 ? '#fbbf24' : '#fb923c';
      c.beginPath();
      c.arc(mx, my, 2.2, 0, Math.PI * 2);
      c.fill();
    }

    const cP = easeOut(subP(recP, 0.35, 1.0));
    if (cP > 0.05) {
      drawGlow(c, coinX, phY + 2, 22 * cP, '#fde047', 0.35 * cP);
      // Zelený lístek vyrůstající za mincí
      c.fillStyle = '#34d399';
      c.beginPath();
      c.ellipse(coinX + 6 * cP, phY - 12 * cP, 7 * cP, 3.6 * cP, -0.6, 0, Math.PI * 2);
      c.fill();
      // Zlatá charitativní mince
      c.fillStyle = '#fde047';
      c.strokeStyle = '#d97706';
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(coinX, phY + 3, 10 * cP, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      drawHeart(c, coinX, phY + 2, 4.2 * cP, '#d97706');
    }
  }
}

export function renderCampfireGroup(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // ⛺ Hnutí Brontosaurus: Nezapálené dříví v kamenném kruhu pod tmavými smrky -> Plápolající táborák ozařující les a jiskry
  const fireY = by - 5;
  const fireP = easeOut(p);

  // Siluety smrků po stranách (osvětlené táborákem při p -> 1)
  [-58, -38, 38, 58].forEach((tx, idx) => {
    const th = idx % 2 === 0 ? 32 : 26;
    c.fillStyle = fireP > 0.2 ? '#065f46' : '#0b2219';
    c.beginPath();
    c.moveTo(cx + tx, fireY - th);
    c.lineTo(cx + tx - 11, fireY);
    c.lineTo(cx + tx + 11, fireY);
    c.closePath();
    c.fill();
  });

  if (fireP > 0.03) {
    drawGlow(c, cx, fireY - 14, 42 * fireP, '#fb923c', 0.45 * fireP);
    const flick = Math.sin(wt * 6.5) * 3;
    const fh = 26 * fireP;
      // Vnější oranžový, střední jantarový a vnitřní krémový plamen
      /** @type {Array<[string, number, number]>} */ ([
      ['#ea580c', 14, fh],
      ['#fbbf24', 10, fh * 0.78],
      ['#fef08a', 6, fh * 0.5]
    ]).forEach(([col, rw, rh], idx) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(cx - rw, fireY - 4);
      c.quadraticCurveTo(cx - rw * 0.5, fireY - rh * 0.7, cx + flick * (0.4 + idx * 0.2), fireY - 4 - rh);
      c.quadraticCurveTo(cx + rw * 0.5, fireY - rh * 0.7, cx + rw, fireY - 4);
      c.closePath();
      c.fill();
    });

    // Stoupající jiskry
    for (let e = 0; e < 5; e++) {
      const eu = ((wt * 0.8 + e * 0.22) % 1) * fireP;
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(cx + Math.sin(e * 2.3 + wt * 2) * 12, fireY - 12 - eu * 26, 1.4, 0, Math.PI * 2);
      c.fill();
    }
  }

  // Zkřížená polena a kamenný kruh
  c.strokeStyle = '#78350f';
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx - 16, fireY - 1);
  c.lineTo(cx + 16, fireY - 7);
  c.moveTo(cx + 16, fireY - 1);
  c.lineTo(cx - 16, fireY - 7);
  c.stroke();

  for (let k = -3; k <= 3; k++) {
    c.fillStyle = '#64748b';
    c.beginPath();
    c.ellipse(cx + k * 6.2, fireY + 1, 3.4, 2.2, 0, 0, Math.PI * 2);
    c.fill();
  }
}

export function renderGlobeBridge(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🎒 INEX-SDA: Planeta s oddělenými břehy -> Visutý světelný most propojující kontinenty a barevné lucerny
  const brP = easeOut(p);
  const glR = 20;
  const glY = cy + 3;

  // Planeta Země s poledníky
  c.strokeStyle = brP > 0.2 ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(cx, glY, glR, 0, Math.PI * 2);
  c.ellipse(cx, glY, 9, glR, 0, 0, Math.PI * 2);
  c.moveTo(cx - glR, glY);
  c.lineTo(cx + glR, glY);
  c.stroke();

  // Dva břehy po stranách
  const leftS = cx - 54;
  const rightS = cx + 54;
  c.fillStyle = '#065f46';
  c.fillRect(leftS - 8, by - 9, 16, 6);
  c.fillRect(rightS - 8, by - 9, 16, 6);

  // Visutý most rozepínající se přes planetu
  if (brP > 0.03) {
    const endBridgeX = lerp(leftS, rightS, brP);
    c.strokeStyle = '#fde047';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(leftS, by - 9);
    c.quadraticCurveTo(lerp(leftS, cx, brP), cy - 26, endBridgeX, by - 9);
    c.stroke();

    const lanternCols = ['#fb7185', '#fbbf24', '#34d399', '#38bdf8', '#c084fc'];
    lanternCols.forEach((col, i) => {
      const u = (i + 1) / 6;
      if (u > brP) return;
      const lx = lerp(leftS, rightS, u);
      const ly = (1 - u) * (1 - u) * (by - 9) + 2 * (1 - u) * u * (cy - 26) + u * u * (by - 9);
      drawGlow(c, lx, ly + 3, 9, col, 0.45);
      c.fillStyle = col;
      c.beginPath();
      c.arc(lx, ly + 3, 2.8, 0, Math.PI * 2);
      c.fill();
    });
  }
}

export function renderWheelsMotion(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🚲 Kola pro Afriku: Zaprášené nehybné kolo ve stínu -> Roztočená kola jedoucí za vycházejícím sluncem ke škole
  const rideP = easeOut(p);
  const roadY = by - 3;
  const sunX = cx + 52;
  const sunY = lerp(roadY + 8, cy - 12, rideP);

  // Vycházející slunce na obzoru a malá škola vpravo
  if (rideP > 0.05) {
    drawGlow(c, sunX, sunY, 26 * rideP, '#fde047', 0.45 * rideP);
    c.fillStyle = '#fde047';
    c.beginPath();
    c.arc(sunX, sunY, 8 * rideP, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = rideP > 0.3 ? '#b45309' : '#334155';
  c.fillRect(cx + 44, roadY - 12, 16, 12);
  c.beginPath();
  c.moveTo(cx + 42, roadY - 12);
  c.lineTo(cx + 52, roadY - 19);
  c.lineTo(cx + 62, roadY - 12);
  c.fill();

  // Cesta
  c.strokeStyle = 'rgba(110, 231, 183, 0.35)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(cx - spanX + 12, roadY);
  c.lineTo(cx + spanX - 12, roadY);
  c.stroke();

  // Jízdní kolo posouvající se vpřed
  const bikeX = cx - 26 + rideP * 18;
  const wy = roadY - 11;
  const wx1 = bikeX - 18;
  const wx2 = bikeX + 18;
  const spin = rideP > 0.02 ? wt * 5 + rideP * 7 : 0;

  [wx1, wx2].forEach((wx) => {
    c.strokeStyle = rideP > 0.15 ? '#6ee7b7' : '#64748b';
    c.lineWidth = 2.1;
    c.beginPath();
    c.arc(wx, wy, 10.5, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1.1;
    for (let s = 0; s < 3; s++) {
      const a = spin + (s * Math.PI) / 3;
      c.beginPath();
      c.moveTo(wx - Math.cos(a) * 9.5, wy - Math.sin(a) * 9.5);
      c.lineTo(wx + Math.cos(a) * 9.5, wy + Math.sin(a) * 9.5);
      c.stroke();
    }
  });

  // Rám, sedlo a řídítka
  c.strokeStyle = rideP > 0.15 ? '#fde047' : '#94a3b8';
  c.lineWidth = 2.2;
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(wx1, wy);
  c.lineTo(bikeX - 6, wy - 13);
  c.lineTo(bikeX + 11, wy - 13);
  c.lineTo(bikeX - 2, wy);
  c.closePath();
  c.moveTo(bikeX - 2, wy);
  c.lineTo(bikeX - 8, wy - 17);
  c.moveTo(wx2, wy);
  c.lineTo(bikeX + 10, wy - 18);
  c.lineTo(bikeX + 15, wy - 18);
  c.stroke();
}

export function renderSafeCrosswalk(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // ♿ Chodci sobě: Vozíček/kočárek zastavený před ostrým obrubníkem -> Sklopená smaragdová rampa a plynulý přejezd přes zebru
  const streetY = by - 5;
  const curbX = cx - 20;
  const stepH = 14;
  const rampP = easeOut(subP(p, 0, 0.48));
  const glideP = easeOut(subP(p, 0.25, 0.98));

  // Vyvýšený chodník vlevo s ostrým obrubníkem
  c.fillStyle = '#334155';
  c.strokeStyle = '#94a3b8';
  c.lineWidth = 1.5;
  c.fillRect(cx - 76, streetY - stepH, curbX - (cx - 76), stepH);
  c.strokeRect(cx - 76, streetY - stepH, curbX - (cx - 76), stepH);

  // Varovný proužek bariéry na hraně obrubníku (mizí se sklopením rampy)
  if (rampP < 0.85) {
    c.fillStyle = `rgba(251, 146, 60, ${0.85 * (1 - rampP)})`;
    c.fillRect(curbX - 3.5, streetY - stepH, 3.5, stepH);
  }

  // Pruhy přechodu pro chodce vpravo
  for (let s = 0; s < 4; s++) {
    const lit = glideP > s * 0.2;
    c.fillStyle = lit ? '#f8fafc' : 'rgba(203, 213, 225, 0.38)';
    c.fillRect(curbX + 12 + s * 19, streetY - 4, 12, 5);
  }

  // Bezbariérová smaragdová rampa sklápějící se přes schod
  const rampW = 26;
  if (rampP > 0.02) {
    c.fillStyle = '#10b981';
    c.strokeStyle = '#fde047';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(curbX, streetY - stepH);
    c.lineTo(curbX + rampW * rampP, streetY);
    c.lineTo(curbX, streetY);
    c.closePath();
    c.fill();
    c.stroke();
  }

  // Zřetelná silueta vozíčku zastaveného před bariérou (p = 0) -> plynule sjíždějícího přes přechod (p = 1)
  const wheelX = lerp(curbX - 18, curbX + 60, glideP);
  let groundAtWheel = streetY - stepH;
  let tilt = 0;
  if (wheelX > curbX && wheelX < curbX + rampW) {
    const uR = (wheelX - curbX) / rampW;
    groundAtWheel = lerp(streetY - stepH, streetY, uR);
    tilt = Math.atan2(stepH, rampW) * 0.7;
  } else if (wheelX >= curbX + rampW) {
    groundAtWheel = streetY;
  }

  c.save();
  c.translate(wheelX, groundAtWheel);
  c.rotate(tilt);

  const frameCol = rampP > 0.3 ? '#6ee7b7' : '#cbd5e1';
  const wheelCol = rampP > 0.3 ? '#fde047' : '#fb7185';

  // Rám sedadla, opěrky a postava
  c.strokeStyle = frameCol;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-4, -18);
  c.lineTo(-4, -9);
  c.lineTo(5, -9);
  c.lineTo(8, -4);
  c.stroke();

  // Hlava sedící postavy
  c.fillStyle = rampP > 0.3 ? '#fde047' : '#cbd5e1';
  c.beginPath();
  c.arc(0.5, -21.5, 2.8, 0, Math.PI * 2);
  c.fill();

  // Přední malé kolečko
  c.strokeStyle = wheelCol;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(8.5, -2.8, 2.6, 0, Math.PI * 2);
  c.stroke();

  // Zadní hlavní kolo s výpletem
  const spinA = glideP * 8;
  c.lineWidth = 2.1;
  c.beginPath();
  c.arc(-2, -6.5, 6.2, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 1;
  for (let sp = 0; sp < 3; sp++) {
    const a = spinA + (sp * Math.PI) / 3;
    c.beginPath();
    c.moveTo(-2 - Math.cos(a) * 5.2, -6.5 - Math.sin(a) * 5.2);
    c.lineTo(-2 + Math.cos(a) * 5.2, -6.5 + Math.sin(a) * 5.2);
    c.stroke();
  }
  c.restore();

  if (glideP > 0.72) {
    drawStar(c, curbX + 66, streetY - 22, 4.6 * subP(glideP, 0.72, 1.0), '#34d399');
  }
}

export function renderKineticSteps(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 👟 EPP Pomáhej pohybem: Klidná dráha a vybitá kapsle -> Kinetické kroky nabíjející baterii pomoci na 100 %
  const kinP = easeOut(p);
  const batX = cx + 42;
  const batY = cy - 15;
  const batW = 22;
  const batH = 34;

  // Běžecká dráha a kinetické oblouky kroků vlevo
  c.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 68, by - 6);
  c.lineTo(cx + 22, by - 6);
  c.stroke();

  for (let s = 0; s < 4; s++) {
    const sP = easeOut(subP(kinP, s * 0.14, s * 0.14 + 0.42));
    const sx = cx - 58 + s * 20;
    c.fillStyle = sP > 0.1 ? '#34d399' : 'rgba(148, 163, 184, 0.35)';
    c.beginPath();
    c.ellipse(sx, by - 9, 5, 2.4, -0.2, 0, Math.PI * 2);
    c.fill();
    if (sP > 0.05) {
      c.strokeStyle = `rgba(253, 224, 71, ${0.75 * sP})`;
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(sx + 8, by - 8, 10 * sP, Math.PI * 1.05, Math.PI * 1.95);
      c.stroke();
    }
  }

  // Energetická kapsle pomoci vpravo
  c.fillStyle = '#0f172a';
  c.strokeStyle = kinP > 0.2 ? '#6ee7b7' : '#64748b';
  c.lineWidth = 1.8;
  c.fillRect(batX + 6, batY - 4, 10, 4);
  drawRoundRect(c, batX, batY, batW, batH, 4);
  c.fill();
  c.stroke();

  const bars = Math.max(1, Math.round(kinP * 5));
  for (let b = 0; b < bars; b++) {
    if (kinP < 0.05 && b > 0) continue;
    c.fillStyle = kinP < 0.05 ? '#475569' : b >= 3 ? '#fde047' : '#34d399';
    c.fillRect(batX + 3, batY + batH - 6 - b * 5.8, batW - 6, 4.2);
  }
  if (kinP > 0.8) {
    drawStar(c, batX + batW / 2, batY - 10, 4.8 * subP(kinP, 0.8, 1.0), '#fde047');
  }
}

export function renderShoeboxGift(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🎁 Krabice od bot: Zavřená převázaná krabice -> Rozvázaná stuha, nadzdvižené víko a kužel kouzelných hvězd
  const boxW = 46;
  const boxH = 24;
  const boxY = by - 4;
  const liftP = easeOut(p);

  // Světelný kužel radosti z otevřené krabice
  if (liftP > 0.08) {
    const rayGrad = c.createLinearGradient(cx, boxY - boxH, cx, cy - 28);
    rayGrad.addColorStop(0, `rgba(253, 224, 71, ${0.55 * liftP})`);
    rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    c.fillStyle = rayGrad;
    c.beginPath();
    c.moveTo(cx - boxW * 0.42, boxY - boxH);
    c.lineTo(cx - boxW * 0.85, cy - 26);
    c.lineTo(cx + boxW * 0.85, cy - 26);
    c.lineTo(cx + boxW * 0.42, boxY - boxH);
    c.closePath();
    c.fill();

    drawStar(c, cx, boxY - boxH - 14 * liftP, 6.2 * liftP, '#fde047');
    drawStar(c, cx - 18 * liftP, boxY - boxH - 22 * liftP, 4.2 * liftP, '#34d399');
    drawHeart(c, cx + 16 * liftP, boxY - boxH - 19 * liftP, 4.5 * liftP, '#fb7185');
  }

  // Spodní část krabice se svislou stuhou
  c.fillStyle = '#e11d48';
  c.strokeStyle = '#fda4af';
  c.lineWidth = 1.4;
  drawRoundRect(c, cx - boxW / 2, boxY - boxH, boxW, boxH, 3);
  c.fill();
  c.stroke();
  c.fillStyle = '#fde047';
  c.fillRect(cx - 4, boxY - boxH, 8, boxH);

  // Víko krabice s mašlí (p = 0 zavřené -> p -> 1 nadzdvižené a nakloněné)
  c.save();
  c.translate(cx - boxW / 2, boxY - boxH - liftP * 11);
  c.rotate(-liftP * 0.22);
  c.fillStyle = '#fb7185';
  c.strokeStyle = '#fecdd3';
  drawRoundRect(c, -2, -7, boxW + 4, 8, 2);
  c.fill();
  c.stroke();
  c.strokeStyle = '#fde047';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(boxW / 2 - 5, -9, 5, 3, -0.3 - liftP * 0.4, 0, Math.PI * 2);
  c.ellipse(boxW / 2 + 5, -9, 5, 3, 0.3 + liftP * 0.4, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

export function renderAngelWings(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 👼 Dobrý anděl: Vychýlené váhy nejistoty se složenými křídly -> 100% dar vyrovnávající váhy a 3vrstvá opeřená andělská křídla
  const angP = easeOut(p);
  const scaleAngle = (1 - angP) * 0.24;
  const wingSpan = 0.26 + angP * 0.74;
  const wingFlap = Math.sin(wt * 2.6) * (1.2 + angP * 2.2);

  if (angP > 0.12) {
    drawGlow(c, cx, cy, 38 * angP, '#fde68a', 0.28 * angP);
  }

  // Vícevrstvá opeřená andělská křídla zvedající se vzhůru a do stran
  [-1, 1].forEach((dir) => {
    for (let tier = 2; tier >= 0; tier--) {
      const tFrac = tier / 2;
      const reachX = (18 + (38 - tier * 7) * wingSpan) * dir;
      const tipY = cy - (18 - tier * 8) * wingSpan + tier * 5 + wingFlap * (1 - tFrac * 0.35);
      const rootY = cy + 2 + tier * 3.5;

      c.fillStyle =
        angP > 0.2
          ? `rgba(255, 255, 255, ${(0.52 + angP * 0.42) * (1 - tier * 0.14)})`
          : `rgba(148, 163, 184, ${0.34 - tier * 0.06})`;
      c.strokeStyle = angP > 0.2 ? (tier === 0 ? '#fde68a' : '#bae6fd') : 'rgba(148, 163, 184, 0.48)';
      c.lineWidth = tier === 0 ? 1.6 : 1.1;

      c.beginPath();
      c.moveTo(cx + dir * 5, rootY);
      c.bezierCurveTo(
        cx + dir * (12 + 16 * wingSpan),
        cy - (16 - tier * 5) * wingSpan + wingFlap,
        cx + reachX * 0.88,
        tipY - 4,
        cx + reachX,
        tipY + 3
      );
      c.quadraticCurveTo(cx + reachX * 0.58, rootY + 9, cx + dir * 5, rootY + 4);
      c.closePath();
      c.fill();
      c.stroke();
    }
  });

  // Svatozář ukotvená k cy (nikoliv pevné y=16, aby nekolidovala s HUD v náhledu)
  c.strokeStyle = angP > 0.2 ? '#fde047' : 'rgba(253, 224, 71, 0.42)';
  c.lineWidth = 1.9;
  c.beginPath();
  c.ellipse(cx, cy - 22, 12.5 + angP * 3, 3.2, 0, 0, Math.PI * 2);
  c.stroke();

  // Váhy rodinného rozpočtu
  const pivotY = cy + 6;
  const beamArm = 30;
  const xL = cx - Math.cos(scaleAngle) * beamArm;
  const yL = pivotY - Math.sin(scaleAngle) * beamArm;
  const xR = cx + Math.cos(scaleAngle) * beamArm;
  const yR = pivotY + Math.sin(scaleAngle) * beamArm;

  c.strokeStyle = angP > 0.35 ? '#fde047' : '#94a3b8';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 13, by - 3);
  c.lineTo(cx + 13, by - 3);
  c.moveTo(cx, by - 3);
  c.lineTo(cx, pivotY);
  c.moveTo(xL, yL);
  c.lineTo(xR, yR);
  c.stroke();

  [
    { x: xL, y: yL },
    { x: xR, y: yR }
  ].forEach((arm) => {
    c.fillStyle = angP > 0.35 ? 'rgba(251, 191, 36, 0.34)' : 'rgba(100, 116, 139, 0.28)';
    c.strokeStyle = angP > 0.35 ? '#fbbf24' : '#94a3b8';
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(arm.x, arm.y + 10.5, 9, 0, Math.PI);
    c.closePath();
    c.fill();
    c.stroke();
  });

  if (angP > 0.05) {
    const coinDrop = Math.max(0, 1 - angP * 1.5) * 13;
    c.fillStyle = '#fde047';
    c.beginPath();
    c.arc(xL, yL + 7.5 - coinDrop, 4.2, 0, Math.PI * 2);
    c.fill();
  }
  drawHeart(c, cx, cy - 4, 4.8 + angP * 2.4, angP > 0.25 ? '#fb7185' : '#fde047');
}

export function renderCharityCare(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 💚 Charita ČR: Zhasnuté 4tabulkové venkovské okénko -> Medově rozsvícený domov pod ochrannou střechou se srdcem péče
  const winW = 38;
  const winH = 30;
  const winY = by - winH - 5;
  const careP = easeOut(p);

  if (careP > 0.08) {
    drawGlow(c, cx, winY + winH / 2, 36 * careP, '#fbbf24', 0.36 * careP);
  }

  // Ochranná střecha domova a terénní péče
  c.strokeStyle = careP > 0.2 ? '#6ee7b7' : 'rgba(148, 163, 184, 0.45)';
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(cx - 34, winY + 2);
  c.lineTo(cx, winY - 14);
  c.lineTo(cx + 34, winY + 2);
  c.stroke();

  // 4 okenní tabulky: p = 0 tmavě břidlicové -> p -> 1 teplé medové světlo
  c.fillStyle = careP > 0.05 ? `rgba(253, 224, 71, ${0.18 + careP * 0.72})` : '#0f172a';
  c.strokeStyle = careP > 0.2 ? '#fde68a' : '#64748b';
  c.lineWidth = 2;
  drawRoundRect(c, cx - winW / 2, winY, winW, winH, 3);
  c.fill();
  c.stroke();

  c.beginPath();
  c.moveTo(cx, winY);
  c.lineTo(cx, winY + winH);
  c.moveTo(cx - winW / 2, winY + winH / 2);
  c.lineTo(cx + winW / 2, winY + winH / 2);
  c.stroke();

  if (careP > 0.3) {
    drawHeart(c, cx, winY - 4 - careP * 3, 6.2 * subP(careP, 0.3, 1.0), '#34d399');
  }
}

export function renderSolidarityBridge(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
  // 🤝 Znesnáze21 / Dobrovolnictví: Rozlomený nedokončený oblouk mezi dvěma břehy -> Světelný most spojující dva lidi
  const brP = easeOut(p);
  const shoreY = by - 5;
  const leftX = cx - 50;
  const rightX = cx + 50;

  // Dva břehy
  c.fillStyle = '#0f2922';
  c.strokeStyle = brP > 0.2 ? '#5eead4' : '#64748b';
  c.lineWidth = 1.8;
  c.fillRect(leftX - 14, shoreY, 22, 6);
  c.strokeRect(leftX - 14, shoreY, 22, 6);
  c.fillRect(rightX - 8, shoreY, 22, 6);
  c.strokeRect(rightX - 8, shoreY, 22, 6);

  // Dvě postavy na březích (zšeřelé -> zlatě osvětlené)
  [leftX - 3, rightX + 3].forEach((fx) => {
    c.fillStyle = brP > 0.5 ? '#fde047' : '#94a3b8';
    c.beginPath();
    c.arc(fx, shoreY - 12, 3.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = brP > 0.5 ? '#fde047' : '#94a3b8';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(fx, shoreY - 8);
    c.lineTo(fx, shoreY - 1);
    c.stroke();
  });

  // Dvě poloviny oblouku rostoucí k sobě až do spojení klenákem uprostřed
  const reach = lerp(0.28, 0.5, brP);
  c.strokeStyle = brP > 0.2 ? '#2dd4bf' : 'rgba(148, 163, 184, 0.5)';
  c.lineWidth = 3.2;
  c.lineCap = 'round';
  [-1, 1].forEach((dir) => {
    c.beginPath();
    for (let s = 0; s <= 16; s++) {
      const u = (s / 16) * reach;
      const tArc = dir === -1 ? u : 1 - u;
      const ax = (1 - tArc) * (1 - tArc) * leftX + 2 * (1 - tArc) * tArc * cx + tArc * tArc * rightX;
      const ay = (1 - tArc) * (1 - tArc) * shoreY + 2 * (1 - tArc) * tArc * (cy - 30) + tArc * tArc * shoreY;
      if (s === 0) c.moveTo(ax, ay);
      else c.lineTo(ax, ay);
    }
    c.stroke();
  });

  // Zlatý klenák a srdce uprostřed spojeného mostu
  if (brP > 0.72) {
    const kP = subP(brP, 0.72, 1.0);
    drawGlow(c, cx, cy - 12, 26 * kP, '#fde047', 0.4 * kP);
    c.fillStyle = '#fde047';
    c.beginPath();
    c.arc(cx, cy - 12, 4.2 * kP, 0, Math.PI * 2);
    c.fill();
    drawHeart(c, cx, cy - 23, 6 * kP, '#fb7185');
  }
}

