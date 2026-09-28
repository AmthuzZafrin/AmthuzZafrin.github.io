const CYCLE_MS = 2400;

/**
 * The reference mark's three tones, sampled off it rather than guessed.
 *
 * Red rather than the expression's glowColor, and flat rather than glowing: like
 * the confetti and the kiss heart, this is an object in front of the display, not
 * part of it. A purple "?" beside purple brows reads as another facial feature.
 */
const RED = '#f44336';
const RED_DARK = '#cc3333';
const RED_LIT = '#f6695e';

/**
 * The mark's geometry, every number a fraction of its overall height, measured off
 * the reference by scanning its rows.
 *
 * The bowl is a circle: its outer edge runs from y=7 to x=100..371 in the source,
 * which fixes a centre and a radius of 0.2166 with the stroke 0.1444 across -- two
 * thirds of the bowl's radius, which is far heavier than a text "?" and is most of
 * what gives the reference its weight.
 *
 * The tail is a cubic fitted to six centreline points read off the same scan. It
 * meets the bowl at 15 degrees with a small change of direction rather than exactly
 * tangentially, because the reference's own tail drifts inside the bowl's circle as
 * it leaves -- it is not a circle joined to a curve.
 */
const Q = {
  bowlCy: -0.209,
  bowlR: 0.2166,
  // 190 degrees, just above horizontal-left, round clockwise past the top and the
  // right to 15 degrees. Canvas angles put 270 at the top, so increasing angle from
  // here climbs the left side -- the direction the character is written in.
  bowlFrom: Math.PI * 1.056,
  bowlTo: Math.PI * 2.083,
  ctrl1: [0.1359, -0.0359],
  ctrl2: [-0.0233, 0.0452],
  tip: [-0.005, 0.205],
  stroke: 0.1444,
  // Half the width of the shaded band. The reference carries a dark band 26 units
  // of 471 wide down the away-from-the-light side of every stroke -- the right of
  // the walls, the underside of the bowl's top -- which is what rounds it.
  shade: 0.0276,
  dotCy: 0.401,
  dotR: 0.0988,
  // The specular: an arc hugging the outer edge of the bowl's upper left, at the
  // radius and sweep the light band actually occupies in the reference.
  glintR: 0.2548,
  glintFrom: Math.PI * 1.178,
  glintTo: Math.PI * 1.433,
  glintW: 0.052,
};

function markPath(ctx, s) {
  ctx.beginPath();
  ctx.arc(0, Q.bowlCy * s, Q.bowlR * s, Q.bowlFrom, Q.bowlTo);
  ctx.bezierCurveTo(
    Q.ctrl1[0] * s, Q.ctrl1[1] * s,
    Q.ctrl2[0] * s, Q.ctrl2[1] * s,
    Q.tip[0] * s, Q.tip[1] * s,
  );
}

/**
 * Stroked, not set as text: canvas text would pull in whichever font the device
 * happens to have, and the face carries no other glyph -- a "?" in Roboto beside
 * hand-drawn brows reads as UI that leaked onto the display.
 *
 * The shading is a second, narrower stroke offset up and to the left. Offsetting by
 * (-shade, -shade) leaves a band of exactly 2*shade on the far side of *both* a
 * vertical stroke and a horizontal one, which is why one vector shades the whole
 * mark: the right of the walls and the underside of the bowl's top at once.
 */
function drawMark(ctx, cx, cy, s, tilt, alpha) {
  const shade = Q.shade * s;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  // Butt, not round. The reference's terminals are blunt cuts -- its left wall and
  // its stem both close over about 13 rows, where a round cap on a stroke that thick
  // would take 27 -- and a round cap also hangs half a stroke width past the path's
  // end, which closed the gap between the stem and the dot almost completely. With
  // butt the gap comes out at the 0.097 the reference actually has.
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  markPath(ctx, s);
  ctx.lineWidth = Q.stroke * s;
  ctx.strokeStyle = RED_DARK;
  ctx.stroke();

  ctx.save();
  ctx.translate(-shade, -shade);
  markPath(ctx, s);
  ctx.lineWidth = Q.stroke * s - shade * 2;
  ctx.strokeStyle = RED;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, Q.bowlCy * s, Q.glintR * s, Q.glintFrom, Q.glintTo);
  ctx.lineWidth = Q.glintW * s;
  ctx.strokeStyle = RED_LIT;
  ctx.stroke();

  // The dot gets the same treatment, at its own smaller offset -- the reference's
  // band on it is thinner than the one on the strokes, because it is a smaller ball.
  const dotR = Q.dotR * s;
  const dotShade = dotR * 0.118;
  ctx.beginPath();
  ctx.arc(0, Q.dotCy * s, dotR, 0, Math.PI * 2);
  ctx.fillStyle = RED_DARK;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-dotShade, Q.dotCy * s - dotShade, dotR - dotShade, 0, Math.PI * 2);
  ctx.fillStyle = RED;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-dotR * 0.34, Q.dotCy * s - dotR * 0.36, dotR * 0.34, dotR * 0.22, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = RED_LIT;
  ctx.fill();

  ctx.restore();
}

const ease = (t) => t * t * (3 - 2 * t);

/**
 * confused: a question mark surfacing beside the head, tilting as it rises, then
 * fading out and starting again.
 *
 * The tilt is what makes it read as puzzlement rather than as a label: it rocks
 * twice on the way up, the way a head does when someone cannot make sense of
 * something. It also pops in slightly over full size, because a mark that eases in
 * at a constant rate reads as a fade rather than as an arrival.
 */
export function drawQuestionMark(ctx, geometry, tMs) {
  const { rightEyeX, eyeY, eyeW, eyeH, screenX, screenW } = geometry;

  // Centred in the gap between the outer edge of the right eye and the edge of the
  // screen, rather than at a fixed offset from the eye. The thinking dots use an
  // offset and it puts them over the bezel, which is what this is avoiding.
  const cx = (rightEyeX + eyeW + screenX + screenW) / 2;
  const size = eyeH * 0.82;

  const phase = (((tMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS) / CYCLE_MS;
  const cy = eyeY + eyeH * 0.02 - eyeH * 0.4 * ease(phase);
  const tilt = Math.sin(phase * Math.PI * 4) * 0.2;

  const alpha = phase < 0.12
    ? phase / 0.12
    : phase > 0.72 ? Math.max(0, (1 - phase) / 0.28) : 1;
  if (alpha <= 0.01) return;

  // A short overshoot on the way in and nothing after it -- 1.12 at the moment the
  // fade-in finishes, settling to 1 shortly after.
  const grow = phase < 0.22 ? 1 + 0.12 * Math.sin((phase / 0.22) * Math.PI) : 1;

  drawMark(ctx, cx, cy, size * grow, tilt, Math.min(alpha, 1));
}
