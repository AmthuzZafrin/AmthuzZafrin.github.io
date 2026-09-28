const PULSE_MS = 900;
const RAY_COUNT = 8;

/**
 * surprised / scared: short lines radiating outward from behind the face,
 * pulsing outward on a loop.
 */
export function drawShockLines(ctx, geometry, tMs, config) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, eyeH } = geometry;
  const cx = (leftEyeX + rightEyeX + eyeW) / 2;
  const cy = eyeY + eyeH / 2;
  const color = config?.glowColor || '#8fd4ff';

  const phase = ((tMs % PULSE_MS) + PULSE_MS) % PULSE_MS / PULSE_MS;
  const inner = eyeW * (1.5 + phase * 0.45);
  const length = eyeW * 0.3 * (1 - phase * 0.4);
  const alpha = Math.max(0, 1 - phase);
  if (alpha <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = eyeW * 0.12;
  ctx.lineWidth = eyeW * 0.045;
  ctx.lineCap = 'round';

  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2 - Math.PI / 2;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    ctx.beginPath();
    ctx.moveTo(cx + cos * inner, cy + sin * inner);
    ctx.lineTo(cx + cos * (inner + length), cy + sin * (inner + length));
    ctx.stroke();
  }
  ctx.restore();
}
