import { roundedRectPath } from '../render/path';

/**
 * The tone ramp across the cloth, sampled off the reference along a line perpendicular
 * to its main fold. `u` is the fraction of the way across, `v` a grey level 0-255.
 *
 * This ramp is the whole effect. The reference has no crease lines anywhere on it --
 * not one -- and every earlier attempt here failed the same way: draw creases and the
 * cloth reads as a folded paper fan, because a hard bright line beside a dark one is
 * exactly what a creased sheet of paper looks like. Fabric reads through broad tonal
 * variation instead, so all of this is one soft gradient.
 *
 * The shape of the ramp: a lit band where the cloth rolls over at the top, a shallow
 * trough behind the roll, the sheet's own lit face, then the deep valley where it falls
 * away, recovering a little at the hem. The range matters as much as the shape -- 248
 * down to 138 is a 44% drop, where the previous version spanned 255 to 198 and read as
 * one flat sheet.
 *
 * The floor goes deeper than the reference's own 159, and the valley is held open
 * wider. The emoji's shadows are being filled by bounce off a big yellow face sitting
 * directly behind them; there is nothing behind this cloth but black, so matching the
 * sampled numbers exactly under-reads.
 *
 * The stops come in PAIRS -- a near-flat plateau, then a fast transition to the next
 * one. This is the difference between cloth and airbrush, and it took a posterised
 * comparison against the reference to see it: a gradient interpolates at a constant
 * slope between two stops, so a ramp of evenly spaced stops has no flat anywhere and
 * no fast anywhere. Real cloth is the opposite. A fold turns the surface through most
 * of its angle in a short distance and then the sheet lies nearly flat between folds,
 * so the tone sits still and then moves quickly. Reading the pair count off the
 * reference: four plateaus, four transitions.
 */
const RAMP = [
  [0.0, 246],
  [0.13, 244],
  [0.2, 198],
  [0.31, 190],
  [0.39, 240],
  [0.54, 238],
  [0.66, 170],
  [0.78, 138],
  [0.88, 170],
  [1.0, 198],
];

/**
 * Grey to a cloth colour. The reference's shadows are warm (150,143,128) because they
 * are picking up bounce off a yellow face; there is no yellow here, and a neutral grey
 * over white reads as dirt rather than as shade, so the shadows lean cool instead.
 *
 * The blue is added as a fraction of the headroom left above `v`, so it never clamps --
 * a flat offset crushes the highlights to the same white and loses the top of the ramp.
 *
 * Only a little of it, though. This cloth sits against a purple glow, and at the 0.22
 * the mask's palette uses the whole tissue went lilac -- which on this face does not
 * read as a cool white, it reads as another thing that is lit up.
 */
function cloth(v) {
  return `rgb(${v},${v},${Math.round(v + (255 - v) * 0.12)})`;
}

/**
 * The silhouette, as offsets from the gathered tip in units of the cloth's own length.
 * Measured off the reference at 6x, with the tip taken where its two hidden edges meet
 * behind the face.
 *
 * Kept as a table of named corners rather than a formula because a sheet of cloth has
 * no formula -- the character is entirely in the corners. The three that matter are the
 * horn at the far left, the point below it, and the tail hanging off the bottom; drop
 * any of them and this is a triangle again.
 */
const P = {
  rightLower: { x: -0.151, y: 0.503 },
  tail: { x: -0.352, y: 0.658 },
  hemCorner: { x: -0.412, y: 0.538 },
  hemLeft: { x: -0.809, y: 0.588 },
  horn: { x: -0.754, y: 0.231 },
};

// Control points. The two through-point curves were solved so the quadratic passes
// exactly through a measured mid-edge point: C = 2*M - (P0 + P2)/2.
// Left edge through the bulge at (-0.719, 0.382); top edge through (-0.427, 0.090).
const C = {
  right1: { x: -0.038, y: 0.18 },
  right2: { x: -0.055, y: 0.36 },
  tailIn: { x: -0.235, y: 0.56 },
  tailOut: { x: -0.4, y: 0.585 },
  hem: { x: -0.611, y: 0.593 },
  // The left edge needs a cubic, not the quadratic it had. A quadratic ties the tangent
  // at the horn to the position of the bulge halfway along, and the two want opposite
  // things: the reference's edge leaves the horn almost straight down -- 0.030 sideways
  // for 0.111 of drop, a ratio of 0.27 -- and only then swings out. Forced through one
  // control, that came out at 0.79, and a horn whose edges part that fast is not a spike
  // at all. This was the whole reason it read blunt.
  left1: { x: -0.676, y: 0.434 },
  left2: { x: -0.72, y: 0.355 },
  top: { x: -0.477, y: 0.0645 },
};

// How far back from the tip the corner is rounded. The reference tucks its tip behind
// the face and never shows one; a sharp point here reads as a paper dart, so the two
// edges are joined by a short arc instead -- cloth pinched in a fist has a bunch, not
// a vertex.
const TIP_ROUND = 0.06;

/**
 * sneeze: a tissue held up to the face, gathered at the nose and falling away down and
 * to the left.
 *
 * BUBU has no nose, so the gather goes where one would be: on the face's centre line,
 * just below the eyes. The sheet hangs down-left from there exactly as the reference's
 * does, which means it covers the left third of the mouth. That is not a placement bug
 * -- it is what a tissue held to the nose actually does, and the reference's mouth only
 * stays clear of its own tissue because that face is a sphere and its mouth sits well
 * to the right of its nose. Here the mouth is directly underneath.
 *
 * Length is capped by the screen rather than chosen: at 0.55 of the screen's width the
 * lower-left point clears the left edge by 28 units and the tail clears the floor by 7.
 */
export function drawTissue(ctx, geometry) {
  const { screenX, screenY, screenW, screenH, screenRadius, mouthCx, eyeY, eyeH } = geometry;

  const L = screenW * 0.55;
  const tipX = mouthCx;
  const tipY = eyeY + eyeH + 15;
  const at = (p) => [tipX + p.x * L, tipY + p.y * L];

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // The tip's two rounded shoulders, each set back along the edge that leaves it.
  const unit = (p) => {
    const len = Math.hypot(p.x, p.y) || 1;
    return { x: (p.x / len) * TIP_ROUND, y: (p.y / len) * TIP_ROUND };
  };
  const shoulderR = unit(C.right1);
  const shoulderT = unit(C.top);

  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(...at(shoulderR));
    ctx.bezierCurveTo(...at(C.right1), ...at(C.right2), ...at(P.rightLower));
    ctx.quadraticCurveTo(...at(C.tailIn), ...at(P.tail));
    ctx.quadraticCurveTo(...at(C.tailOut), ...at(P.hemCorner));
    ctx.quadraticCurveTo(...at(C.hem), ...at(P.hemLeft));
    ctx.bezierCurveTo(...at(C.left1), ...at(C.left2), ...at(P.horn));
    ctx.quadraticCurveTo(...at(C.top), ...at(shoulderT));
    ctx.quadraticCurveTo(tipX, tipY, ...at(shoulderR));
    ctx.closePath();
  };

  // The tone ramp's axis: measured perpendicular to the fold, running from just inside
  // the top edge down across the sheet. Sampling three stations along the fold gave the
  // same profile at each, which is what says a single gradient can carry the whole form.
  const body = ctx.createLinearGradient(
    tipX - 0.516 * L, tipY + 0.215 * L,
    tipX - 0.352 * L, tipY + 0.548 * L,
  );
  for (const [u, v] of RAMP) body.addColorStop(u, cloth(v));

  outline();
  ctx.fillStyle = body;
  // Enough bloom to sit the cloth on the screen rather than look pasted to it, and no
  // more: the tissue is the one thing BUBU wears that is neither lit nor metal.
  ctx.shadowColor = 'rgba(255,255,255,0.25)';
  ctx.shadowBlur = L * 0.05;
  ctx.fill();

  outline();
  ctx.clip();
  ctx.shadowBlur = 0;

  // The sheet twists, so its right side sits brighter than one straight gradient can
  // predict -- measured 30 to 40 grey levels above the ramp there. A soft lift rather
  // than a second ramp, because the falloff has no edge to it.
  //
  // 40 levels off a base near 200 is about 0.16 of the headroom to white, so that is
  // the alpha. At 0.5 -- the first attempt -- this single wash flattened the whole ramp
  // back to the plain white sheet the ramp exists to get rid of.
  const lit = ctx.createRadialGradient(
    tipX - 0.16 * L, tipY + 0.32 * L, 0,
    tipX - 0.16 * L, tipY + 0.32 * L, 0.3 * L,
  );
  lit.addColorStop(0, 'rgba(255,255,255,0.16)');
  lit.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lit;
  ctx.fillRect(tipX - L, tipY, L, L);

  // The roll's specular, sitting just past the horn along the fold. The horn is the
  // end of a rolled-over edge, and a roll is a cylinder: it carries a long thin
  // highlight down its length, brightest where it turns most sharply. In the reference
  // this is the single brightest thing on the cloth, and without it the horn reads as a
  // flat spike cut out of paper rather than as the end of a fold.
  //
  // Elliptical, so it lies along the roll instead of pooling. Canvas has no elliptical
  // gradient, so the space is rotated to the fold's angle and scaled short across it.
  ctx.save();
  ctx.translate(tipX - 0.6 * L, tipY + 0.275 * L);
  ctx.rotate(0.246);
  ctx.scale(1, 0.26);
  const roll = ctx.createRadialGradient(0, 0, 0, 0, 0, 0.19 * L);
  roll.addColorStop(0, 'rgba(255,255,255,0.85)');
  roll.addColorStop(0.45, 'rgba(255,255,255,0.4)');
  roll.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = roll;
  ctx.beginPath();
  ctx.arc(0, 0, 0.19 * L, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // The tail. It hangs behind the sheet's own hem, so it is in the cloth's shadow --
  // in the reference it drops to 152 while the hem two centimetres above it reads 220.
  const shade = ctx.createRadialGradient(
    tipX - 0.34 * L, tipY + 0.65 * L, 0,
    tipX - 0.34 * L, tipY + 0.65 * L, 0.19 * L,
  );
  shade.addColorStop(0, 'rgba(96,104,124,0.55)');
  shade.addColorStop(1, 'rgba(96,104,124,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(tipX - 0.6 * L, tipY + 0.4 * L, 0.6 * L, 0.4 * L);

  // The gather. Where the cloth is bunched the folds crowd together and light cannot
  // reach between them, so the pinch is darker than the sheet it feeds.
  const gather = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 0.16 * L);
  gather.addColorStop(0, 'rgba(120,128,148,0.5)');
  gather.addColorStop(1, 'rgba(120,128,148,0)');
  ctx.fillStyle = gather;
  ctx.beginPath();
  ctx.arc(tipX, tipY, 0.16 * L, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
