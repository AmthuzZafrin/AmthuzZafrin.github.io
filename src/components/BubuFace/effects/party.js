import { roundedRectPath } from '../render/path';

/**
 * celebrating: the party blower held in the lips, and the paper falling round it.
 *
 * Both are objects in front of the display rather than parts of it, so neither
 * takes the expression's glowColor and neither glows. Their colours come straight
 * off the reference emoji, sampled from it rather than guessed -- a party horn
 * that is purple-on-purple with the face reads as another facial feature.
 */

// The violet mouthpiece. Two ends of one colour rather than a flat fill, for the
// same reason the kiss heart is shaded: a cylinder is only a cylinder if the light
// runs off it, and the light here is up, matching the heart and the drool.
const GRIP_LIT = '#a89dff';
const GRIP_DEEP = '#5442b8';
// The collar between grip and tube, a shade brighter so the join reads as a part
// rather than as a bulge in the grip.
const COLLAR_LIT = '#b7aeff';
const COLLAR_DEEP = '#6a58d8';
// The rolled paper: blue body, magenta spots.
const PAPER_LIT = '#8fabf4';
const PAPER_DEEP = '#2c50b4';
const PAPER_MID = '#5075db';
const SPOT = '#e603ac';

/**
 * The horn's proportions, as fractions of the screen's width so the whole thing
 * scales with the face -- except `gap`, which is a fraction of the mouth's width,
 * because what it measures is clearance from the lips.
 *
 * Short thin shaft, big roll. That is what a party blower actually looks like at
 * rest: nearly all of its paper is wound up, and the bit sticking out of the collar
 * is a stub. The first pass had this the other way round, a long shaft with a small
 * curl on the end, which read as a wand rather than as something with paper in it.
 */
const HORN = {
  gap: 0.34,
  gripLen: 0.092,
  gripHalf: 0.013,
  collarLen: 0.02,
  collarHalf: 0.02,
  paperHalf: 0.0105,
  // How far the paper reaches, rolled up and shot out.
  paperMin: 0.024,
  paperMax: 0.275,
  // The roll's outer radius at those same two moments.
  coilMax: 0.092,
  coilMin: 0.018,
  // What the paper is wound around. The spiral stops here rather than at zero, so
  // the middle of the roll is a small hole and not a point.
  coreR: 0.01,
};

/**
 * The blow, on a loop: a hard shove out, a moment held, then a slower recoil and a
 * rest before the next one.
 *
 * Uneven on purpose, and the unevenness is the whole effect -- paper leaves a
 * blower much faster than it comes back, and an even out-and-back reads as
 * something being pumped rather than blown. The shoot eases only at its end, so it
 * starts at full speed; the recoil is smoothstepped at both ends because nothing
 * snaps on the way back.
 */
const BLOW_MS = 2600;
const SHOOT_END = 0.18;
const HOLD_END = 0.34;
const RECOIL_END = 0.62;

function uncoilAmount(phase) {
  if (phase < SHOOT_END) {
    const t = phase / SHOOT_END;
    return 1 - (1 - t) * (1 - t);
  }
  if (phase < HOLD_END) return 1;
  if (phase < RECOIL_END) {
    const t = (phase - HOLD_END) / (RECOIL_END - HOLD_END);
    return 1 - t * t * (3 - 2 * t);
  }
  return 0;
}

function bandGradient(ctx, half, lit, deep) {
  const g = ctx.createLinearGradient(0, -half, 0, half);
  g.addColorStop(0, lit);
  g.addColorStop(1, deep);
  return g;
}

/**
 * The lengthways glint along a cylinder -- a thin bright capsule just above its
 * centreline, inside its own silhouette.
 *
 * The top-to-bottom gradient alone gives a shape that shades correctly but still
 * looks matte. This is the second half of what makes it read as moulded plastic
 * and coated paper rather than as a coloured bar.
 */
function sheen(ctx, x, len, half, alpha) {
  if (len <= half) return;
  roundedRectPath(ctx, x + half * 0.6, -half * 0.66, len - half * 1.2, half * 0.36, half * 0.18);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fill();
}

/**
 * A point on the spiral the rolled paper follows, t running 0 at its outer end to
 * 1 at the middle.
 *
 * Split out from the path below because the spots have to sit on the paper, and
 * the radius at any point is well inside the roll's outer radius -- placing one at
 * that radius leaves it floating off the top of the roll, which is exactly what it
 * did.
 */
function coilPoint(cx, outerR, innerR, turns, t) {
  // Starts at the left of the roll, where the tube runs into it, and curls upward
  // first -- decreasing angle, since canvas y points down.
  const angle = Math.PI - t * turns * Math.PI * 2;
  const r = outerR - (outerR - innerR) * t;
  return { x: cx + Math.cos(angle) * r, y: Math.sin(angle) * r };
}

function coilPath(ctx, cx, outerR, innerR, turns) {
  ctx.beginPath();
  // Stepped by turn rather than by a fixed count, so a roll that has unwound to
  // half a turn is drawn with as many segments per turn as a full one.
  const steps = Math.max(12, Math.ceil(turns * 40));
  for (let i = 0; i <= steps; i++) {
    const { x, y } = coilPoint(cx, outerR, innerR, turns, i / steps);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
}

export function drawPartyHorn(ctx, geometry, tMs, config) {
  const { mouthCx, mouthY, mouthW, eyeH, screenW } = geometry;

  // The mouth's own centre, wherever the descriptor has put it -- the horn is held
  // at the lips, so it has to follow them rather than sit at a fixed height.
  const width = mouthW * (config?.mouthScale ?? 1);
  const y = mouthY + eyeH * (config?.mouthDrop ?? 0);

  const u = uncoilAmount((((tMs % BLOW_MS) + BLOW_MS) % BLOW_MS) / BLOW_MS);
  const s = (f) => screenW * f;
  const lerp = (a, b) => a + (b - a) * u;

  const gripLen = s(HORN.gripLen);
  const gripHalf = s(HORN.gripHalf);
  const collarLen = s(HORN.collarLen);
  const collarHalf = s(HORN.collarHalf);
  const paperHalf = s(HORN.paperHalf);
  const band = paperHalf * 2;
  const coreR = s(HORN.coreR);

  const paperStart = gripLen + collarLen;
  const paperLen = lerp(s(HORN.paperMin), s(HORN.paperMax));
  const paperEnd = paperStart + paperLen;
  const coilR = lerp(s(HORN.coilMax), s(HORN.coilMin));
  const coilCx = paperEnd + coilR;

  // The spiral is stroked down its middle, so its outer edge sits half a band
  // outside the path. Turns follow from the radius rather than being chosen: the
  // roll loses one band of radius per wrap, so a roll this deep holds exactly this
  // many. That is what makes it visibly unwind instead of just shrinking.
  const outerR = Math.max(band * 0.5, coilR - band / 2);
  const turns = Math.max(0.4, (outerR - coreR) / band);

  ctx.save();
  // Cleared explicitly: effects run after the mouth, and several mouth shapes leave
  // their glow on the shared context.
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Clear of the lips rather than between them. Everything past here is measured
  // along the horn, which runs straight out to the right.
  ctx.translate(mouthCx + width * HORN.gap, y);

  // 1. The paper, drawn before the grip so the collar overlaps its near end and
  //    hides the seam.
  roundedRectPath(ctx, paperStart, -paperHalf, paperLen, paperHalf * 2, paperHalf * 0.45);
  ctx.fillStyle = bandGradient(ctx, paperHalf, PAPER_LIT, PAPER_DEEP);
  ctx.fill();

  // Spots at a fixed spacing rather than a fixed count, so more of them come into
  // view as the paper pays out -- which is what shows that the tube is lengthening
  // and not merely being scaled.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = SPOT;
  const pitch = paperHalf * 4.6;
  for (let i = 0; i * pitch < paperLen + pitch; i++) {
    ctx.beginPath();
    ctx.ellipse(
      paperStart + pitch * (i + 0.55),
      paperHalf * (i % 2 ? -0.32 : 0.32),
      paperHalf * 0.6,
      paperHalf * 0.5,
      0, 0, Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
  sheen(ctx, paperStart, paperLen, paperHalf, 0.3);

  // 2. The roll. One spiral stroked three times, wide to narrow: dark at the full
  //    band width, mid inside that, light down the middle. Each turn ends up a
  //    bright core inside a dark rim, and because the turns abut exactly, adjacent
  //    rims meet as one dark seam -- which is the line you actually see between
  //    wraps of paper. A single stroke gave a flat disc with no seams at all, and
  //    two gave the seams no depth.
  const innerR = coreR;
  coilPath(ctx, coilCx, outerR, innerR, turns);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [w, colour] of [[1, PAPER_DEEP], [0.68, PAPER_MID], [0.28, PAPER_LIT]]) {
    ctx.lineWidth = band * w;
    ctx.strokeStyle = colour;
    ctx.stroke();
  }

  // One spot per turn, alternating between the top and the bottom of the roll so
  // they don't stack into a radial line.
  ctx.fillStyle = SPOT;
  for (let k = 0; k < Math.floor(turns); k++) {
    const { x, y: sy } = coilPoint(coilCx, outerR, innerR, turns, (k + (k % 2 ? 0.25 : 0.75)) / turns);
    ctx.beginPath();
    ctx.ellipse(x, sy, band * 0.28, band * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. The grip, then the collar over the paper's near end.
  roundedRectPath(ctx, 0, -gripHalf, gripLen, gripHalf * 2, gripHalf);
  ctx.fillStyle = bandGradient(ctx, gripHalf, GRIP_LIT, GRIP_DEEP);
  ctx.fill();
  sheen(ctx, 0, gripLen, gripHalf, 0.38);

  roundedRectPath(ctx, gripLen, -collarHalf, collarLen, collarHalf * 2, collarHalf * 0.4);
  ctx.fillStyle = bandGradient(ctx, collarHalf, COLLAR_LIT, COLLAR_DEEP);
  ctx.fill();

  ctx.restore();
}

/**
 * The paper's four colours, each with the darker edge its far side turns as it
 * tumbles. Sampled off the reference; it uses no more than these four.
 */
const CONFETTI = [
  { face: '#feae35', edge: '#b8720f' },
  { face: '#fc366b', edge: '#b60d40' },
  { face: '#2770df', edge: '#13459c' },
  { face: '#f7f501', edge: '#b0ae00' },
];

/**
 * One piece each: where it falls, how big, how long it takes to cross, and how
 * fast it turns. Sizes and speeds are all slightly different and the spins
 * alternate direction -- eight identical pieces fall as a grid, which reads as a
 * pattern rather than as paper.
 */
const PAPERS = [
  { x: 0.08, size: 0.055, fall: 5600, spin: 1.4, colour: 2 },
  { x: 0.21, size: 0.044, fall: 4400, spin: -1.9, colour: 0 },
  { x: 0.34, size: 0.06, fall: 6200, spin: 1.1, colour: 1 },
  { x: 0.46, size: 0.042, fall: 4900, spin: -1.5, colour: 3 },
  { x: 0.58, size: 0.057, fall: 5900, spin: 1.7, colour: 2 },
  { x: 0.7, size: 0.047, fall: 4600, spin: -1.2, colour: 0 },
  { x: 0.83, size: 0.052, fall: 6500, spin: 1.5, colour: 3 },
  { x: 0.93, size: 0.044, fall: 5200, spin: -1.8, colour: 1 },
];

/** celebrating: coloured paper tumbling down past the face. */
export function drawConfetti(ctx, geometry, tMs) {
  const { screenX, screenY, screenW, screenH, screenRadius } = geometry;

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  // Clipped to the screen: paper crossing the bezel would read as sitting in front
  // of the whole head rather than falling behind the glass.
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  PAPERS.forEach((paper, i) => {
    const size = screenW * paper.size;
    // The 0.37 stagger is what stops the eight of them entering at the top together
    // on the first cycle, which no amount of differing fall times would undo.
    const phase = ((tMs / paper.fall + i * 0.37) % 1 + 1) % 1;
    const sway = Math.sin(phase * Math.PI * 3 + i) * screenW * 0.02;
    const cx = screenX + screenW * paper.x + sway;
    const cy = screenY - size + phase * (screenH + size * 2);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((tMs / 1000) * paper.spin + i);
    const half = size / 2;
    roundedRectPath(ctx, -half, -half, size, size, half * 0.28);
    const { face, edge } = CONFETTI[paper.colour];
    // Across the piece's own diagonal, so the shading turns with it -- a fixed
    // light direction on a tumbling square looks like the colour is flickering.
    const shade = ctx.createLinearGradient(-half, -half, half, half);
    shade.addColorStop(0, face);
    shade.addColorStop(1, edge);
    ctx.fillStyle = shade;
    ctx.fill();
    ctx.restore();
  });

  ctx.restore();
}
