// Icy white-blue, its own colour rather than the expression's glowColor: the
// flakes are weather around the face, not part of the display, the same way the
// sweat drops keep their cyan.
const ICE = '#d9f1ff';

/**
 * One six-pointed flake: three arms crossing at the centre, each end carrying a
 * pair of barbs angled back along the arm.
 *
 * Three full-length lines rather than six spokes -- a line through the centre is
 * two opposite arms at once, so the shape closes up exactly instead of relying on
 * six endpoints all meeting in the middle.
 */
function drawFlake(ctx, cx, cy, size, rotation, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();

  for (let i = 0; i < 3; i++) {
    const armAngle = (i * Math.PI) / 3;
    const dx = Math.cos(armAngle) * size;
    const dy = Math.sin(armAngle) * size;
    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);

    // Barbs on both ends of this arm. `sign` flips which end, and the barb angle
    // is measured from that end's outward direction so they always splay away
    // from the centre.
    for (const sign of [1, -1]) {
      const outward = armAngle + (sign > 0 ? 0 : Math.PI);
      const bx = dx * sign * 0.5;
      const by = dy * sign * 0.5;
      for (const spread of [0.6, -0.6]) {
        ctx.moveTo(bx, by);
        ctx.lineTo(
          bx + Math.cos(outward + spread) * size * 0.34,
          by + Math.sin(outward + spread) * size * 0.34,
        );
      }
    }
  }

  ctx.lineWidth = Math.max(1, size * 0.13);
  ctx.lineCap = 'round';
  ctx.strokeStyle = ICE;
  ctx.shadowColor = ICE;
  ctx.shadowBlur = size * 0.7;
  ctx.stroke();
  ctx.restore();
}

// Positions as fractions of the screen, sizes as a fraction of its width. Five
// flakes ringing the face at the edges, three left and two right, at mixed sizes
// -- straight off the reference, which is deliberately lopsided.
const FLAKES = [
  { x: 0.11, y: 0.13, size: 0.055 },
  { x: 0.89, y: 0.15, size: 0.05 },
  { x: 0.08, y: 0.46, size: 0.075 },
  { x: 0.16, y: 0.81, size: 0.088 },
  { x: 0.92, y: 0.64, size: 0.07 },
];

/**
 * cold: snowflakes drifting around the face.
 *
 * Each flake turns slowly and twinkles, both driven from tMs alone like every
 * other effect. The per-flake phase offset is what stops the five of them
 * rotating and brightening in lockstep, which reads as one rigid object.
 */
export function drawSnowflakes(ctx, geometry, tMs) {
  const { screenX, screenY, screenW, screenH } = geometry;

  FLAKES.forEach((flake, i) => {
    const phase = tMs / 1000 + i * 1.3;
    const alpha = 0.7 + 0.3 * Math.sin(phase * 1.6);
    drawFlake(
      ctx,
      screenX + screenW * flake.x,
      screenY + screenH * flake.y,
      screenW * flake.size,
      phase * 0.25,
      alpha,
    );
  });
}
