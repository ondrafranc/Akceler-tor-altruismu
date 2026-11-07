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
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
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
          color: s.color || '#fde68a'
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

  // Star Blooms
  for (const p of pts) {
    const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 34);
    g.addColorStop(0, p.color);
    g.addColorStop(0.35, 'rgba(253, 230, 138, 0.35)');
    g.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
    ctx.fill();

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

  // 5. Top Editorial Pill
  roundRectPath(ctx, 195, 88, 690, 64, 32);
  ctx.fillStyle = 'rgba(6, 22, 18, 0.76)';
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(110, 231, 183, 0.38)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fde68a';
  ctx.font = '800 23px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('✦  AKCELERÁTOR ALTRUISMU • KRAJINA DOBRA', 540, 129);

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
