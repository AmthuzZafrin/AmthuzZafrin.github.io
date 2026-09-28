import { roundedRectPath } from '../render/path';
import { OPEN_MOUTH_SIZES, openMouthCentreY } from '../render/drawMouth';

const VAPOUR = '255,255,255';

// The cumulus, as (x across the puff's half-width, y down its height, radius in
// half-widths). Narrow at the top so the puff leaves the mouth as a thin stream and
// only billows once it is clear of it -- a puff that starts at full width reads as a
// beard rather than as breath.
const BLOBS = [
  { x: 0, y: 0.02, r: 0.14 },
  { x: -0.14, y: 0.22, r: 0.22 },
  { x: 0.18, y: 0.26, r: 0.2 },
  { x: -0.48, y: 0.46, r: 0.26 },
  { x: 0.44, y: 0.5, r: 0.24 },
  { x: -0.08, y: 0.52, r: 0.3 },
  { x: -0.62, y: 0.74, r: 0.22 },
  { x: 0.2, y: 0.78, r: 0.28 },
  { x: 0.6, y: 0.8, r: 0.2 },
  { x: -0.26, y: 0.92, r: 0.24 },
];

const CYCLE_MS = 2600;

// The cloud's height as a fraction of its width. Flat on purpose: the mouth sits at
// 0.7 of the screen's height, so there is far less room below it than the reference
// has below its own mouth, and a puff that spreads sideways fits where one that
// billows downward does not.
const H_RATIO = 0.5;

// How far past its anchor the puff actually reaches at full size, as a fraction of
// its width -- taken from the blob table rather than assumed, so retuning a blob
// cannot silently push the cloud through the bottom of the screen.
const EXTENT = Math.max(...BLOBS.map((b) => b.y * H_RATIO + b.r * 0.5));

// The soft edge reaches past the silhouette too. Counted in, because a clipped glow
// leaves a hard straight edge that is more obvious than the blob it came from.
const GLOW_SPREAD = 0.12;

/**
 * One breath, at `phase` 0..1 through its life.
 *
 * Drawn as a single union path and filled once, the same construction the clouds
 * effect uses and for the same reason: the blobs overlap deliberately, and per-blob
 * translucent fills would show every one of those overlaps as a brighter seam.
 */
function puff(ctx, cx, top, phase, width, drop) {
  // Snaps in at the lips, holds at full opacity through the middle of its life, then
  // thins as it disperses. A curve that only *peaks* at full -- the obvious
  // min(phase*4) * (1-phase) shape -- leaves the puff translucent for almost its whole
  // life, and translucent white on a near-black screen is grey smoke, not breath.
  const alpha = Math.min(1, phase * 6, (1 - phase) * 2.4);
  if (alpha <= 0.01) return;

  // Grows as it falls. Breath expands as it cools, and a puff that keeps one size
  // reads as a solid object being lowered on a string.
  // Grows to exactly `width` at the end of its life, which is what the containment
  // arithmetic in drawBreathPuff is solved against.
  const scale = 0.5 + phase * 0.5;
  const halfW = width * 0.5 * scale;
  // Proportional to the puff's own width, not to how far it falls. Tying it to the
  // drop made the cloud a third as tall as it was wide, and at that aspect the lobes
  // overlap so heavily they merge into two lumps instead of reading as a billow.
  const height = width * H_RATIO * scale;
  const y = top + drop * phase;
  // A slight sideways drift, so the two puffs in flight are never mirror images.
  const driftX = cx + Math.sin(phase * 2.4) * width * 0.12;

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.beginPath();
  for (const blob of BLOBS) {
    const r = halfW * blob.r;
    const bx = driftX + blob.x * halfW;
    const by = y + blob.y * height;
    ctx.moveTo(bx + r, by);
    ctx.arc(bx, by, r, 0, Math.PI * 2);
  }

  const body = ctx.createLinearGradient(0, y, 0, y + height);
  body.addColorStop(0, `rgba(${VAPOUR},0.92)`);
  body.addColorStop(1, `rgba(${VAPOUR},0.55)`);
  ctx.fillStyle = body;
  ctx.shadowColor = `rgba(${VAPOUR},0.5)`;
  ctx.shadowBlur = width * GLOW_SPREAD * scale;
  ctx.fill();

  ctx.restore();
}

/**
 * exhaust: the breath of the exhaling-face emoji, falling from the mouth.
 *
 * Two puffs half a cycle apart rather than one. A single puff leaves the face empty
 * for the part of the cycle where it has faded and the next has not started, and that
 * gap reads as a dropped frame rather than as breathing.
 *
 * The start is derived from OPEN_MOUTH_SIZES, so retuning the 'blow' mouth carries the
 * breath with it instead of leaving it hanging off the lip.
 *
 * The puff falls rather than rises. That is the reference's own direction and it is
 * worth keeping: vapour rising would read as steam off a hot drink, where this is a
 * sigh with weight behind it.
 */
export function drawBreathPuff(ctx, geometry, tMs) {
  const { mouthCx, mouthY, mouthW, screenX, screenY, screenW, screenH, screenRadius } = geometry;

  const ry = mouthW * OPEN_MOUTH_SIZES.blow.ry;
  const top = openMouthCentreY(mouthY, mouthW, 'blow') + ry * 0.7;

  // The puff is sized to the room it has, rather than to a fraction of the mouth.
  //
  // The reference's is 1.4x its mouth across, but the reference's mouth sits higher on
  // a face that continues past the frame, and taking that ratio literally here runs
  // the cloud through the bottom of the screen at the end of every breath. Solving
  // `drop + (EXTENT + GLOW_SPREAD) * width == room` instead makes the last and lowest
  // frame land exactly on the screen's edge, and keeps doing so if the blob table, the
  // mouth row or the screen proportions move. It works out near enough 1.1x the mouth,
  // so the departure costs little.
  const room = screenY + screenH - top;
  const drop = room * 0.2;
  const width = (room - drop) / (EXTENT + GLOW_SPREAD);

  ctx.save();
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  const phase = (tMs % CYCLE_MS) / CYCLE_MS;
  puff(ctx, mouthCx, top, phase, width, drop);
  puff(ctx, mouthCx, top, (phase + 0.5) % 1, width, drop);

  ctx.restore();
}
