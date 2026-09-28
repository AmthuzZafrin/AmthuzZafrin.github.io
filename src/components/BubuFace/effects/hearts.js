const RISE_MS = 2600;

const HEARTS = [
  { dx: -0.5, size: 0.22, delay: 0 },
  { dx: 1.6, size: 0.28, delay: RISE_MS * 0.4 },
  { dx: 0.55, size: 0.18, delay: RISE_MS * 0.7 },
];

function heartPath(ctx, cx, cy, size) {
  const w = size / 2;
  const top = cy - size * 0.32;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.42);
  ctx.bezierCurveTo(cx - w * 1.5, cy - size * 0.1, cx - w * 0.85, top - size * 0.4, cx, top);
  ctx.bezierCurveTo(cx + w * 0.85, top - size * 0.4, cx + w * 1.5, cy - size * 0.1, cx, cy + size * 0.42);
  ctx.closePath();
}

/**
 * kissing: the single big heart leaving the puckered lips.
 *
 * Unlike drawFloatingHearts this one never fades out -- the reference emoji
 * keeps its heart on screen permanently, so a rise-and-vanish cycle would read
 * as a different gesture. It breathes and drifts slightly instead, which keeps
 * it alive without it ever leaving.
 *
 * Red rather than the expression's pink: the emoji's heart is red, and against
 * kissing's pink lips a pink heart loses its edge.
 */
const KISS_HEART_RED = '#ff2f4d';

/**
 * The lit and shadowed ends of that red, for the body's shading.
 *
 * A heart filled with one colour reads as a symbol -- a sticker of a heart. What
 * makes it an object is that its two lobes are round, and roundness is carried
 * entirely by the fill running light on one side and dark on the other. The light
 * is up and to the left, as it is on the drool, so the two agree.
 */
const KISS_HEART_LIT = '#ff97a4';
const KISS_HEART_DEEP = '#8e0c22';

export function drawKissHeart(ctx, geometry, tMs) {
  const { mouthCx, mouthY, mouthW } = geometry;

  // One slow cycle: scale breathes and the heart eases outward a touch.
  const t = Math.sin((tMs / 1400) * Math.PI * 2);
  const size = mouthW * 0.95 * (1 + t * 0.05);
  // Far enough right to clear the centred pucker's outer bumps.
  const cx = mouthCx + mouthW * 1.05 + t * mouthW * 0.05;
  const cy = mouthY + mouthW * 0.1 - t * mouthW * 0.04;

  // Where the light sits: over the crown of the left lobe, up and to the left.
  const litX = cx - size * 0.3;
  const litY = cy - size * 0.34;

  ctx.save();

  // 1. The halo. Flat red under its own shadow rather than the shaded fill below,
  //    so the light spilling off the heart stays one colour -- a shaded fill drags
  //    its shadow light on one side and dark on the other, which reads as a smudge
  //    behind the shape instead of as glow coming off it.
  heartPath(ctx, cx, cy, size);
  ctx.fillStyle = KISS_HEART_RED;
  ctx.shadowColor = KISS_HEART_RED;
  ctx.shadowBlur = size * 0.35;
  ctx.fill();

  // 2. The body, over the top of that flat fill. The gradient is centred on the
  //    light and not on the heart, so its falloff runs diagonally across both lobes
  //    and darkest into the point -- which is what makes the lobes read as round.
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  //    The outer radius is a hair under the heart's own reach from the light -- the
  //    far edge of the right lobe sits about 0.93 size away -- so the dark end of the
  //    ramp is actually reached on the body instead of falling off past it. At 1.15
  //    it was, and the shaded side stayed the same red as the lit one.
  const body = ctx.createRadialGradient(litX, litY, size * 0.05, litX, litY, size * 0.95);
  body.addColorStop(0, KISS_HEART_LIT);
  body.addColorStop(0.35, KISS_HEART_RED);
  body.addColorStop(1, KISS_HEART_DEEP);
  ctx.fillStyle = body;
  ctx.fill();

  // 3. The specular -- the small bright patch a glossy surface throws straight back,
  //    and the one thing that separates something wet-looking from something matte.
  //    Clipped to the heart (the fill above leaves it as the current path) and faded
  //    to nothing at its own edge, so it sits on the surface rather than on top of it.
  ctx.clip();
  const gloss = ctx.createRadialGradient(litX, litY, 0, litX, litY, size * 0.26);
  gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(litX, litY, size * 0.26, size * 0.19, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Red, matching the kiss heart above and the heart eyes in drawEye.js. It was a mid
// pink, which on a face whose own glow is pink left the hearts reading as part of the
// display rather than as objects drifting past it.
const FLOATING_HEART_RED = '#ff2f4d';

/** heart / celebrating: hearts drifting upward past the face. */
export function drawFloatingHearts(ctx, geometry, tMs) {
  const { leftEyeX, eyeY, eyeW, eyeH } = geometry;
  const startY = eyeY + eyeH * 2.2;
  const distance = eyeH * 3.6;

  HEARTS.forEach((heart) => {
    const phase = (((tMs + heart.delay) % RISE_MS) + RISE_MS) % RISE_MS / RISE_MS;
    const alpha = phase < 0.15 ? phase / 0.15 : Math.max(0, (1 - phase) / 0.5);
    if (alpha <= 0.01) return;

    // slight side-to-side drift so they don't rise in straight columns
    const sway = Math.sin(phase * Math.PI * 2 + heart.delay) * eyeW * 0.12;
    const cx = leftEyeX + eyeW * heart.dx + sway;
    const cy = startY - distance * phase;

    ctx.save();
    ctx.globalAlpha = Math.min(alpha, 1);
    heartPath(ctx, cx, cy, eyeW * heart.size);
    ctx.fillStyle = FLOATING_HEART_RED;
    ctx.shadowColor = FLOATING_HEART_RED;
    ctx.shadowBlur = eyeW * heart.size * 0.9;
    ctx.fill();
    ctx.restore();
  });
}
