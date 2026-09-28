import { useCallback, useRef } from 'react';
import { bodyLanguage } from '../../affect/bodyLanguage.js';
import { TIMING, IDLE_SAFE_EXPRESSIONS } from './constants';
import { smoothstep } from './ease';
import { updateGaze } from './gaze';
import {
  beginTransition,
  startSequence,
  updatePendingSwap,
  updateSequence,
  updateTransition,
} from './transition';
import {
  ENTRANCE_BEATS,
  ENTRANCE_END_MS,
  ENTRANCE_OPENING_EXPRESSION,
  beatReady,
  entranceLidClosed,
  entranceOwnsLids,
} from './entranceTimeline';

function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function scheduleNextBlink(state, now) {
  const timing = state.timing ?? TIMING;
  state.nextBlinkAt = now + randRange(timing.blinkIntervalMinMs, timing.blinkIntervalMaxMs);
}

function createInitialState(initialExpression) {
  const now = performance.now();
  return {
    expressionKey: initialExpression,
    pinnedExpression: null,
    lastInteractionAt: now,

    blinkPhase: 'idle',
    blinkPhaseStartedAt: now,
    nextBlinkAt: now + randRange(TIMING.blinkIntervalMinMs, TIMING.blinkIntervalMaxMs),
    doubleBlinkArmed: false,
    blinkFraction: 0,

    idleActive: false,
    idleCycleIndex: 0,
    idleHoldUntil: 0,

    pupil: { x: 0, y: 0 },

    trackingActive: false,
    trackedTarget: { x: 0, y: 0 },
    lastTrackedAt: 0,

    bobPhase: 0,
    // Accumulated rather than derived from `now % period`, because the period is
    // no longer constant. Deriving it means that the instant arousal changes the
    // period, the phase jumps to a different point in the cycle and BUBU visibly
    // lurches mid-float. Integrating the phase keeps the motion continuous across
    // a tempo change, which is the entire reason the tempo is allowed to change.
    lastFrameAt: now,

    // Live animation timing, from affect/bodyLanguage.js. Starts as the resting
    // constants, so a BubuFace that is never told about an affect behaves exactly
    // as it did before any of this existed.
    timing: TIMING,

    // The face being moved away from -- a full descriptor, snapshotted from what
    // was on screen when the change began -- and when that move began. null means
    // the face is settled and draw() can use the expression directly, which is
    // every frame outside a change. See transition.js.
    transitionFrom: null,
    transitionStartedAt: 0,
    // A change waiting for a blink to hide behind, and when it started waiting.
    pendingExpression: null,
    pendingSince: 0,
    // A situation's faces being played in order; null when there is none.
    sequence: null,

    // The talking mouth. `speechPulses` is the list of moments a mouth opens,
    // in ms from speechStartedAt; see audio/wordTiming.mouthPulses.
    speechPulses: null,
    speechStartedAt: 0,
    mouthOpenAmount: 0,

    // The entrance. `entranceStartedAt` being null is the whole on/off switch --
    // every other field here is meaningless while it is.
    entranceStartedAt: null,
    // How far through ENTRANCE_BEATS the sequence is. Past the end means every
    // scripted expression change has landed.
    entranceBeat: 0,
  };
}

/**
 * How far the mouth opens at the peak of a syllable, as a multiple of that
 * syllable's own openness, and how far it falls back between them.
 *
 * It never shuts completely while talking: a mouth that closes fully between
 * syllables reads as chewing. It also never reaches 1 -- that is a yawn, and this
 * shape at full extension is wider than any single spoken sound needs.
 */
const MOUTH_PEAK = 0.8;
const MOUTH_REST = 0.1;

/** A syllable's shape: the mouth snaps open and falls back more slowly, which is
 * the asymmetry an actual jaw has. */
const MOUTH_ATTACK_MS = 60;
const MOUTH_DECAY_MS = 190;

/**
 * How far open the mouth is, from the pulse list alone.
 *
 * Reading the schedule rather than being told frame by frame keeps React out of
 * the animation loop entirely: the component hands over the pulses once when the
 * line starts, and this runs off the same clock as every other motion.
 */
function updateMouth(s, now) {
  if (s.speechPulses === null) {
    // Ease shut rather than dropping to zero, so the mouth closes at the end of a
    // sentence instead of vanishing mid-syllable.
    s.mouthOpenAmount = Math.max(0, s.mouthOpenAmount - 0.08);
    return;
  }

  const t = now - s.speechStartedAt;
  // The most recent pulse at or before now. Walking from the end is fine: these
  // lists are a dozen entries long.
  let last = null;
  for (let i = s.speechPulses.length - 1; i >= 0; i--) {
    if (s.speechPulses[i].at <= t) {
      last = s.speechPulses[i];
      break;
    }
  }
  if (last === null) {
    s.mouthOpenAmount = 0;
    return;
  }

  const since = t - last.at;
  const envelope =
    since < MOUTH_ATTACK_MS
      ? since / MOUTH_ATTACK_MS
      : Math.max(0, 1 - (since - MOUTH_ATTACK_MS) / MOUTH_DECAY_MS);
  // Scaled by the syllable's own vowel, so the mouth is wide on "no" and narrow
  // on "Bubu" instead of doing the same thing every time.
  const peak = MOUTH_PEAK * last.open;
  s.mouthOpenAmount = MOUTH_REST + (peak - MOUTH_REST) * smoothstep(envelope);
}

function updateBlink(s, now) {
  switch (s.blinkPhase) {
    case 'idle':
      if (now >= s.nextBlinkAt) {
        s.blinkPhase = 'closing';
        s.blinkPhaseStartedAt = now;
      }
      break;
    case 'closing': {
      const t = (now - s.blinkPhaseStartedAt) / s.timing.blinkCloseMs;
      s.blinkFraction = Math.min(t, 1);
      if (t >= 1) {
        s.blinkPhase = 'closed';
        s.blinkPhaseStartedAt = now;
      }
      break;
    }
    case 'closed':
      if (now - s.blinkPhaseStartedAt >= s.timing.blinkHoldMs) {
        s.blinkPhase = 'opening';
        s.blinkPhaseStartedAt = now;
      }
      break;
    case 'opening': {
      const t = (now - s.blinkPhaseStartedAt) / s.timing.blinkOpenMs;
      s.blinkFraction = Math.max(1 - t, 0);
      if (t >= 1) {
        s.blinkPhase = 'idle';
        if (s.doubleBlinkArmed) {
          s.doubleBlinkArmed = false;
          s.nextBlinkAt = now + s.timing.doubleBlinkGapMs;
        } else {
          s.doubleBlinkArmed = Math.random() < s.timing.doubleBlinkChance;
          scheduleNextBlink(s, now);
        }
      }
      break;
    }
    default:
      break;
  }
}

/**
 * The one-shot arrival sequence. Runs only between playEntrance() and
 * ENTRANCE_END_MS; at every other moment it is a single null check.
 *
 * Called after updateBlink so that while the entrance owns the lids it is the last
 * writer on blinkFraction and cannot be overwritten within the same tick.
 */
function updateEntrance(s, now) {
  if (s.entranceStartedAt === null) return;
  const t = now - s.entranceStartedAt;

  if (entranceOwnsLids(t)) {
    // The scripted lids: the slow open, and the slow blink after it. Held in
    // 'idle' with an infinite nextBlinkAt because that is the one phase which
    // never touches blinkFraction, so this owns the value outright rather than
    // fighting the FSM for it. Re-asserted every tick rather than only at
    // playEntrance, so a replay that lands mid-blink cannot leave the FSM part
    // way through one.
    s.blinkPhase = 'idle';
    s.nextBlinkAt = Number.POSITIVE_INFINITY;
    s.blinkFraction = entranceLidClosed(t);
    return;
  }

  // Past the release, every remaining beat is carried by a real FSM blink using
  // the same TIMING constants as every ambient one -- so a scripted blink cannot
  // look subtly different from a natural one, and there is no second copy of the
  // FSM to keep in step. Nothing writes blinkFraction from here on.
  const beat = ENTRANCE_BEATS[s.entranceBeat];
  if (beat) {
    // Aim the FSM at this beat. Only while it is idle: overwriting mid-blink
    // would re-fire the blink it is already running once the beat time is past.
    if (s.blinkPhase === 'idle') s.nextBlinkAt = s.entranceStartedAt + beat.atMs;

    // beginTransition blends this change like any other; firing it under the lids
    // means the blend runs where it cannot be seen, so the new face is already
    // settled when the eyes reopen. See beatReady for why the beat's own time has
    // to be checked as well as the lids.
    if (beatReady(beat, t, s.blinkFraction)) {
      // A null expression is a beat that exists only to schedule a blink -- the
      // blink has already happened by the time this runs, so there is nothing to
      // do but move on to the next one.
      // `entranceFaces` false keeps the face the arrival opened on: the blinks still
      // land, the smile does not. See playEntrance.
      if (beat.expression !== null && s.entranceFaces) {
        beginTransition(s, beat.expression, now);
        // Re-pinned, because pinnedExpression is what hard-suppresses idle
        // cycling and it must name the face actually showing.
        s.pinnedExpression = beat.expression;
      }
      s.entranceBeat += 1;
    }
  }

  if (t >= ENTRANCE_END_MS) s.entranceStartedAt = null;
}

function updateIdleCycle(s, now) {
  if (s.pinnedExpression) {
    s.idleActive = false;
    return;
  }

  const idleFor = now - s.lastInteractionAt;
  if (idleFor < TIMING.idleTriggerMs) {
    s.idleActive = false;
    return;
  }

  if (!s.idleActive) {
    s.idleActive = true;
    s.idleHoldUntil = now + randRange(TIMING.idleHoldMinMs, TIMING.idleHoldMaxMs);
    beginTransition(s, pickIdleExpression(s.expressionKey), now);
    return;
  }

  if (now >= s.idleHoldUntil) {
    s.idleHoldUntil = now + randRange(TIMING.idleHoldMinMs, TIMING.idleHoldMaxMs);
    beginTransition(s, pickIdleExpression(s.expressionKey), now);
  }
}

/**
 * Spec §2 calls for random idle cycling rather than a fixed rotation. Repeats are
 * excluded explicitly: with 20 candidates a naive random pick would land on the
 * same face twice in a row often enough to look like the animation had frozen.
 */
function pickIdleExpression(current) {
  const candidates = IDLE_SAFE_EXPRESSIONS.filter((key) => key !== current);
  const pool = candidates.length > 0 ? candidates : IDLE_SAFE_EXPRESSIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Owns all continuously-updating animation state (blink FSM, idle-cycle
 * trigger, gaze, bob phase) in a single mutable ref, so
 * driving it every RAF tick never forces a React re-render. BubuFace.jsx
 * calls tick(now) once per frame and reads stateRef.current when drawing.
 */
export function useFaceAnimation(initialExpression) {
  const stateRef = useRef(null);
  if (!stateRef.current) {
    stateRef.current = createInitialState(initialExpression);
  }

  const setExpression = useCallback((key) => {
    const s = stateRef.current;
    // A face asked for directly ends any sequence still playing: it is a newer
    // decision about what the face should be doing.
    s.sequence = null;
    beginTransition(s, key, performance.now());
    s.pinnedExpression = key;
    s.lastInteractionAt = performance.now();
    s.idleActive = false;
  }, []);

  /** Play a situation's faces in order. See transition.startSequence. */
  const playSequence = useCallback((keys, options) => {
    const s = stateRef.current;
    if (!keys?.length) return;
    startSequence(s, keys, performance.now(), options);
    s.lastInteractionAt = performance.now();
    s.idleActive = false;
  }, []);

  const releaseToIdle = useCallback(() => {
    const s = stateRef.current;
    s.pinnedExpression = null;
    s.lastInteractionAt = performance.now();
  }, []);

  const setTrackedFacePosition = useCallback((pos) => {
    const s = stateRef.current;
    if (pos === null) {
      s.trackingActive = false;
      return;
    }
    s.trackingActive = true;
    s.trackedTarget = { x: pos.x, y: pos.y };
    s.lastTrackedAt = performance.now();
  }, []);

  /**
   * Play the arrival sequence: shut eyes opening slowly, a slow blink, then an
   * ordinary blink BUBU comes out of smiling, and a second one that takes the
   * smile back off. See entranceTimeline.js for the beat and the reasoning.
   *
   * Safe to call again mid-sequence -- it restarts cleanly from t=0, which is what
   * StrictMode's double mount does in development.
   *
   * `faces: false` plays the same arrival without the smile: the eyes open and blink
   * on the same beats, and the face stays on neutral throughout. For the website's
   * home page, where BUBU holds neutral (15 Sep 2026).
   */
  const playEntrance = useCallback(({ faces = true } = {}) => {
    const s = stateRef.current;
    const now = performance.now();

    s.entranceStartedAt = now;
    s.entranceBeat = 0;
    s.entranceFaces = faces;

    // Set explicitly rather than inherited from whatever the component mounted
    // with, so the sequence starts on the same face however it was reached.
    // Pinning is what stops updateIdleCycle swapping the face out from under the
    // sequence at the 7s mark; each beat moves the pin as it lands.
    // Snapped, not transitioned: the entrance begins on a black screen with the
    // eyes shut, so there is nothing on show to move away from.
    s.expressionKey = ENTRANCE_OPENING_EXPRESSION;
    s.transitionFrom = null;
    s.pendingExpression = null;
    s.sequence = null;
    s.pinnedExpression = ENTRANCE_OPENING_EXPRESSION;
    s.lastInteractionAt = now;

    // Park the blink FSM so updateEntrance can own blinkFraction, and start fully
    // shut. updateEntrance re-asserts both every tick until the release.
    s.blinkPhase = 'idle';
    s.blinkFraction = 1;
    s.nextBlinkAt = Number.POSITIVE_INFINITY;
  }, []);

  /**
   * Start moving the mouth in time with a line being spoken.
   *
   * Takes the whole pulse schedule up front rather than a call per syllable, so
   * the mouth runs on the animation clock instead of on a stack of React timers
   * that would each cost a re-render.
   */
  const startTalking = useCallback((pulses) => {
    const s = stateRef.current;
    s.speechPulses = pulses;
    s.speechStartedAt = performance.now();
  }, []);

  /** Stop, and let the mouth ease shut rather than dropping mid-syllable. */
  const stopTalking = useCallback(() => {
    stateRef.current.speechPulses = null;
  }, []);

  const tick = useCallback((now) => {
    const s = stateRef.current;
    updateBlink(s, now);
    // After updateBlink, so that while the entrance owns the lids it is the last
    // writer on blinkFraction within the tick.
    updateEntrance(s, now);
    // After the blink and the entrance, so a change waiting for the lids sees this
    // frame's lids.
    updatePendingSwap(s, now);
    updateSequence(s, now);
    updateIdleCycle(s, now);
    // After everything that can start one, so a transition beginning this frame is
    // not retired by the check below before it has drawn once.
    updateTransition(s, now);
    updateMouth(s, now);
    updateGaze(s, now);
    const elapsed = Math.max(0, Math.min(now - s.lastFrameAt, 250));
    s.lastFrameAt = now;
    s.bobPhase = (s.bobPhase + elapsed / s.timing.bobPeriodMs) % 1;
  }, []);

  /**
   * Tell the face how BUBU is feeling, so its tempo can follow.
   *
   * Separate from setExpression because the two are different things and were
   * never distinguished before: the expression is what BUBU's face is doing, and
   * this is how its whole body moves while doing it. A face can wear the same
   * expression alert and exhausted, and until now BUBU could not.
   *
   * Cheap enough to call on the affect clock -- it recomputes a small object and
   * touches no React state, in keeping with the rest of this hook.
   */
  const setAffect = useCallback((affect) => {
    stateRef.current.timing = bodyLanguage(affect ?? {});
  }, []);

  return {
    stateRef,
    setExpression,
    playSequence,
    setAffect,
    releaseToIdle,
    setTrackedFacePosition,
    playEntrance,
    startTalking,
    stopTalking,
    tick,
  };
}
