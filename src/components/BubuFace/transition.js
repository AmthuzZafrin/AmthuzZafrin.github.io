import { blendExpressions, hasDiscreteChange } from './expressions/blend.js';
import { getExpression } from './expressions/index.js';
import { smoothstep } from './ease.js';
import { SWAP_AT_LID, SWAP_FALLBACK_MS } from './entranceTimeline.js';

/**
 * How one expression becomes another, so every change of face moves the way the
 * welcome entrance does instead of cutting.
 *
 * The entrance always looked better than every other change, for two reasons it did
 * not share with them:
 *
 *   It hid its shape changes under a blink. A mouth cannot be half one shape and half
 *   another (see expressions/blend.js), so part of any change is a pop, and the
 *   entrance only ever changed face with the lids shut. Every other change popped in
 *   the open. Now a change with a shape in it waits for a blink -- asking for one at
 *   once rather than waiting up to several seconds for the next ambient one -- and
 *   lands while the lids are down, with the continuous part gliding out from under.
 *
 *   It never changed its mind halfway. When a reply's face arrived while the previous
 *   change was still settling, the blend restarted from the previous *target*, which
 *   the face had not reached yet, so it jumped. The starting point is now a snapshot
 *   of what was actually on screen.
 *
 * Pure and free of React, so transition.test.mjs can drive it with a plain object.
 * useFaceAnimation owns the state; BubuFace draws faceAt().
 */

/**
 * How long a change of expression takes, once it starts.
 *
 * 720ms, against the 270ms of a blink. The first part runs under the lids, so what is
 * seen is the brows and mouth still settling after they reopen -- the face moving,
 * rather than something that happened while you were not looking.
 *
 * It was 320ms, then 480ms, and both read as quick beside the entrance. The ceiling
 * is roughly a second: past that a face looks like it is deciding on the expression
 * rather than having it.
 */
export const TRANSITION_MS = 720;

/** How far through its transition the face is: 1 when settled. */
export function transitionProgress(s, now) {
  if (s.transitionFrom === null) return 1;
  return Math.min(1, (now - s.transitionStartedAt) / TRANSITION_MS);
}

/**
 * The descriptor to draw right now.
 *
 * Outside a change this is the plain descriptor and blendExpressions is never called,
 * so the common frame costs what it always did. Eased with the same smoothstep as the
 * entrance's lids, so a change has no visible corner where it starts or stops.
 */
export function faceAt(s, now) {
  const target = getExpression(s.expressionKey);
  if (s.transitionFrom === null) {
    return { ...target, effects: target.effects.map((key) => ({ key, alpha: 1 })) };
  }
  return blendExpressions(s.transitionFrom, target, smoothstep(transitionProgress(s, now)));
}

function applyTransition(s, key, now) {
  s.transitionFrom = faceAt(s, now);
  s.transitionStartedAt = now;
  s.expressionKey = key;
  s.pendingExpression = null;
}

/**
 * Start moving the face towards `key`.
 *
 * The single door every expression change goes through -- the entrance's beats,
 * setExpression, and the idle cycler all call this, so none of them can leave a change
 * unanimated by forgetting to.
 *
 * Setting the face already showing is not a transition and must not restart one: the
 * idle cycler and the entrance both re-assert the current face on frames where nothing
 * has changed. It does cancel a change still waiting for its blink, since that change
 * is no longer wanted.
 */
export function beginTransition(s, key, now) {
  if (key === s.expressionKey) {
    s.pendingExpression = null;
    return;
  }
  if (key === s.pendingExpression) return;

  const needsCover = hasDiscreteChange(getExpression(s.expressionKey), getExpression(key));
  if (needsCover && s.blinkFraction < SWAP_AT_LID) {
    s.pendingExpression = key;
    s.pendingSince = now;
    return;
  }
  applyTransition(s, key, now);
}

/**
 * Land a waiting change once the lids are down.
 *
 * Run after the blink FSM, so blinkFraction is this frame's. The fallback is the same
 * backstop the entrance has: if the RAF loop stalls through the whole blink, snap in
 * the open rather than leave the face on one it was asked to leave.
 */
export function updatePendingSwap(s, now) {
  if (s.pendingExpression === null) return;
  if (s.blinkFraction >= SWAP_AT_LID || now - s.pendingSince > SWAP_FALLBACK_MS) {
    applyTransition(s, s.pendingExpression, now);
    return;
  }
  // Ask for the covering blink now. Only from idle -- a blink already under way will
  // reach the threshold by itself -- and never during the entrance, which schedules
  // its own blinks and must not have one pulled forward.
  if (s.entranceStartedAt === null && s.blinkPhase === 'idle' && s.nextBlinkAt > now) {
    s.nextBlinkAt = now;
  }
}

/**
 * How long each face of a situation is held before the next begins: the covering
 * blink, the glide, and a beat of the face simply being there, so each one reads.
 */
export const SEQUENCE_HOLD_MS = 1700;

/**
 * Move through several faces in order -- a situation's faces, from
 * backend/emotion.py SITUATIONS -- each one entering through beginTransition, so
 * every step is blink-covered and eased like any other change. One face is not a
 * sequence and just becomes that face. With `loop`, it starts over after the last
 * (the preview page uses that); otherwise it stays on the last face.
 */
export function startSequence(s, keys, now, { loop = false, holdMs = SEQUENCE_HOLD_MS } = {}) {
  s.sequence = keys.length > 1 ? { keys, index: 0, nextAt: now + holdMs, holdMs, loop } : null;
  beginTransition(s, keys[0], now);
  s.pinnedExpression = keys[0];
}

export function updateSequence(s, now) {
  const seq = s.sequence;
  if (!seq || now < seq.nextAt) return;
  let next = seq.index + 1;
  if (next >= seq.keys.length) {
    if (!seq.loop) {
      s.sequence = null;
      return;
    }
    next = 0;
  }
  seq.index = next;
  seq.nextAt = now + seq.holdMs;
  beginTransition(s, seq.keys[next], now);
  s.pinnedExpression = seq.keys[next];
}

export function updateTransition(s, now) {
  if (s.transitionFrom !== null && now - s.transitionStartedAt >= TRANSITION_MS) {
    s.transitionFrom = null;
  }
}
