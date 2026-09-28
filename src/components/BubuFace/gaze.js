import { TIMING } from './constants.js';

/**
 * Where BUBU is looking.
 *
 * Centred by default, and centred is the whole point: BUBU is looking at the
 * person. This used to run a synthetic wander -- a fresh random waypoint every
 * two to four seconds -- whenever the camera had nothing to track, so the eyes
 * drifted around the room while someone was mid-sentence. A companion that will
 * not hold your gaze reads as distracted, and no amount of easing fixes what the
 * motion is saying.
 *
 * The pupils now move for exactly two reasons. Real tracking, when the camera has
 * a face -- which is not a departure from centre, it *is* looking at them. And an
 * expression's own pupilBias, applied in BubuFace's draw() and overriding this
 * entirely: glancing up in thought or away in embarrassment belongs to the
 * expression rather than being something the eyes do on their own.
 *
 * Own module, next to ease.js, for the reason entranceTimeline.js gives: it is
 * maths and it touches no canvas, no React and no browser global, so gaze.test.mjs
 * can drive it frame by frame under bare node.
 */

/** How long a tracked face position stays trusted after it was last seen. */
export const TRACKING_STALE_MS = 1500;

/** Straight ahead, at whoever is sitting there. */
export const GAZE_CENTRE = Object.freeze({ x: 0, y: 0 });

/** Whether the camera has given us a face position recently enough to follow. */
export function isTracking(state, now) {
  return Boolean(state.trackingActive) && now - state.lastTrackedAt <= TRACKING_STALE_MS;
}

/**
 * Advance the pupils one frame.
 *
 * The return to centre uses the same damped ease the tracking does, so a face
 * leaving frame drifts back rather than snapping to the middle. Mutates
 * `state.pupil` in place -- the animation state is one mutable ref by design, so
 * that no motion costs a React render.
 */
export function updateGaze(state, now) {
  // Timing comes from the state when the affect layer has supplied one, and falls
  // back to the constants otherwise -- so a caller that never sets an affect gets
  // exactly the behaviour this had before, and the entrance sequence and tests
  // that build a bare state keep working untouched.
  const timing = state.timing ?? TIMING;
  const tracking = isTracking(state, now);
  let target = tracking ? state.trackedTarget : GAZE_CENTRE;

  // Under distress the gaze settles slightly off the person rather than holding
  // them in a stare. Applied to the target, not the pupil, so it eases in through
  // the same damping as everything else instead of jumping.
  const aversion = timing.gazeAversion ?? 0;
  if (aversion > 0 && tracking) {
    target = { x: target.x * (1 - aversion), y: target.y * (1 - aversion) + aversion * 0.5 };
  }

  state.pupil.x += (target.x - state.pupil.x) * timing.pupilDamping;
  state.pupil.y += (target.y - state.pupil.y) * timing.pupilDamping;
  return state.pupil;
}
