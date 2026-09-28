import { getOrCreateCanvas } from './offscreenCache';
import { getFaceGeometry } from './geometry';
import { roundedRectPath } from './path';
import { getNoisePattern } from './noiseTexture';

function buildScreen(ctx, w, h) {
  const g = getFaceGeometry(w, h);
  const { screenX, screenY, screenW, screenH, screenRadius } = g;

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // dark glass background
  const bg = ctx.createRadialGradient(
    screenX + screenW / 2,
    screenY + screenH * 0.42,
    0,
    screenX + screenW / 2,
    screenY + screenH * 0.42,
    screenW * 0.75
  );
  bg.addColorStop(0, '#170a1f');
  bg.addColorStop(0.6, '#0a0510');
  bg.addColorStop(1, '#000000');
  ctx.fillStyle = bg;
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // vignette
  const vignette = ctx.createRadialGradient(
    screenX + screenW / 2,
    screenY + screenH / 2,
    screenW * 0.25,
    screenX + screenW / 2,
    screenY + screenH / 2,
    screenW * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // baked grain + scanline texture. The dpr has to be handed down: this layer is
  // built under a scale(dpr) transform, and without it the tile bakes at 1x and the
  // pattern stretches it into blocks.
  const pattern = getNoisePattern(ctx, ctx.canvas.width / w);
  if (pattern) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = pattern;
    ctx.fillRect(screenX, screenY, screenW, screenH);
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // soft ambient glow separating the black screen from the grey shell around it —
  // a near-invisible hairline stroke with a wide blur reads as diffuse light, not a drawn line
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.save();
  ctx.lineWidth = screenW * 0.0015;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.shadowColor = 'rgba(255,255,255,0.5)';
  ctx.shadowBlur = screenW * 0.02;
  ctx.stroke();
  ctx.restore();
}

/** Cached offscreen glass-screen layer (background/gloss/vignette/chrome only). */
export function getScreenLayer(w, h, dpr) {
  return getOrCreateCanvas('screen', w, h, dpr, buildScreen);
}
