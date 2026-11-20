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
    // Zvířata v útulku: Klidná kameninová miska a čekající pejsek -> Teplý proud granulí, plná miska a radostné vrtění
    const bowlX = cx + 16;
    const bowlW = 66;
    const bowlH = 16;
    const bowlY = by - 4;

    // Měkké teplé podsvícení kameninové misky při proměně
    if (p > 0.04) {
      drawGlow(c, bowlX, bowlY - bowlH * 0.5, 44 + p * 18, '#f6e7c1', 0.08 + p * 0.24);
    }

    // Jemný kontaktní stín pod pejskem i miskou
    c.fillStyle = 'rgba(4, 12, 9, 0.42)';
    c.beginPath();
    c.ellipse(bowlX, bowlY + 3, bowlW * 0.58, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(cx - 46, bowlY + 2.5, 22, 4.4, 0, 0, Math.PI * 2);
    c.fill();

    // Silueta čekajícího pejska v jemných teplých hnědo-kaštanových tónech české krajiny
    const dogBreath = Math.sin(wt * 2.0) * 0.7;
    const tailWag = Math.sin(wt * (1.8 + p * 6.2)) * (0.1 + p * 0.44);
    const earLift = lerp(-0.34, 0.14, easeOut(p));
    const headLift = easeOut(p) * 3.2;

    c.save();
    c.translate(cx - 44, bowlY + 1);

    // Ocásek (klidný oblouk -> veselé vrtění)
    c.save();
    c.translate(-19, -11);
    c.rotate(tailWag);
    c.strokeStyle = '#9b6a41';
    c.lineWidth = 2.8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-7, -8, -10, -15 - p * 3);
    c.stroke();
    c.restore();

    // Tělo pejska (sedící silueta s jemným kaštanovým stínováním)
    const coatGrad = c.createLinearGradient(-18, -30, 8, 0);
    coatGrad.addColorStop(0, '#5a3e2b');
    coatGrad.addColorStop(0.55, '#3b281d');
    coatGrad.addColorStop(1, '#261912');
    c.fillStyle = coatGrad;
    c.strokeStyle = `rgba(246, 231, 193, ${0.22 + p * 0.28})`;
    c.lineWidth = 1.0;

    c.beginPath();
    c.moveTo(-19, 0);
    c.quadraticCurveTo(-22, -16 + dogBreath, -8, -21 + dogBreath);
    c.quadraticCurveTo(2, -23 + dogBreath, 5, -12 + dogBreath * 0.5);
    c.quadraticCurveTo(6, -3, 8, 0);
    c.lineTo(-19, 0);
    c.closePath();
    c.fill();
    c.stroke();

    // Světlejší náprsenka a přední tlapka
    c.fillStyle = 'rgba(232, 206, 168, 0.22)';
    c.beginPath();
    c.ellipse(1.5, -10 + dogBreath * 0.5, 4.2, 7.5, -0.18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6c4b33';
    c.beginPath();
    c.ellipse(8.5, -1.6, 4.2, 2.1, 0, 0, Math.PI * 2);
    c.fill();

    // Hlava a jemný čumáček nakloněný směrem k misce
    const hy = -23 - headLift + dogBreath * 0.65;
    c.fillStyle = coatGrad;
    c.beginPath();
    c.ellipse(1.5, hy, 8.2, 7.0, -0.06 - p * 0.1, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Čumák
    c.fillStyle = '#4e3525';
    c.beginPath();
    c.ellipse(9.2, hy + 1.4, 4.2, 3.0, 0.08, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#19120e';
    c.beginPath();
    c.arc(12.6, hy + 0.6, 1.5, 0, Math.PI * 2);
    c.fill();

    // Měkké sklopené ouško (po akci se jemně zvedne)
    c.save();
    c.translate(-2.5, hy - 3.2);
    c.rotate(earLift);
    c.fillStyle = '#7b5234';
    c.beginPath();
    c.ellipse(0, 4.2, 3.1, 5.6, 0.12, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Klidný jiskřivý pohled
    c.fillStyle = '#f6e7c1';
    c.beginPath();
    c.arc(5.2, hy - 1.2, 1.35, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // Tělo kameninové misky (vnitřní stín)
    c.fillStyle = '#18110c';
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 5.0, 0, 0, Math.PI * 2);
    c.fill();

    // Sypající se parabolický proud granulí a vršící se kopec v misce
    if (p > 0.02) {
      const pourP = subP(p, 0.02, 0.72);
      if (pourP > 0 && pourP < 1) {
        for (let d = 0; d < 8; d++) {
          const dp = (pourP * 2.2 + d * 0.13) % 1;
          const kx = lerp(bowlX + 34, bowlX - 6 + (d % 3) * 6, dp);
          const ky = lerp(cy - 30, bowlY - bowlH - 2, dp * dp);
          c.fillStyle = d % 2 === 0 ? '#dfb06a' : '#b87638';
          c.beginPath();
          c.ellipse(kx, ky, 3.0, 2.1, dp * 2, 0, Math.PI * 2);
          c.fill();
        }
      }

      const fillP = easeOut(subP(p, 0.08, 0.92));
      const kCount = Math.floor(20 * fillP);
      for (let i = 0; i < kCount; i++) {
        const row = Math.floor(i / 7);
        const colIdx = i % 7;
        const rowSpan = 23 - row * 5;
        const kx = bowlX - rowSpan + (colIdx / 6) * rowSpan * 2;
        const ky = bowlY - bowlH - 1 - row * 3.1 + Math.sin(i * 1.7) * 1.0;
        c.fillStyle = i % 2 === 0 ? '#e3b56f' : '#c07e3e';
        c.beginPath();
        c.ellipse(kx, ky, 3.9, 2.7, (i % 4) * 0.35, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255, 248, 232, 0.35)';
        c.beginPath();
        c.arc(kx - 1.0, ky - 0.8, 0.85, 0, Math.PI * 2);
        c.fill();
      }
    }

    // Přední stěna matné české terakotové misky se smetanovým okrajem
    const bGrad = c.createLinearGradient(bowlX - bowlW / 2, bowlY - bowlH, bowlX + bowlW / 2, bowlY);
    bGrad.addColorStop(0, '#c07241');
    bGrad.addColorStop(0.55, '#9d552b');
    bGrad.addColorStop(1, '#6f391b');
    c.fillStyle = bGrad;
    c.strokeStyle = 'rgba(243, 229, 204, 0.72)';
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(bowlX - bowlW / 2, bowlY - bowlH);
    c.quadraticCurveTo(bowlX - bowlW * 0.45, bowlY, bowlX - bowlW * 0.35, bowlY);
    c.lineTo(bowlX + bowlW * 0.35, bowlY);
    c.quadraticCurveTo(bowlX + bowlW * 0.45, bowlY, bowlX + bowlW / 2, bowlY - bowlH);
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 4.8, 0, 0, Math.PI);
    c.fill();
    c.stroke();

    // Jemný glazurou světlý okraj a drobná tlapka
    c.strokeStyle = 'rgba(246, 231, 193, 0.55)';
    c.lineWidth = 1.0;
    c.beginPath();
    c.ellipse(bowlX, bowlY - bowlH, bowlW / 2, 4.8, 0, Math.PI, Math.PI * 2);
    c.stroke();
    drawPaw(c, bowlX, bowlY - 6, 4.2, 'rgba(246, 231, 193, 0.82)');

    if (p > 0.35) {
      const celP = easeOut(subP(p, 0.35, 1.0));
      drawSteam(c, bowlX, bowlY - bowlH - 10, 14 * celP, wt);
      drawHeart(c, cx - 18, bowlY - 30 - celP * 5 + Math.sin(wt * 3) * 2, 5.4 * celP, '#f6e7c1');
    }
}

export function renderShelterCare(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Donio útulky: Chladný přístřešek se schoulenou kočičkou -> Zářící zlatá střecha bezpečí a plná miska
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

export function renderWildlifeRescue(c, { p, prep, wt, cx, by, red }) {
    // Zvire v nouzi (774 155 155): Schoulene klubicko jezka a ptacek v trave -> Ochranna naruc stanice, spokojeny jezek a vzletajici ptacek
    const groundY = by - 3;
    const uncurl = easeOut(subP(p, 0.02, 0.90));
    const handP = easeOut(subP(p, 0.01, 0.62));
    const birdP = easeOut(subP(p, 0.06, 0.94));
    const breath = red ? 0 : Math.sin(wt * 2.2) * 0.6;
    const twitch = red ? 0 : Math.sin(wt * 3.6) * (0.4 + prep * 0.9) * (1 - uncurl * 0.5);

    // 1. Jemna predzvestna zare pri najeti mysi (prep) a hrejiva ochranna kupole po akci (handP)
    if (prep > 0.02 || handP > 0.02) {
      const glowR = 24 + prep * 8 + handP * 22;
      const glowA = 0.08 * prep + 0.28 * handP;
      drawGlow(c, cx, groundY - 12, glowR, handP > 0.15 ? '#34d399' : '#fde68a', glowA);
    }

    // 2. Trsy nocni travy po vnejsich stranach (citelny kontext i pri p = 0, bez prekryvu se zviratky)
    c.save();
    c.strokeStyle = handP > 0.2 ? '#10b981' : 'rgba(52, 211, 153, 0.44)';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    [-52, -45, 45, 52].forEach((gxOff, idx) => {
      const sway = red ? 0 : Math.sin(wt * 1.8 + idx) * 1.1;
      const lean = idx < 2 ? -4 : 4;
      const tipH = idx % 2 === 0 ? 12 : 9.5;
      c.beginPath();
      c.moveTo(cx + gxOff, groundY + 1.5);
      c.quadraticCurveTo(cx + gxOff + lean * 0.5, groundY - tipH * 0.55, cx + gxOff + lean + sway, groundY - tipH);
      c.stroke();
    });
    c.restore();

    // 3. Ochranne smaragdovo-zlate dlane / klenba zachranne stanice po obvodu sceny (nikdy neprotina telicko)
    if (handP > 0.02) {
      c.save();
      c.strokeStyle = `rgba(110, 231, 183, ${(0.34 + handP * 0.56).toFixed(3)})`;
      c.lineWidth = 2.3;
      c.lineCap = 'round';
      [-1, 1].forEach((dir) => {
        const baseX = cx + dir * 36;
        const ctrlX = cx + dir * (44 + 8 * handP);
        const tipX = cx + dir * lerp(40, 26, handP);
        const tipY = groundY - 6 - 24 * handP;
        c.beginPath();
        c.moveTo(baseX, groundY + 1);
        c.quadraticCurveTo(ctrlX, groundY - 10 * handP - 3, tipX, tipY);
        c.stroke();
      });
      c.restore();
    }

    // 4. Jezek vlevo od stredu: p = 0 utulne schoulene klubicko NA zemi -> p = 1 vykoukne cumacek, ocko, ousko a tlapky
    const hx = cx - 15 - uncurl * 2;
    const hy = groundY - 0.5;
    c.save();
    c.translate(hx, hy);

    // Mekky stin pod jezkem
    c.fillStyle = 'rgba(0, 0, 0, 0.36)';
    c.beginPath();
    c.ellipse(1 + uncurl * 1.5, 1.5, 13.5 + uncurl * 2.5, 2.8, 0, 0, Math.PI * 2);
    c.fill();

    // Tlapky (vykouknou na trave pri rozbaleni klubicka)
    if (uncurl > 0.12) {
      const pawP = easeOut(subP(uncurl, 0.12, 0.75));
      c.fillStyle = '#d97706';
      c.beginPath();
      c.ellipse(-5.5, -0.8, Math.max(0.25, 2.9 * pawP), Math.max(0.2, 1.6 * pawP), 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(5.2, -0.8, Math.max(0.25, 3.1 * pawP), Math.max(0.2, 1.6 * pawP), 0, 0, Math.PI * 2);
      c.fill();
    }

    // Bodlinky vyhradne po horni klenbe zad (p = 0: 0.96*PI .. 1.92*PI nad zemi; p = 1: 0.94*PI .. 1.64*PI za ouskem, nula prekryvu s oblicejem)
    const domeX = -1.8;
    const domeY = -6.8 + breath * 0.4;
    const spineStart = lerp(Math.PI * 0.96, Math.PI * 0.94, uncurl);
    const spineEnd = lerp(Math.PI * 1.92, Math.PI * 1.64, uncurl);
    const spineCount = 15;
    for (let s = 0; s < spineCount; s++) {
      const u = s / (spineCount - 1);
      const a = lerp(spineStart, spineEnd, u);
      const rIn = 6.8;
      const rOut = 13.4 + (s % 2) * 2.1;
      const warmQuill = uncurl > 0.12 || prep > 0.25;
      c.fillStyle =
        s % 2 === 0
          ? warmQuill
            ? '#b45309'
            : '#a8a29e'
          : warmQuill
            ? '#fde68a'
            : '#d6d3d1';
      c.beginPath();
      c.moveTo(domeX + Math.cos(a - 0.12) * rIn, domeY + Math.sin(a - 0.12) * rIn);
      c.lineTo(domeX + Math.cos(a) * rOut, domeY + Math.sin(a) * rOut);
      c.lineTo(domeX + Math.cos(a + 0.12) * rIn, domeY + Math.sin(a + 0.12) * rIn);
      c.closePath();
      c.fill();
    }

    // Spodni teple brisko a kozisek jezka (plocha spodni hrana lezici na trave, zadny obrys presekavajici cumacek)
    c.fillStyle = uncurl > 0.12 ? '#78350f' : '#57534e';
    c.beginPath();
    c.ellipse(-1.2, -5.8 + breath * 0.35, 10.6 + uncurl * 1.4, 6.2, 0, Math.PI * 0.94, Math.PI * 2.06);
    c.quadraticCurveTo(4, -0.6, -1.2, -0.6);
    c.quadraticCurveTo(-8, -0.6, -11.6, -4.6);
    c.closePath();
    c.fill();

    // Hlava a cumacek jezka: pri p = 0 jemne schovany cumacek u klubicka -> pri p = 1 radostne vysunuty svetly cumacek
    const snoutReach = lerp(9.8 + prep * 1.1 + twitch * 0.5, 16.8, uncurl);
    const snoutTipY = lerp(-3.6, -5.8, uncurl) + breath * 0.3;
    c.fillStyle = uncurl > 0.08 ? '#fde68a' : '#e7e5e4';
    c.beginPath();
    c.moveTo(2.5, -9.6 + breath * 0.3);
    c.quadraticCurveTo(9.2 + uncurl * 3.2, -9.2 + breath * 0.3, snoutReach, snoutTipY);
    c.quadraticCurveTo(9.5 + uncurl * 2.5, -1.0, 2.2, -1.2);
    c.closePath();
    c.fill();

    // Kulate ousko
    const earScale = 0.45 + 0.55 * uncurl;
    c.fillStyle = uncurl > 0.12 ? '#92400e' : '#78716c';
    c.beginPath();
    c.ellipse(3.6, -10.2 + breath * 0.3, 2.4 * earScale, 2.9 * earScale, -0.2, 0, Math.PI * 2);
    c.fill();

    // Tmavy koralkovy cumacek (samostatna subpath bez spojovaci cary k oku)
    const noseR = lerp(1.25, 1.65, uncurl);
    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(snoutReach + 0.3, snoutTipY, noseR, 0, Math.PI * 2);
    c.fill();

    // Ocko jezka (samostatna subpath s bilym odleskem)
    const eyeX = lerp(6.8, 9.8, uncurl);
    const eyeY = lerp(-5.0, -6.2, uncurl) + breath * 0.3;
    if (uncurl < 0.18) {
      c.strokeStyle = '#1e293b';
      c.lineWidth = 1.2;
      c.lineCap = 'round';
      c.beginPath();
      c.arc(eyeX, eyeY, 1.35, 0.15, Math.PI - 0.15);
      c.stroke();
    } else {
      const eyeR = 1.15 + 0.3 * uncurl;
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(eyeX - 0.35, eyeY - 0.35, 0.48, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 5. Drobny ptacek vpravo (pro zranene jezky a ptaky): p = 0 schouleny v trave -> p = 1 uzdraveny vzleta s rozepjatymi kridly
    const flutter = red ? 0 : Math.sin(wt * 5.4) * (0.4 + birdP * 1.8);
    const bx = cx + 21 + birdP * 4;
    const byBird = groundY - 4.5 - birdP * 12 + flutter * 0.45;
    c.save();
    c.translate(bx, byBird);
    c.rotate(lerp(0.08, -0.16, birdP));

    // Ocasek ptacka
    c.strokeStyle = birdP > 0.15 ? '#059669' : '#64748b';
    c.lineWidth = 2.1;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(5.5, 1);
    c.lineTo(10.5, lerp(2.8, -0.5, birdP));
    c.stroke();

    // Telicko ptacka
    c.fillStyle = birdP > 0.15 ? '#34d399' : '#94a3b8';
    c.beginPath();
    c.ellipse(0, 0.5, 6.2, 4.4, -0.12, 0, Math.PI * 2);
    c.fill();

    // Hrud a hlavicka
    const headLift = prep * 1.0 + birdP * 1.8;
    c.fillStyle = birdP > 0.15 ? '#fde047' : '#cbd5e1';
    c.beginPath();
    c.arc(-4.8, -2.6 - headLift * 0.45, 3.5, 0, Math.PI * 2);
    c.fill();

    // Kridelko (slozene u tela pri p = 0 -> radostne mavajici pri p -> 1)
    const wingLift = birdP * 6.5 + (birdP > 0.2 ? Math.abs(flutter) * 1.4 : 0);
    c.fillStyle = birdP > 0.15 ? '#10b981' : '#64748b';
    c.beginPath();
    c.moveTo(-1.5, -0.5);
    c.quadraticCurveTo(2.5, -4.2 - wingLift, 5.2, -1.2 - wingLift * 0.75);
    c.quadraticCurveTo(2.2, 2.2, -1.5, 1.2);
    c.closePath();
    c.fill();

    // Zobacek a ocko ptacka
    c.fillStyle = '#f59e0b';
    c.beginPath();
    c.moveTo(-7.8, -3.2 - headLift * 0.45);
    c.lineTo(-10.8, -2.5 - headLift * 0.45);
    c.lineTo(-7.8, -1.7 - headLift * 0.45);
    c.closePath();
    c.fill();

    c.fillStyle = '#0f172a';
    c.beginPath();
    c.arc(-5.4, -3.0 - headLift * 0.45, 0.95, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 6. Hrejive srdce zachrany mezi jezkem a ptackem pri dokonceni
    if (p > 0.42) {
      const hP = easeOut(subP(p, 0.42, 1.0));
      if (hP > 0.02) {
        drawHeart(c, cx + 3, groundY - 24 - hP * 4, 5.4 * hP, '#fde047');
      }
    }
}

export function renderBirdsGlass(c, { p, prep, wt, cx, cy, by, w, h, cs, red, frame, gx, py, spanX }) {
    // Bezpečná skla pro ptáky: Zrcadlící neoznačené sklo a ohrožený let -> UV ochranný rastr a bezpečný oblouk nad sklem
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
    // Nářečí strnadů: Tichý strnad na větvi -> Zpívající zlatý strnad a harmonický spektrogram „di-di-di-dééé“
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

