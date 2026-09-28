import { getOrCreateCanvas } from './offscreenCache';

const TILE_SIZE = 128;
const SCANLINE_SPACING = 4;

/**
 * Builds the grain in *device* pixels rather than logical ones.
 *
 * putImageData ignores the context transform, so the scale() that getOrCreateCanvas
 * applies before calling this does nothing here -- the dimensions have to come off
 * the canvas itself. That is also the fix: this used to build a 128x128 tile at dpr 1
 * whatever the screen was, and the pattern then stretched it, so on a 3x phone every
 * grain pixel occupied a 3x3 block and the scanlines sat 12 device pixels apart
 * instead of 4. The grain read as chunky noise rather than as film grain.
 *
 * The scanline spacing is scaled with it, so the stripes keep the same physical
 * pitch and only their edges get sharper.
 */
function buildNoiseTile(ctx, w) {
  const deviceW = ctx.canvas.width;
  const deviceH = ctx.canvas.height;
  const dpr = deviceW / w;
  const spacing = Math.max(1, Math.round(SCANLINE_SPACING * dpr));

  const imageData = ctx.createImageData(deviceW, deviceH);
  const data = imageData.data;

  for (let y = 0; y < deviceH; y++) {
    const onScanline = y % spacing === 0;
    for (let x = 0; x < deviceW; x++) {
      const i = (y * deviceW + x) * 4;
      const noise = Math.random() * 60;
      const alpha = (onScanline ? 22 : 8) + noise;
      data[i] = 210;
      data[i + 1] = 190;
      data[i + 2] = 230;
      data[i + 3] = Math.min(255, alpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Returns a repeating CanvasPattern of the pre-baked grain+scanline tile.
 *
 * A pattern maps one bitmap pixel to one *user* unit, so the dpr-sized tile above
 * would otherwise tile dpr times too coarsely and undo the whole point of building it
 * at device resolution. Scaling the pattern back down by the same factor puts one
 * bitmap pixel on one device pixel, which is what makes the grain fine again.
 */
export function getNoisePattern(ctx, dpr = 1) {
  const tile = getOrCreateCanvas('noiseTile', TILE_SIZE, TILE_SIZE, dpr, buildNoiseTile);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern && dpr !== 1 && pattern.setTransform) {
    pattern.setTransform(new DOMMatrix().scale(1 / dpr));
  }
  return pattern;
}
