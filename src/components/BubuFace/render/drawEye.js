import { roundedRectPath } from './path';
import { drawGlow } from './glow';

const FRAME_RADIUS_RATIO = 0.21;
const RING_THICKNESS_RATIO = 0.12;
const PUPIL_SIZE_RATIO = 0.29;
const CLOSED_THRESHOLD = 0.12;

/** Traces a heart centred on (cx, cy), sized to fit `size` across. */
function heartPath(ctx, cx, cy, size) {
  const w = size / 2;
  const top = cy - size * 0.32;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.42);
  ctx.bezierCurveTo(cx - w * 1.5, cy - size * 0.1, cx - w * 0.85, top - size * 0.4, cx, top);
  ctx.bezierCurveTo(cx + w * 0.85, top - size * 0.4, cx + w * 1.5, cy - size * 0.1, cx, cy + size * 0.42);
  ctx.closePath();
}

// The heart's own red, ignoring glowColor for the same reason STAR_GLOW does: love's
// pink is the colour of the *face*, and a heart drawn in it sat a shade away from the
// mouth rather than reading as its own object.
const HEART_GLOW = '#f5334f';

/**
 * Love: the eye *is* a glowing heart. No frame, no inner well, no pupil and
 * no eyebrow -- returning early from drawEye is what removes all four, since
 * they're drawn unconditionally further down and there is no flag to suppress
 * them individually.
 *
 * Springs out and settles back on the same 1.4s loop the star eyes use -- see
 * popSpring.
 *
 * Blinking is deliberately ignored here. The blink squashes the eye vertically,
 * which on a heart reads as the shape deforming rather than an eyelid closing.
 */
function drawHeartEye(ctx, { x, y, width, height, tMs, dpr }) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  // Deliberately overflows the eye box the rounded-rect eye fits inside. There
  // is no frame to stay within here, so the heart is sized to read at a glance
  // rather than to match the other expressions' eye footprint.
  //
  // 1.62 is set by the same collision the star's size is: the eye centres are 215.6px
  // apart at CANVAS_SIZE, and this heart path reaches 0.449 of `size` sideways -- a
  // cubic, so it falls well short of its own control points at 0.75. Held at the
  // spring's 1.2x peak that allows 1.664 of eye width, and 1.62 leaves about 6px
  // between the two hearts at full pop. It lands a shade narrower than the star eyes
  // next door, which want 1.725 to match exactly and cannot have it.
  const size = width * 1.62 * popSpring(tMs);

  drawGlow(ctx, cx, cy, size * 1.5, HEART_GLOW, dpr, 0.8);

  ctx.save();
  heartPath(ctx, cx, cy, size);
  ctx.fillStyle = HEART_GLOW;
  ctx.shadowColor = HEART_GLOW;
  ctx.shadowBlur = size * 0.45;
  // Filled twice: the shadow blur alone leaves the silhouette soft, and the
  // second pass lays a crisp edge back over its own bloom.
  ctx.fill();
  ctx.fill();
  ctx.restore();
}

// The star's own colour, and the one place in the eye layer that ignores glowColor
// entirely -- the same licence the tongue and the teeth take in drawMouth.js. A
// star-struck face is star-struck because the stars are *blue*; tinting them to
// match the face's glow loses the whole reference. One flat light blue rather than
// the shaded fill this first had: a gradient and an outline make the star look like
// a pasted-in illustration, where every other feature here is a single glowing
// colour on a dark display.
const STAR_GLOW = '#63bff0';

// One pop every 1.4s. The attack is the first 12% of it and the rest is the shape
// ringing back down to rest. Shared by the star and the heart eyes, so the two faces
// pulse identically -- which is the point: it reads as one behaviour BUBU has, not as
// two separate effects that happen to look similar.
const POP_SPRING_MS = 1400;
const POP_ATTACK = 0.12;
// Down from 0.28 to buy resting size -- see outerR. The pop is correspondingly
// gentler; that was the price and it was asked for explicitly.
const POP_OVERSHOOT = 0.2;

/**
 * How far past its resting size a popping eye is at time tMs, as a multiplier.
 *
 * Split into a fast attack and a damped oscillation rather than one decaying sine,
 * because a single sine starting at full overshoot jumps discontinuously at the loop
 * boundary. Here the attack eases up to the overshoot, the decay rings down to
 * almost exactly 1 by the end of the cycle, and the two meet at the same value, so
 * the loop is seamless and the only sharp moment is the pop itself.
 */
function popSpring(tMs) {
  const phase = (((tMs % POP_SPRING_MS) + POP_SPRING_MS) % POP_SPRING_MS) / POP_SPRING_MS;
  if (phase < POP_ATTACK) {
    return 1 + POP_OVERSHOOT * Math.sin((phase / POP_ATTACK) * (Math.PI / 2));
  }
  const settle = (phase - POP_ATTACK) / (1 - POP_ATTACK);
  return 1 + POP_OVERSHOOT * Math.exp(-5 * settle) * Math.cos(settle * Math.PI * 2 * 1.8);
}

/** Traces a five-pointed star centred on (cx, cy), first point at 12 o'clock. */
function starPath(ctx, cx, cy, outerR, innerR, rotation) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = rotation - Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * excited: the eye *is* a big blue star, as in the star-struck emoji. Replaces the
 * whole eye the way 'heart' and 'spiral' do -- no frame, no well, no pupil, no brow.
 *
 * The inner radius is 0.45 of the outer rather than the 0.382 a true pentagram uses.
 * A geometric pentagram comes out spindly at this size and reads as a sparkle; the
 * reference's star is visibly fat-armed, and that is what separates "star eyes" from
 * "sparkles floating near the eyes".
 *
 * Tilted outward on each side, mirrored via `side`. The reference's two stars are not
 * parallel, and two perfectly upright ones read as a printed icon rather than as eyes.
 * The exact angle also buys size: see outerR below.
 *
 * Springs out and settles back on a 1.4s loop -- see popSpring. Both eyes share
 * one clock, so they pop together.
 *
 * Blinking is ignored, for the reason drawHeartEye gives: squashing this vertically
 * reads as the shape deforming, not as an eyelid.
 */
function drawStarEye(ctx, { x, y, width, height, side, tMs, dpr }) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  // Overflows the eye box like the heart does -- there is no frame to stay inside,
  // so it is sized to read at a glance.
  //
  // The ceiling is set by the *spring*, not by the resting size, and it moves with the
  // tilt. The eye centres are 1.79 eye-widths apart. An untilted star reaches 0.951 of
  // its radius sideways; tilting turns the inner-facing vertex away from the horizontal
  // and at 0.25 rad that drops to 0.845, so the two stars collide at a radius of 1.06
  // eye-widths instead of 1.007. That is the hard limit on the *peak*, so the resting
  // size it allows depends on POP_OVERSHOOT: 0.828 at the original 0.28, 0.884 at the
  // current 0.2. 0.87 sits just inside the latter, with the facing points about 3px
  // apart at full pop -- measured, not eyeballed.
  //
  // Which is the trade this face has been walking down: the peak footprint has barely
  // moved across the last three increases (126.3px, then 125.6px), because it was
  // always pinned against that collision. Every increase since has come out of the
  // spring, not out of spare room. The tilt is spent too -- it is near 0.314 rad, where
  // a gap between two points faces the centre and clearance is greatest, and past that
  // the next vertex swings in and clearance falls again.
  const outerR = width * 0.87 * popSpring(tMs);

  drawGlow(ctx, cx, cy, outerR * 2.4, STAR_GLOW, dpr, 0.55);

  ctx.save();
  starPath(ctx, cx, cy, outerR, outerR * 0.45, (side === 'left' ? -1 : 1) * 0.25);
  ctx.fillStyle = STAR_GLOW;
  ctx.shadowColor = STAR_GLOW;
  ctx.shadowBlur = outerR * 0.45;
  // Filled twice for the reason drawHeartEye is: the blur alone leaves the
  // silhouette soft, and the second pass lays a crisp edge back over its own bloom.
  ctx.fill();
  ctx.fill();
  ctx.restore();
}

/**
 * Dizzy / swirl: the eye *is* an inward spiral. Like the heart, this replaces
 * the whole eye -- no frame, no inner well, no pupil, no eyebrow -- which is
 * why drawEye returns early rather than reaching the pupil-level dispatch.
 *
 * More turns than the old pupil-sized version had: at full eye size a 2.6-turn
 * spiral leaves visible gaps between the arms and reads as a loose scribble.
 */
/**
 * One revolution, slow enough to read as woozy rather than as a strobe.
 *
 * The spiral is built in polar coordinates, so a phase added to the angle turns
 * the whole shape rigidly, and a full turn lands it back on itself -- the loop has
 * no seam regardless of how many turns the spiral has.
 */
const SPIRAL_SPIN_MS = 2600;

function drawSpiralEye(ctx, { x, y, width, height, glowColor, tMs, dpr }) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const size = width * 1.15;
  const maxR = size * 0.5;
  const turns = 3.4;
  const steps = 160;
  const spin =
    ((((tMs % SPIRAL_SPIN_MS) + SPIRAL_SPIN_MS) % SPIRAL_SPIN_MS) / SPIRAL_SPIN_MS) * Math.PI * 2;

  drawGlow(ctx, cx, cy, size * 1.5, glowColor, dpr, 0.7);

  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = spin + t * turns * Math.PI * 2;
    const r = maxR * t;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = size * 0.3;
  ctx.stroke();
  ctx.restore();
}

/**
 * The eyebrow stroke, shared by every eye shape that keeps one.
 *
 * Extracted once there were three call sites (the default eye, 'flat'/'flatDown'
 * and 'scrunch'). browY is passed in rather than derived here: each whole-eye
 * shape has a different vertical extent, so each one knows where its own brow
 * has to clear the eye.
 */
function drawEyebrow(ctx, {
  cx, browY, width, browColor, eyebrowAngle, eyebrowCurve,
  // 0.62 is the length every framed eye uses -- it's tuned to sit inside the
  // frame's footprint. Shapes with no frame can afford a wider brow.
  lengthRatio = 0.62,
  // 'arc' bends by eyebrowCurve (zero leaves it straight); 'tick' is the kinked
  // brow described below. Per-eye, unlike eyebrowCurve, which is shared.
  shape = 'arc',
}) {
  const browLen = width * lengthRatio;
  ctx.save();
  ctx.translate(cx, browY);
  ctx.rotate(eyebrowAngle);
  ctx.beginPath();
  if (shape === 'tick') {
    // A tick mark turned through 180 degrees: the vertex ends up at the top with a
    // long arm falling away to the left and a short one to the right, and the right
    // end finishing higher than the left. Straight segments with a mitred join --
    // the kink is the whole point, and a curve through the same three points reads
    // as an ordinary arch.
    ctx.moveTo(-browLen / 2, browLen * 0.16);
    ctx.lineTo(-browLen / 2 + browLen * 0.7, -browLen * 0.14);
    ctx.lineTo(browLen / 2, browLen * 0.02);
  } else {
    ctx.moveTo(-browLen / 2, 0);
    if (eyebrowCurve) ctx.quadraticCurveTo(0, -browLen * eyebrowCurve, browLen / 2, 0);
    else ctx.lineTo(browLen / 2, 0);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width * 0.047;
  ctx.strokeStyle = browColor;
  ctx.shadowColor = browColor;
  ctx.shadowBlur = width * 0.1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Wink / closed: one glowing stroke where the eye sits, keeping the eyebrow.
 *
 * arcDir flips which way the closed lid bows: +1 curves upward (the smiling
 * eye of 'flat'), -1 curves downward (the downcast eye of 'flatDown'). It is
 * the only difference between a happy closed eye and a crestfallen one.
 */
// No dpr parameter: it existed only for the drawGlow bloom removed below.
function drawFlatEye(ctx, { x, y, width, height, glowColor, browColor, eyebrowAngle, eyebrow = true, eyebrowRaise = 0, eyebrowCurve = 0, eyebrowShape, browShift = 0, arcDir = 1, eyeArc = 1 }) {
  const cx = x + width / 2;
  const cy = y + height / 2;

  // No separate drawGlow bloom, unlike the open eye. A bloom centred on the eye box
  // works there because the bright frame sits over it; a closed eye is one thin arc,
  // so the bloom has nothing to sit behind and reads as a dot hanging in the empty
  // socket. The stroke's own shadowBlur below already gives it the neon halo -- the
  // same call drawSlantMouth makes, for the same reason.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + width * 0.12, cy);
  // Only the middle moves -- the two ends stay on cy however deep the bow gets. So
  // deepening this is how a closed eye's corners are made to sit lower: they do not
  // drop, the arch rises over them, exactly as eyebrowCurve works on a brow.
  ctx.quadraticCurveTo(cx, cy - height * 0.18 * arcDir * eyeArc, x + width * 0.88, cy);
  ctx.lineWidth = width * 0.13;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.18;
  ctx.stroke();
  ctx.restore();

  if (!eyebrow) return;

  drawEyebrow(ctx, {
    cx: cx + browShift,
    browY: cy - height * 0.62 - width * eyebrowRaise,
    width,
    browColor,
    eyebrowAngle,
    eyebrowCurve,
    shape: eyebrowShape,
  });
}

/**
 * persevering / tired: the eye is a screwed-shut '>' or '<', its point facing
 * inward toward the nose. Like the heart and spiral it replaces the frame, well
 * and pupil, so it branches before those are drawn -- but unlike them it keeps
 * an optional brow, because persevering's reference has none and tired's does.
 *
 * The first shape that differs between the two eyes rather than being mirrored
 * automatically, which is why drawEye now takes `side`. Drawing the same '>' on
 * both would read as the face glancing sideways, not as a wince.
 */
function drawScrunchEye(ctx, {
  x, y, width, height, glowColor, browColor, eyebrowAngle,
  eyebrow = true, eyebrowRaise = 0, eyebrowCurve = 0, eyebrowShape, browShift = 0, dpr, side,
}) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const reach = height * 0.3;
  // The point sits on the inner edge: right for the left eye, left for the right.
  const tipX = side === 'left' ? x + width * 0.84 : x + width * 0.16;
  const backX = side === 'left' ? x + width * 0.16 : x + width * 0.84;

  drawGlow(ctx, cx, cy, width * 1.15, glowColor, dpr, 0.45);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(backX, cy - reach);
  ctx.lineTo(tipX, cy);
  ctx.lineTo(backX, cy + reach);
  ctx.lineWidth = width * 0.12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.18;
  ctx.stroke();
  ctx.restore();

  if (!eyebrow) return;

  // Clear of `reach` above centre, so the brow never touches the wince's top arm.
  // Higher than the framed eye's brow: there is no frame here to crowd, and a
  // wince wants the brows visibly pushed away from the eyes.
  drawEyebrow(ctx, {
    cx: cx + browShift,
    browY: cy - reach - width * (0.35 + eyebrowRaise),
    width,
    browColor,
    eyebrowAngle,
    eyebrowCurve,
    shape: eyebrowShape,
    lengthRatio: 0.72,
  });
}

/**
 * Draws one eye: soft bloom, glowing outer ring, eyebrow, and (when open
 * enough) the purple inner halo + tracking-offset dark pupil + highlights.
 *
 * params.blinkFraction: 0 (open) .. 1 (fully closed), driven by the blink FSM.
 * params.staticOpenFraction: overrides blinkFraction when set — used by
 * expressions like sleepy that hold a fixed half-closed eye outside the FSM.
 * params.pupilOffset: {x, y} in -1..1, already-damped tracking target.
 */
export function drawEye(ctx, params) {
  const {
    x,
    y,
    width,
    height,
    glowColor,
    browColor = glowColor,
    pupilOffset = { x: 0, y: 0 },
    // Multiplies the pupil, and the two highlights on it, past the sizes every other
    // face uses. Only the framed eye has either -- the shapes that replace the whole
    // eye have no pupil to scale.
    pupilScale = 1,
    pupilGlint = 1,
    blinkFraction = 0,
    staticOpenFraction = null,
    eyebrowAngle = 0,
    eyebrow = true,
    // Per-eye vertical lift, in fractions of eye width. eyebrowAngle is applied
    // mirrored (left gets -angle, right +angle), so tilt alone can never raise
    // one brow above the other -- which a smirk needs.
    eyebrowRaise = 0,
    // Bends the brow into an arc instead of a straight line. Positive arches it
    // upward in the middle; 0 keeps the plain stroke every other expression uses.
    eyebrowCurve = 0,
    // Outward slide, in fractions of eye width. Signed here rather than in the
    // helpers below because this is the only level that knows which eye it is.
    eyebrowSpread = 0,
    eyebrowShape = 'arc',
    eyeShape = 'default',
    // Which eye this is. Only shapes that aren't left/right symmetric use it.
    side = 'left',
    // Animation clock, in ms. Only shapes that animate in their own right read it --
    // blinking and the bob reach the eye through blinkFraction and a canvas
    // translate, so everything else here is still a pure function of its geometry.
    tMs = 0,
    // Fraction of the inner well standing in water, measured from its floor. null
    // is dry. Lives on the eye rather than in an effect because the surface has to
    // track the lid: an effect only sees geometry.eyeH, the eye's full height, so a
    // pool it drew would hang outside the eye every time the eye blinked.
    eyeWater = null,
    // Multiplies how far a closed eye's arc bows. Only the flat shapes read it --
    // the framed eye has no arc, and the replaced shapes are their own outlines.
    eyeArc = 1,
    dpr = 1,
  } = params;

  const browShift = (side === 'left' ? -1 : 1) * width * eyebrowSpread;

  // 'flat' is the wink/closed-line look: a single stroke where the eye was, with
  // no frame, well or pupil. Handled up front because it shares nothing below.
  if (eyeShape === 'flat' || eyeShape === 'flatDown') {
    drawFlatEye(ctx, {
      x, y, width, height, glowColor, browColor, eyebrowAngle, eyebrow, eyebrowRaise, eyebrowCurve, eyebrowShape, browShift, eyeArc,
      // Negative bows the lid downward, and the magnitude sets how deeply.
      arcDir: eyeShape === 'flatDown' ? -1.9 : 1,
    });
    return;
  }

  // 'heart' and 'spiral' replace the whole eye rather than just the pupil, so
  // they branch here -- above the frame and the eyebrow -- not at pupil level.
  if (eyeShape === 'heart') {
    drawHeartEye(ctx, { x, y, width, height, tMs, dpr });
    return;
  }

  if (eyeShape === 'spiral') {
    drawSpiralEye(ctx, { x, y, width, height, glowColor, tMs, dpr });
    return;
  }

  if (eyeShape === 'star') {
    drawStarEye(ctx, { x, y, width, height, side, tMs, dpr });
    return;
  }

  if (eyeShape === 'scrunch') {
    drawScrunchEye(ctx, {
      x, y, width, height, glowColor, browColor, eyebrowAngle,
      eyebrow, eyebrowRaise, eyebrowCurve, eyebrowShape, browShift, dpr, side,
    });
    return;
  }

  const openFraction = staticOpenFraction !== null ? staticOpenFraction : 1 - blinkFraction;
  const effHeight = Math.max(height * openFraction, height * 0.05);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const frameY = cy - effHeight / 2;

  drawGlow(ctx, cx, cy, width * 1.3, glowColor, dpr, 0.45 + 0.35 * openFraction);

  roundedRectPath(ctx, x, frameY, width, effHeight, width * FRAME_RADIUS_RATIO);
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.fillStyle = glowColor;
  ctx.fill();
  ctx.restore();

  // Expressions that cover the eyes (cool's sunglasses) switch the brow off --
  // a brow floating just above an opaque lens reads as a glitch.
  if (eyebrow) {
    drawEyebrow(ctx, {
      cx: cx + browShift,
      browY: frameY - width * (0.12 + eyebrowRaise),
      width,
      browColor,
      eyebrowAngle,
      eyebrowCurve,
      shape: eyebrowShape,
    });
  }

  if (openFraction < CLOSED_THRESHOLD) {
    return;
  }

  // inner well — a purple halo rather than flat black, so the dark pupil reads against it
  const inset = width * RING_THICKNESS_RATIO;
  const innerW = width - inset * 2;
  const innerH = Math.max(effHeight - inset * 2, 1);
  const innerY = frameY + (effHeight - innerH) / 2;

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerW * 0.6);
  halo.addColorStop(0, '#451c77');
  halo.addColorStop(0.55, '#22093f');
  halo.addColorStop(1, '#110121');

  roundedRectPath(ctx, x + inset, innerY, innerW, innerH, width * 0.12);
  ctx.fillStyle = halo;
  ctx.fill();

  // tiny glow line tracing the inner well's edge
  roundedRectPath(ctx, x + inset, innerY, innerW, innerH, width * 0.12);
  ctx.save();
  ctx.lineWidth = width * 0.012;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.05;
  ctx.stroke();
  ctx.restore();

  // The natural size first, then the expression's own scaling, then a hard stop at
  // the well. Scaling after the min rather than inside it is what makes pupilScale
  // mean what it says: fold it into the first term and the innerH cap swallows it the
  // moment the pupil grows past the well's height, and the knob stops responding.
  // The 0.95 stops are what the cap was for -- a pupil wider than its own well.
  const pupilSize = Math.min(
    Math.min(width * PUPIL_SIZE_RATIO, innerH * 0.85) * pupilScale,
    innerH * 0.95,
    innerW * 0.95,
  );
  const travelX = (innerW - pupilSize) / 2;
  const travelY = Math.max((innerH - pupilSize) / 2, 0);
  const px = cx + pupilOffset.x * travelX - pupilSize / 2;
  const py = cy + pupilOffset.y * travelY - pupilSize / 2;
  const pcx = px + pupilSize / 2;
  const pcy = py + pupilSize / 2;

  // tiny radiant glow tracing the pupil's rim, drawn first so the dark pupil sits on top
  drawGlow(ctx, pcx, pcy, pupilSize * 1.5, glowColor, dpr, 0.4);

  // pupil — flat dark core fading to transparent at the rim so its edge dissolves
  // into the halo. A dark shadowBlur can't do this: it's invisible against a dark backdrop.
  const pupilGrad = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, pupilSize * 0.72);
  pupilGrad.addColorStop(0, 'rgba(26,0,51,1)');
  pupilGrad.addColorStop(0.7, 'rgba(26,0,51,1)');
  pupilGrad.addColorStop(1, 'rgba(26,0,51,0)');

  roundedRectPath(ctx, px, py, pupilSize, pupilSize, pupilSize * 0.26);
  ctx.fillStyle = pupilGrad;
  ctx.fill();

  // crisp highlights, clipped to the pupil silhouette so they can't bleed past it
  ctx.save();
  roundedRectPath(ctx, px, py, pupilSize, pupilSize, pupilSize * 0.26);
  ctx.clip();

  // Both highlights already grow with the pupil; pupilGlint is what makes them grow
  // faster than it, which is the difference between a bigger eye and a glossier one.
  // Their centres pull in towards the pupil's own centre as they swell, by half the
  // extra radius, so a large glint sits inside the silhouette rather than being cut
  // in half by the clip above.
  const glint = (fx, fy, r) => {
    const rr = pupilSize * r * pupilGlint;
    const grown = rr - pupilSize * r;
    ctx.beginPath();
    ctx.arc(
      px + pupilSize * fx + (fx > 0.5 ? -grown : grown),
      py + pupilSize * fy + (fy > 0.5 ? -grown : grown),
      rr, 0, Math.PI * 2,
    );
  };

  glint(0.71, 0.15, 0.16);
  ctx.fillStyle = '#edebef';
  ctx.shadowColor = 'rgba(237,235,239,0.8)';
  ctx.shadowBlur = pupilSize * 0.12;
  ctx.fill();

  ctx.shadowBlur = 0;
  glint(0.23, 0.65, 0.1);
  ctx.fillStyle = 'rgba(113,97,129,0.9)';
  ctx.fill();
  ctx.restore();

  if (eyeWater) {
    drawEyeWater(ctx, {
      x: x + inset, y: innerY, width: innerW, height: innerH, level: eyeWater, side, tMs,
    });
  }
}

// The reference's own blue, sampled off it: a flat light cyan, no gradient.
const WATER = '#28b6f6';
// The meniscus. Water reads as water because its surface catches light differently
// from its body -- a flat fill with a hard top edge reads as a coloured block.
const WATER_SURFACE = 'rgba(190,240,255,0.85)';

const RIPPLE_MS = 3400;

/**
 * The pool of unshed tears standing in the lower half of the eye.
 *
 * Drawn last so it sits in front of the pupil, as it does in the reference -- the
 * eye is behind the water, not beside it. Clipped to the inner well, so the surface
 * meets the eye's own edge instead of running square across it.
 *
 * The reference's waterline is dead flat: sampled at the two columns its iris does
 * not cover, it is at y 265 on the left and 264 on the right. What looks wavy there
 * is the iris hanging down through it. BUBU's pupil is far too small to do that, so
 * the ripple below is a deliberate departure -- without some movement in the surface
 * the pool reads as a solid wedge of blue rather than as liquid.
 */
function drawEyeWater(ctx, { x, y, width, height, level, side, tMs }) {
  const surface = y + height * (1 - level);
  // Shallow on purpose. The reference's waterline is flat, so every unit of this is
  // a departure -- enough to read as liquid, not enough to read as choppy.
  const wave = height * 0.038;
  // Half a period apart, so the two eyes never crest together and read as one shape.
  const phase = (tMs / RIPPLE_MS) * Math.PI * 2 + (side === 'left' ? 0 : Math.PI);

  ctx.save();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  roundedRectPath(ctx, x, y, width, height, width * 0.12);
  ctx.clip();

  // Traced across rather than drawn as one curve: two humps of different lengths,
  // which is what keeps it from reading as a single tidy arc sliding back and forth.
  const steps = 24;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const sy = surface
      + Math.sin(u * Math.PI * 2 + phase) * wave
      + Math.sin(u * Math.PI * 3.4 - phase * 0.7) * wave * 0.45;
    if (i === 0) ctx.lineTo(x, sy);
    else ctx.lineTo(x + width * u, sy);
  }
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fillStyle = WATER;
  ctx.fill();

  // The surface line on its own, over the fill.
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const sy = surface
      + Math.sin(u * Math.PI * 2 + phase) * wave
      + Math.sin(u * Math.PI * 3.4 - phase * 0.7) * wave * 0.45;
    if (i === 0) ctx.moveTo(x, sy);
    else ctx.lineTo(x + width * u, sy);
  }
  ctx.lineWidth = height * 0.06;
  ctx.strokeStyle = WATER_SURFACE;
  ctx.stroke();

  ctx.restore();
}
