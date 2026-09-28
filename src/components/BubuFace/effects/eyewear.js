import { roundedRectPath } from '../render/path';
import { METAL_LIGHT as FRAME_GREY, METAL_SHADE as FRAME_SHADOW } from '../render/metal';

/**
 * Both pieces of eyewear: cool's dark shades and nerd's clear spectacles.
 *
 * One shape, one implementation. The two faces wear the same frame -- two rounded
 * lenses over the eye boxes with a bridge between them and a diagonal sheen across
 * each -- and differ only in whether the lens is filled. Keeping them as separate
 * drawing code meant the same geometry existed twice and could drift apart.
 *
 * The lenses are padded out past the eye boxes so the frame sits *over* the eyes
 * rather than butting against them.
 */
/**
 * A sheen streak, as fractions of the lens width: `bottom` is where its lower edge
 * starts, `width` how wide it runs, and every streak leans by the same SHEEN_SLANT
 * so the pair stay parallel. Two of these -- one broad and soft, one narrow and
 * bright -- is what reads as glass; a single flat stripe reads as a translucent
 * patch stuck on the lens.
 */
const SHEEN_SLANT = 0.34;

// The glass, shared with the monocle in effects/monocle.js. Pale and blue-grey rather
// than clear: a truly clear lens is invisible against this screen.
const LENS = '205,220,236';

function drawEyewear(ctx, geometry, {
  lensFill, rimWidth, rimShadeStop, sheens,
  // The three that make a lens read as glass rather than as a hole in the frame,
  // all default off so the opaque shades are untouched by them.
  //
  // `magnify` enlarges what is behind the lens -- the one cue that says "lens" at all.
  // `edge` is the bright band just inside the rim: glass is a solid with thickness, and
  // near its edge you are looking through it at a grazing angle where it stops
  // transmitting and turns bright. `glints` are small hard speculars.
  magnify = 0,
  edge = 0,
  glints = [],
  // A trace of tint across the whole lens. Deliberately tiny -- the eye behind this
  // one is the point of the face, and anything heavier fogs it.
  tint = 0,
  // Sunglasses only. `horizon` is a soft band of reflected light low on the lens,
  // the thing a dark lens picks up from whatever it is facing; `rimGlint` is a
  // hairline of light along the top edge of the frame. Both default off, because
  // on nerd's clear lenses there is nothing for either to sit on.
  horizon = 0,
  rimGlint = 0,
  // Multiplies how far the lens is padded out past the eye box, which is the only
  // thing that sets the frame's size. Capped in practice at 2.84: the padding grows
  // inward as well as outward, and at that point the two lenses meet in the middle
  // and the bridge between them has no gap left to span.
  pad = 1,
}) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, eyeH } = geometry;

  const padX = eyeW * 0.14 * pad;
  const padY = eyeH * 0.12 * pad;
  const w = eyeW + padX * 2;
  const h = eyeH + padY * 2;
  const y = eyeY - padY;
  const radius = eyeW * 0.24;

  const lenses = [leftEyeX - padX, rightEyeX - padX];

  // Bridge first, so an opaque lens overlaps and hides its ends. With a clear lens
  // there is nothing to hide, but its ends land on the rims either way -- it spans
  // exactly the gap between the two lens boxes.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lenses[0] + w, y + h * 0.32);
  ctx.lineTo(lenses[1], y + h * 0.32);
  ctx.lineWidth = eyeH * 0.13;
  ctx.strokeStyle = FRAME_GREY;
  ctx.shadowColor = FRAME_SHADOW;
  ctx.shadowBlur = eyeW * 0.08;
  ctx.stroke();
  ctx.restore();

  lenses.forEach((x) => {
    // What the lens does to the eye behind it, before anything is drawn on top of it.
    // Resampling the canvas rather than redrawing the eye at scale, for the reason
    // monocle.js gives: this effect is handed geometry and nothing else, and plumbing
    // the eye's colour, pupil offset and blink phase through here would give each of
    // them a second source of truth. drawImage takes its source rectangle in the
    // backing store's own pixels while the destination is in user space, so the
    // current transform is applied by hand.
    if (magnify > 1) {
      const t = ctx.getTransform();
      // A scale and a translate are all this face applies today -- see monocle.js
      // for the full note. Under a rotation this would sample a box that is no
      // longer the right one, so it is skipped and nerd's lenses would read as
      // plain glass; nothing rotates the face at present, so it never fires.
      if (!t.b && !t.c) {
        const sw = w / magnify;
        const sh = h / magnify;
        const sx = x + (w - sw) / 2;
        const sy = y + (h - sh) / 2;
        ctx.save();
        // Inside the rim's centre line, so the resampled edge tucks under the metal
        // instead of ending in a visible seam.
        roundedRectPath(
          ctx, x + rimWidth * 0.5, y + rimWidth * 0.5,
          w - rimWidth, h - rimWidth, Math.max(0, radius - rimWidth * 0.5),
        );
        ctx.clip();
        ctx.drawImage(
          ctx.canvas,
          t.a * sx + t.e, t.d * sy + t.f, t.a * sw, t.d * sh,
          x, y, w, h,
        );
        ctx.restore();
      }
    }

    ctx.save();
    roundedRectPath(ctx, x, y, w, h, radius);
    if (lensFill) {
      ctx.fillStyle = typeof lensFill === 'function' ? lensFill(ctx, y, h) : lensFill;
      ctx.fill();
    }
    ctx.lineWidth = rimWidth;
    // Top-to-bottom gradient so the rim reads as brushed metal rather than a flat
    // grey outline.
    const rim = ctx.createLinearGradient(0, y, 0, y + h);
    rim.addColorStop(0, FRAME_GREY);
    rim.addColorStop(rimShadeStop, FRAME_GREY);
    rim.addColorStop(1, FRAME_SHADOW);
    ctx.strokeStyle = rim;
    ctx.shadowColor = FRAME_SHADOW;
    ctx.shadowBlur = eyeW * 0.1;
    ctx.stroke();
    ctx.restore();

    // Everything below is clipped to the lens, so a streak can run off its edge
    // and be cut by the frame rather than having to be sized to fit inside it.
    ctx.save();
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.clip();

    if (tint > 0) {
      const wash = ctx.createLinearGradient(x, y, x + w, y + h);
      wash.addColorStop(0, `rgba(${LENS},${tint})`);
      wash.addColorStop(0.55, `rgba(${LENS},${tint * 0.3})`);
      wash.addColorStop(1, `rgba(${LENS},${tint * 0.8})`);
      ctx.fillStyle = wash;
      ctx.fillRect(x, y, w, h);
    }

    // The edge. Three concentric strokes on the lens outline rather than a radial
    // gradient, because this lens is a rounded rectangle and a radial one would pool
    // in the corners. Each is centred on the outline and clipped to the inside, so
    // only its inner half lands; wide-and-faint first, narrow-and-bright last, which
    // is what builds the falloff.
    if (edge > 0) {
      const band = Math.min(w, h) * 0.14;
      [[2, 0.1], [1.2, 0.16], [0.55, 0.3]].forEach(([k, a]) => {
        roundedRectPath(ctx, x, y, w, h, radius);
        ctx.lineWidth = band * k;
        ctx.strokeStyle = `rgba(${LENS},${a * edge})`;
        ctx.stroke();
      });
    }

    glints.forEach(({ fx, fy, rx, ry, alpha }) => {
      ctx.beginPath();
      ctx.ellipse(x + w * fx, y + h * fy, w * rx, h * ry, -0.72, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });

    // The reflected band goes under the streaks: it is what the lens is picking up,
    // where they are light landing on its surface. Faded out at both ends so it
    // reads as a reflection rather than as a painted stripe.
    if (horizon > 0) {
      const band = ctx.createLinearGradient(0, y + h * 0.5, 0, y + h * 0.92);
      band.addColorStop(0, 'rgba(150,175,225,0)');
      band.addColorStop(0.45, `rgba(150,175,225,${horizon})`);
      band.addColorStop(1, 'rgba(150,175,225,0)');
      ctx.fillStyle = band;
      ctx.fillRect(x, y + h * 0.5, w, h * 0.42);
    }

    sheens.forEach(({ bottom, width, alpha }) => {
      ctx.beginPath();
      ctx.moveTo(x + w * bottom, y + h);
      ctx.lineTo(x + w * (bottom + SHEEN_SLANT), y);
      ctx.lineTo(x + w * (bottom + SHEEN_SLANT + width), y);
      ctx.lineTo(x + w * (bottom + width), y + h);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    });

    // Inside the clip, so it follows the lens's rounded top and stops at its edges.
    if (rimGlint > 0) {
      ctx.beginPath();
      ctx.moveTo(x + radius * 0.7, y + rimWidth * 0.45);
      ctx.lineTo(x + w - radius * 0.7, y + rimWidth * 0.45);
      ctx.lineWidth = rimWidth * 0.3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255,255,255,${rimGlint})`;
      ctx.stroke();
    }
    ctx.restore();
  });
}

/**
 * cool: dark shades over both eyes.
 *
 * Drawn opaque so the glowing eyes are genuinely hidden behind them -- a
 * translucent lens reads as a smudge rather than as sunglasses.
 */
export function drawSunglasses(ctx, geometry) {
  drawEyewear(ctx, geometry, {
    // Graded rather than one flat tone. A real dark lens is densest at the top,
    // where it is shading the most light, and lifts towards the bottom -- a single
    // colour across the whole lens is what made these read as cut-out rectangles.
    lensFill: (ctx2, y, h) => {
      const tint = ctx2.createLinearGradient(0, y, 0, y + h);
      tint.addColorStop(0, 'rgba(6,2,14,0.98)');
      tint.addColorStop(0.62, 'rgba(16,6,30,0.96)');
      tint.addColorStop(1, 'rgba(34,14,54,0.94)');
      return tint;
    },
    rimWidth: geometry.eyeW * 0.05,
    // The shade runs the full height. The opaque lens still defines the shape, so
    // the rim going near-black at the bottom costs nothing.
    rimShadeStop: 0,
    // A broad soft one and a narrow bright one, the pair a curved glass surface
    // actually throws. Stronger than the old single 0.16 streak because they now
    // sit on a graded lens that can take the contrast.
    sheens: [
      { bottom: 0.08, width: 0.2, alpha: 0.14 },
      { bottom: 0.34, width: 0.07, alpha: 0.3 },
    ],
    horizon: 0.13,
    rimGlint: 0.5,
  });
}

/**
 * nerd: the same frame with clear lenses, so the glowing eyes read straight
 * through. Filling them would turn these into shades, and the eyes are the point
 * of this face.
 *
 * Two of the style values differ from the sunglasses', both for the same reason --
 * with no lens behind it, the rim alone has to carry the whole shape:
 *   - it is drawn twice as thick, matching the reference's heavy frames;
 *   - the shade is held back to the last 30% of the gradient, because a rim fading
 *     to near-black at the bottom would simply vanish against the screen.
 * The sheen is weaker for the opposite reason: anything stronger veils the eye
 * behind it.
 */
export function drawGlasses(ctx, geometry) {
  drawEyewear(ctx, geometry, {
    lensFill: null,
    rimWidth: geometry.eyeW * 0.1,
    rimShadeStop: 0.7,
    // Twice the standard padding, so the frame reads as the heavy spectacles of the
    // reference rather than as two rims tracing the eye boxes. Short of the 2.84 the
    // bridge can survive, and clear of everything around it: the outer rims stop 40
    // units inside the screen and the lower ones 35 above the grin's top edge.
    pad: 2,
    // No diagonal streak. It ran the full height of the lens straight across the eye
    // -- the one place a highlight must not sit -- and with the edge band and the
    // speculars below doing the work it was only veiling what it sat on.
    sheens: [],
    // Bounded by the eye, not chosen: the lens box is the eye box padded out, and at
    // this padding it is 1.56 eye-widths across, so past about 1.5 the eye's own frame
    // pushes through the rim. 1.2 leaves it comfortably inside while still reading
    // against the unmagnified faces beside it.
    magnify: 1.2,
    edge: 1,
    tint: 0.1,
    // A hard highlight with a smaller companion trailing it, and a dim third opposite.
    // Kept small and pushed into the corners, where the lens overhangs the eye box by
    // 0.18 of its width and there is dark screen to sit on. The monocle can put its
    // speculars nearer the middle because its lens is far larger than the eye behind
    // it; here they landed on the frame's own glow, and white over saturated purple
    // desaturates rather than brightens -- two grey smudges rather than two glints.
    glints: [
      { fx: 0.14, fy: 0.24, rx: 0.032, ry: 0.12, alpha: 0.5 },
      { fx: 0.25, fy: 0.1, rx: 0.018, ry: 0.05, alpha: 0.34 },
      { fx: 0.87, fy: 0.83, rx: 0.024, ry: 0.07, alpha: 0.14 },
    ],
  });
}
