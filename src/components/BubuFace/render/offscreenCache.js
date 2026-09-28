const caches = new Map();

/**
 * Sizes kept per key before the least recently used one is dropped.
 *
 * More than one, because a page can show faces of different sizes in the same frame
 * -- the website's intro draws a large face and a ring of small ones together. With a
 * single slot per key each face evicted the other's layers, and every frame rebuilt
 * the head shell and the screen from scratch for all of them. The app shows one face
 * at a time and never holds more than one size per key, so it sees no difference.
 *
 * Bounded, because every step of a window being resized is a new size, and a full
 * layer at 480px on a 2x screen is close to 4MB.
 */
const SIZES_PER_KEY = 4;

/**
 * Get-or-create a memoized offscreen canvas. The build function is only
 * invoked again when width/height/dpr change for a given key, so callers
 * can safely call this every frame without repeating expensive gradient
 * work.
 */
export function getOrCreateCanvas(key, width, height, dpr, build) {
  const sizeKey = `${width}x${height}@${dpr}`;
  let sizes = caches.get(key);
  if (!sizes) {
    sizes = new Map();
    caches.set(key, sizes);
  }

  const hit = sizes.get(sizeKey);
  if (hit) {
    // A Map iterates in insertion order, so moving a hit to the back leaves the least
    // recently used size at the front, which is where eviction looks.
    if (sizes.size > 1) {
      sizes.delete(sizeKey);
      sizes.set(sizeKey, hit);
    }
    return hit;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  build(ctx, width, height);

  sizes.set(sizeKey, canvas);
  if (sizes.size > SIZES_PER_KEY) sizes.delete(sizes.keys().next().value);
  return canvas;
}

export function clearOffscreenCaches() {
  caches.clear();
}
