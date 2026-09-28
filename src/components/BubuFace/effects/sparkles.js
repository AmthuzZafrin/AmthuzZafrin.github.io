const CYCLE_MS = 1500;

// Fixed positions in eye-box-relative units so sparkles sit around the face
// rather than scattering randomly each frame (which would strobe).
const STARS = [
  { dx: -0.55, dy: -0.5, size: 0.16, delay: 0 },
  { dx: 1.55, dy: -0.35, size: 0.2, delay: CYCLE_MS * 0.33 },
  { dx: 1.75, dy: 0.9, size: 0.13, delay: CYCLE_MS * 0.66 },
  { dx: -0.75, dy: 0.75, size: 0.15, delay: CYCLE_MS * 0.5 },
];

function drawStar(ctx, cx, cy, r, alpha, color) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  // four-point sparkle: long axes with pinched waists
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 1.5;
  ctx.fill();
  ctx.restore();
}

/** excited / celebrating: sparkle stars twinkling around the face. */
export function drawSparkles(ctx, geometry, tMs, config) {
  const { leftEyeX, eyeY, eyeW, eyeH } = geometry;
  const color = config?.glowColor || '#ffd27a';

  STARS.forEach((star) => {
    const phase = (((tMs + star.delay) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;
    // grow-then-shrink twinkle
    const scale = Math.sin(phase * Math.PI);
    if (scale <= 0.01) return;
    const cx = leftEyeX + eyeW * star.dx;
    const cy = eyeY + eyeH * star.dy;
    drawStar(ctx, cx, cy, eyeW * star.size * scale, scale, color);
  });
}
