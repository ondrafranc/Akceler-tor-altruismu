/**
 * Procedural Canvas 2D scene renderers for food, hunger relief, and zero waste.
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
export function renderRice(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Freerice: Vzpřímené bledé stéblo a prázdná miska OSN -> Zlatý klas sklánějící se k misce plné rýže
    const bowlX = cx + 22;
    const bowlW = 58;
    const bowlY = by - 3;
    const bend = lerp(0.18, 1.0, easeOut(p));
    const sway = Math.sin(wt * 1.8) * 2;

    // Rýžové stéblo vlevo
    const stX = cx - 48;
    const stY = by - 2;
    const tipX = stX + 12 + bend * 38 + sway;
    const tipY = stY - 46 + bend * 14;
    c.strokeStyle = p > 0.15 ? '#facc15' : 'rgba(163, 230, 53, 0.55)';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(stX, stY);
    c.quadraticCurveTo(stX + 6 + bend * 10, stY - 36, tipX, tipY);
    c.stroke();

    // Lístek stébla
    c.strokeStyle = '#4ade80';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(stX + 4, stY - 14);
    c.quadraticCurveTo(stX - 14, stY - 26, stX - 18, stY - 32);
    c.stroke();

    // Zrnka na klasu
    for (let g = 0; g < 7; g++) {
      const u = 0.42 + g * 0.09;
      const gxP = (1 - u) * (1 - u) * stX + 2 * (1 - u) * u * (stX + 6 + bend * 10) + u * u * tipX;
      const gyP = (1 - u) * (1 - u) * stY + 2 * (1 - u) * u * (stY - 36) + u * u * tipY;
      c.fillStyle = p > 0.15 ? '#fde047' : 'rgba(254, 240, 138, 0.45)';
      c.beginPath();
      c.ellipse(gxP, gyP + (g % 2 === 0 ? -2.5 : 2.5), 3.6, 1.7, -0.3 + bend * 0.5, 0, Math.PI * 2);
      c.fill();
    }

    // Padající zrnka rýže z klasu do misky
    const pourP = subP(p, 0.1, 0.8);
    if (pourP > 0 && pourP < 1) {
      for (let k = 0; k < 7; k++) {
        const dp = (pourP * 2 + k * 0.15) % 1;
        const rx = lerp(tipX, bowlX + (k % 3 - 1) * 7, dp);
        const ry = lerp(tipY, bowlY - 16, dp * dp);
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.ellipse(rx, ry, 3.1, 1.5, dp * 1.4, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Vnitřek misky + kopec bílé rýže
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.ellipse(bowlX, bowlY - 15, bowlW * 0.44, 5, 0, 0, Math.PI * 2);
    c.fill();

    if (p > 0.12) {
      const riceP = easeOut(subP(p, 0.12, 0.95));
      c.fillStyle = '#f8fafc';
      c.beginPath();
      c.ellipse(bowlX, bowlY - 15, bowlW * 0.4 * riceP, 9 * riceP, 0, Math.PI, Math.PI * 2);
      c.fill();
      for (let i = 0; i < Math.floor(16 * riceP); i++) {
        const gxG = bowlX - 16 + ((i * 9 + 3) % 32);
        const gyG = bowlY - 16 - Math.floor(i / 6) * 2.5;
        c.fillStyle = i % 2 === 0 ? '#ffffff' : '#fef3c7';
        c.beginPath();
        c.ellipse(gxG, gyG, 3.4, 1.6, (i % 5) * 0.4, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Modrá miska WFP/OSN
    const unGrad = c.createLinearGradient(bowlX, bowlY - 15, bowlX, bowlY);
    unGrad.addColorStop(0, '#0284c7');
    unGrad.addColorStop(1, '#1e3a8a');
    c.fillStyle = unGrad;
    c.strokeStyle = '#7dd3fc';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(bowlX, bowlY - 15, bowlW * 0.44, 0, Math.PI);
    c.closePath();
    c.fill();
    c.stroke();

    if (p > 0.45) {
      drawSteam(c, bowlX, bowlY - 24, 14 * subP(p, 0.45, 1.0), wt);
    }
}

/** @type {SceneRenderer} */
export function renderFoodBank(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Potravinová banka: Prázdný dvoupatrový regál -> Police zaplňující se bedýnkami, konzervami a chlebem
    const rx = cx - 42;
    const ry = cy - 16;
    const rw = 84;
    const rh = 42;

    // Konstrukce regálu
    c.strokeStyle = '#d97706';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx, ry + rh);
    c.moveTo(rx + rw, ry);
    c.lineTo(rx + rw, ry + rh);
    c.moveTo(rx, ry + rh * 0.5);
    c.lineTo(rx + rw, ry + rh * 0.5);
    c.moveTo(rx, ry + rh);
    c.lineTo(rx + rw, ry + rh);
    c.stroke();

    // Při p = 0 čárkovaný obrys prázdného místa
    if (p < 0.25) {
      c.save();
      c.setLineDash([3, 3]);
      c.strokeStyle = `rgba(148, 163, 184, ${0.45 * (1 - p * 3.5)})`;
      c.lineWidth = 1.2;
      c.strokeRect(rx + 10, ry + 6, 22, 12);
      c.strokeRect(rx + 46, ry + rh * 0.5 + 6, 24, 12);
      c.restore();
    }

    const items = [
      { x: rx + 8, y: ry + rh * 0.5, w: 20, h: 13, col: '#fbbf24' },
      { x: rx + 33, y: ry + rh * 0.5, w: 16, h: 15, col: '#34d399' },
      { x: rx + 54, y: ry + rh * 0.5, w: 22, h: 11, col: '#f59e0b', round: true },
      { x: rx + 8, y: ry + rh, w: 22, h: 14, col: '#fb7185' },
      { x: rx + 35, y: ry + rh, w: 18, h: 15, col: '#38bdf8' },
      { x: rx + 58, y: ry + rh, w: 18, h: 13, col: '#fde047' }
    ];
    items.forEach((it, idx) => {
      const iP = easeOut(subP(p, idx * 0.1, idx * 0.1 + 0.38));
      if (iP <= 0.02) return;
      const curH = it.h * iP;
      c.fillStyle = it.col;
      if (it.round) {
        c.beginPath();
        c.ellipse(it.x + it.w / 2, it.y - 1, (it.w / 2) * iP, curH, 0, Math.PI, Math.PI * 2);
        c.fill();
      } else {
        drawRoundRect(c, it.x, it.y - curH - 1, it.w, curH, 2);
        c.fill();
      }
    });

    if (p > 0.65) {
      drawHeart(c, cx, ry - 6, 5.5 * subP(p, 0.65, 1.0), '#fde047');
    }
}

/** @type {SceneRenderer} */
export function renderSoupLantern(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Naděje: Zhasnutá pouliční lampa v chladném dešti -> Hřejivý kužel lucerny a napařená polévka pod střechou
    const lampX = cx - 36;
    const bowlX = cx + 16;
    const baseS = by - 3;
    const warmP = easeOut(p);

    // Chladný déšť (p = 0) mizící s rozsvícením lucerny
    if (warmP < 0.6) {
      c.strokeStyle = `rgba(148, 163, 184, ${(1 - warmP * 1.5) * 0.45})`;
      c.lineWidth = 1.2;
      for (let r = 0; r < 6; r++) {
        const rxR = cx - 44 + r * 20;
        const ryR = cy - 18 + (r % 2) * 10;
        c.beginPath();
        c.moveTo(rxR, ryR);
        c.lineTo(rxR - 4, ryR + 9);
        c.stroke();
      }
    }

    // Kužel teplého světla z lucerny
    if (warmP > 0.04) {
      const coneGrad = c.createLinearGradient(lampX + 12, cy - 22, bowlX, baseS);
      coneGrad.addColorStop(0, `rgba(253, 224, 71, ${0.42 * warmP})`);
      coneGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      c.fillStyle = coneGrad;
      c.beginPath();
      c.moveTo(lampX + 12, cy - 20);
      c.lineTo(bowlX + 36, baseS);
      c.lineTo(lampX - 10, baseS);
      c.closePath();
      c.fill();
    }

    // Pouliční lampa vlevo
    c.strokeStyle = '#64748b';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(lampX, baseS);
    c.lineTo(lampX, cy - 22);
    c.quadraticCurveTo(lampX, cy - 28, lampX + 12, cy - 24);
    c.stroke();
    c.fillStyle = warmP > 0.1 ? '#fde047' : '#334155';
    c.beginPath();
    c.arc(lampX + 12, cy - 21, 4.2, 0, Math.PI * 2);
    c.fill();

    // Střecha přístřeší a miska s polévkou vpravo
    c.strokeStyle = warmP > 0.2 ? '#fbbf24' : 'rgba(148, 163, 184, 0.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(bowlX - 28, cy - 4);
    c.lineTo(bowlX, cy - 18);
    c.lineTo(bowlX + 28, cy - 4);
    c.stroke();

    c.fillStyle = warmP > 0.15 ? '#ea580c' : '#334155';
    c.strokeStyle = warmP > 0.15 ? '#fde68a' : '#64748b';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(bowlX, baseS - 13, 16, 0, Math.PI);
    c.closePath();
    c.fill();
    c.stroke();

    if (warmP > 0.35) {
      drawSteam(c, bowlX, baseS - 16, 15 * subP(warmP, 0.35, 1.0), wt);
    }
}

/** @type {SceneRenderer} */
export function renderZeroWastePot(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Zachraň jídlo: Křivá mrkev s natí, rajče a bylinka vedle studeného hrnce -> Oblouk do měděného hrnce a voňavá večeře
    const potY = by - 4;
    const potW = 46;
    const potH = 22;
    const cookP = easeOut(p);
    const inP = easeOut(subP(p, 0, 0.58));

    // Rozpoznatelná „nedokonalá" zelenina na lince skákající obloukem do hrnce
    if (inP < 0.98) {
      /**
       * @param {number} sx
       * @param {number} sy
       * @param {number} peakOff
       */
      const arcPos = (sx, sy, peakOff) => {
        const u = inP;
        return {
          x: (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * ((sx + cx) * 0.5) + u * u * cx,
          y: (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * (potY - peakOff) + u * u * (potY - potH + 2)
        };
      };

      // 1. Křivá mrkev s lístky natě vlevo
      const car = arcPos(cx - 50, potY - 6, 42);
      c.save();
      c.translate(car.x, car.y);
      c.rotate(-0.35 + inP * 1.4);
      c.strokeStyle = '#4ade80';
      c.lineWidth = 1.5;
      c.lineCap = 'round';
      [-0.4, 0, 0.4].forEach((ang) => {
        c.beginPath();
        c.moveTo(-5, 0);
        c.lineTo(-10, ang * 7);
        c.stroke();
      });
      c.fillStyle = '#fb923c';
      c.beginPath();
      c.moveTo(-5, -3.4);
      c.quadraticCurveTo(2, -4.2, 9, 0.8);
      c.quadraticCurveTo(2, 3.8, -5, 3.2);
      c.closePath();
      c.fill();
      c.restore();

      // 2. Zralé rajče se zelenou stopkou vpravo
      const tom = arcPos(cx + 50, potY - 6, 40);
      c.save();
      c.translate(tom.x, tom.y);
      c.rotate(-inP * 1.2);
      c.fillStyle = '#f43f5e';
      c.beginPath();
      c.ellipse(0, 0.5, 5.8, 5.0, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.beginPath();
      c.arc(-2, -1.2, 1.5, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#22c55e';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(-3, -4.5);
      c.lineTo(0, -3.2);
      c.lineTo(3, -4.5);
      c.moveTo(0, -6);
      c.lineTo(0, -3);
      c.stroke();
      c.restore();

      // 3. Snítka zelené bylinky nahoře vlevo
      const herb = arcPos(cx - 34, potY - 17, 44);
      c.save();
      c.translate(herb.x, herb.y);
      c.rotate(0.2 + inP * 1.1);
      c.strokeStyle = '#34d399';
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(-4, 3);
      c.quadraticCurveTo(0, 0, 4, -3);
      c.stroke();
      c.fillStyle = '#4ade80';
      c.beginPath();
      c.ellipse(-1, -1.5, 3.2, 1.7, -0.5, 0, Math.PI * 2);
      c.ellipse(2, 1.2, 3.2, 1.7, 0.4, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Plamínky pod hrncem a měděná záře při vaření
    if (cookP > 0.25) {
      const flP = subP(cookP, 0.25, 1.0);
      drawGlow(c, cx, potY - potH * 0.45, 30 * flP, '#fb923c', 0.36 * flP);
      [-10, 0, 10].forEach((fx, idx) => {
        c.fillStyle = idx === 1 ? '#fde047' : '#fb923c';
        c.beginPath();
        c.arc(cx + fx, potY + 1.5, 2.2 * flP, 0, Math.PI * 2);
        c.fill();
      });
    }

    // Ucha a tělo hrnce (chladná litina -> hřejivý měděný hrnec se zlatým vývarem)
    c.strokeStyle = cookP > 0.2 ? '#fde68a' : '#94a3b8';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx - potW / 2, potY - potH + 7, 4.5, Math.PI * 0.5, Math.PI * 1.5);
    c.stroke();
    c.beginPath();
    c.arc(cx + potW / 2, potY - potH + 7, 4.5, -Math.PI * 0.5, Math.PI * 0.5);
    c.stroke();

    const potGrad = c.createLinearGradient(cx - potW / 2, potY - potH, cx + potW / 2, potY);
    if (cookP > 0.2) {
      potGrad.addColorStop(0, '#f97316');
      potGrad.addColorStop(0.55, '#ea580c');
      potGrad.addColorStop(1, '#9a3412');
    } else {
      potGrad.addColorStop(0, '#475569');
      potGrad.addColorStop(1, '#1e293b');
    }
    c.fillStyle = potGrad;
    drawRoundRect(c, cx - potW / 2, potY - potH, potW, potH, 4);
    c.fill();
    c.stroke();

    // Hladina zlatavé polévky v hrnci
    if (cookP > 0.3) {
      c.fillStyle = '#fbbf24';
      c.beginPath();
      c.ellipse(cx, potY - potH + 1.5, potW * 0.44, 2.6, 0, 0, Math.PI * 2);
      c.fill();
    }

    if (cookP > 0.42) {
      const sP = subP(cookP, 0.42, 1.0);
      drawSteam(c, cx, potY - potH - 4, 15 * sP, wt);
      drawHeart(c, cx, potY - potH - 19, 5.2 * sP, '#fde047');
    }
}

/** @type {SceneRenderer} */
export function renderBakerySave(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Nesnězeno: Hodiny před zavíračkou a složený sáček -> Zachráněný kraftový sáček s křupavou bagetou a croissantem
    const clkX = cx - 44;
    const clkY = cy + 2;
    const bagX = cx + 14;
    const bagY = by - 3;
    const saveP = easeOut(p);

    // Hodiny zavírací doby vlevo s ciferníkem a výsečí zavíračky
    c.fillStyle = '#0f172a';
    c.strokeStyle = saveP > 0.3 ? '#34d399' : '#fb923c';
    c.lineWidth = 1.9;
    c.beginPath();
    c.arc(clkX, clkY, 12.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Výseč „za 5 minut zavíračka" -> smaragdové zachránění
    c.fillStyle = saveP > 0.3 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(251, 146, 60, 0.28)';
    c.beginPath();
    c.moveTo(clkX, clkY);
    c.arc(clkX, clkY, 10.5, -Math.PI * 0.78, -Math.PI * 0.5);
    c.closePath();
    c.fill();

    c.strokeStyle = saveP > 0.3 ? '#6ee7b7' : '#fde68a';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(clkX, clkY);
    c.lineTo(clkX - 5.5, clkY - 4.5);
    c.moveTo(clkX, clkY);
    c.lineTo(clkX, clkY - 8.5);
    c.stroke();

    // Vykukující francouzská bageta s nářezy a lístkový croissant (oddělené úhly bez překryvu)
    const riseP = easeOut(subP(saveP, 0.12, 0.88));
    if (riseP > 0.03) {
      drawGlow(c, bagX, bagY - 25, 28 * riseP, '#fbbf24', 0.36 * riseP);

      // 1. Křupavá bageta vpravo s šikmými pekařskými zářezy
      c.save();
      c.translate(bagX + 9, bagY - 16 - riseP * 11);
      c.rotate(0.34);
      c.fillStyle = '#d97706';
      c.strokeStyle = '#fde68a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.ellipse(0, 0, 5.2, 13.5, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.strokeStyle = '#fef3c7';
      c.lineWidth = 1.1;
      [-5, 0, 5].forEach((sy) => {
        c.beginPath();
        c.moveTo(-2.6, sy - 1.4);
        c.lineTo(2.6, sy + 1.4);
        c.stroke();
      });
      c.restore();

      // 2. Zlatavý půlměsícový croissant vlevo s vrstvením těsta
      c.save();
      c.translate(bagX - 8, bagY - 16 - riseP * 9.5);
      c.rotate(-0.24);
      c.fillStyle = '#fbbf24';
      c.strokeStyle = '#fef08a';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(-9.5, 4.5);
      c.quadraticCurveTo(-7, -7.5, 0, -7.5);
      c.quadraticCurveTo(7, -7.5, 9.5, 4.5);
      c.quadraticCurveTo(4.5, -0.5, 0, -0.5);
      c.quadraticCurveTo(-4.5, -0.5, -9.5, 4.5);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = '#b45309';
      c.lineWidth = 1;
      [-3.6, 3.6].forEach((cxOff) => {
        c.beginPath();
        c.moveTo(cxOff, -6.2);
        c.quadraticCurveTo(cxOff * 0.85, -3, cxOff * 0.7, -0.6);
        c.stroke();
      });
      c.restore();
    }

    // Kraftový záchranný sáček (p = 0 přehnutý zavřený -> p = 1 teplý otevřený se zoubkovaným okrajem)
    const bagGrad = c.createLinearGradient(bagX - 18, bagY - 21, bagX + 18, bagY);
    if (saveP > 0.15) {
      bagGrad.addColorStop(0, '#d97706');
      bagGrad.addColorStop(1, '#92400e');
    } else {
      bagGrad.addColorStop(0, '#475569');
      bagGrad.addColorStop(1, '#334155');
    }
    c.fillStyle = bagGrad;
    c.strokeStyle = saveP > 0.15 ? '#fde68a' : '#94a3b8';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bagX - 18, bagY - 20);
    c.lineTo(bagX - 15, bagY);
    c.lineTo(bagX + 15, bagY);
    c.lineTo(bagX + 18, bagY - 20);
    c.closePath();
    c.fill();
    c.stroke();

    if (saveP <= 0.12) {
      // Přehnutá zavřená klopa sáčku před záchranou
      c.fillStyle = '#64748b';
      c.beginPath();
      c.moveTo(bagX - 18, bagY - 20);
      c.lineTo(bagX + 18, bagY - 20);
      c.lineTo(bagX + 15, bagY - 14);
      c.lineTo(bagX - 15, bagY - 14);
      c.closePath();
      c.fill();
    } else if (saveP > 0.5) {
      drawSteam(c, bagX, bagY - 30, 10 * subP(saveP, 0.5, 1.0), wt);
    }
    drawHeart(c, bagX, bagY - 9, 4.4, saveP > 0.2 ? '#34d399' : 'rgba(148, 163, 184, 0.5)');
}

