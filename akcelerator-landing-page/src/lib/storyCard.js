/**
 * Client-side 1080x1920 (9:16) Story Card Generator for Instagram Stories,
 * TikTok, WhatsApp, Discord & Signal — 100% private in browser (<canvas>),
 * zero server uploads, using our painted Bohemian Sanctuary artwork + personal constellation!
 */

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function loadImageSafe(src) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Renders a 1080x1920 PNG Data URL & Blob representing the user's Bioluminescent Sanctuary & Constellation.
 * @param {{
 *   mode?: 'tip' | 'quiet',
 *   actionTitle?: string,
 *   stepsCount?: number,
 *   healPercent?: number,
 *   stars?: Array<{ x: number, y: number, color?: string }>
 * }} opts
 * @returns {Promise<{ dataUrl: string, blob: Blob | null }>}
 */
export async function renderStoryCardPng(opts = {}) {
  if (typeof document === 'undefined') {
    return { dataUrl: '', blob: null };
  }

  const mode = opts.mode === 'quiet' ? 'quiet' : 'tip';
  const stepsCount = Math.max(1, Number(opts.stepsCount) || 1);
  const healPercent = Math.max(32, Math.min(100, Number(opts.healPercent) || 32));
  const cleanAction = String(opts.actionTitle || '1 malý krok pro druhé v Česku')
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D\u2640\u2642\s]+/u, '')
    .trim();

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: '', blob: null };

  // 1. Deep Nocturnal Indigo-Emerald Base
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#040d0e');
  sky.addColorStop(0.46, '#08211e');
  sky.addColorStop(0.75, '#0e3327');
  sky.addColorStop(1, '#04100c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 2. Always draw the full radiant Golden Dawn Bohemian Sanctuary artwork (zero level gating!)
  const [dawnImg, twilightImg] = await Promise.all([
    loadImageSafe('/art/sanctuary-dawn.jpg'),
    loadImageSafe('/art/sanctuary-twilight.jpg')
  ]);

  const artImg = dawnImg || twilightImg;
  if (artImg) {
    const targetY = 760;
    const targetH = 1160;
    const scale = Math.max(W / artImg.width, targetH / artImg.height);
    const drawW = artImg.width * scale;
    const drawH = artImg.height * scale;
    const drawX = (W - drawW) / 2;
    ctx.drawImage(artImg, drawX, targetY, drawW, drawH);

    // Seamless vertical blend into upper night sky
    const seam = ctx.createLinearGradient(0, targetY - 20, 0, targetY + 340);
    seam.addColorStop(0, '#071d1b');
    seam.addColorStop(0.55, 'rgba(7, 29, 27, 0.55)');
    seam.addColorStop(1, 'rgba(7, 29, 27, 0)');
    ctx.fillStyle = seam;
    ctx.fillRect(0, targetY - 25, W, 370);

    // Bottom vignette for footer readability
    const btm = ctx.createLinearGradient(0, 1480, 0, H);
    btm.addColorStop(0, 'rgba(4, 16, 12, 0)');
    btm.addColorStop(0.6, 'rgba(4, 16, 12, 0.78)');
    btm.addColorStop(1, 'rgba(3, 12, 9, 0.95)');
    ctx.fillStyle = btm;
    ctx.fillRect(0, 1480, W, H - 1480);
  }

  // 3. Ethereal Aurora Ribbon in Upper Sky
  const aurora = ctx.createRadialGradient(540, 520, 40, 540, 520, 540);
  aurora.addColorStop(0, 'rgba(52, 211, 153, 0.22)');
  aurora.addColorStop(0.45, 'rgba(56, 189, 248, 0.11)');
  aurora.addColorStop(1, 'rgba(4, 13, 14, 0)');
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 60, W, 940);

  // 4. Personal Constellation Threads & Glowing Stars
  const fallbackCoords = [
    { x: 210, y: 830, color: '#fde68a' },
    { x: 355, y: 760, color: '#6ee7b7' },
    { x: 535, y: 815, color: '#fde68a' },
    { x: 705, y: 745, color: '#bae6fd' },
    { x: 865, y: 825, color: '#fed7aa' },
    { x: 290, y: 905, color: '#e9d5ff' },
    { x: 635, y: 890, color: '#6ee7b7' },
    { x: 465, y: 715, color: '#fde68a' }
  ];

  const starCount = Math.min(8, Math.max(3, stepsCount + 2));
  const pts =
    Array.isArray(opts.stars) && opts.stars.length >= 2
      ? opts.stars.slice(0, 10).map((s) => ({
          x: 130 + s.x * 820,
          y: 700 + Math.min(0.48, s.y) * 520,
          color: s.color || '#fde68a',
          lightType: s.lightType || 'star'
        }))
      : fallbackCoords.slice(0, starCount);

  // Constellation Threads
  ctx.save();
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  for (let i = 0; i < pts.length - 1; i++) {
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
  }
  ctx.stroke();
  ctx.restore();

  // Star, Lantern & Wave Blooms
  for (const p of pts) {
    const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 34);
    g.addColorStop(0, p.color);
    g.addColorStop(0.35, 'rgba(253, 230, 138, 0.35)');
    g.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
    ctx.fill();

    if (p.lightType === 'wave') {
      ctx.save();
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 26, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 42, 17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 12);
    ctx.lineTo(p.x + 3, p.y - 3);
    ctx.lineTo(p.x + 12, p.y);
    ctx.lineTo(p.x + 3, p.y + 3);
    ctx.lineTo(p.x, p.y + 12);
    ctx.lineTo(p.x - 3, p.y + 3);
    ctx.lineTo(p.x - 12, p.y);
    ctx.lineTo(p.x - 3, p.y - 3);
    ctx.closePath();
    ctx.fill();
  }

  // Soft Fireflies over Lake Foreground
  const flies = [
    [180, 1440], [310, 1510], [490, 1465], [690, 1525], [860, 1450], [770, 1385], [250, 1375]
  ];
  for (const [fx, fy] of flies) {
    const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 18);
    fg.addColorStop(0, 'rgba(253, 230, 138, 0.9)');
    fg.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(fx, fy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4B. Patronka Molly — Tortoiseshell Silhouette with Glowing Emerald Eyes & Golden Firefly on Lakeshore
  ctx.save();
  const mx = 260;
  const my = 1490;

  // Golden water reflection & aura under Molly
  const mRefl = ctx.createRadialGradient(mx, my + 42, 4, mx, my + 42, 74);
  mRefl.addColorStop(0, 'rgba(253, 230, 138, 0.42)');
  mRefl.addColorStop(0.5, 'rgba(245, 158, 11, 0.18)');
  mRefl.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = mRefl;
  ctx.beginPath();
  ctx.ellipse(mx, my + 42, 74, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mossy shore stone
  ctx.fillStyle = 'rgba(18, 40, 29, 0.94)';
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.38)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(mx - 8, my + 12, 62, 16, -0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tail with honey-amber tip
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1e1714';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(mx + 22, my + 2);
  ctx.bezierCurveTo(mx + 50, my - 6, mx + 56, my - 38, mx + 38, my - 56);
  ctx.stroke();

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 7.5;
  ctx.beginPath();
  ctx.moveTo(mx + 44, my - 22);
  ctx.quadraticCurveTo(mx + 52, my - 38, mx + 38, my - 56);
  ctx.stroke();

  // Tortoiseshell body
  ctx.fillStyle = '#1e1714';
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.48)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(mx, my - 10, 28, 33, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(mx, my - 10, 27, 32, -0.08, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.ellipse(mx + 12, my - 18, 15, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.ellipse(mx - 10, my - 2, 14, 11, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(mx - 4, my - 14, 8.5, 10, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head & ears
  const mhx = mx - 4;
  const mhy = my - 44;
  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.moveTo(mhx - 20, mhy - 6);
  ctx.lineTo(mhx - 24, mhy - 34);
  ctx.lineTo(mhx - 5, mhy - 18);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.moveTo(mhx + 5, mhy - 18);
  ctx.lineTo(mhx + 24, mhy - 34);
  ctx.lineTo(mhx + 20, mhy - 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1e1714';
  ctx.beginPath();
  ctx.arc(mhx, mhy, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(mhx, mhy, 22, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(mhx, mhy - 24, 24, 48);
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.ellipse(mhx + 8, mhy + 6, 9, 7, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glowing emerald eyes (#84cc16 / #bef264)
  [-9, 9].forEach((ex) => {
    ctx.fillStyle = '#bef264';
    ctx.shadowColor = '#84cc16';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(mhx + ex, mhy - 1, 5.8, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#090d08';
    ctx.beginPath();
    ctx.ellipse(mhx + ex, mhy - 1, 2.3, 4.0, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Golden firefly right in front of Molly's nose
  const mff = ctx.createRadialGradient(mhx - 34, mhy - 18, 2, mhx - 34, mhy - 18, 26);
  mff.addColorStop(0, '#ffffff');
  mff.addColorStop(0.35, 'rgba(253, 230, 138, 0.95)');
  mff.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = mff;
  ctx.beginPath();
  ctx.arc(mhx - 34, mhy - 18, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Top Editorial Pill
  roundRectPath(ctx, 140, 88, 800, 64, 32);
  ctx.fillStyle = 'rgba(6, 22, 18, 0.76)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.38)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('✦  AKCELERÁTOR ALTRUISMU • POMÁHÁME LIDEM POMÁHAT', 540, 129);

  // 6. Main Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 62px "Plus Jakarta Sans", system-ui, sans-serif';
  const mainHeading =
    mode === 'quiet'
      ? 'Každý drobný dobrý skutek rozsvěcí svět kolem nás.'
      : 'Pomáhat druhým může trvat jen jedinou minutu.';
  const titleLines = wrapCanvasText(ctx, mainHeading, 880);
  let yCursor = 248;
  for (const line of titleLines) {
    ctx.fillText(line, 540, yCursor);
    yCursor += 76;
  }

  ctx.fillStyle = '#fde68a';
  ctx.font = 'italic 38px Georgia, "Instrument Serif", serif';
  ctx.fillText('Nemusíš spasit celý svět — stačí jeden laskavý čin.', 540, yCursor + 14);

  // 7. Glass Feature Card
  const cardY = yCursor + 62;
  const cardH = mode === 'tip' ? 280 : 230;
  roundRectPath(ctx, 96, cardY, W - 192, cardH, 36);
  ctx.fillStyle = 'rgba(5, 20, 16, 0.76)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.42)';
  ctx.stroke();

  if (mode === 'tip') {
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('TIP NA RYCHLOU POMOC DRUHÝM (BEZ REGISTRACE):', 540, cardY + 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 38px "Plus Jakarta Sans", system-ui, sans-serif';
    const tipLines = wrapCanvasText(ctx, `„${cleanAction}“`, 780).slice(0, 2);
    let ty = cardY + 122;
    for (const tl of tipLines) {
      ctx.fillText(tl, 540, ty);
      ty += 48;
    }

    ctx.fillStyle = 'rgba(209, 250, 229, 0.88)';
    ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(
      '✨ Ověřené způsoby, jak snadno pomoci lidem, zvířatům i přírodě',
      540,
      cardY + cardH - 34
    );
  } else {
    ctx.fillStyle = '#6ee7b7';
    ctx.font = '800 23px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('KRAJINA DOBRA • SKUTKY A CHVÍLE VYDECHNUTÍ', 540, cardY + 62);

    ctx.fillStyle = '#fde68a';
    ctx.font = '800 48px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Dobro se děje potichu každý den', 540, cardY + 138);

    ctx.fillStyle = 'rgba(236, 253, 245, 0.9)';
    ctx.font = '600 25px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('Jednoduchá pomoc v okolí i z domova po celé České republice', 540, cardY + 192);
  }

  // 8. Bottom Invitation Footer Pill
  roundRectPath(ctx, 106, 1628, W - 212, 192, 36);
  ctx.fillStyle = 'rgba(6, 24, 18, 0.88)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.4)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 31px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Najdi si svůj dobrý skutek podle dnešního času a chuti:', 540, 1694);

  ctx.fillStyle = '#fde68a';
  ctx.font = '800 37px "Plus Jakarta Sans", system-ui, sans-serif';
  const hostLabel =
    typeof window !== 'undefined' && window.location.host && !window.location.host.includes('localhost')
      ? window.location.host
      : 'akcelerator-altruismu.cz';
  ctx.fillText(`🌿 ${hostLabel}`, 540, 1752);

  ctx.fillStyle = 'rgba(167, 243, 208, 0.85)';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('45 ověřených tipů z domova • Živá mapa pomoci ve všech 14 krajích ČR', 540, 1794);

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  return { dataUrl, blob };
}
