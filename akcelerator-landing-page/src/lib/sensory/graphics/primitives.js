/**
 * Procedural Canvas 2D vector drawing primitives for poetic deed transformations.
 */

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} color
 * @param {number} [alpha=0.35]
 */
export function drawGlow(c, x, y, r, color, alpha = 0.35) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(0.45, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, 6.28);
  c.fill();
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} color
 */
export function drawHeart(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 8;
  c.beginPath();
  c.moveTo(x, y + r * 0.35);
  c.bezierCurveTo(x - r, y - r * 0.4, x - r * 1.1, y + r * 0.6, x, y + r * 1.25);
  c.bezierCurveTo(x + r * 1.1, y + r * 0.6, x + r, y - r * 0.4, x, y + r * 0.35);
  c.fill();
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} wing
 * @param {number} size
 * @param {string} color
 */
export function drawBird(c, x, y, wing, size, color) {
  c.save();
  c.strokeStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 6;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x - size, y - wing * size * 0.65);
  c.quadraticCurveTo(x - size * 0.4, y - size * 0.42, x, y);
  c.quadraticCurveTo(x + size * 0.4, y - size * 0.42, x + size, y - wing * size * 0.65);
  c.stroke();
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} color
 */
export function drawStar(c, x, y, r, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 10;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.36;
    const a = (i * Math.PI) / 4;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
  c.fill();
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} s
 * @param {string} color
 */
export function drawPaw(c, x, y, s, color) {
  c.save();
  c.fillStyle = color;
  c.shadowColor = color;
  c.shadowBlur = 6;
  c.beginPath();
  c.ellipse(x, y + s * 0.25, s * 0.55, s * 0.42, 0, 0, 6.28);
  c.fill();
  [
    [-0.55, -0.35],
    [-0.2, -0.58],
    [0.2, -0.58],
    [0.55, -0.35]
  ].forEach(([dx, dy]) => {
    c.beginPath();
    c.arc(x + dx * s, y + dy * s, s * 0.22, 0, 6.28);
    c.fill();
  });
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} rw
 * @param {number} rh
 * @param {number} r
 */
export function drawRoundRect(c, x, y, rw, rh, r) {
  c.beginPath();
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, rw, rh, r);
  } else {
    c.rect(x, y, rw, rh);
  }
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} h
 * @param {number} t
 * @param {string} [col='rgba(254, 243, 199, 0.45)']
 */
export function drawSteam(c, x, y, h, t, col = 'rgba(254, 243, 199, 0.45)') {
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    const sx = x - 10 + s * 10;
    const sWave = Math.sin(t * 3 + s * 1.6) * 3.5;
    c.beginPath();
    c.moveTo(sx, y);
    c.quadraticCurveTo(sx + sWave, y - h * 0.5, sx - sWave * 0.4, y - h);
    c.stroke();
  }
  c.restore();
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} r
 * @param {string} colPetal
 * @param {string} colCenter
 */
export function drawFlower(c, x, y, r, colPetal, colCenter) {
  c.save();
  c.fillStyle = colPetal;
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    c.beginPath();
    c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = colCenter;
  c.beginPath();
  c.arc(x, y, r * 0.35, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
