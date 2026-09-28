const CYCLE_MS = 1800;

const DOTS = [
  { scale: 0.5, dy: 0.0, delay: 0 },
  { scale: 0.72, dy: -0.45, delay: CYCLE_MS / 3 },
  { scale: 1.0, dy: -0.95, delay: (CYCLE_MS / 3) * 2 },
];

/**
 * thinking / confused: three dots rising beside the head, growing as they go --
 * the thought-bubble idiom, without drawing an actual bubble.
 */
export function drawThinkingDots(ctx, geometry, tMs, config) {
  const { rightEyeX, eyeY, eyeW, eyeH } = geometry;
  const color = config?.glowColor || '#cc88ff';
  const baseX = rightEyeX + eyeW * 1.5;
  const baseY = eyeY + eyeH * 0.1;
  const unit = eyeW * 0.11;

  DOTS.forEach((dot) => {
    const phase = (((tMs + dot.delay) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;
    const alpha = phase < 0.15 ? phase / 0.15 : Math.max(0, (1 - phase) / 0.55);
    if (alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = Math.min(alpha, 1);
    ctx.beginPath();
    ctx.arc(
      baseX + unit * dot.scale * 1.6,
      baseY + eyeH * dot.dy,
      unit * dot.scale,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = unit * 2;
    ctx.fill();
    ctx.restore();
  });
}
