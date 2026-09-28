import { getOrCreateCanvas } from './offscreenCache';
import { hexToRgba } from './path';

function buildGlowSprite(ctx, size, color) {
  const r = size / 2;
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r);
  gradient.addColorStop(0, hexToRgba(color, 0.9));
  gradient.addColorStop(0.22, hexToRgba(color, 0.4));
  gradient.addColorStop(0.5, hexToRgba(color, 0.08));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

/** Cached radial-gradient glow sprite, keyed by color+size — rebuilt only when those change. */
export function getGlowSprite(color, size, dpr) {
  return getOrCreateCanvas(`glow:${color}:${Math.round(size)}`, size, size, dpr, (ctx, w) =>
    buildGlowSprite(ctx, w, color)
  );
}

// How strongly the face being drawn right now shows its glows; 1 is as designed. Set by
// BubuFace's draw loop for its own frame and put back straight after, so one page can
// show faces with different amounts -- the website's home face asked for less (14 Sep
// 2026) -- while every other face, the app's included, draws exactly as it did.
let glowScale = 1;

export function setGlowScale(scale) {
  glowScale = scale;
}

/** Blits a cached glow sprite centered at (x, y) using additive blending. */
export function drawGlow(ctx, x, y, size, color, dpr, intensity = 1) {
  const strength = intensity * glowScale;
  if (strength <= 0) return;
  const sprite = getGlowSprite(color, size, dpr);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = strength;
  ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}
