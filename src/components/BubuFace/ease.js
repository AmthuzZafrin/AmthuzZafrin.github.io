/**
 * Smoothstep: zero slope at both ends, so a value driven by it has no visible
 * corner where it starts or stops moving.
 *
 * Extracted from BubuFace.jsx, where it lived as a local for the sleepy droop.
 * The entrance timeline needs the same curve, and a second hand-written copy is
 * how two animations end up subtly different for no reason anyone can find later.
 *
 * `t` is expected in 0..1 and is not clamped here -- every caller derives it from
 * a phase it has already bounded, and clamping inside would hide the bug where one
 * of them has not.
 *
 * There are three further near-duplicates in the tree: an inline easeInOutQuad in
 * useFaceAnimation.js's pupil wander, an identical smoothstep in
 * effects/questionMark.js, and a lerp in effects/party.js. Sweeping those in is a
 * separate mechanical change -- doing it here would bury the entrance work in an
 * unrelated diff.
 */
export const smoothstep = (t) => t * t * (3 - 2 * t);
