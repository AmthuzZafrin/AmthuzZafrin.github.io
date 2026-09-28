import { roundedRectPath } from '../render/path';

// Sampled off the reference: the mercury reads (198,59,40) and the glass (226,245,252).
// The red is pushed a little brighter here -- on this near-black screen the sampled
// value sits close enough to the shell's plum to lose its edge against it.
const MERCURY = '#e0402a';
const MERCURY_DEEP = '#a52a18';
const GLASS = '#e2f5fc';
const GLASS_SHADE = '#b9d8e6';

// Where the mercury column starts and stops along the tube. The reference's glass is
// clear for roughly its first third.
const FILL_START = 0.36;
const FILL_END = 0.985;

/**
 * ill: a clinical thermometer held in the corner of the mouth, angled up and out
 * across the cheek.
 *
 * Drawn in a translated and rotated space, so every measurement below is along the
 * tube rather than in screen coordinates. Placing a rotated capsule by its corners
 * instead means re-deriving four points each time the angle moves, and the angle is
 * exactly the thing that needs tuning here.
 *
 * The tilt is shallower than the reference's 44 degrees, and deliberately. The emoji's
 * eyes are small dots high on a circular face, so a steep thermometer passes well
 * clear of them; BUBU's eyes are large, low and far apart, and at 44 degrees the tube
 * runs straight through the left one. 24 degrees keeps it under the eye and still
 * reads as propped in the mouth rather than lying flat.
 *
 * Drawn as an effect, so it lands after the mouth and covers its left corner -- which
 * is what makes it read as held in the mouth rather than floating in front of it.
 */
export function drawThermometer(ctx, geometry) {
  const { screenX, screenY, screenW, screenH, screenRadius, mouthCx, mouthY, mouthW } = geometry;

  const angle = 0.42;
  const length = screenW * 0.38;
  const thickness = screenW * 0.05;

  // The mouth's left corner, a touch below the line so the tube sits in the corner
  // rather than balanced on top of it.
  const endX = mouthCx - mouthW * 0.55;
  const endY = mouthY + mouthW * 0.06;

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  ctx.translate(endX - length * Math.cos(angle), endY - length * Math.sin(angle));
  ctx.rotate(angle);

  const half = thickness / 2;
  // The reservoir at the tip that goes in the mouth. A clinical thermometer is a tube
  // with a swollen bulb at one end, and without it this was a uniform capsule -- which
  // is a lolly stick, not an instrument. Wider than the tube, or it does not read as
  // a separate part.
  const bulbR = thickness * 0.62;

  // Tube and bulb as one union path, so no seam shows where they meet. Two subpaths
  // wound the same way, filled nonzero.
  const glass = () => {
    ctx.beginPath();
    ctx.moveTo(half, -half);
    ctx.lineTo(length, -half);
    ctx.arc(length, 0, half, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(half, half);
    ctx.arc(half, 0, half, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    ctx.moveTo(length + bulbR, 0);
    ctx.arc(length, 0, bulbR, 0, Math.PI * 2);
  };

  // 1. The glass. Three stops rather than two: a bright line along the top edge, the
  // body colour through the middle, and shade underneath. Two stops give a flat ramp,
  // which reads as a bevelled strip; the bright edge is what makes it a cylinder.
  const body = ctx.createLinearGradient(0, -bulbR, 0, bulbR);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.3, GLASS);
  body.addColorStop(1, GLASS_SHADE);
  ctx.save();
  glass();
  ctx.fillStyle = body;
  ctx.shadowColor = 'rgba(210,240,255,0.45)';
  ctx.shadowBlur = thickness * 0.5;
  ctx.fill();
  ctx.restore();

  ctx.save();
  glass();
  ctx.clip();

  // 2. The mercury: a full bulb and a thread running out of it. The thread used to be
  // 0.56 of the tube's thickness, which is not a column of mercury -- it is a red bar
  // with a rim of glass drawn round it. A real one is a hairline.
  const fillX = length * FILL_START;
  const fillH = thickness * 0.2;
  const column = ctx.createLinearGradient(0, -fillH, 0, fillH);
  column.addColorStop(0, MERCURY);
  column.addColorStop(1, MERCURY_DEEP);

  ctx.beginPath();
  ctx.arc(length, 0, bulbR * 0.66, 0, Math.PI * 2);
  ctx.fillStyle = column;
  ctx.fill();

  roundedRectPath(ctx, fillX, -fillH / 2, length * FILL_END - fillX, fillH, fillH / 2);
  ctx.fillStyle = column;
  ctx.fill();

  // 3. Graduations, etched on the glass above the thread rather than ruled across the
  // mercury. That is where a thermometer's scale actually is, and ticks drawn over the
  // column read as segments of it -- as though the mercury came in pieces.
  ctx.strokeStyle = 'rgba(90,130,150,0.5)';
  ctx.lineCap = 'butt';
  for (let i = 1; i <= 9; i += 1) {
    const x = length * 0.18 + (length * 0.72 * i) / 10;
    const long = i % 3 === 0;
    ctx.lineWidth = thickness * (long ? 0.07 : 0.05);
    ctx.beginPath();
    ctx.moveTo(x, -half * 0.86);
    ctx.lineTo(x, -half * (long ? 0.24 : 0.46));
    ctx.stroke();
  }

  // 4. The specular streak along the top of the glass, and a second on the bulb --
  // it is a sphere, and a sphere under the same light carries its own highlight.
  ctx.beginPath();
  ctx.moveTo(half, -thickness * 0.26);
  ctx.lineTo(length - bulbR, -thickness * 0.26);
  ctx.lineWidth = thickness * 0.12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.stroke();

  const gleam = ctx.createRadialGradient(
    length - bulbR * 0.35, -bulbR * 0.38, 0,
    length - bulbR * 0.35, -bulbR * 0.38, bulbR * 0.6,
  );
  gleam.addColorStop(0, 'rgba(255,255,255,0.75)');
  gleam.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(length - bulbR * 0.35, -bulbR * 0.38, bulbR * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = gleam;
  ctx.fill();

  ctx.restore();
  ctx.restore();
}
