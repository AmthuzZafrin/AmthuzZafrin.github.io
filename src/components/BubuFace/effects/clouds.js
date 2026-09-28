import { roundedRectPath } from '../render/path';

const WHITE = '255,255,255';
// The shaded side of a lobe. A cool grey rather than neutral, so the shadow reads
// as sky light rather than as dirt on the white.
const SHADE = '150,158,182';

/**
 * Traces one bank as a single union path: a slab pinned to a screen edge plus a
 * row of puffs bulging off its inner edge.
 *
 * One path rather than per-puff fills, for two reasons. The union gives a
 * continuous silhouette -- the puffs sit closer together than their radii sum,
 * precisely so no flat slab shows between them. And filling once means no overlap
 * can show through as a brighter seam, which per-puff translucent fills would.
 *
 * `edge` is -1 for the bank hanging from the top, +1 for the one rising from the
 * bottom. Each puff's `dy` pushes it deeper into the face, in the same direction
 * for either bank, so the silhouette isn't a single row of circles sitting on one
 * straight line -- that regularity is most of what reads as cartoon.
 */
function bankPath(ctx, screen, edge, baseY, puffs, drift) {
  const { x: sx, y: sy, w: sw, h: sh } = screen;

  ctx.beginPath();
  // Slabs overshoot past their screen edge; the caller's clip trims them, which is
  // cheaper than matching the screen's rounded corners here.
  if (edge < 0) ctx.rect(sx, sy - sh, sw, sh + (baseY - sy));
  else ctx.rect(sx, baseY, sw, sy + sh * 2 - baseY);

  for (const puff of puffs) {
    const r = sw * puff.r;
    // Drift wraps over a span wider than the screen, so a puff never pops in or
    // out of existence at an edge -- it slides past behind the shell instead.
    const px = sx + ((((puff.x + drift) % 1.4) + 1.4) % 1.4 - 0.2) * sw;
    const py = baseY - edge * sw * (puff.dy ?? 0);
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, Math.PI * 2);
  }
}

/**
 * One bank, in three passes.
 *
 * One bank, in four passes.
 *
 * Haze blurs the silhouette outward so the bank dissolves into the dark instead of
 * ending on a hard outline. Body lays the white over it, opaque at the screen edge
 * and thinning towards the face. Shade pools cool grey at each lobe's inner side
 * and highlight pools light at its outer side -- together those two give every
 * lobe a lit crown over a shaded base, which is what separates a cloud from one
 * flat white mass.
 *
 * A single flat fill with an outline was the first attempt and looked like clip
 * art; the layering is the whole difference.
 */
function drawBank(ctx, screen, edge, base, puffs, drift, sway) {
  const { x: sx, y: sy, w: sw, h: sh } = screen;
  // `base` is the slab's inner edge, as a fraction of screen height from the top.
  const baseY = sy + sh * base + sway;
  const maxReach = Math.max(...puffs.map((p) => p.r + (p.dy ?? 0))) * sw;
  const outerY = edge < 0 ? sy : sy + sh;
  const innerY = baseY + edge * -1 * maxReach;

  // 1. haze
  ctx.save();
  bankPath(ctx, screen, edge, baseY, puffs, drift);
  ctx.fillStyle = `rgba(${WHITE},0.22)`;
  ctx.shadowColor = `rgba(${WHITE},0.45)`;
  ctx.shadowBlur = sw * 0.07;
  ctx.fill();
  ctx.fill();
  ctx.restore();

  // 2. body -- the inner edge is left well short of opaque so the haze under it
  // still shows through and the bank fades out rather than stopping.
  ctx.save();
  bankPath(ctx, screen, edge, baseY, puffs, drift);
  const body = ctx.createLinearGradient(0, outerY, 0, innerY);
  body.addColorStop(0, `rgba(${WHITE},0.99)`);
  body.addColorStop(0.5, `rgba(${WHITE},0.94)`);
  body.addColorStop(1, `rgba(${WHITE},0.42)`);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();

  // 3 + 4. shade and highlight pools, both clipped to the silhouette so neither
  // bloom escapes it. `edge` points from the face towards the screen edge, so
  // -edge is deeper into the face: the shaded side.
  ctx.save();
  bankPath(ctx, screen, edge, baseY, puffs, drift);
  ctx.clip();

  const pools = (offset, radius, colour, inner, outer) => {
    for (const puff of puffs) {
      const r = sw * puff.r;
      const px = sx + ((((puff.x + drift) % 1.4) + 1.4) % 1.4 - 0.2) * sw;
      const py = baseY - edge * sw * (puff.dy ?? 0) + edge * r * offset;
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, r * radius);
      gradient.addColorStop(0, `rgba(${colour},${inner})`);
      gradient.addColorStop(1, `rgba(${colour},${outer})`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(px, py, r * radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  pools(-0.55, 1.15, SHADE, 0.5, 0);
  pools(0.5, 1.05, WHITE, 0.9, 0);
  ctx.restore();
}

// x, r and dy are all fractions of screen width. Radii and depths are deliberately
// uneven -- matched puffs on a level line are what make a cloud look drawn.
//
// A bank's reach is base*screenH + max(r + dy)*screenW + sway, and it has to clear
// the eyes. The bases are set from the *worst* case, not from whatever a screenshot
// shows: the banks drift, so every puff eventually passes over an eye, and sizing
// against the average leaves the largest one grazing it a minute later.
//
// 'peaking' scales its eyes to 1.3, which takes their span from 0.24-0.50 of screen
// height out to 0.20-0.54, and both bases are set to leave the same 14 units of face
// showing past them. The top bank had 19 units of slack and the bottom 30, so this
// is what closes the two banks in on the eyes -- most of it comes from the eyes
// growing to meet them, because the puffs do most of each bank's reaching and only
// the slab behind them can be pulled back.
const TOP_PUFFS = [
  { x: -0.02, r: 0.1, dy: 0.012 },
  { x: 0.11, r: 0.072 },
  { x: 0.23, r: 0.105, dy: 0.02 },
  { x: 0.36, r: 0.066, dy: 0.008 },
  { x: 0.48, r: 0.098 },
  { x: 0.6, r: 0.075, dy: 0.018 },
  { x: 0.73, r: 0.11, dy: 0.006 },
  { x: 0.87, r: 0.068 },
  { x: 1.0, r: 0.096, dy: 0.014 },
];

const BOTTOM_PUFFS = [
  { x: -0.04, r: 0.088, dy: 0.01 },
  { x: 0.09, r: 0.11, dy: 0.018 },
  { x: 0.22, r: 0.07 },
  { x: 0.34, r: 0.102, dy: 0.014 },
  { x: 0.47, r: 0.074, dy: 0.006 },
  { x: 0.59, r: 0.108, dy: 0.02 },
  { x: 0.72, r: 0.069 },
  { x: 0.85, r: 0.104, dy: 0.012 },
  { x: 0.98, r: 0.08, dy: 0.004 },
];

/**
 * peaking: cloud banks across the top and bottom, leaving only a band of face with
 * the eyes in it.
 *
 * Drawn as an effect, so it lands after the eyes and mouth and genuinely occludes
 * them -- which is the whole look. The two banks drift in opposite directions at
 * different speeds and sway out of phase, all from tMs, so the pair never reads as
 * one rigid frame around the eyes.
 */
export function drawClouds(ctx, geometry, tMs) {
  const { screenX, screenY, screenW, screenH, screenRadius } = geometry;
  const screen = { x: screenX, y: screenY, w: screenW, h: screenH };

  ctx.save();
  // Clipped to the screen so the banks can't spill onto the metal shell.
  roundedRectPath(ctx, screenX, screenY, screenW, screenH, screenRadius);
  ctx.clip();

  // 0.005 is the top slab's floor, near enough: its puffs already reach 62.6 units
  // past it and the eyes' top is 82.8 from the screen edge, so there is nowhere else
  // for it to go. 0.74 is where the bottom bank already sat -- at the scaled eye size
  // that is exactly the matching margin, so it stays.
  drawBank(ctx, screen, -1, 0.005, TOP_PUFFS, tMs / 90000, Math.sin(tMs / 4200) * screenH * 0.01);
  drawBank(ctx, screen, 1, 0.74, BOTTOM_PUFFS, -tMs / 65000, Math.sin(tMs / 5300 + 1.9) * screenH * 0.011);

  ctx.restore();
}
