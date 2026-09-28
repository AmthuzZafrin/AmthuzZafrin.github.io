import { smoothstep } from './ease.js';

/**
 * BUBU's arrival, as pure functions of milliseconds since the entrance started.
 *
 * Everything here is maths and nothing here touches a canvas, React or a browser
 * global, which is the whole point: it can be run under bare `node` and asserted
 * frame by frame. The rendering side (useFaceAnimation, BubuFace's draw) reads
 * these and does nothing clever of its own.
 *
 * The beat:
 *
 *   black -> the neutral face fades up with its eyes shut -> the eyes open ->
 *   a pause -> one slow, deliberate blink -> a pause -> one ordinary blink,
 *   changing nothing -> a longer pause -> a blink that brings up the smile ->
 *   the smile holds a good while -> a blink that puts it back to neutral -> a
 *   pause -> and only then does it speak.
 *
 * Every pause in that sentence is a real constant below, because the pauses are
 * the point. Take them out and the same six events read as a twitch.
 *
 * The head does not tilt. It did once; see the note on rotation below.
 *
 * Explicit .js on the ease import: this module is exercised directly by Node in
 * entranceTimeline.test.mjs, and bare ESM specifiers do not resolve there. Same
 * reason memoryEngine.js imports './storage.js'.
 */

// --- phase boundaries, all ms from the start of the entrance ---

/**
 * How long the screen is nothing but black before BUBU begins to appear.
 *
 * Not dead time. The app opens on black and the face used to start fading up in
 * the same frame, so there was never a moment that read as "black screen" -- it
 * read as a slow load. Holding it for a beat first makes the black deliberate,
 * and makes what follows an arrival rather than a page finishing rendering.
 */
export const BLACK_HOLD_MS = 600;

/**
 * How long the face takes to fade up out of black, once the hold is over.
 *
 * Lives here rather than in WelcomeScreen because both have to agree with
 * EYES_SHUT_MS: the fade finishes just before the lids start to move, so the
 * face has fully arrived before it does anything. Numbers in two files would
 * drift the first time either was retuned.
 *
 * The fade itself is CSS opacity on a wrapper div, not ctx.globalAlpha --
 * drawGlow and ten effect modules assign globalAlpha absolutely inside their own
 * save/restore, so a value set at the top of draw() would fade the shell while
 * every glow blitted at full strength.
 */
export const FADE_IN_MS = 1000;

/** How long the face sits fully shut before anything moves. Covers the black hold
 * and the whole fade, so the eyes never open through a half-transparent head. */
export const EYES_SHUT_MS = 1600;

/**
 * When the lids finish opening.
 *
 * 500ms of travel, against the 120ms of TIMING.blinkOpenMs that a natural blink
 * takes. Roughly four times slower, and that ratio is the entire difference
 * between "blinked" and "woke up".
 */
export const EYES_OPEN_END_MS = 2100;

// --- the slow blink ---
//
// Scripted here rather than handed to the blink FSM, because the FSM knows
// exactly one speed. This one is deliberately far slower than an ordinary blink:
// it reads as BUBU settling into being awake, and it is what makes the ordinary
// blink that follows legible *as* ordinary. Two blinks at the same speed would
// just look like a stutter.
//
// At 1020ms it is roughly four times the FSM's 270ms, and the hold in the middle
// is more than three times the FSM's. The eyes visibly rest shut rather than
// passing through shut, which is the whole difference between a slow blink and a
// quick one played back late.

/** When the slow blink begins -- half a second after the eyes finish opening, so
 * there is a real beat where BUBU is simply looking at you before it moves. */
export const SLOW_BLINK_AT_MS = 2600;
export const SLOW_BLINK_CLOSE_MS = 400;
export const SLOW_BLINK_HOLD_MS = 180;
export const SLOW_BLINK_OPEN_MS = 440;
export const SLOW_BLINK_END_MS =
  SLOW_BLINK_AT_MS + SLOW_BLINK_CLOSE_MS + SLOW_BLINK_HOLD_MS + SLOW_BLINK_OPEN_MS;

/**
 * When the lids are handed back to the blink FSM.
 *
 * The load-bearing moment of this module. Up to here the entrance writes
 * blinkFraction every tick; from here it must never write it again, or BUBU
 * never blinks for the rest of the screen's life.
 */
export const LIDS_RELEASE_MS = SLOW_BLINK_END_MS;

// --- the two expression changes ---
//
// Both ride a blink, and not because a change would otherwise snap: every
// expression change goes through beginTransition and is blended over
// TRANSITION_MS by expressions/blend.js. The blink is layered on top of that
// blend, not used instead of it. A 480ms interpolation between two very
// different faces is smooth but still visibly a morph; closed lids hide the
// change completely, so the face simply *is* different when the eyes reopen.
// That is what an arrival wants and what an ordinary reply does not.
//
// 'smile' is eyeShape 'flat' -- a single bowed stroke where the eye was, drawn
// by a branch of drawEye that returns before any lid logic and therefore ignores
// blinkFraction completely. That sounds like a problem for an animation built on
// blinks, and it is the opposite: the lids coming down are the last thing drawn
// before the swap, and a nearly-shut lid and a smile arc are both a thin
// horizontal stroke in the same place. The eye curves into the smile. Going back
// the other way, the blink that carries 'smile' -> 'neutral' is invisible while
// the smile is showing and then opens real eyes, so the return costs nothing
// either.

/** The face the entrance opens on, set explicitly at playEntrance rather than
 * inherited from whatever the component mounted with. */
export const ENTRANCE_OPENING_EXPRESSION = 'neutral';

/**
 * One ordinary blink, changing nothing.
 *
 * Its whole job is to be unremarkable. After a blink that took a second, a plain
 * 270ms one says BUBU is awake and idling rather than still waking up -- and it
 * separates the slow blink from the smile, which otherwise arrive close enough
 * together to read as one event.
 *
 * 530ms after the slow blink finishes. Shorter and the pair reads as a double
 * blink rather than two separate ones.
 */
export const NORMAL_BLINK_AT_MS = 4150;

/** When a blink brings up the smile. A long beat after the ordinary blink ends,
 * so the smile arrives as its own thought rather than as that blink's result. */
export const SMILE_AT_MS = 5150;

/** When a further blink takes the smile back off. Two and a half seconds of it:
 * long enough to be a held expression and not a flicker of one. */
export const SMILE_END_MS = 7700;

/**
 * The scripted blinks, in order. updateEntrance walks this list and aims the
 * blink FSM at each `atMs` in turn.
 *
 * `expression: null` is a blink that changes nothing. Keeping plain blinks in the
 * same list as the ones that carry a change is what makes the blink schedule
 * readable in one place -- and it means the sequence's timing is stated once
 * rather than split between this file and a second list somewhere else.
 *
 * Every expression change here rides a blink so the change is hidden outright
 * rather than merely blended -- see the note above on why the entrance wants
 * that and an ordinary reply does not.
 */
export const ENTRANCE_BEATS = [
  { atMs: NORMAL_BLINK_AT_MS, expression: null },
  { atMs: SMILE_AT_MS, expression: 'smile' },
  { atMs: SMILE_END_MS, expression: 'neutral' },
];

/**
 * The face BUBU is left on when the entrance ends, and the one reduced motion
 * cuts straight to. Derived from the beats so it cannot disagree with them.
 *
 * The last beat that actually changes something, not simply the last beat -- a
 * plain blink on the end would otherwise make this undefined.
 */
export const ENTRANCE_SETTLE_EXPRESSION = [...ENTRANCE_BEATS]
  .reverse()
  .find((beat) => beat.expression !== null).expression;

/**
 * The face worn while a line is being spoken.
 *
 * A state rather than a mood, which is what definitions.js already says about it:
 * `speaking` is neutral with the mouth open (mouthShape 'open', mouthCurve 0.6)
 * and everything else identical. That is why this one change alone does not need
 * a blink to hide it -- the only thing that moves is the mouth, and a mouth
 * opening is what starting to speak looks like.
 */
export const ENTRANCE_SPEAKING_EXPRESSION = 'speaking';

/**
 * The face BUBU changes to once it has finished speaking, just before the button
 * appears.
 *
 * Not on the timeline, because it is not on a clock -- it lands when the second
 * line actually finishes, which depends on the voice. It is named here anyway so
 * the whole choreography is readable in one file and the tests can check it is a
 * face that can be shown.
 */
export const ENTRANCE_PAYOFF_EXPRESSION = 'happy';

/** How far past a beat's own time the swap will wait for its blink before giving
 * up and snapping. Only reachable if the RAF loop drops most of a second. */
export const SWAP_FALLBACK_MS = 700;

/**
 * How shut the lids must be for a swap to hide behind them.
 *
 * Not blinkPhase === 'closed': that hold is 60ms, about 3.6 frames at 60Hz, and
 * one dropped frame would miss it entirely. 0.85 spans closing's tail, the hold
 * and opening's head, which is several frames wide at any frame rate that is not
 * already broken.
 */
export const SWAP_AT_LID = 0.85;

/**
 * When the entrance stops driving anything.
 *
 * Derived, not chosen. updateEntrance stops walking the beat list the moment this
 * passes, so an end earlier than the last beat's own fallback would mean a stalled
 * RAF could strand BUBU on 'smile' -- which is flat-eyed and never blinks -- for
 * the entire life of the screen. The 200ms on top is slack, not meaning.
 */
export const ENTRANCE_END_MS =
  ENTRANCE_BEATS[ENTRANCE_BEATS.length - 1].atMs + SWAP_FALLBACK_MS + 200;

/**
 * When the first line is spoken.
 *
 * Deliberately equal to ENTRANCE_END_MS rather than merely after the last beat.
 * The speaking face is set with setExpression, and until the entrance has
 * actually finished, updateEntrance still owns pinnedExpression -- so a stalled
 * RAF that pushed the final beat onto its fallback could overwrite the speaking
 * mouth with a neutral one, mid-sentence. Starting only once the entrance is over
 * makes that impossible rather than unlikely.
 *
 * In the ordinary case the last beat lands well before this, so the gap reads as
 * the pause it is: BUBU returns to neutral, waits, and then speaks.
 */
export const LINE_ONE_AT_MS = ENTRANCE_END_MS;

const span = (t, from, to) => smoothstep(Math.min(Math.max((t - from) / (to - from), 0), 1));

/**
 * How shut the lids are, 1 = fully closed, 0 = fully open.
 *
 * Same sense as useFaceAnimation's `blinkFraction`, deliberately, because this
 * value is written straight into it.
 */
export function entranceLidClosed(t) {
  if (t < EYES_SHUT_MS) return 1;
  if (t < EYES_OPEN_END_MS) return 1 - span(t, EYES_SHUT_MS, EYES_OPEN_END_MS);

  const closeEnd = SLOW_BLINK_AT_MS + SLOW_BLINK_CLOSE_MS;
  const holdEnd = closeEnd + SLOW_BLINK_HOLD_MS;
  if (t < SLOW_BLINK_AT_MS) return 0;
  if (t < closeEnd) return span(t, SLOW_BLINK_AT_MS, closeEnd);
  if (t < holdEnd) return 1;
  if (t < SLOW_BLINK_END_MS) return 1 - span(t, holdEnd, SLOW_BLINK_END_MS);
  return 0;
}

/**
 * Whether the entrance is still driving the lids, or the blink FSM has them back.
 *
 * While true, updateEntrance writes blinkFraction every tick; the instant it goes
 * false it must stop. See LIDS_RELEASE_MS.
 */
export function entranceOwnsLids(t) {
  return t < LIDS_RELEASE_MS;
}

/**
 * Whether a beat's expression change should land on this frame.
 *
 * The `t >= beat.atMs` half looks redundant next to the lid check and is not.
 * Without it, the moment one beat lands the next one is evaluated against the
 * same still-closed lids and fires immediately -- both changes ride a single
 * blink, and the smile is gone within a few frames of arriving. Seen on screen
 * before it was understood; entranceTimeline.test.mjs now pins it.
 *
 * The fallback is the backstop for an RAF loop that stalls through the whole
 * blink. It snaps in the open, which is ugly, and is strictly better than leaving
 * BUBU stuck on a face the sequence was supposed to move off.
 */
export function beatReady(beat, t, lidClosed) {
  if (t < beat.atMs) return false;
  return lidClosed >= SWAP_AT_LID || t > beat.atMs + SWAP_FALLBACK_MS;
}
