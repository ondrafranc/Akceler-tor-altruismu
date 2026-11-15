/**
 * Procedural Canvas 2D scene renderers for animals and shelter care.
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

export function renderKibble(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // 🐾 Zvířata v útulku: Prázdná miska a čekající pejsek -> Parabolický proud granulí, plná miska a vrtící ocásek
    const bowlX = cx + 10;
    const bowlW = 68;
    const bowlH = 16;
    const bowlY = by - 4;

    c.fillStyle = 'rgba(0, 0, 0, 0.42)';
    c.beginPath();
    c.ellipse(bowlX, bowlY + 3, bowlW * 0.56, 5.5, 0, 0, Math.PI * 2);
    c.fill();

    // Pejsek vlevo od misky (sklopená ouška před akcí -> nastražená ouška a radostné vrtění po akci)
    const dogBreath = Math.sin(wt * 2.2) * 1.0;
    const tailWag = Math.sin(wt * (2.0 + p * 6.5)) * (0.12 + p * 0.42);
    const earLift = lerp(-0.48, 0.12, easeOut(p));
    c.save();
    c.translate(cx - 46, bowlY + 1);
    c.save();
    c.translate(-22, -14);
    c.rotate(tailWag);
    c.strokeStyle = '#d97706';
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-7, -9, -11, -17 - p * 3);
    c.stroke();
    c.restore();

    c.fillStyle = '#291d16';
    c.strokeStyle = `rgba(253, 230, 138, ${0.32 + p * 0.35})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(-12, -11 + dogBreath, 13, 8.5, 0.18, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const headLift = p * 3;
    c.beginPath();
    c.ellipse(1, -21 - headLift + dogBreath * 0.7, 8, 7, -0.05 - p * 0.12, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    c.save();
    c.translate(-3, -25 - headLift + dogBreath * 0.7);
    c.rotate(earLift);
    c.fillStyle = '#d97706';
    c.beginPath();
    c.ellipse(0, 3, 3.2, 5.5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.fillStyle = '#0f0c0a';
    c.beginPath();
    c.arc(8, -20 - headLift + dogBreath * 0.7, 1.9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(3.5, -22.5 - headLift + dogBreath * 0.7, 1.8, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tělo keramické misky (zadní okraj + vnitřek)
    c.fillStyle = '#1c120b';
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 5.5, 0, 0, Math.PI * 2);
    c.fill();

    // Sypající se parabolický proud granulí a vršící se kopec v misce
    if (p > 0.02) {
      const pourP = subP(p, 0.02, 0.72);
      if (pourP > 0 && pourP < 1) {
        for (let d = 0; d < 8; d++) {
          const dp = (pourP * 2.2 + d * 0.13) % 1;
          const kx = lerp(bowlX + 34, bowlX - 6 + (d % 3) * 6, dp);
          const ky = lerp(cy - 30, bowlY - bowlH - 2, dp * dp);
          c.fillStyle = d % 2 === 0 ? '#fbbf24' : '#d97706';
          c.beginPath();
          c.ellipse(kx, ky, 3.2, 2.3, dp * 2, 0, Math.PI * 2);
          c.fill();
        }
      }

      const fillP = easeOut(subP(p, 0.08, 0.92));
      const kCount = Math.floor(20 * fillP);
      for (let i = 0; i < kCount; i++) {
        const row = Math.floor(i / 7);
        const colIdx = i % 7;
        const rowSpan = 24 - row * 5;
        const kx = bowlX - rowSpan + (colIdx / 6) * rowSpan * 2;
        const ky = bowlY - bowlH - 1 - row * 3.2 + Math.sin(i * 1.7) * 1.1;
        c.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f59e0b';
        c.beginPath();
        c.ellipse(kx, ky, 4.1, 2.9, (i % 4) * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255, 255, 255, 0.42)';
        c.beginPath();
        c.arc(kx - 1.1, ky - 0.9, 0.9, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Přední stěna misky s tlapkou
    const bGrad = c.createLinearGradient(bowlX - bowlW / 2, bowlY - bowlH, bowlX + bowlW / 2, bowlY);
    bGrad.addColorStop(0, '#f59e0b');
    bGrad.addColorStop(1, '#b45309');
    c.fillStyle = bGrad;
    c.strokeStyle = '#fde68a';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(bowlX - bowlW / 2, bowlY - bowlH);
    c.quadraticCurveTo(bowlX - bowlW * 0.45, bowlY, bowlX - bowlW * 0.35, bowlY);
    c.lineTo(bowlX + bowlW * 0.35, bowlY);
    c.quadraticCurveTo(bowlX + bowlW * 0.45, bowlY, bowlX + bowlW / 2, bowlY - bowlH);
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 5.2, 0, 0, Math.PI);
    c.fill();
    c.stroke();
    drawPaw(c, bowlX, bowlY - 6, 4.5, '#fde68a');

    if (p > 0.35) {
      const celP = easeOut(subP(p, 0.35, 1.0));
      drawSteam(c, bowlX, bowlY - bowlH - 10, 15 * celP, wt);
      drawHeart(c, cx - 22, bowlY - 30 - celP * 5 + Math.sin(wt * 3) * 2, 5.8 * celP, '#fbbf24');
    }
}

export function renderShelterCare(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // 🐾 Donio útulky: Chladný přístřešek se schoulenou kočičkou -> Zářící zlatá střecha bezpečí a plná miska
    const roofPeakY = cy - 26;
    const eaveY = cy - 4;
    const bowlX = cx + 18;
    const bowlW = 54;
    const bowlH = 14;
    const bowlY = by - 4;

    const roofP = easeOut(subP(p, 0, 0.65));
    if (roofP > 0.02) {
      const sanctuaryGrad = c.createLinearGradient(cx, roofPeakY, cx, bowlY);
      sanctuaryGrad.addColorStop(0, `rgba(251, 191, 36, ${0.28 * roofP})`);
      sanctuaryGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      c.fillStyle = sanctuaryGrad;
      c.beginPath();
      c.moveTo(cx, roofPeakY);
      c.lineTo(cx + 66, bowlY);
      c.lineTo(cx - 66, bowlY);
      c.closePath();
      c.fill();
    }

    // Střecha útulku
    c.strokeStyle = roofP > 0.1 ? '#fde68a' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 2.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - 62, eaveY);
    c.lineTo(cx, roofPeakY);
    c.lineTo(cx + 62, eaveY);
    c.stroke();

    // Schoulená kočička vlevo -> zvedá hlavičku a ocásek v teple domova
    c.save();
    c.translate(cx - 30, bowlY - 2);
    c.fillStyle = '#1f2937';
    c.strokeStyle = roofP > 0.1 ? '#fbbf24' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.ellipse(0, -6, 13, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    const catWake = easeOut(subP(p, 0.2, 0.9));
    const headY = -11 - catWake * 5;
    c.beginPath();
    c.arc(9, headY, 6.2, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    // Ouška
    c.beginPath();
    c.moveTo(5, headY - 4);
    c.lineTo(6, headY - 10);
    c.lineTo(9, headY - 5);
    c.moveTo(10, headY - 5);
    c.lineTo(13, headY - 10);
    c.lineTo(14, headY - 4);
    c.fill();
    c.stroke();
    // Ocásek
    c.strokeStyle = '#fbbf24';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(-12, -5);
    c.quadraticCurveTo(-20, -8 - catWake * 10, -15 + Math.sin(wt * 3) * 2, -12 - catWake * 12);
    c.stroke();
    c.restore();

    // Smaragdová miska vpravo
    c.fillStyle = '#0c241b';
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 4.6, 0, 0, Math.PI * 2);
    c.fill();

    if (p > 0.08) {
      const fillP = easeOut(subP(p, 0.08, 0.88));
      const kCount = Math.floor(15 * fillP);
      for (let i = 0; i < kCount; i++) {
        const row = Math.floor(i / 5);
        const kx = bowlX - 16 + (i % 5) * 8;
        const ky = bowlY - bowlH - 1 - row * 2.8;
        c.fillStyle = i % 2 === 0 ? '#fbbf24' : '#fde68a';
        c.beginPath();
        c.ellipse(kx, ky, 3.6, 2.4, (i % 3) * 0.3, 0, Math.PI * 2);
        c.fill();
      }
    }

    const bGrad = c.createLinearGradient(bowlX - bowlW / 2, bowlY - bowlH, bowlX + bowlW / 2, bowlY);
    bGrad.addColorStop(0, '#10b981');
    bGrad.addColorStop(1, '#065f46');
    c.fillStyle = bGrad;
    c.strokeStyle = '#6ee7b7';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bowlX - bowlW / 2, bowlY - bowlH);
    c.lineTo(bowlX - bowlW * 0.36, bowlY);
    c.lineTo(bowlX + bowlW * 0.36, bowlY);
    c.lineTo(bowlX + bowlW / 2, bowlY - bowlH);
    c.closePath();
    c.fill();
    c.stroke();
    drawPaw(c, bowlX, bowlY - 5.5, 4, '#fde68a');

    if (p > 0.3) {
      const hP = easeOut(subP(p, 0.3, 1.0));
      drawHeart(c, cx, roofPeakY + 14 - Math.sin(wt * 2.8) * 2, 6.5 * hP, '#fde047');
    }
}

export function renderWildlifeRescue(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // 🦔 Zvíře v nouzi: Pevně schoulené klubíčko ježka v trávě -> Ochranná náruč a rozvinutý spokojený ježek
    const groundY = by - 5;
    const uncurl = easeOut(subP(p, 0.15, 0.95));
    const handP = easeOut(subP(p, 0.02, 0.65));

    // Trsy noční trávy po stranách (čitelný kontext i při p = 0)
    c.strokeStyle = handP > 0.2 ? '#10b981' : 'rgba(52, 211, 153, 0.38)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    [-38, -32, 32, 38].forEach((gxOff, idx) => {
      c.beginPath();
      c.moveTo(cx + gxOff, groundY + 2);
      c.quadraticCurveTo(cx + gxOff + (idx < 2 ? -3 : 3), groundY - 7, cx + gxOff + (idx % 2 === 0 ? -5 : 5), groundY - 12);
      c.stroke();
    });

    // Ochranné zlatosmaragdové dlaně / kupole záchranné stanice
    if (handP > 0.02) {
      drawGlow(c, cx, groundY - 12, 34 * handP, '#34d399', 0.3 * handP);
      c.strokeStyle = `rgba(110, 231, 183, ${0.35 + handP * 0.55})`;
      c.lineWidth = 2.4;
      [-1, 1].forEach((dir) => {
        c.beginPath();
        c.moveTo(cx + dir * 10, groundY + 2);
        c.quadraticCurveTo(
          cx + dir * (36 * handP + 12),
          groundY - 6,
          cx + dir * (28 * handP + 6),
          groundY - 27 * handP
        );
        c.stroke();
      });
    }

    // Ježek: p = 0 zřetelné dvoubarevné klubíčko bodlinek -> p = 1 vykoukne čumáček, očko a tlapky
    c.save();
    c.translate(cx - uncurl * 4, groundY - 8);
    const spineStart = lerp(0, Math.PI * 0.8, uncurl);
    const spineEnd = lerp(Math.PI * 2, Math.PI * 2.1, uncurl);
    for (let s = 0; s < 16; s++) {
      const a = lerp(spineStart, spineEnd, s / 15);
      const rIn = 8.5;
      const rOut = 15.5 + (s % 2) * 2.6;
      c.fillStyle = s % 2 === 0 ? (uncurl > 0.15 ? '#b45309' : '#a8a29e') : uncurl > 0.15 ? '#fde68a' : '#78716c';
      c.beginPath();
      c.moveTo(Math.cos(a - 0.13) * rIn, Math.sin(a - 0.13) * rIn);
      c.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
      c.lineTo(Math.cos(a + 0.13) * rIn, Math.sin(a + 0.13) * rIn);
      c.closePath();
      c.fill();
    }

    c.fillStyle = uncurl > 0.15 ? '#92400e' : '#57534e';
    c.strokeStyle = 'rgba(253, 230, 138, 0.35)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, 1, 11 + uncurl * 2.5, 8.5, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    if (uncurl > 0.1) {
      const snP = subP(uncurl, 0.1, 1.0);
      c.fillStyle = '#fde68a';
      c.beginPath();
      c.moveTo(6, -4);
      c.quadraticCurveTo(12 * snP + 6, -3, 7 + 12 * snP, 1.5);
      c.quadraticCurveTo(12 * snP + 5, 6, 6, 6.5);
      c.closePath();
      c.fill();

      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(7 + 12 * snP, 1.2, 1.7 * snP, 0, Math.PI * 2);
      c.arc(10 * snP + 2.5, -0.8, 1.4 * snP, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    if (p > 0.48) {
      const hP = subP(p, 0.48, 1.0);
      drawHeart(c, cx + 18, groundY - 25 - hP * 4, 5.4 * hP, '#fde047');
    }
}

export function renderBirdsGlass(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // 🐦 Bezpečná skla pro ptáky: Zrcadlící neoznačené sklo a ohrožený let -> UV ochranný rastr a bezpečný oblouk nad sklem
    const paneX = cx - 4;
    const paneY = cy - 18;
    const paneW = 78;
    const paneH = 44;

    // Skleněná tabule s odleskem
    c.fillStyle = 'rgba(56, 189, 248, 0.10)';
    c.strokeStyle = p > 0.2 ? '#7dd3fc' : 'rgba(148, 163, 184, 0.45)';
    c.lineWidth = 1.6;
    c.fillRect(paneX, paneY, paneW, paneH);
    c.strokeRect(paneX, paneY, paneW, paneH);

    c.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(paneX + 12, paneY + paneH - 6);
    c.lineTo(paneX + 34, paneY + 6);
    c.stroke();

    // UV ochranné body rozsvěcující se na skle (p: 0 -> 1)
    const dotP = easeOut(subP(p, 0.02, 0.5));
    for (let gxIdx = 0; gxIdx < 5; gxIdx++) {
      for (let gyIdx = 0; gyIdx < 3; gyIdx++) {
        const dx = paneX + 11 + gxIdx * 14;
        const dy = paneY + 10 + gyIdx * 12;
        c.fillStyle =
          dotP > 0.05
            ? (gxIdx + gyIdx) % 2 === 0
              ? `rgba(253, 224, 71, ${0.2 + dotP * 0.8})`
              : `rgba(52, 211, 153, ${0.2 + dotP * 0.8})`
            : 'rgba(148, 163, 184, 0.12)';
        c.beginPath();
        c.arc(dx, dy, 1.1 + dotP * 1.7, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Letová dráha ptáka: p = 0 míří přímo do skla -> p -> 1 zvedá se do bezpečného oblouku nad tabuli
    const arcP = easeOut(subP(p, 0.1, 0.95));
    const startX = cx - 76;
    const startY = cy + 4;
    const endX = lerp(paneX + 6, paneX + paneW + 22, arcP);
    const ctrlX = paneX - 6 + arcP * 26;
    const ctrlY = lerp(cy + 4, paneY - 26, arcP);
    const endY = lerp(cy + 4, paneY - 6, arcP);

    c.save();
    c.setLineDash([4, 3]);
    c.strokeStyle = arcP > 0.2 ? `rgba(110, 231, 183, ${0.35 + arcP * 0.5})` : 'rgba(251, 113, 133, 0.45)';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(startX, startY);
    c.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    c.stroke();
    c.restore();

    const u = lerp(0.28, 0.92, arcP);
    const birdX = (1 - u) * (1 - u) * startX + 2 * (1 - u) * u * ctrlX + u * u * endX;
    const birdY = (1 - u) * (1 - u) * startY + 2 * (1 - u) * u * ctrlY + u * u * endY;
    drawBird(c, birdX, birdY, Math.sin(wt * 5.5), 9 + arcP * 2.5, arcP > 0.25 ? '#6ee7b7' : '#cbd5e1');

    if (arcP > 0.6) {
      drawStar(c, birdX - 12, birdY + 4, 3.8 * subP(arcP, 0.6, 1.0), '#fde047');
    }
}

export function renderBirdsSong(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // 🎶 Nářečí strnadů: Tichý strnad na větvi -> Zpívající zlatý strnad a harmonický spektrogram „di-di-di-dééé“
    const twigY = by - 8;
    const songP = easeOut(p);

    // Větev s lístky
    c.strokeStyle = '#92400e';
    c.lineWidth = 2.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx - spanX + 12, twigY + 3);
    c.quadraticCurveTo(cx - 34, twigY - 5, cx + 22, twigY + 1);
    c.stroke();
    c.fillStyle = songP > 0.1 ? '#34d399' : '#15803d';
    c.beginPath();
    c.ellipse(cx - 12, twigY - 4, 5.5, 2.5, -0.45, 0, Math.PI * 2);
    c.ellipse(cx + 8, twigY - 2, 5, 2.2, 0.35, 0, Math.PI * 2);
    c.fill();

    // Strnad obecný (žlutá hlavička a hruď, kaštanové křídlo, vykrojený ocásek)
    c.save();
    c.translate(cx - 50, twigY - 3);
    if (songP > 0.15) {
      drawGlow(c, 4, -10, 20 * songP, '#fde047', 0.28 * songP);
    }
    // Nožky
    c.strokeStyle = '#d97706';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-1, -3);
    c.lineTo(-2, 1);
    c.moveTo(3, -3);
    c.lineTo(3, 1);
    c.stroke();
    // Ocásek
    c.strokeStyle = songP > 0.08 ? '#a16207' : '#57534e';
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-7, -5);
    c.lineTo(-20, 2);
    c.stroke();
    // Tělíčko + křídlo
    c.fillStyle = songP > 0.08 ? '#eab308' : '#78716c';
    c.beginPath();
    c.ellipse(0, -8, 10.5, 6.2, -0.22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = songP > 0.08 ? '#b45309' : '#57534e';
    c.beginPath();
    c.ellipse(-2, -8, 7.2, 3.6, -0.28, 0, Math.PI * 2);
    c.fill();

    const headLift = prep * 1.0 + songP * 2.5;
    c.fillStyle = songP > 0.08 ? '#fde047' : '#a8a29e';
    c.beginPath();
    c.arc(8, -13.5 - headLift, 5.2, 0, Math.PI * 2);
    c.fill();

    // Zobáček: zavřený -> otevřený při zpěvu
    const beakGap = songP * 2.4 + (songP > 0.3 ? Math.abs(Math.sin(wt * 7)) * 1.1 : 0);
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.moveTo(12, -14.5 - headLift);
    c.lineTo(18, -15 - headLift - beakGap);
    c.lineTo(12, -13 - headLift);
    c.moveTo(12, -13 - headLift);
    c.lineTo(17.5, -11.5 - headLift + beakGap * 0.6);
    c.lineTo(12, -12 - headLift);
    c.fill();

    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(9, -14.5 - headLift, 1.3, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tichá přerušovaná osa (p = 0) -> 3 staccato tóny „di-di-di“ a vlnící se harmonická stuha „dééé“ (p -> 1)
    const baseSpecY = cy + 3;
    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = `rgba(148, 163, 184, ${0.42 * (1 - songP * 0.65)})`;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(cx - 24, baseSpecY);
    c.lineTo(cx + 84, baseSpecY);
    c.stroke();
    c.restore();

    if (songP > 0.02) {
      // 3 krátké staccato impulzy „di-di-di“
      const shortNotes = [
        { x: cx - 20, h: 11, t0: 0.04 },
        { x: cx - 8, h: 14, t0: 0.16 },
        { x: cx + 4, h: 17, t0: 0.28 }
      ];
      shortNotes.forEach((n, idx) => {
        const sP = easeOut(subP(songP, n.t0, n.t0 + 0.32));
        if (sP <= 0) return;
        const nh = (n.h + Math.sin(wt * 6 + idx) * 1.5) * sP;
        c.fillStyle = idx === 2 ? '#6ee7b7' : '#fde047';
        drawRoundRect(c, n.x, baseSpecY - nh * 0.65, 5.5, Math.max(3, nh), 2.8);
        c.fill();
      });

      // Dlouhý nesený tón „dééé“ jako elegantní víceharmonická zvuková stuha (nikoliv těžký obdélník)
      const susP = easeOut(subP(songP, 0.38, 0.96));
      if (susP > 0.02) {
        const sStart = cx + 17;
        const sEnd = lerp(sStart + 4, cx + 82, susP);
        [
          { amp: 7.5, col: '#fde047', w: 2.5, ph: 0 },
          { amp: 4.5, col: '#34d399', w: 1.8, ph: 1.4 }
        ].forEach((wv) => {
          c.strokeStyle = wv.col;
          c.lineWidth = wv.w;
          c.lineCap = 'round';
          c.beginPath();
          for (let i = 0; i <= 20; i++) {
            const u = i / 20;
            const sx = lerp(sStart, sEnd, u);
            const env = Math.sin(u * Math.PI);
            const sy = baseSpecY - 3 + Math.sin(u * 10 - wt * 4.5 + wv.ph) * wv.amp * env * susP;
            if (i === 0) c.moveTo(sx, sy);
            else c.lineTo(sx, sy);
          }
          c.stroke();
        });

        // Drobné vznášející se notové jiskry
        drawStar(c, lerp(sStart, sEnd, 0.65), baseSpecY - 14 * susP, 3.8 * susP, '#fde047');
      }

      // Akustické vlny od zobáčku
      for (let r = 1; r <= 2; r++) {
        c.strokeStyle = `rgba(253, 224, 71, ${(0.45 * songP) / r})`;
        c.lineWidth = 1.3;
        c.beginPath();
        c.arc(cx - 32, twigY - 18, 7 * r + ((wt * 6) % 5), -0.6, 0.5);
        c.stroke();
      }
    }
}

