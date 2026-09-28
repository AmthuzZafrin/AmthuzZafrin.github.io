const CYCLE_MS = 2400;
// Sizes and the column step are fractions of eye width, and the rise is too. They
// used to be absolute pixels -- 14/19/24px, a 70px climb, a 14px step -- which is
// right at CANVAS_SIZE and wrong everywhere else: this is the one overlay that would
// have grown or shrunk relative to the face on a phone or a tablet.
const LETTERS = [
  { size: 0.17, delay: 0 },
  { size: 0.23, delay: CYCLE_MS / 3 },
  { size: 0.3, delay: (CYCLE_MS / 3) * 2 },
];

function alphaForPhase(phase) {
  if (phase < 0.12) return phase / 0.12;
  if (phase > 0.75) return Math.max(0, (1 - phase) / 0.25);
  return 1;
}

/**
 * Animated drifting "Z" letters rising from just above the right brow.
 *
 * They used to sit on the shell above the bezel, outside the lit screen, which made
 * them the only feature on the face not drawn on the display. Anchored to the eye now
 * instead, and the rise is capped so the largest glyph's top edge still clears the
 * top of the screen at the end of its climb.
 */
export function drawZzz(ctx, geometry, tMs, config) {
  const { rightEyeX, eyeY, eyeW } = geometry;
  const baseX = rightEyeX + eyeW * 0.75;
  const baseY = eyeY - eyeW * 0.05;
  const rise = eyeW * 0.5;
  const glowColor = config.glowColor;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = eyeW * 0.08;

  LETTERS.forEach((letter, i) => {
    const phase = (((tMs + letter.delay) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;
    const alpha = alphaForPhase(phase);
    if (alpha <= 0) return;

    const y = baseY - phase * rise;
    const x = baseX + i * eyeW * 0.13 + Math.sin(phase * Math.PI * 2) * eyeW * 0.028;

    ctx.globalAlpha = alpha;
    ctx.font = `${eyeW * letter.size}px system-ui, sans-serif`;
    ctx.fillText('Z', x, y);
  });

  ctx.restore();
}
