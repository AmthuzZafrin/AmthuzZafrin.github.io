import { DEFAULTS } from './definitions.js';

/**
 * Mixing one expression into another, so a change of face is a move rather than a cut.
 *
 * Until this existed, setExpression was a hard assign: every property of the new
 * face appeared on a single frame. Going neutral -> happy meant the brows were
 * flat and then, one frame later, arched, with two full cheeks of blush already
 * at full strength. What this produces instead is a descriptor for any moment in
 * between, which draw() consumes exactly as it consumes a real one.
 *
 * Three kinds of property, treated three ways, because they genuinely differ:
 *
 *   Continuous  -- brow curve, brow raise, mouth curve, pupil scale, colours.
 *                  Interpolated. This is the part that does the work, and it is
 *                  what the request "the eyebrow should curve down slowly" is
 *                  asking for.
 *
 *   Discrete    -- eyeShape, mouthShape, eyebrowShape, and the on/off flags.
 *                  A shape cannot be half 'flat' and half 'default'; there is no
 *                  value between a framed eye and a closed arc. These take the
 *                  target immediately, at t=0.
 *
 *   Effects     -- blush, tears, sparkles. Faded by alpha, which is what makes
 *                  blush "appear slowly" rather than switch on.
 *
 * Discrete properties switch at the *start* rather than at the midpoint, and that
 * is deliberate. Every discrete change in this app happens behind a blink -- the
 * entrance's smile arrives and leaves under one -- and a midpoint switch would
 * fall roughly when the lids are opening again, putting the one unavoidable pop
 * in the sequence exactly where it can be seen. At t=0 it lands while the eyes
 * are still shut, and the continuous properties glide out from under the blink.
 *
 * Pure, and importable under bare node, so blend.test.mjs can assert it directly.
 */

/** Interpolated on the way through. Everything here is a plain number on a face. */
const CONTINUOUS = [
  'eyebrowAngle',
  'eyebrowSpread',
  'eyebrowCurve',
  'mouthCurve',
  'mouthScale',
  'mouthHeight',
  'mouthDrop',
  // Continuous rather than discrete so a face changing mid-sentence fades the
  // lip-sync out across the transition. As a discrete switch the mouth would stop
  // dead on one frame, halfway through a syllable, which is the exact pop the
  // rest of this file exists to avoid.
  'mouthSync',
  'pupilScale',
  'pupilGlint',
  'sweatScale',
  'blushRise',
  'eyeArc',
];

/**
 * Either one number for both eyes or a per-eye {left, right}. Interpolated per
 * side, so a face with one eye bigger than the other still arrives one eye at a
 * time rather than snapping.
 *
 * The fallback is what a missing value means for that property, and the two
 * differ: no eyebrowRaise is no lift at all, while no eyeScale is full size.
 */
const SIDED = { eyebrowRaise: 0, eyeScale: 1 };

/** Interpolated through RGB. Carries the sad faces' cooler glow across. */
const COLOURS = ['glowColor', 'browColor'];

/**
 * Taken from the target at t=0. Listed rather than inferred, so a property added
 * to DEFAULTS without being classified here fails the test that checks this file
 * covers all of them, instead of silently never animating.
 */
const DISCRETE = [
  'eyebrowShape',
  'eyebrow',
  'mouth',
  'eyeShape',
  'mouthShape',
  'bounce',
  'pupilBias',
  'eyeWater',
  'eyeDroopMs',
  'eyeStaticOpenFraction',
];

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const lerp = (a, b, t) => a + (b - a) * t;

function lerpSided(a, b, t, fallback) {
  const side = (value, which) => {
    if (value === null || value === undefined) return fallback;
    return typeof value === 'number' ? value : value?.[which] ?? fallback;
  };
  return {
    left: lerp(side(a, 'left'), side(b, 'left'), t),
    right: lerp(side(a, 'right'), side(b, 'right'), t),
  };
}

const HEX = /^#([0-9a-f]{6})$/i;

/** Interpolates two `#rrggbb` strings. Anything else falls back to the target,
 * since there is nothing sensible to interpolate between two unknown formats. */
export function lerpColour(a, b, t) {
  const ma = HEX.exec(a);
  const mb = HEX.exec(b);
  if (!ma || !mb) return t < 1 ? a : b;
  const na = parseInt(ma[1], 16);
  const nb = parseInt(mb[1], 16);
  const channel = (shift) => {
    const value = Math.round(lerp((na >> shift) & 255, (nb >> shift) & 255, t));
    return value.toString(16).padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/** An effect as a {key, alpha} pair. A bare key is an effect at full strength. */
const asEffect = (effect) => (typeof effect === 'string' ? { key: effect, alpha: 1 } : effect);

/**
 * How strongly each effect should be drawn partway through a transition.
 *
 * An effect on both faces stays at full strength rather than dipping through the
 * middle -- two expressions that both blush should not have the blush flicker on
 * the way between them.
 *
 * `from` may already carry alphas: a change that starts mid-change starts from the
 * blend on screen (see transition.js), where a blush can be half faded in. It then
 * carries on from that strength instead of jumping back to full or to nothing.
 */
export function blendEffects(from, to, t) {
  const start = new Map(from.map(asEffect).map(({ key, alpha }) => [key, alpha]));
  const alphas = new Map();
  for (const [key, alpha] of start) alphas.set(key, alpha * (1 - t));
  for (const { key } of to.map(asEffect)) {
    alphas.set(key, start.has(key) ? lerp(start.get(key), 1, t) : t);
  }
  return [...alphas].map(([key, alpha]) => ({ key, alpha }));
}

const sameValue = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Whether going from one face to the other changes anything that cannot glide --
 * a shape, a flag. Those changes are the ones transition.js hides under a blink;
 * a change that is all brow angles and colours can move in the open.
 */
export function hasDiscreteChange(from, to) {
  return DISCRETE.some((key) => !sameValue(from[key], to[key]));
}

/**
 * A descriptor for the face `t` of the way from `from` to `to`.
 *
 * Returns the same flat shape getExpression does, plus `effects` carrying an
 * alpha per entry. draw() cannot tell the difference apart from that.
 */
export function blendExpressions(from, to, rawT) {
  const t = clamp01(rawT);
  if (t <= 0) return { ...from, effects: blendEffects(from.effects, from.effects, 0) };
  if (t >= 1) return { ...to, effects: blendEffects(to.effects, to.effects, 1) };

  // Start from the target, so anything unclassified is at least correct by the
  // end of the transition rather than stuck on the old face forever.
  const out = { ...to };
  for (const key of CONTINUOUS) out[key] = lerp(from[key], to[key], t);
  for (const [key, fallback] of Object.entries(SIDED)) {
    out[key] = lerpSided(from[key], to[key], t, fallback);
  }
  for (const key of COLOURS) out[key] = lerpColour(from[key], to[key], t);
  for (const key of DISCRETE) out[key] = to[key];
  out.effects = blendEffects(from.effects, to.effects, t);
  return out;
}

/** Exported for the test that checks every property of a face is accounted for. */
export const CLASSIFIED = {
  CONTINUOUS,
  SIDED: Object.keys(SIDED),
  COLOURS,
  DISCRETE,
  ALL_KEYS: Object.keys(DEFAULTS),
};
