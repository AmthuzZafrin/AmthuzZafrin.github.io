const FALL_MS = 1600;

// The pale blue every drop here has always been, kept for the halo so the glow
// around them is unchanged, plus the two ends of it the body now runs between.
const WATER = 'rgba(150,205,255,0.9)';
const WATER_THIN = 'rgba(168,216,255,0.5)';
const WATER_DEEP = 'rgba(92,166,236,0.95)';
// The edge. A drop is brightest at its rim because that is where you are looking
// through the most water, and that bright outline is most of what separates a real
// drop from a blue blob.
const WATER_RIM = 'rgba(219,244,255,0.78)';

/**
 * One drop of water.
 *
 * Shared by every drop on the face -- the tears, the sweat, the fright drops and
 * awkward's forehead bead -- so all of them are the same substance, which is the
 * point: they differ by where they sit and how they move, never by what they are.
 *
 * Four passes, and each does something a flat fill cannot. The halo keeps its own
 * flat colour so the glow stays one colour rather than smearing light-to-dark. The
 * body runs thin at the point and dense at the base, because a hanging drop really
 * does gather its water at the bottom. The rim is stroked *inside* a clip of the
 * same path, so only its inner half lands and the silhouette stays exact. And the
 * two highlights are the giveaway that it is water and not glass: a specular up on
 * the shoulder where the light is, and the small bright pool a drop throws near its
 * base by focusing that same light through itself.
 */
function drawDrop(ctx, cx, cy, size, alpha) {
  // teardrop: pointed at the top, round at the bottom
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.bezierCurveTo(cx + size * 0.9, cy - size * 0.1, cx + size * 0.65, cy + size * 0.75, cx, cy + size * 0.75);
    ctx.bezierCurveTo(cx - size * 0.65, cy + size * 0.75, cx - size * 0.9, cy - size * 0.1, cx, cy - size);
    ctx.closePath();
  };

  ctx.save();
  ctx.globalAlpha = alpha;

  path();
  ctx.fillStyle = WATER;
  ctx.shadowColor = WATER;
  ctx.shadowBlur = size * 1.2;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  const body = ctx.createLinearGradient(cx, cy - size, cx, cy + size * 0.75);
  body.addColorStop(0, WATER_THIN);
  body.addColorStop(0.55, WATER);
  body.addColorStop(1, WATER_DEEP);
  path();
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  path();
  ctx.clip();

  path();
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = WATER_RIM;
  ctx.stroke();

  const specX = cx - size * 0.3;
  const specY = cy + size * 0.05;
  const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, size * 0.42);
  spec.addColorStop(0, 'rgba(255,255,255,0.8)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.ellipse(specX, specY, size * 0.32, size * 0.42, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = spec;
  ctx.fill();

  const poolX = cx + size * 0.16;
  const poolY = cy + size * 0.44;
  const pool = ctx.createRadialGradient(poolX, poolY, 0, poolX, poolY, size * 0.3);
  pool.addColorStop(0, 'rgba(255,255,255,0.5)');
  pool.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.ellipse(poolX, poolY, size * 0.3, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = pool;
  ctx.fill();

  ctx.restore();
  ctx.restore();
}

/**
 * crying: tears streaming down from the inner corner of each eye.
 *
 * Two staggered drops per eye so the stream reads as continuous without ever
 * having more than a couple of shapes on screen. Animated purely from tMs, like
 * every other effect -- no internal timers, so it stays in step with the single
 * requestAnimationFrame loop.
 */
export function drawTears(ctx, geometry, tMs) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, eyeH } = geometry;
  // Bigger than the beads drawSweatDrops and drawLaughTears run: this is the one
  // placement meant to be read as crying, and it is the only user of this effect.
  const size = eyeW * 0.16;
  const startY = eyeY + eyeH * 0.82;
  const distance = eyeH * 2.6;

  const columns = [leftEyeX + eyeW * 0.28, rightEyeX + eyeW * 0.72];

  columns.forEach((cx, columnIndex) => {
    for (let drop = 0; drop < 2; drop++) {
      const offset = (columnIndex * 0.35 + drop * 0.5) * FALL_MS;
      const phase = (((tMs + offset) % FALL_MS) + FALL_MS) % FALL_MS / FALL_MS;
      // fade in quickly at the eye, fade out as it leaves the face
      const alpha = phase < 0.15 ? phase / 0.15 : Math.max(0, (1 - phase) / 0.45);
      drawDrop(ctx, cx, startY + distance * phase, size, Math.min(alpha, 1));
    }
  });
}

/**
 * scared: tiny beads of sweat running down from the forehead.
 *
 * Same droplet as the tears, and that's the whole trick -- what makes it read
 * as sweat rather than crying is that it's much smaller and starts above the
 * eyes instead of at them. Staggered half a cycle apart so the two temples
 * never bead at the same instant, which would look mechanical.
 */
const SWEAT_CYCLE_MS = 2000;

export function drawSweatDrops(ctx, geometry, tMs, config) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, screenY } = geometry;
  const forehead = eyeY - screenY;
  // Scaled per expression rather than globally: 'scared' wants these barely
  // there, 'hot' wants them obvious, and one size can't be both.
  const size = eyeW * 0.075 * (config?.sweatScale ?? 1);
  const startY = screenY + forehead * 0.22;
  const distance = forehead * 0.8;

  [leftEyeX + eyeW * 0.12, rightEyeX + eyeW * 0.88].forEach((cx, i) => {
    const offset = i * SWEAT_CYCLE_MS * 0.5;
    const phase = (((tMs + offset) % SWEAT_CYCLE_MS) + SWEAT_CYCLE_MS) % SWEAT_CYCLE_MS / SWEAT_CYCLE_MS;
    const alpha = phase < 0.18 ? phase / 0.18 : Math.max(0, (1 - phase) / 0.5);
    drawDrop(ctx, cx, startY + distance * phase, size, Math.min(alpha, 1));
  });
}

const FRIGHT_CYCLE_MS = 1500;

/**
 * Where the drops sit, in screen-box fractions. Hand-placed rather than random: the
 * effect has to be a pure function of tMs like every other one, and a fresh
 * Math.random per frame would make each drop jitter about within a single fall.
 * Kept to the margins and the forehead, clear of the eyes and mouth, and deliberately
 * uneven -- six drops on a tidy grid read as a pattern rather than as a cold sweat.
 */
const FRIGHT_SPOTS = [
  { x: 0.12, y: 0.08 },
  { x: 0.84, y: 0.17 },
  { x: 0.33, y: 0.03 },
  { x: 0.95, y: 0.5 },
  { x: 0.66, y: 0.06 },
  { x: 0.05, y: 0.43 },
];

/**
 * scared: beads breaking out all over the head at once.
 *
 * Distinct from drawSweatDrops, which runs a continuous stream down both temples.
 * A stream reads as exertion; these all appear together, hold, and fade together,
 * which reads as a face breaking out in a cold sweat.
 *
 * One shared phase for every spot, so they stay in step. That is the whole difference
 * from drawSweatDrops, which exists to keep its drops *out* of step.
 */
export function drawFrightDrops(ctx, geometry, tMs, config) {
  const { screenX, screenY, screenW, screenH, eyeW } = geometry;
  const size = eyeW * 0.075 * (config?.sweatScale ?? 1);

  const phase = (((tMs % FRIGHT_CYCLE_MS) + FRIGHT_CYCLE_MS) % FRIGHT_CYCLE_MS) / FRIGHT_CYCLE_MS;
  const alpha = Math.min(1, phase < 0.18 ? phase / 0.18 : Math.max(0, (1 - phase) / 0.5));

  FRIGHT_SPOTS.forEach((spot) => {
    const cx = screenX + screenW * spot.x;
    const cy = screenY + screenH * spot.y + screenH * 0.14 * phase;
    drawDrop(ctx, cx, cy, size, alpha);
  });
}

/**
 * awkward: the single bead at the side of the forehead, as in the
 * grinning-face-with-sweat emoji.
 *
 * Distinct from drawSweatDrops, which runs two beads down both temples on a
 * loop. This one is a fixed feature of the face -- the emoji holds its drop
 * permanently -- so it never falls and never fades, and only bobs enough to
 * avoid looking dead on an otherwise moving face.
 */
export function drawSweatBead(ctx, geometry, tMs) {
  const { rightEyeX, eyeY, eyeW, screenY } = geometry;
  const forehead = eyeY - screenY;
  const size = eyeW * 0.44;
  const bob = Math.sin((tMs / 1600) * Math.PI * 2) * size * 0.16;

  // The mirror of where it used to sit: leftEyeX - eyeW * 0.05 is the same distance
  // outside the left eye that this is outside the right one.
  const cx = rightEyeX + eyeW * 1.05;
  // Anchored off its own tip as well as off the forehead. drawDrop runs from
  // cy - size to cy + size * 0.75, so at this larger size the old flat 0.46 of the
  // forehead put the point above the screen's top edge, where the bezel cut it off.
  // Taking whichever is lower keeps a margin under the edge at any size.
  const cy = Math.max(screenY + forehead * 0.46, screenY + size + eyeW * 0.06);

  drawDrop(ctx, cx, cy + bob, size, 1);
}

/**
 * worry: one tear resting on the right cheek, as in the sad-but-relieved emoji.
 *
 * The third placement of the same droplet, and the position is what separates
 * them: drawTears streams from both eyes, drawSweatDrops runs down both
 * temples, drawSweatBead sits high on the right forehead. This one sits beside
 * and below the right eye, and like the forehead bead it never falls -- the
 * reference holds it in place.
 */
export function drawCheekTear(ctx, geometry, tMs) {
  const { rightEyeX, eyeY, eyeW, eyeH, screenX, screenW } = geometry;
  const size = eyeW * 0.38;
  const bob = Math.sin((tMs / 1800) * Math.PI * 2) * size * 0.14;

  // Centred in the gap between the eye's outer edge and the edge of the screen,
  // rather than pinned a fixed step outside the eye. At the old 1.02 of an eye width
  // the drop's own body reached back over the frame's corner, and every increase in
  // size pushed it further in -- the gap's midpoint is the one placement that cannot,
  // because it is the furthest point from both edges at once.
  //
  // drawDrop's widest point sits about 0.65 of its size either side of centre. The
  // gap here is 82.7 units against 0.65 x 45.7, so roughly 12 units stay clear on the
  // frame side and on the bezel side alike.
  const cx = (rightEyeX + eyeW + screenX + screenW) / 2;

  drawDrop(ctx, cx, eyeY + eyeH * 0.95 + bob, size, 1);
}

/** laughing: tears squeezed out at the outer corners, slower than the crying pair. */
export function drawLaughTears(ctx, geometry, tMs) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, eyeH } = geometry;
  // No longer the smallest droplet here: the reference wears its joy-tears as big
  // as its eyes, and at the old 0.1 they read as sweat beads. Past drawTears' 0.16
  // now, which is fine -- these are the ones the expression is named for.
  const size = eyeW * 0.18;
  const startY = eyeY + eyeH * 0.6;
  const distance = eyeH * 1.4;

  [leftEyeX - eyeW * 0.06, rightEyeX + eyeW * 1.06].forEach((cx, i) => {
    const phase = (((tMs + i * 700) % 2200) + 2200) % 2200 / 2200;
    const alpha = phase < 0.2 ? phase / 0.2 : Math.max(0, (1 - phase) / 0.5);
    drawDrop(ctx, cx, startY + distance * phase, size, Math.min(alpha, 1));
  });
}
