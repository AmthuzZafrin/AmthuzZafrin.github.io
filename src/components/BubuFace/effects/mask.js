import { roundedRectPath } from '../render/path';

// The mask's own blue, sampled off the reference: lighter across the top
// (230,244,253) and deeper towards the chin (184,222,245).
const CLOTH_LIGHT = '#e6f4fd';
const CLOTH_DEEP = '#b8def5';
// The pleat creases. A muted blue rather than a grey -- on this near-black screen a
// grey line over pale blue reads as a scratch in the surface.
const PLEAT = '110,168,208';
// The bound edge and the ear loops, which are the same cream in the reference.
const BAND = '#f7f2e6';

/**
 * Traces the mask's outline: wider at the top than the bottom, its top edge bowed
 * gently down and its bottom edge bowed further down.
 *
 * The two bows are not decoration. A mask with straight edges reads as a envelope
 * taped over the face; the bows are what make it sit *on* something.
 */
function maskPath(ctx, m) {
  const { cx, top, bottom, halfTop, halfBottom, height } = m;
  // A quadratic reaches half its control offset at its midpoint, hence the doubling.
  const topBow = height * 0.08 * 2;
  const bottomBow = height * 0.14 * 2;
  const sideY = top + height * 0.6;

  ctx.beginPath();
  ctx.moveTo(cx - halfTop, top);
  ctx.quadraticCurveTo(cx, top + topBow, cx + halfTop, top);
  ctx.quadraticCurveTo(cx + halfTop, sideY, cx + halfBottom, bottom);
  ctx.quadraticCurveTo(cx, bottom + bottomBow, cx - halfBottom, bottom);
  ctx.quadraticCurveTo(cx - halfTop, sideY, cx - halfTop, top);
  ctx.closePath();
}

/**
 * One ear loop: from a corner of the mask out to the edge of the screen.
 *
 * In the reference these end on the face's own silhouette. There is no silhouette
 * here, so they run to the screen's edge and the caller's clip takes them -- which
 * reads the same way, as a strap continuing around behind the head.
 */
function strap(ctx, x0, y0, x1, y1, lift, w0, w1) {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + lift;

  // Filled between two offset curves rather than stroked, because a stroke is one
  // width for its whole length and elastic is not: it is thickest where it is sewn
  // into the cloth and thins as it runs away to the ear. Sampled along the quadratic,
  // offsetting each point along the curve's own normal by the half-width there.
  const STEPS = 18;
  const pts = [];
  for (let i = 0; i <= STEPS; i += 1) {
    const t = i / STEPS;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t ** 2 * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * my + t ** 2 * y1;
    const dx = 2 * (1 - t) * (mx - x0) + 2 * t * (x1 - mx);
    const dy = 2 * (1 - t) * (my - y0) + 2 * t * (y1 - my);
    const len = Math.hypot(dx, dy) || 1;
    pts.push({ x, y, nx: -dy / len, ny: dx / len, hw: (w0 + (w1 - w0) * t) / 2 });
  }

  ctx.beginPath();
  pts.forEach((p, i) => {
    const px = p.x + p.nx * p.hw;
    const py = p.y + p.ny * p.hw;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  });
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    ctx.lineTo(p.x - p.nx * p.hw, p.y - p.ny * p.hw);
  }
  ctx.closePath();
  ctx.fillStyle = BAND;
  ctx.fill();
}

/**
 * mask: the medical-mask emoji -- a surgical mask covering the lower face, with the
 * eyes left plain above it.
 *
 * Drawn as an effect so it lands after the eyes and genuinely covers what is under
 * it. The expression switches the brow and the mouth off as well rather than relying
 * on that cover, the same way 'peaking' does: the mouth's glow bloom is wider than
 * the mouth itself and would haze straight through the cloth.
 *
 * Sized off screenW rather than screenH. The reference's face is a circle, so its
 * proportions can be read either way, but this screen is half again as wide as it is
 * tall -- taking the mask's height from screenH makes it a tall bib.
 *
 * The cloth is opaque. Everything else BUBU wears is either glowing or metal, so the
 * temptation is to make this glow too, but a mask that glows stops reading as fabric.
 * It gets a soft bloom around its edge instead, which is enough to keep it from
 * looking pasted onto the screen.
 */
export function drawFaceMask(ctx, geometry) {
  const { screenX, screenY, screenW, screenH, screenRadius, eyeY, eyeH } = geometry;

  // Bigger than the 0.44 x 0.65 it was, but wider rather than taller -- there is no
  // room to be taller. The mask has to live in the 204 units between the eyes' bottom
  // and the screen floor, and it reaches further into that band than its `height`
  // suggests: the lower edge bows down another 0.14 of the height past `bottom`, the
  // binding straddles both edges by half its own 0.075, and the ear loops rise past
  // the top corners. Ink actually spans about 1.27 heights.
  //
  // So height is capped near 146 whatever else changes, and the growth goes sideways,
  // where the screen has room to spare. This is 20% wider than the original with the
  // same height, and the aspect drops from 0.65 to 0.55 to pay for it -- a departure
  // from the reference, but the reference's face is a circle and this screen is not.
  const width = screenW * 0.53;
  const height = width * 0.55;
  const m = {
    cx: screenX + screenW / 2,
    // Clear of the eyes by 10 units of face plus the ear loops' own rise above the
    // top corners, which is what the corners were touching before. Anchored to the
    // eyes rather than to a fraction of the screen so it cannot drift onto them.
    top: eyeY + eyeH + 10 + height * 0.0875,
    halfTop: width / 2,
    // The reference tapers to 0.83 of its top width at the chin.
    halfBottom: width * 0.415,
    height,
  };
  m.bottom = m.top + height;

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // 1. Ear loops, under the body so their inner ends are covered by it rather than
  // stopping in a visible butt joint against its edge.
  // Thinner than the 0.11 of the mask's height this was -- at that width the four of
  // them read as painted bars rather than as elastic -- and thinning again along
  // their length, to 0.55 of what they leave the cloth at.
  const loopW = height * 0.055;
  const edgeL = screenX - loopW;
  const edgeR = screenX + screenW + loopW;
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.3)';
  ctx.shadowBlur = height * 0.08;
  // The upper loops rise only a little on their way out. Any more and they cross the
  // eyes, which sit barely a tenth of the mask's height above its top corners.
  const ear = loopW * 0.55;
  strap(ctx, m.cx - m.halfTop, m.top + height * 0.06, edgeL, m.top - height * 0.06, -height * 0.03, loopW, ear);
  strap(ctx, m.cx + m.halfTop, m.top + height * 0.06, edgeR, m.top - height * 0.06, -height * 0.03, loopW, ear);
  strap(ctx, m.cx - m.halfBottom, m.bottom - height * 0.05, edgeL, m.bottom + height * 0.12, height * 0.05, loopW, ear);
  strap(ctx, m.cx + m.halfBottom, m.bottom - height * 0.05, edgeR, m.bottom + height * 0.12, height * 0.05, loopW, ear);
  ctx.restore();

  // 2. The cloth, lighter at the top than the bottom.
  const cloth = ctx.createLinearGradient(0, m.top, 0, m.bottom);
  cloth.addColorStop(0, CLOTH_LIGHT);
  cloth.addColorStop(1, CLOTH_DEEP);
  ctx.save();
  maskPath(ctx, m);
  ctx.fillStyle = cloth;
  ctx.shadowColor = 'rgba(190,225,250,0.5)';
  ctx.shadowBlur = height * 0.18;
  ctx.fill();
  ctx.restore();

  // 3. The bound edge. Stroked on the same path, so half its width lies outside the
  // cloth and half over it -- which is exactly how the reference's binding reads.
  ctx.save();
  maskPath(ctx, m);
  ctx.lineWidth = height * 0.075;
  ctx.strokeStyle = BAND;
  ctx.stroke();
  ctx.restore();

  // 4. Pleats, clipped to the cloth so they stop at the binding instead of crossing
  // it. Bowed the same way the bottom edge is, so they sit on the same surface.
  ctx.save();
  maskPath(ctx, m);
  ctx.clip();

  // Across the mask, not just down it. The vertical gradient in the fill gives the
  // cloth a top and a bottom but leaves it flat side to side, which is what made it
  // read as a cut-out; this darkens both edges so it wraps around something.
  const wrap = ctx.createLinearGradient(m.cx - m.halfTop, 0, m.cx + m.halfTop, 0);
  wrap.addColorStop(0, `rgba(${PLEAT},0.34)`);
  wrap.addColorStop(0.3, `rgba(${PLEAT},0)`);
  wrap.addColorStop(0.7, `rgba(${PLEAT},0)`);
  wrap.addColorStop(1, `rgba(${PLEAT},0.34)`);
  ctx.fillStyle = wrap;
  ctx.fillRect(m.cx - m.halfTop, m.top - height, m.halfTop * 2, height * 3);

  // Each pleat is a fold, not a line: the cloth turns away from the light below the
  // crease and back towards it above. One stroke gave the crease and nothing else,
  // which is why the three of them read as ruling on a flat sheet.
  const pleatLine = (t, offset, colour, w) => {
    const y = m.top + height * t + offset;
    const half = m.halfTop + (m.halfBottom - m.halfTop) * t;
    ctx.beginPath();
    ctx.moveTo(m.cx - half, y);
    ctx.quadraticCurveTo(m.cx, y + height * 0.16, m.cx + half, y);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.strokeStyle = colour;
    ctx.stroke();
  };

  for (const t of [0.34, 0.56, 0.78]) {
    pleatLine(t, -height * 0.035, 'rgba(255,255,255,0.55)', height * 0.03);
    pleatLine(t, 0, `rgba(${PLEAT},0.5)`, height * 0.04);
    pleatLine(t, height * 0.03, `rgba(${PLEAT},0.16)`, height * 0.05);
  }

  // The nose wire: the sewn channel along the top of a real mask, which is also what
  // pinches the cloth in above the pleats.
  const wireY = m.top + height * 0.14;
  ctx.beginPath();
  ctx.moveTo(m.cx - m.halfTop * 0.82, wireY);
  ctx.quadraticCurveTo(m.cx, wireY + height * 0.09, m.cx + m.halfTop * 0.82, wireY);
  ctx.lineWidth = height * 0.028;
  ctx.strokeStyle = `rgba(${PLEAT},0.34)`;
  ctx.stroke();

  ctx.restore();

  ctx.restore();
}
