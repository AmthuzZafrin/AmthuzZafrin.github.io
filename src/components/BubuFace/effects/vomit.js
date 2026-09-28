import { roundedRectPath } from '../render/path';
import { OPEN_MOUTH_SIZES, OPEN_MOUTH_RIM_RATIO, openMouthCentreY } from '../render/drawMouth';

// The vivid green of the reference's spill, sampled off it -- around (53,205,6) at the
// mouth and (88,217,10) further down. Not SICK_GLOW: disgust's green is a wash tinting
// a whole face, where this is a thick liquid and wants to be the most saturated thing
// on the screen.
const BILE = '#4fd10a';
// The shaded side of a lump. Dark enough to separate one lump from the next without
// going near-black, which on this screen would read as a hole rather than a shadow.
const BILE_DARK = '#2f8205';
const BILE_DARK_RGB = '47,130,5';
const BILE_LIGHT = '#8cf03c';
const BILE_LIGHT_RGB = '140,240,60';

// The mound's lumps, as (x across the pool's half-width, how far below the mound's
// drooping top line in mouth widths, radius in mouth widths). Hand-placed and of
// deliberately uneven size: an evenly-spaced row of equal discs merges into a
// scalloped rectangle, which is what the first attempt at this looked like. The
// outermost pair sit past the block underneath and are what round off the sides.
const MOUND_LUMPS = [
  { x: 0.00, dy: 0.00, r: 0.34 },
  { x: -0.30, dy: 0.02, r: 0.32 },
  { x: 0.32, dy: 0.00, r: 0.30 },
  { x: -0.58, dy: 0.04, r: 0.30 },
  { x: 0.60, dy: 0.01, r: 0.32 },
  { x: -0.84, dy: 0.02, r: 0.26 },
  { x: 0.86, dy: 0.05, r: 0.24 },
  { x: -0.15, dy: 0.42, r: 0.30 },
  { x: 0.17, dy: 0.44, r: 0.32 },
  { x: -0.45, dy: 0.40, r: 0.28 },
  { x: 0.46, dy: 0.42, r: 0.26 },
  { x: -0.72, dy: 0.34, r: 0.26 },
  { x: 0.74, dy: 0.36, r: 0.28 },
  { x: -0.98, dy: 0.22, r: 0.22 },
  { x: 1.00, dy: 0.24, r: 0.20 },
  { x: -0.90, dy: 0.58, r: 0.20 },
  { x: 0.92, dy: 0.60, r: 0.18 },
];

// Bubbles suspended in the mass, as (x across the pool's half-width, t from the mouth
// down to the screen edge, radius in mouth widths). Clustered near the middle at the
// top, where the flow is only a column wide, and spreading out into the pool below --
// which is where the reference's are. Clipped to the mass, so the ones near an edge
// get bitten into by the silhouette exactly as the reference's are.
const BUBBLES = [
  { x: -0.14, t: 0.20, r: 0.17 },
  { x: 0.15, t: 0.13, r: 0.13 },
  { x: 0.02, t: 0.40, r: 0.19 },
  { x: -0.26, t: 0.52, r: 0.15 },
  { x: 0.27, t: 0.47, r: 0.17 },
  { x: -0.57, t: 0.74, r: 0.16 },
  { x: -0.30, t: 0.82, r: 0.19 },
  { x: 0.06, t: 0.70, r: 0.14 },
  { x: 0.36, t: 0.80, r: 0.18 },
  { x: 0.64, t: 0.72, r: 0.15 },
  { x: -0.84, t: 0.88, r: 0.13 },
  { x: 0.86, t: 0.90, r: 0.16 },
  { x: 0.00, t: 0.93, r: 0.17 },
];

/**
 * vomit: the green spill pouring out of the mouth, as in the vomiting-face emoji.
 *
 * Magnifying the reference is what settled the shape, and it is not the funnel it
 * looks like at thumbnail size. It is three parts: the green fills the *interior of
 * the mouth* completely, so what remains visible of the mouth is a thick arch and not
 * a bowl; a short column, narrower than the mouth, drops out from under it; and that
 * blooms almost immediately into a wide lumpy mound roughly 1.35 mouth-widths across.
 * A smooth funnel from mouth to floor -- the obvious reading -- renders as a flat
 * green mountain with the mouth sitting on top of it like a handle.
 *
 * Covering the rim's lower half is the whole trick behind the arch, so the cap is
 * built from the mouth's own ellipse padded by half the rim stroke, and every one of
 * those numbers is imported rather than copied. Retuning the 'maw' row carries this
 * with it; hardcoding them here would let the rim reappear as two bright hooks the
 * next time that row moves.
 *
 * The cap is cut at a chord slightly *above* the mouth's centre line rather than at
 * it: at the centre line the ellipse is at its widest, so anything lower leaves a
 * sliver of rim showing at the waist.
 *
 * Drawn as a single union path -- cap, column and mound together -- so no internal
 * seams show through, then the bubbles and the edge shading are clipped to that same
 * path.
 *
 * Clipped to the screen's rounded rect, like the clouds effect. In the reference the
 * mound runs off the chin and past the face; there is no "past the face" here, so it
 * runs off the bottom of the screen instead and the clip follows the corner radius.
 */
export function drawVomitFlow(ctx, geometry, tMs) {
  const { mouthCx, mouthY, mouthW, screenX, screenY, screenW, screenH, screenRadius } = geometry;

  // The mouth cavity, padded by half the rim stroke so the cap swallows the rim
  // rather than stopping on its centre line.
  const pad = mouthW * OPEN_MOUTH_RIM_RATIO * 0.5;
  const capRx = mouthW * OPEN_MOUTH_SIZES.maw.rx + pad;
  const capRy = mouthW * OPEN_MOUTH_SIZES.maw.ry + pad;
  const cy = openMouthCentreY(mouthY, mouthW, 'maw');

  const floor = screenY + screenH;

  // A slow swell, so the spill is not frozen against an animated face. Small: this is
  // a heavy liquid, and anything livelier reads as a wobbling jelly.
  const swell = 1 + Math.sin(tMs / 900) * 0.03;

  // The liquid line inside the mouth. Held clear of the rim on both sides, so the
  // mouth reads as a mouth with something welling up in it rather than as a shape
  // flooded to its own edges -- and domed rather than flat, echoing the curve of the
  // lip above it. A flat line across the widest part of an ellipse is the one thing
  // that makes the rim above it read as a separate object sitting on top.
  const liqHalf = capRx * 0.72 * swell;
  const liqY = cy;
  // How high the dome stands above that line. What it may not do is reach the upper
  // lip's inner edge, which sits at cy - (ry - pad) -- capRy is the rim's *outer* edge,
  // so the inner one is two pads higher up than it. At this mouth that edge is 39.6
  // units above the centre and the dome's apex lands 28.3 above it, which leaves a
  // tenth of a mouth-width of cavity still showing between the two. Past about 0.85
  // the dome touches the lip and the mouth stops reading as a mouth with something
  // welling up in it.
  const liqRise = capRy * 0.62;

  // The throat: the flow stays at the liquid line's width until it is clear of the
  // mouth, and only fans out below. Fanning from the liquid line instead widens the
  // mass past the rim while it is still inside it, which swallows the rim's two lower
  // ends -- and those ends are exactly what make the mouth read as a mouth.
  const throatY = cy + capRy * 1.15;
  const colBottom = capRx * swell;

  // The mound. Its top droops quadratically towards the edges so the rim's ends stay
  // clear of it; without the droop the mound swallows them and the mouth disappears.
  const poolHalf = capRx * 1.5 * swell;
  const moundY = cy + capRy;
  const droop = mouthW * 0.42;
  const moundTop = (dx) => moundY + (dx / poolHalf) ** 2 * droop;
  // The block under the lumps stops short of the pool's full width so the outermost
  // lumps, not a pair of straight vertical edges, are what the sides read as.
  const blockHalf = poolHalf * 0.86;

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  const mass = () => {
    ctx.beginPath();

    // The body: a domed liquid line inside the mouth, splaying out to the mound. Drawn
    // clockwise like every other subpath so the nonzero fill unions them instead of
    // punching holes. A quadratic reaches half its control offset at its midpoint,
    // hence the doubled rise.
    const colEnd = moundY + mouthW * 0.3;
    ctx.moveTo(mouthCx - liqHalf, liqY);
    ctx.quadraticCurveTo(mouthCx, liqY - liqRise * 2, mouthCx + liqHalf, liqY);
    ctx.lineTo(mouthCx + liqHalf, throatY);
    ctx.lineTo(mouthCx + colBottom, colEnd);
    ctx.lineTo(mouthCx - colBottom, colEnd);
    ctx.lineTo(mouthCx - liqHalf, throatY);
    ctx.closePath();

    // The block the lumps sit on: its top edge follows the same droop they do, so no
    // gap can open between them however the lumps are retuned, and its bottom runs
    // off the screen. Sampled rather than curved -- the lumps hide the facets.
    const STEPS = 12;
    const base = floor + mouthW * 0.5;
    ctx.moveTo(mouthCx - blockHalf, moundTop(-blockHalf));
    for (let i = 1; i <= STEPS; i += 1) {
      const dx = (i / STEPS - 0.5) * 2 * blockHalf;
      ctx.lineTo(mouthCx + dx, moundTop(dx));
    }
    ctx.lineTo(mouthCx + blockHalf, base);
    ctx.lineTo(mouthCx - blockHalf, base);
    ctx.closePath();

    for (const lump of MOUND_LUMPS) {
      const dx = lump.x * poolHalf;
      const r = mouthW * lump.r;
      const y = moundTop(dx) + mouthW * lump.dy;
      ctx.moveTo(mouthCx + dx + r, y);
      ctx.arc(mouthCx + dx, y, r, 0, Math.PI * 2);
    }
  };

  // A vertical gradient rather than a flat fill: brightest where it leaves the mouth,
  // deepening as it falls, so the mass has some body to it.
  const body = ctx.createLinearGradient(0, liqY, 0, floor);
  body.addColorStop(0, BILE_LIGHT);
  body.addColorStop(0.35, BILE);
  body.addColorStop(1, BILE_DARK);

  mass();
  ctx.fillStyle = body;
  ctx.shadowColor = BILE;
  ctx.shadowBlur = mouthW * 0.35;
  ctx.fill();

  ctx.save();
  mass();
  ctx.clip();
  ctx.shadowBlur = 0;

  // Shading down both edges, which is what gives the mass a rounded front. On its own
  // it is not enough -- it rounds the silhouette but leaves the interior flat, which
  // is what made the mound read as one poster-green shape with circles drawn on it.
  // The per-lump crowns below are the other half.
  const sides = ctx.createLinearGradient(mouthCx - poolHalf, 0, mouthCx + poolHalf, 0);
  sides.addColorStop(0, `rgba(${BILE_DARK_RGB},0.75)`);
  sides.addColorStop(0.26, `rgba(${BILE_DARK_RGB},0)`);
  sides.addColorStop(0.74, `rgba(${BILE_DARK_RGB},0)`);
  sides.addColorStop(1, `rgba(${BILE_DARK_RGB},0.75)`);
  ctx.fillStyle = sides;
  // Wider than the gradient's own span: the outermost lumps sit past poolHalf, and a
  // linear gradient clamps to its end colour rather than running out.
  ctx.fillRect(mouthCx - poolHalf * 1.4, liqY, poolHalf * 2.8, floor + mouthW - liqY);

  // A lit crown on each lump. One light source above, so every lump is bright on its
  // upper-left shoulder and falls away from there -- which is what separates a heap of
  // rounded masses from a scalloped outline filled with one colour. Offset by a third
  // of the radius rather than centred: a highlight on a sphere's centre reads as the
  // sphere glowing, not as light landing on it.
  for (const lump of MOUND_LUMPS) {
    const dx = lump.x * poolHalf;
    const r = mouthW * lump.r;
    const lx = mouthCx + dx - r * 0.3;
    const ly = moundTop(dx) + mouthW * lump.dy - r * 0.34;
    const crown = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 1.05);
    crown.addColorStop(0, `rgba(${BILE_LIGHT_RGB},0.5)`);
    crown.addColorStop(0.55, `rgba(${BILE_LIGHT_RGB},0.14)`);
    crown.addColorStop(1, `rgba(${BILE_LIGHT_RGB},0)`);
    ctx.fillStyle = crown;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 1.05, 0, Math.PI * 2);
    ctx.fill();
  }

  // The wet sheen on the dome inside the mouth, where the liquid is a curved surface
  // facing up and is the only part of the mass that catches the light square on.
  const sheenY = liqY - liqRise * 0.55;
  const sheen = ctx.createRadialGradient(mouthCx, sheenY, 0, mouthCx, sheenY, liqHalf * 0.8);
  sheen.addColorStop(0, 'rgba(225,255,190,0.45)');
  sheen.addColorStop(1, 'rgba(225,255,190,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(mouthCx, sheenY, liqHalf * 0.8, liqRise * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bubbles. A bubble in a thick liquid is a pocket of gas: dark through its middle
  // where you are looking through the most of it, bright around the rim where the
  // surface turns, and carrying one small specular from the same light as the lumps.
  // The flat translucent disc this used to be had none of that and read as a spot
  // painted on the surface.
  const span = floor - liqY;
  for (const b of BUBBLES) {
    const r = mouthW * b.r;
    const px = mouthCx + b.x * poolHalf;
    const py = liqY + b.t * span;

    const gas = ctx.createRadialGradient(px, py, r * 0.08, px, py, r);
    gas.addColorStop(0, `rgba(${BILE_DARK_RGB},0.5)`);
    gas.addColorStop(0.7, `rgba(${BILE_DARK_RGB},0.14)`);
    gas.addColorStop(1, `rgba(${BILE_LIGHT_RGB},0.6)`);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = gas;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.lineWidth = r * 0.16;
    ctx.strokeStyle = `rgba(${BILE_DARK_RGB},0.55)`;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px - r * 0.33, py - r * 0.35, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(232,255,205,0.6)';
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}
