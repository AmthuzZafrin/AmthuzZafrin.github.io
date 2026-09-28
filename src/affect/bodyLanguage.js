import { TIMING } from '../components/BubuFace/constants.js';

/**
 * How BUBU moves when it feels something.
 *
 * BubuFace has fifty-five expressions and twelve animation constants, and every
 * one of the twelve is a fixed number. So BUBU blinks at the same rate, floats at
 * the same speed, with the same amplitude, and tracks the pointer with the same
 * lag, whether it is delighted or grieving. Its *face* changes and its **body**
 * never does.
 *
 * That is backwards, in terms of what a person actually reads. Expression is what
 * you notice consciously; tempo is what makes something feel alive before you have
 * worked out what it is feeling. A tired person does not merely wear a tired
 * expression -- they blink slowly, move less, and take longer to look at you. None
 * of that was available to BUBU, and none of it costs a model call.
 *
 * So: the constants become functions of affect. This module is that mapping, and
 * only the mapping -- it returns a timing object of exactly the shape TIMING has,
 * so useFaceAnimation reads from it in place of the frozen constants and nothing
 * else in the renderer has to know that anything changed.
 *
 * Pure and browser-free, so the whole of BUBU's body language is testable under
 * bare node without rendering a frame.
 */

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

/**
 * How far each quantity is allowed to move from its resting value.
 *
 * Bounded multiplicatively rather than replaced outright, so every value here
 * stays anchored to the constants that were tuned against the actual render. The
 * point is a legible shift in tempo, not a different character: at full arousal
 * BUBU is quicker and more awake, not frantic, and at the bottom it is heavy, not
 * broken.
 */
export const RANGE = Object.freeze({
  // Blink interval: the single most legible one. A drowsy face blinks slowly and
  // an alert face often, and people read it without noticing they are reading it.
  blinkInterval: 0.55,
  // Lid speed. Slow lids are the specific thing that reads as tired rather than
  // merely still, which is why this moves further than the others.
  lidSpeed: 0.7,
  // Float period and height: breathing, essentially.
  bobPeriod: 0.4,
  bobAmplitude: 0.5,
  // How promptly the eyes catch up with what they are following.
  damping: 0.55,
});

/**
 * How far the gaze drifts off-target when someone is distressed.
 *
 * Sustained eye contact under distress is confrontational, and looking slightly
 * away while staying present is what people actually do when they are giving
 * someone room. Small on purpose: enough to soften, never enough to look evasive
 * or broken.
 */
export const MAX_GAZE_AVERSION = 0.22;

/** Above this arousal-scaled intensity, double blinks stop being cute and read as twitchy. */
const DOUBLE_BLINK_CEILING = 0.55;

/**
 * Timing for a given affect.
 *
 * `arousal` does nearly all the work here, which is correct: tempo is the
 * behavioural signature of activation, and valence shows in the face. Valence
 * enters only where it genuinely changes movement -- gaze aversion under distress,
 * and the small suppression of playful double blinks when things are heavy.
 *
 * Returns the same keys as TIMING, plus `gazeAversion`, which the gaze integrator
 * consumes and the blink FSM ignores.
 */
export function bodyLanguage({ valence = 0, arousal = 0, intensity = 0 } = {}) {
  const energy = clamp(arousal, -1, 1);
  const distress = clamp(Math.max(0, -valence) * clamp(intensity, 0, 1), 0, 1);

  // Scale for quantities that should get SMALLER as arousal rises (intervals,
  // periods, durations) and its inverse for those that should get larger.
  const slower = 1 - energy * RANGE.blinkInterval;
  const lids = 1 - energy * RANGE.lidSpeed;
  const period = 1 - energy * RANGE.bobPeriod;
  const height = 1 + energy * RANGE.bobAmplitude;
  const snap = 1 + energy * RANGE.damping;

  return Object.freeze({
    ...TIMING,

    blinkIntervalMinMs: Math.round(TIMING.blinkIntervalMinMs * slower),
    blinkIntervalMaxMs: Math.round(TIMING.blinkIntervalMaxMs * slower),

    blinkCloseMs: Math.round(TIMING.blinkCloseMs * lids),
    blinkOpenMs: Math.round(TIMING.blinkOpenMs * lids),
    // The pause with the lids shut. Lengthened when subdued -- a long blink is
    // most of the difference between "resting" and "switched off", and it is the
    // cheapest weary gesture there is.
    blinkHoldMs: Math.round(TIMING.blinkHoldMs * lids),

    bobPeriodMs: Math.round(TIMING.bobPeriodMs * period),
    bobAmplitudePx: TIMING.bobAmplitudePx * height,

    pupilDamping: clamp(TIMING.pupilDamping * snap, 0.02, 0.9),

    // Suppressed when things are heavy. A double blink is a light gesture and it
    // lands badly on someone who has just said something difficult.
    doubleBlinkChance: TIMING.doubleBlinkChance * clamp(1 - distress / DOUBLE_BLINK_CEILING, 0, 1),

    // Not part of TIMING -- consumed by the gaze integrator, ignored by the blink
    // state machine.
    gazeAversion: MAX_GAZE_AVERSION * distress,
  });
}
