import { roundedRectPath } from '../render/path';
import { METAL_LIGHT, METAL_SHADE } from '../render/metal';

// The glass. Pale and blue-grey rather than clear: a truly clear lens is invisible
// against this screen, and the reference's own lens is tinted enough to read.
const LENS = '205,220,236';

// How much the lens enlarges what is behind it.
//
// Bounded by the eye, not chosen for looks: the eye box's half-width is 0.5 of the eye
// width and the lens radius is 0.68 of it, so anything past about 1.36 pushes the eye's
// own frame out through the rim. 1.22 leaves the eye comfortably inside while still
// being unmistakable when compared against the bare left eye.
const MAGNIFY = 1.22;

/**
 * suspect: a monocle over the right eye, with its cord hanging off the frame.
 *
 * Sized to enclose the eye box rather than scaled off the reference. The emoji's eyes
 * are small ovals, so its monocle is four times an eye across; BUBU's eye box is huge
 * by comparison, and that ratio would put the rim outside the screen. A radius of
 * 0.68 of the eye width clears the box's own half-diagonal (0.66) with a little to
 * spare, which is the same "sits over the eye, not against it" margin eyewear.js uses
 * for the spectacles.
 *
 * That radius also has to stay clear of the brow, which is why the expression cocks
 * the right brow by 0.28 of the eye width: the rim's top lands at 0.25 above the eye
 * box and the brow at 0.40, leaving the two visibly separate. Raising the brow less
 * than about 0.25 buries it in the rim.
 *
 * Metal comes from render/metal.js, shared with cool's shades, nerd's spectacles and
 * the zipper mouth -- an object sitting on the display is lit by the room rather than
 * emitting, so it must not follow glowColor.
 */
export function drawMonocle(ctx, geometry) {
  const { rightEyeX, eyeY, eyeW, eyeH, screenX, screenY, screenW, screenH, screenRadius } = geometry;

  const cx = rightEyeX + eyeW / 2;
  const cy = eyeY + eyeH / 2;
  const r = eyeW * 0.68;
  const rim = eyeW * 0.09;

  // The lug sits just above the horizontal, where the reference's does.
  const lugAngle = -0.18;
  const lugX = cx + Math.cos(lugAngle) * r;
  const lugY = cy + Math.sin(lugAngle) * r;

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // 1. What the lens does to the eye behind it. A monocle is a lens before it is a
  // disc, and magnification is the one cue that says so -- everything below is
  // decoration laid on top of it.
  //
  // Done by resampling the canvas rather than by redrawing the eye at scale. The effect
  // is handed geometry and nothing else: it does not know the eye's glow colour, pupil
  // offset or blink phase, and plumbing all three through here would give every one of
  // them a second source of truth that could drift from the first.
  //
  // Source coordinates for drawImage are in the backing store's own pixels while the
  // destination is in user space, so the current transform has to be applied by hand.
  const t = ctx.getTransform();
  // A scale and a translate are all this face applies today -- device pixels and
  // the idle bob -- so the source rectangle below really is the box sitting behind
  // the lens. The welcome screen's entrance briefly rotated the head as well, which
  // is why this guard was written; that tilt has since been removed, so nothing
  // reaches here with a rotation any more.
  //
  // Kept anyway, because the failure it prevents is silent: under a rotation the
  // rectangle would sample a smear rather than the face, and the fix would be a
  // rotated source rectangle here, not deleting this check.
  if (!t.b && !t.c) {
    const src = r / MAGNIFY;
    ctx.save();
    ctx.beginPath();
    // Inside the rim's centre line, so the resampled edge is tucked under the metal
    // rather than ending in a visible circular seam.
    ctx.arc(cx, cy, r - rim * 0.5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      ctx.canvas,
      t.a * (cx - src) + t.e, t.d * (cy - src) + t.f, t.a * src * 2, t.d * src * 2,
      cx - r, cy - r, r * 2, r * 2,
    );
    ctx.restore();
  }

  // 2. The cord, before the rim and lug so they cover where it joins. It runs off the
  // bottom of the screen the way the reference's runs off the chin.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(lugX, lugY);
  ctx.quadraticCurveTo(
    lugX + r * 0.55, cy + r * 1.4,
    lugX + r * 0.25, screenY + screenH,
  );
  ctx.lineWidth = eyeW * 0.022;
  ctx.lineCap = 'round';
  ctx.strokeStyle = METAL_SHADE;
  ctx.shadowColor = METAL_SHADE;
  ctx.shadowBlur = eyeW * 0.05;
  ctx.stroke();
  ctx.restore();

  // 3. The glass itself.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // The edge, and this is the part that does the work. Glass is a solid with thickness:
  // near the rim you are looking through it at a grazing angle, it stops transmitting
  // and turns bright. That ring is what separates a lens from a hole cut in the screen,
  // and it carries the read further than the flat tint ever did.
  const edge = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  edge.addColorStop(0, `rgba(${LENS},0)`);
  edge.addColorStop(0.78, `rgba(${LENS},0.1)`);
  edge.addColorStop(1, `rgba(${LENS},0.5)`);
  ctx.fillStyle = edge;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // A trace of tint across the rest. This was 0.34 at its strongest, which washed the
  // eye behind it from saturated purple down to lilac -- the lens read as fogged, not
  // as clear. Glass this thin barely tints at all; the edge above and the speculars
  // below are what sell it.
  const tint = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  tint.addColorStop(0, `rgba(${LENS},0.1)`);
  tint.addColorStop(0.55, `rgba(${LENS},0.03)`);
  tint.addColorStop(1, `rgba(${LENS},0.08)`);
  ctx.fillStyle = tint;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

  // Speculars: a hard highlight with a smaller companion trailing it, and a dim third
  // opposite for the light coming back off the far surface. Glass reflects the room in
  // small sharp marks. The single ellipse this had ran nearly the full height of the
  // lens and straight across the pupil, which is the one place a highlight must not be.
  const glint = (fx, fy, rx, ry, alpha) => {
    ctx.beginPath();
    ctx.ellipse(cx + r * fx, cy + r * fy, r * rx, r * ry, -0.72, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  };
  glint(-0.44, -0.4, 0.09, 0.26, 0.5);
  glint(-0.19, -0.62, 0.05, 0.1, 0.36);
  glint(0.44, 0.42, 0.07, 0.17, 0.15);
  ctx.restore();

  // 4. The rim, over the glass so its inner edge stays crisp.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  // Four stops, not two. A ramp from the metal colour straight to its shade reads as a
  // flat washer; the bright line along the top is what says the ring is round in
  // section, which is the same thing the thermometer's glass turned out to need.
  const metal = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  metal.addColorStop(0, '#e8e5f0');
  metal.addColorStop(0.28, METAL_LIGHT);
  metal.addColorStop(0.7, METAL_LIGHT);
  metal.addColorStop(1, METAL_SHADE);
  ctx.lineWidth = rim;
  ctx.strokeStyle = metal;
  ctx.shadowColor = METAL_SHADE;
  ctx.shadowBlur = eyeW * 0.07;
  ctx.stroke();

  // 5. The lug the cord hangs from.
  ctx.beginPath();
  ctx.arc(lugX, lugY, rim * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = METAL_LIGHT;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
