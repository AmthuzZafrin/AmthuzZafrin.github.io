import { CRESCENT } from '../render/drawMouth';
import { roundedRectPath } from '../render/path';

const OOZE_MS = 4200;

/**
 * Three tones rather than one flat fill. A strand of liquid is a tube, and what
 * makes a tube read as round is that its edges are darker than its middle -- a
 * single colour, however well chosen, stays a flat bar no matter how it is shaped.
 * The sheen on top of that is the wet part: standing water carries a hard specular
 * streak, not a soft gradient, so it goes on at full strength and narrow.
 */
const WATER_DEEP = 'rgba(38,150,215,0.95)';
const WATER_LIGHT = 'rgba(150,230,255,0.97)';
const WATER_SHEEN = 'rgba(255,255,255,0.55)';

/**
 * Where each strand hangs, in the crescent's own parameter u -- 0 at the left
 * corner of the mouth, 1 at the right. Lengths are fractions of the mouth width.
 *
 * The two sit close together near the right corner. They used to be further apart,
 * bridged by a band of water tracing the lip, but that band read as a bar parked
 * under the mouth rather than as part of the drool, so it is gone and the strands
 * have closed up in its place. They still hang at slightly different heights, since
 * the lip is climbing towards the corner and each meets it where it is.
 */
const STRANDS = [
  { u: 0.79, length: 0.29 },
  { u: 0.9, length: 0.36 },
];

/** Enough to follow the lip across one strand's width; it barely bends over that span. */
const TOP_STEPS = 6;

/** Deep at both edges, bright just off centre -- the light is up and to the left. */
function tube(ctx, left, right) {
  const gradient = ctx.createLinearGradient(left, 0, right, 0);
  gradient.addColorStop(0, WATER_DEEP);
  gradient.addColorStop(0.38, WATER_LIGHT);
  gradient.addColorStop(1, WATER_DEEP);
  return gradient;
}

/**
 * drool: two strands of water hanging from the corner of the mouth.
 *
 * Nothing detaches. The reference holds a continuous stream rather than a falling
 * bead, so the strands only breathe -- their lengths drift out of phase with each
 * other, which keeps the face alive without turning the drool into a drip.
 *
 * Each strand starts on the lower lip exactly, which needs the mouth's own curve
 * (hence drawMouth exporting CRESCENT) and its drawn size (hence mouthScale and
 * mouthDrop being read off the descriptor -- the geometry only carries the unscaled
 * base). This assumes a 'crescent' mouth, true of the only expression using this
 * effect; change that shape and these anchors have to follow.
 */
export function drawDrool(ctx, geometry, tMs, config) {
  const { mouthCx, mouthY, mouthW, eyeH } = geometry;

  const width = mouthW * (config?.mouthScale ?? 1);
  const y = mouthY + eyeH * (config?.mouthDrop ?? 0);
  const halfW = width / 2;
  const bottomCtrl = width * CRESCENT.bottomCtrl;

  const lipX = (u) => mouthCx + halfW * (2 * u - 1);
  // The blunt term is not decoration: rounding the mouth's corners pushes its whole
  // bottom edge down by that much, and without it the water floats above the lip.
  const lipY = (u) => y + width * CRESCENT.blunt + 2 * u * (1 - u) * bottomCtrl;

  /**
   * The lip's *inner* edge at a given x -- the boundary between the rim stroke and
   * the mouth's dark fill, which is where the water starts.
   *
   * lipY is the stroke's centreline and a stroke straddles its path, so the inner
   * edge is half a rim above it. Effects draw after the mouth, so the water then
   * covers the rim across its own width, which is the point: it reads as running
   * out over the lip rather than as beginning underneath it.
   */
  const lipAt = (px) => lipY((px - (mouthCx - halfW)) / width) - width * CRESCENT.rim * 0.5;

  const strandW = width * 0.09;
  const half = strandW / 2;

  ctx.save();
  ctx.shadowColor = WATER_DEEP;
  ctx.shadowBlur = width * 0.03;

  STRANDS.forEach((strand, index) => {
    const offset = index * OOZE_MS * 0.37;
    const phase = ((((tMs + offset) % OOZE_MS) + OOZE_MS) % OOZE_MS) / OOZE_MS;
    const ooze = 0.82 + 0.18 * Math.sin(phase * Math.PI * 2);

    const x = lipX(strand.u);
    const top = lipAt(x);
    const length = width * strand.length * ooze;
    // The tip is wider than the strand feeding it. Liquid hanging off something
    // gathers at the bottom before it lets go, and a strand of even width reads as
    // a drawn line instead -- this is most of what separates the two.
    const bead = strandW * 0.62;

    // Tapered, not a parallel-sided bar. A strand is widest where it leaves the
    // lip and thins as it stretches, and the sides pinch inward rather than running
    // straight -- with even sides this read as a drawn tube however it was shaded.
    const bodyLength = Math.max(length - bead, strandW);
    const topHalf = half * 1.15;
    const footHalf = half * 0.72;
    // The top edge is not level: it follows the lip, which is climbing towards the
    // corner, so the right side of each strand sits higher than its left. Traced
    // along the curve rather than cut as a straight chord between the two corners,
    // which is what makes it meet the lip along its whole width instead of at the
    // ends only.
    ctx.fillStyle = tube(ctx, x - topHalf, x + topHalf);
    ctx.beginPath();
    ctx.moveTo(x - topHalf, lipAt(x - topHalf));
    ctx.quadraticCurveTo(x - topHalf, top + bodyLength * 0.55, x - footHalf, top + bodyLength);
    ctx.lineTo(x + footHalf, top + bodyLength);
    ctx.quadraticCurveTo(x + topHalf, top + bodyLength * 0.55, x + topHalf, lipAt(x + topHalf));
    for (let i = TOP_STEPS - 1; i >= 0; i--) {
      const px = x - topHalf + 2 * topHalf * (i / TOP_STEPS);
      ctx.lineTo(px, lipAt(px));
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = tube(ctx, x - bead, x + bead);
    ctx.beginPath();
    ctx.arc(x, top + bodyLength, bead, 0, Math.PI * 2);
    ctx.fill();

    // Held clear of both ends: a highlight running the full length would outline
    // the strand rather than sit on it.
    const sheenW = strandW * 0.22;
    const sheenLength = Math.max(0, bodyLength - strandW * 0.9);
    if (sheenLength > 0) {
      ctx.fillStyle = WATER_SHEEN;
      roundedRectPath(ctx, x - topHalf + strandW * 0.26, top + strandW * 0.45, sheenW, sheenLength, sheenW / 2);
      ctx.fill();
    }
  });

  ctx.restore();
}
