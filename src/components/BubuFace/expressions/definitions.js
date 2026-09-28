// Explicit .js extension: this module is imported directly by Node in
// expressions.test.mjs, where bare specifiers don't resolve.
import { COLORS } from '../constants.js';

/**
 * The 30 expressions from spec §2, as one reviewable table.
 *
 * This is a data table rather than one module per expression: at four
 * expressions a file each was readable, at thirty it would be ~330 lines of
 * boilerplate spread across thirty files, and the whole point of the descriptor
 * design is that an expression *is* data. Keeping them together also means the
 * palette can be compared at a glance, which is how you catch two "sad" variants
 * that accidentally look identical.
 *
 * Only the fields that differ from DEFAULTS are listed. The four original
 * expressions (neutral, happy, sad, sleepy) keep their exact previous values so
 * the existing look is unchanged.
 *
 * Effects named here must exist in ../effects/index.js -- expressions.test.mjs
 * enforces that, because a typo'd effect name fails silently at runtime.
 */
export const DEFAULTS = {
  glowColor: COLORS.faceGlow,
  browColor: COLORS.glowPrimary,
  eyebrowAngle: 0,
  // Per-eye vertical brow lift, {left, right} in fractions of eye width.
  // eyebrowAngle is mirrored, so it alone cannot raise one brow above the other.
  eyebrowRaise: null,
  // Slides both brows outward, away from the face centre, in fractions of eye
  // width -- widening the gap between them without moving the eyes.
  eyebrowSpread: 0,
  // Bends the brow into an arc; positive arches it upward in the middle.
  eyebrowCurve: 0,
  // Per-eye brow outline, {left, right}, each 'arc' or 'tick'. 'arc' is the
  // eyebrowCurve bend (zero leaves it straight); 'tick' is a kinked brow. Per-eye
  // because eyebrowCurve is shared by both, so it cannot give one brow a different
  // outline from the other.
  eyebrowShape: null,
  // Set false to suppress the brow entirely, for expressions that cover the eyes.
  eyebrow: true,
  // Set false to suppress the mouth entirely. Distinct from a flat mouthCurve,
  // which still draws a line -- this draws nothing at all.
  mouth: true,
  // Multiplies both eye dimensions, about each eye's own centre so the pair stay put.
  // Either one number for both eyes or a per-eye {left, right}, as eyebrowRaise is.
  // The brow scales with its eye, since drawEye derives it from the eye's width.
  // Effects still place themselves off geometry.eyeW, which is the unscaled size --
  // an expression that scales its eyes a long way may need its overlay moved too.
  eyeScale: 1,
  // Holds the lids at a fraction of full height instead of letting them blink.
  // Either one number for both eyes or a per-eye {left, right}, as eyeScale is --
  // and null on a side means that eye keeps its ordinary blink.
  eyeStaticOpenFraction: null,
  // Cycle length, in ms, for the lids sagging from wide open down to
  // eyeStaticOpenFraction and being hauled back up. null holds them still at that
  // fraction, which is what every other expression using it wants.
  eyeDroopMs: null,
  mouthCurve: 0,
  // Multiplies the mouth's width. mouthCurve only changes how far the line bows,
  // never how far across it runs, and geometry.mouthW is shared by every face.
  mouthScale: 1,
  // Multiplies how deep the mouth hangs, without changing how far it runs across.
  // mouthScale cannot do this: every shape derives its height from its width too, so
  // that field only makes a mouth bigger or smaller. Only the grin family reads it.
  mouthHeight: 1,
  // Slides the mouth down the face, in fractions of eye height. Same units as
  // blushRise, so the two can be reasoned about against each other.
  mouthDrop: 0,
  mouthShape: 'curve',
  // Whether this face lip-syncs while BUBU is speaking: 1 moves the mouth with
  // the syllables, 0 holds the shape still and lets the voice play over it.
  //
  // Off for almost everything, deliberately. A laugh, a sob or a snarl is a mouth
  // held in a shape -- flapping it open and shut on every syllable destroys the
  // expression and leaves a generic talking face wearing the wrong eyebrows. Only
  // the resting faces have a mouth that is *doing* nothing, and so only they have
  // one free to talk.
  mouthSync: 0,
  // One name for both eyes, or a per-eye {left, right}. 'winkLeft' is the older
  // name for { left: 'flat', right: 'default' } and still works.
  eyeShape: 'default',
  // Fraction of the eye's inner well standing in water, measured from its floor.
  // null is dry. Only the framed eye reads it -- the closed and replaced shapes
  // (flat, heart, spiral, star, scrunch) have no well to fill.
  eyeWater: null,
  // Multiplies how far a closed eye's arc bows. Only the 'flat' and 'flatDown'
  // shapes read it. Deeper drops the corners relative to the middle -- the arc's two
  // ends are fixed, so it is the arch that rises, as with eyebrowCurve on a brow.
  eyeArc: 1,
  // Forces the pupils to a fixed offset instead of tracking/wandering, in -1..1.
  pupilBias: null,
  // Multiplies the pupil, capped at the inner well so it can never spill out of the
  // eye. Only the framed eye reads it -- the shapes that replace the whole eye
  // (heart, spiral, flat, scrunch) have no pupil to grow.
  pupilScale: 1,
  // Multiplies the two highlights on the pupil, on top of the growth they already
  // get from pupilScale. Separate because a bigger eye and a glossier one are
  // different things, and the pleading face wants both at once.
  pupilGlint: 1,
  // Adds a springy vertical motion on top of the idle bob.
  bounce: false,
  // Multiplies the sweatDrops effect's droplet size. Only that effect reads it.
  sweatScale: 1,
  // Lifts the blush effect's cheeks towards the eyes, in fractions of eye height.
  // Only that effect reads it.
  blushRise: 0,
  effects: [],
};

const SAD_GLOW = '#b184f5';
const SLEEPY_GLOW = '#b98ae0';
const ANGRY_GLOW = '#ff5c7a';
// A true red for the angry brows. ANGRY_GLOW is pink enough that using it here
// too would read as one flat hot-pink face; the brows carry the anger, so they
// want a colour the eyes clearly aren't.
const ANGRY_BROW = '#ff2b3d';
const LOVE_GLOW = '#ff8ac4';
// Light red for the overheated face. Lighter and less pink than ANGRY_GLOW, which
// would read as anger, and a shade lighter than the hotBlush flush behind it so
// the features still separate from the cheeks.
const HOT_GLOW = '#ff8074';
// Cold blue. Brighter than the coldBlush wash behind it so the features separate,
// and brighter and more saturated than SCARED_GLOW so the two don't collide.
const COLD_GLOW = '#5cc4ff';
// Deeper, greyer blue for fright. Darker AND less saturated than COLD_GLOW rather
// than just darker: cold is a bright sky blue, and two blues separated by lightness
// alone would still read as the same face at different brightnesses.
const SCARED_GLOW = '#5ba8d8';
// Sickly yellow-green, taken from the reference's own skin and brightened to carry
// as a glow. Brighter than the sickBlush wash behind it, for the same reason as the
// two above.
const SICK_GLOW = '#9ed64f';
const WARM_GLOW = '#ffd27a';

export const DEFINITIONS = [
  // --- the original four, values preserved exactly -------------------------
  { key: 'neutral', mouthCurve: 0.9, mouthSync: 1 },
  {
    key: 'happy',
    mouthCurve: 1.35,
    // Arched up in the middle so the outer ends fall away, and lifted clear of the
    // frames. Positive curve reads as "corners down" even though it is the middle that
    // moves: the control offset is -browLen * curve, so the ends stay on browY and the
    // midpoint rises above them.
    //
    // Matched to genuinely_happy's 0.2 rather than picked. The two faces are meant to
    // sit on the same ladder, and a brow arched harder here than on the expression
    // above it inverts the pair.
    eyebrowCurve: 0.2,
    eyebrowRaise: { left: 0.12, right: 0.12 },
    effects: ['blush'],
  },
  // Brows bowed down in the middle with the ends lifted, matching crying's. The
  // magnitude is still derived from the mouth -- 0.19 is the curve giving a brow the
  // same midpoint deflection relative to its own length that mouthCurve -0.6 gives
  // the mouth, since both are symmetric quadratics and each deflects by half its
  // control offset -- but the sign is the opposite of what that reading implies, so
  // the pair of sad faces sag the same way.
  //
  // The raise now clears two things rather than one: the 0.2 tilt drops each inner
  // end about 7px, and the negative curve drops the middle another 7. 0.12 of eye
  // width is 14px, which leaves a gap under both.
  {
    key: 'sad',
    glowColor: SAD_GLOW,
    eyebrowAngle: 0.2,
    eyebrowCurve: -0.19,
    eyebrowRaise: { left: 0.12, right: 0.12 },
    eyebrowSpread: 0.12,
    mouthCurve: -0.6,
    // The same 15px crying drops by, so the two stay a family.
    mouthDrop: 0.15,
  },
  {
    key: 'sleepy',
    glowColor: SLEEPY_GLOW,
    // 0.4 is now where the droop *ends* rather than where the eyes sit: they fall to
    // it from neutral's fully-open eye and are hauled back, on a 3.6s loop. Slower
    // than the blink at 270ms and slower than the 3.2s bob, so it never syncs with
    // either and beats against both.
    eyeStaticOpenFraction: 0.4,
    eyeDroopMs: 3600,
    // The mouth opens into a circle while the lids are down and is shut again before
    // they lift -- see drawYawnMouth for the blend, and BubuFace's yawnAmount for the
    // window. mouthCurve is still the resting shape it opens *from*.
    mouthShape: 'yawn',
    mouthCurve: 0.25,
    effects: ['zzz'],
  },

  // --- positive ------------------------------------------------------------
  // Neutral's mouth exactly, with the eyes closed into upward arcs -- the
  // smiling-eyes emoji. Reuses the 'flat' eye shape (laughing and wink already
  // use it): its arc control point sits above centre, so it bows upward.
  // The brow started level with happy's and 47px clear of the arc, which read as
  // detached -- happy's own brow sits 0.12 of an eye width off the top of its frame.
  // The arc's top here is cy - 0.09h - 0.065w (a symmetric quadratic reaches half
  // its control offset, plus half the stroke) and browY is cy - 0.62h - w*raise, so
  // -0.27 reproduced happy's gap exactly; -0.19 backs off about 10px from that.
  //
  // The curve is positive, which lifts only the middle -- the ends always stay on
  // browY. That is what drops the corners: they do not move, the arch rises over
  // them. 0.18 of a 75px brow raises the midpoint by about 7.
  {
    key: 'smile',
    eyeShape: 'flat',
    eyebrowRaise: { left: -0.19, right: -0.19 },
    eyebrowCurve: 0.18,
    mouthCurve: 0.9,
  },
  // The grinning-face-with-sweat emoji: smiling arc eyes, laughing's open laugh, no
  // brows, and one bead held at the right side of the forehead.
  {
    key: 'awkward',
    eyeShape: 'flat',
    eyebrow: false,
    // laughing's mouth stripped back and reshaped: 'grinRow' is the same silhouette
    // and the same white row, without the tooth divisions or the tongue. Shorter and
    // deeper than laughing wears it too -- 0.95 takes the run from 235px to 186, and
    // 1.6 takes the drop from 74px to 93. mouthScale could not do that on its own,
    // since it moves both together.
    mouthShape: 'grinRow',
    mouthScale: 0.95,
    mouthHeight: 1.6,
    mouthDrop: -0.15,
    effects: ['sweatBead'],
  },
  // The savouring-food emoji: smiling arc eyes, no brows, tongue licking out.
  // Deeper arcs than the other closed-eye faces wear: 1.6 of the standard bow, which
  // drops the corners without moving them -- the ends of the arc are fixed at the eye's
  // centre line and it is the middle that lifts.
  { key: 'yummy', eyeShape: 'flat', eyeArc: 1.6, eyebrow: false, mouthShape: 'tongue', mouthScale: 1.25 },
  // The zany/winking-with-tongue emoji. 'winkLeft' reuses the same per-eye
  // split that 'wink' uses: left eye closes flat, right stays open.
  // The brows are happy's, and were already: nothing here sets an angle or a curve,
  // so both come straight from DEFAULTS and render at the same height. The raise is
  // not a change to the brow line, it is what keeps the pair looking like one pair.
  //
  // browY is computed differently for the two eye shapes -- the framed eye hangs its
  // brow off the frame's top edge, the winking 'flat' eye off the eye's own centre --
  // and the wink's arc sits far below where a frame top would be. So the identical
  // brow that sat 8px above the right eye sat 29 above the left. 21px of the face is
  // 0.27 of an eye width, and negative lowers a flat eye's brow.
  //
  // Both sides then lift by a further 0.08, keeping that difference intact -- the
  // raise moves the pair, it is the -0.27 between them that holds them level over
  // their two different eyes. The curve arches each brow up in the middle, which is
  // what leaves the corners reading as turned down: only the middle moves, the ends
  // stay on browY. Safe to share across the mismatched pair because the flat eye and
  // the framed eye take the same brow lengthRatio, so one curve bends both the same.
  {
    key: 'crazy',
    eyeShape: 'winkLeft',
    eyebrowRaise: { left: -0.19, right: 0.08 },
    eyebrowCurve: 0.18,
    mouthShape: 'grinTongue',
  },
  // The unamused-face emoji: smirk's narrowed sideways eyes and cocked brow,
  // over a plain inverted curve. No mouthShape needed -- a symmetric frown is
  // exactly what the default 'curve' does with a negative mouthCurve.
  {
    key: 'annoyed',
    eyeStaticOpenFraction: 0.58,
    pupilBias: { x: 0.95, y: 0 },
    // smirk's brows exactly: level, arched so the corners read as turned down, split
    // outward, and tilted so the right turns clockwise and the left anticlockwise.
    // They need no adjustment to land the same on this face -- both wear the framed
    // eye at the same 0.58 open fraction, and browY comes off the frame's top edge,
    // so the two faces compute it identically. The pair that used to sit here was the
    // asymmetric one smirk also carried, with the right brow alone cocked.
    eyebrowAngle: 0.14,
    eyebrowRaise: { left: 0.08, right: 0.08 },
    eyebrowCurve: 0.18,
    eyebrowSpread: 0.18,
    mouthCurve: -0.7,
    mouthDrop: 0.1,
  },
  // The smirking-face emoji: narrowed eyes cut to the right, one brow cocked,
  // and a one-sided smile.
  {
    key: 'smirk',
    // Not lower than this: the inner well is inset by a fixed amount, so it
    // shrinks faster than the eye does. Below ~0.55 the well squeezes the pupil
    // to a few pixels and the sideways glance stops reading at all.
    eyeStaticOpenFraction: 0.58,
    pupilBias: { x: 0.95, y: 0 },
    // Positive tilts the right brow clockwise and the left anticlockwise: BubuFace
    // hands the left eye the negated angle, and drawEyebrow rotates about the brow's
    // own centre, where a positive canvas angle turns clockwise. The sign is the
    // whole change from the -0.14 this used to carry, which tilted the pair the other
    // way. Rotating about the centre is also what lets the two stay level: the
    // midpoint never leaves browY however far the ends swing.
    eyebrowAngle: 0.14,
    // Both brows on one line. The raise used to be asymmetric -- it lifted the right
    // one alone to match the side the eyes glance towards -- and level is the ask, so
    // it is one value for the pair now. With both eyes the same shape at the same open
    // fraction, equal raises land them at the same browY.
    //
    // The curve arches each brow up in the middle, which is what leaves the corners
    // reading as turned down -- only the middle moves, the ends stay on browY.
    eyebrowRaise: { left: 0.08, right: 0.08 },
    eyebrowCurve: 0.18,
    eyebrowSpread: 0.18,
    mouthShape: 'smirk',
  },
  {
    key: 'genuinely_happy',
    glowColor: WARM_GLOW,
    // Brows in the eyes' own warm amber rather than the default purple. The
    // contrast browColor normally buys is worth having on furious, where the brows
    // carry the emotion; here they are just the top of a wholly warm face.
    browColor: WARM_GLOW,
    mouthCurve: 1.6,
    eyeStaticOpenFraction: 0.55,
    eyebrowCurve: 0.2,
    eyebrowRaise: { left: 0.08, right: 0.08 },
    blushRise: 0.2,
    effects: ['blush', 'sparkles'],
  },
  {
    // The star-struck emoji: both eyes replaced by big blue stars over a grin packed
    // with teeth. Brows off for the same reason cool and nerd have none -- the stars
    // reach where a brow would sit, and the reference has none either.
    //
    // The 'sparkles' overlay is gone with them: it existed to say "this face is
    // dazzled", and the eyes now say it far louder. Two of them together read as
    // clutter rather than as emphasis.
    // No glowColor: the mouth falls through to DEFAULTS' faceGlow, neutral's colour.
    // The warm amber it used to carry fought the blue stars, and the stars are what
    // this face is now about.
    key: 'excited',
    eyeShape: 'star',
    eyebrow: false,
    mouthShape: 'beam',
    mouthScale: 1.15,
    bounce: true,
  },
  {
    key: 'laughing',
    glowColor: WARM_GLOW,
    browColor: WARM_GLOW,
    // A gentle arch, well short of what the reference measures. Its brow deflects
    // about 0.37 of its own length at the middle, which by the half-control-offset
    // rule is a curve of 0.74 -- and that is what this had first. It came out a
    // croissant, because the reference's brow is *wider* than its eye where BUBU's
    // is 0.62 of one, and the same deflection ratio on a brow that much shorter
    // reads as a peak rather than an arch. lengthRatio is shared by every framed
    // eye, so the length cannot follow the reference and the dome gives way
    // instead: 0.74 to 0.45 to this, about 9px of lift across a 75px brow.
    eyebrowCurve: 0.25,
    // Right brow clockwise, left anticlockwise, so each *outer* end rides about 10
    // degrees above its inner one. Positive because the angle is applied mirrored:
    // the left brow takes -angle, the right +angle, and a positive canvas rotation
    // turns clockwise. The reference tilts the other way; this does not.
    eyebrowAngle: 0.15,
    // Bigger than any other brow lift here, and it has to be. The dome only moves
    // the middle -- the ends stay on browY, which DEFAULTS puts 14px above the
    // frame -- and the tilt then drops one end 5.6px of that (the inner one, at
    // this sign). At raise 0 that end sits on the frame and the brow reads as a
    // handle bolted to a box.
    eyebrowRaise: { left: 0.14, right: 0.14 },
    // Pushed apart, the same 0.12 the sad group and scared use. It also buys the
    // inner ends room: those are the ends this tilt drops.
    eyebrowSpread: 0.12,
    // sleepy's lids rather than the reference's closed arcs, which is a departure
    // asked for on purpose. Held at the fraction rather than cycling to it --
    // sleepy's droop plus this expression's bounce would be two motions at once.
    eyeStaticOpenFraction: 0.4,
    // 'grinRow' rather than 'laugh': the same silhouette and the same white row along
    // the top, without the tooth divisions or the tongue lying in the cavity. The
    // divisions were hairlines against a band that already had a flat lower edge, so
    // they read as one solid bar rather than as separate teeth, and the tongue floated
    // unattached in the middle of the cavity. 'awkward' has worn this shape all along.
    mouthShape: 'grinRow',
    // The grin silhouette is already wide, but a laugh this open wants to reach
    // most of the way across the eyes: 1.2 takes it to about 235px against the
    // 336 spanned by the eye pair.
    mouthScale: 1.2,
    // Negative lifts it. This mouth hangs 74px below its own line, so at rest it
    // sat low on the screen with the gap all above it; 0.15 of eye height moves it
    // up 15px and still leaves 66px of clear screen between it and the eyes.
    mouthDrop: -0.15,
    bounce: true,
    effects: ['laughTears'],
  },
  {
    key: 'celebrating',
    glowColor: WARM_GLOW,
    // Brows on the eye colour, as kissing's are. Everywhere else they stay purple.
    browColor: WARM_GLOW,
    // kissing's brow and mouth, and its right eye on both sides.
    eyebrowCurve: 0.25,
    eyebrowAngle: 0.15,
    // Not kissing's mismatched pair. Its 0.14/-0.06 exists because its two eyes are
    // different shapes and each derives browY its own way; both eyes are closed here,
    // so the value tuned over the closed one is the right one for both.
    eyebrowRaise: { left: -0.06, right: -0.06 },
    eyebrowSpread: 0.12,
    eyeShape: 'flat',
    mouthShape: 'pucker',
    bounce: true,
    effects: ['partyHorn', 'confetti'],
  },
  {
    key: 'proud',
    glowColor: WARM_GLOW,
    browColor: WARM_GLOW,
    // The reference's brows measure 27 degrees of tilt, inner ends up. That is well
    // past what a framed eye takes before the outer end lands on the frame, so this
    // is 0.34 with eyebrowRaise carrying the rest -- the read is the same and the
    // brow stays clear of the eye.
    eyebrowAngle: 0.34,
    // Its brows sag below their own chord by 7 units on a 72-unit brow. A symmetric
    // quadratic reaches half its control offset at the midpoint, so the offset is 14
    // and the curve 14/72; negative, because negative is what bows the middle down.
    eyebrowCurve: -0.2,
    eyebrowRaise: { left: 0.16, right: 0.16 },
    // The reference's brows are shorter than its eyes and sit over their outer
    // halves, not centred on them. BUBU's brow length is fixed, so the spread is
    // what puts it over the same part of the eye.
    eyebrowSpread: 0.1,
    // Mouth width against eye width is 164:131 in the reference. The same ratio on
    // BUBU's own eye needs 1.75 -- its default mouth is much narrower relative to
    // its eyes than the emoji's is.
    mouthScale: 1.75,
    // Sags 35 units on a 164-wide mouth. amplitude is the quadratic's control, so
    // the midpoint drops half of it: 0.16 * curve = 35/164 gives 1.33.
    mouthCurve: 1.33,
    // Waterline sampled at the two columns the reference's iris does not cover: 0.386
    // of the eye's height up from the floor, on both.
    eyeWater: 0.386,
  },

  // --- affection -----------------------------------------------------------
  {
    key: 'love',
    glowColor: LOVE_GLOW,
    // Red rather than the face's pink, and springing on the same 1.4s loop the star
    // eyes use -- both live in drawHeartEye.
    eyeShape: 'heart',
    // excited's mouth exactly: the teeth-packed beam at the same 1.15 scale. Still in
    // LOVE_GLOW rather than excited's inherited purple, so the mouth belongs to this
    // face while the eyes are their own object.
    //
    // No mouthCurve: 'beam' is a filled silhouette, so curvature doesn't apply.
    mouthShape: 'beam',
    mouthScale: 1.15,
  },
  {
    key: 'heart',
    glowColor: LOVE_GLOW,
    // Brows in the eyes' own pink rather than DEFAULTS' purple, as kissing already
    // does -- the two affection faces now match each other.
    browColor: LOVE_GLOW,
    // Arched up in the middle with the ends falling away -- genuinely_happy's brow
    // rather than the sad pair's, which is what this had first and read as pleading
    // over a smile.
    eyebrowCurve: 0.2,
    eyebrowRaise: { left: 0.1, right: 0.1 },
    mouthCurve: 1.0,
    mouthDrop: 0.12,
    // The everyday pink cheek, at blushRise 0. It used to be ill's fever red, which
    // this shared by delegation rather than by choice; a face wearing LOVE_GLOW and
    // floating hearts has no reason to flush the colour of a temperature.
    effects: ['blush', 'floatingHearts'],
  },
  {
    key: 'kissing',
    glowColor: LOVE_GLOW,
    // Brows match the eyes here. Everywhere else they stay on DEFAULTS' purple.
    browColor: LOVE_GLOW,
    // wink's brow, which is drool's and laughing's before it.
    eyebrowCurve: 0.25,
    eyebrowAngle: 0.15,
    // Not the matched pair wink has. The two eyes are different shapes here and
    // each derives browY its own way -- the framed left eye measures from the top
    // of its frame, the closed right one from its own centre, which is 50px lower.
    // At a shared 0.14 the right brow floated well clear of the arc under it; the
    // negative value pushes it back down towards its eye.
    eyebrowRaise: { left: 0.14, right: -0.06 },
    eyebrowSpread: 0.12,
    // The mirror of wink: its closed arc on the right eye, an ordinary blinking
    // eye on the left. 'winkLeft' only names the other hand, so this is the per-eye
    // form. No eyeStaticOpenFraction -- the 'flat' shape draws a closed stroke and
    // never reads one, and the left eye wants its ordinary blink.
    eyeShape: { left: 'default', right: 'flat' },
    mouthShape: 'pucker',
    // 'deepBlush' rather than 'blush' for the depth, not the hue -- both are pink
    // now that 'blush' has been recoloured. The two are separated by lightness: this
    // one lands at 107 against the everyday cheek's 144, which is what keeps a kiss
    // reading warmer than a smile.
    blushRise: 0.15,
    effects: ['deepBlush', 'kissHeart'],
  },
  {
    key: 'shy',
    glowColor: LOVE_GLOW,
    // The brow follows the eyes rather than DEFAULTS' fixed purple. Every other
    // feature here is LOVE_GLOW, so the default left the brows as the one cool
    // stroke on an otherwise pink face.
    browColor: LOVE_GLOW,
    // Arched up in the middle, the opposite of the sad pair's bow, at about
    // two-thirds their magnitude. Only the middle of the brow moves -- the ends
    // stay on browY whichever way it bends -- so arching upward carries it away
    // from the eye frame rather than towards it.
    eyebrowCurve: 0.12,
    eyebrowRaise: { left: 0.1, right: 0.1 },
    eyeStaticOpenFraction: 0.6,
    // The lids come down from wide open to this face's 0.6 and back, on a loop --
    // the same mechanism sleepy uses, and the reason eyeStaticOpenFraction above is
    // read as the *bottom* of the travel rather than a fixed height.
    //
    // Slower than sleepy's 3600: the fall is half the cycle either way, so the lids
    // take 2.1s to come down here against its 1.8s, which is a bashful settle
    // rather than a nod-off. Safe on the mouth despite one phase driving both --
    // drawMouth reads openAmount only for the 'yawn' shape, and this is a 'curve'.
    eyeDroopMs: 4200,
    // happy's mouth outright -- its curve at DEFAULTS' width and height, which is
    // why no mouthScale or mouthDrop appears here.
    mouthCurve: 1.35,
    // Lifts the flush clear of the smile. A curve this deep carries its corners a
    // long way up, and a cheek left at the default height ends up sitting on them
    // -- the same reason genuinely_happy carries a rise of its own.
    blushRise: 0.15,
    pupilBias: { x: -0.75, y: 0.35 },
    effects: ['deepBlush'],
  },

  // --- negative ------------------------------------------------------------
  {
    key: 'crying',
    glowColor: SAD_GLOW,
    eyebrowAngle: 0.32,
    // Sad's raise and spread, scaled to this face: the steeper 0.32 tilt drops each
    // inner end by about 12px rather than sad's 7, so it needs 0.14 of eye width,
    // not 0.1.
    //
    // The curve deliberately does NOT follow sad's rule. That rule -- half the
    // mouth's deflection ratio, which would be 0.4 here -- gives an arch bowing the
    // same way as sad's, and this face wants the opposite: bowed down in the middle,
    // ends lifted, so the brows sag towards the eyes instead of vaulting over them.
    // Shallow with it, at half that magnitude, or the dip meets the eye frame the
    // raise above was added to clear.
    eyebrowCurve: -0.2,
    eyebrowRaise: { left: 0.14, right: 0.14 },
    eyebrowSpread: 0.12,
    mouthCurve: -1.25,
    mouthScale: 1.35,
    mouthDrop: 0.15,
    effects: ['tears'],
  },
  {
    key: 'hiding_sadness',
    glowColor: SAD_GLOW,
    eyebrowAngle: 0.22,
    // The sad pair's brow, at their magnitude: bowed down in the middle with the ends
    // lifted. The raise clears two drops, as it does there -- the 0.22 tilt takes each
    // inner end down about 8px and the curve takes the middle down another 7 -- so
    // 0.12 of eye width, the same 14px sad needs.
    eyebrowCurve: -0.19,
    eyebrowRaise: { left: 0.12, right: 0.12 },
    // The tell: a held smile that doesn't reach the eyes.
    eyeStaticOpenFraction: 0.7,
    mouthCurve: 0.55,
  },
  {
    key: 'furious',
    glowColor: ANGRY_GLOW,
    browColor: ANGRY_BROW,
    eyebrowAngle: -0.42,
    // The largest raise on any face, because this is the hardest tilt: at 0.42 rad
    // the inner end of each brow falls about 15px, against sad's 7. 0.15 of eye width
    // is 18px. No curve -- a straight bar is what reads as a scowl, and bending it
    // either way softens it into one of the sad brows.
    eyebrowRaise: { left: 0.15, right: 0.15 },
    // Half the sad pair's spread. A scowl wants the brows converging on the nose,
    // so this only opens the gap enough to keep the inner ends off the frames.
    eyebrowSpread: 0.05,
    mouthCurve: -1.05,
    mouthDrop: 0.15,
  },
  {
    key: 'angry',
    // No glowColor and no browColor, so both fall through to DEFAULTS -- the same
    // purple pair neutral wears. This face is what the FusionEngine reaches for on
    // raised voice alone, which is as often stress as anger, and the red palette
    // committed it to anger before the words had been read.
    eyebrowAngle: -0.3,
    // Between neutral's brow and furious's: the 0.3 tilt drops each inner end about
    // 11px, against furious's 15, so it needs less lift than furious's 0.15 to clear
    // the frame by the same margin.
    eyebrowRaise: { left: 0.12, right: 0.12 },
    // furious's mouth exactly, in place of the 'wavy' squiggle this used to wear. The
    // tilt is the only thing separating the two faces now, which is the right split:
    // they are the same reaction at different intensities.
    mouthCurve: -1.05,
    mouthDrop: 0.15,
  },
  {
    key: 'scared',
    glowColor: SCARED_GLOW,
    // Brows in the eyes' own blue. They were the default magenta, which was the
    // only warm thing on an otherwise entirely cold face and read as belonging to
    // a different expression.
    browColor: SCARED_GLOW,
    // shock's arch and lift, but no longer shock's flat setting: a small positive
    // eyebrowAngle turns the right brow clockwise and the left anticlockwise, since
    // the field is applied mirrored. That drops the inner ends, which is the same
    // direction sad tilts -- worth knowing before reusing the number, because at
    // sad's 0.2 the arch stops reading and it becomes a plain worried brow.
    eyebrowAngle: 0.14,
    eyebrowCurve: 0.4,
    eyebrowRaise: { left: 0.26, right: 0.26 },
    eyebrowSpread: 0.12,
    eyeStaticOpenFraction: 1,
    // tired's mouth, at three quarters size and dropped clear of the raised brows.
    // 'anguished' was the open downturned shape; 'weary' is the wide gape, which
    // against fully-open eyes reads as a face caught mid-gasp.
    mouthShape: 'weary',
    mouthScale: 0.75,
    mouthDrop: 0.12,
    // One bead at a time, landing somewhere new each cycle, rather than a stream
    // down both temples. The radiating 'shockLines' are gone with it -- they were a
    // second thing saying the same word.
    sweatScale: 1.5,
    effects: ['frightDrops'],
  },
  // The pensive-face emoji: eyes closed and downcast, brows pushed up at the
  // inner ends, small frown. 'flatDown' is 'flat' with the closed lid bowing
  // the other way -- the same stroke that reads as a smile when it curves up.
  // Mouth is left at DEFAULTS' mouthCurve of 0 -- a straight line.
  {
    key: 'guilt',
    eyeShape: 'flatDown',
    eyebrowAngle: 0.3,
    // Negative: the brow dips in the middle rather than arching over it.
    eyebrowCurve: -0.25,
    // Negative bows the mouth's midpoint upward, which leaves the corners sitting
    // below it -- the opposite sense to eyebrowCurve above, because drawMouth takes
    // the amplitude as a downward offset where drawEyebrow takes it as an upward one.
    // Shallow at -0.3: the sad faces this sits beside run -0.55 to -0.7, and the
    // pensive reference is barely turned down at all.
    mouthCurve: -0.3,
    mouthDrop: 0.1,
  },
  // The pleading-face emoji. Only the brows and mouth are its own: brows pushed
  // up at the inner ends into a '/\' over the eyes, above a small plain frown.
  // Eyes stay on the default framed eye.
  {
    key: 'pleading',
    // Big wet eyes are what the pleading face is, more than the brows are: the
    // reference's pupils fill most of the eye and carry outsized highlights. The
    // glint runs ahead of the pupil rather than with it, because a pupil that grows
    // and takes its highlights along in proportion just reads as a bigger eye.
    pupilScale: 1.7,
    pupilGlint: 1.45,
    // The reference traces at ~38 degrees, but it can't be matched here: its brow
    // is 0.88 of the eye's width and sits well clear of it, where the framed eye's
    // is 0.62 and starts just 0.12 above the frame. Past ~0.35 the outer end swings
    // down into the frame's top corner and the pair read as antennae.
    eyebrowAngle: 0.34,
    // Slight sag rather than an arch: the reference's brow sits just below the
    // chord between its two ends, and the arched look comes from the tilt.
    eyebrowCurve: -0.25,
    // Lifted clear of the frame so the tilt has somewhere to go. 0.12 was not enough
    // at this tilt -- worry needed 0.2 at a shallower 0.3, and the drop at each end
    // goes with the sine of the angle, so 0.34 needs more still.
    eyebrowRaise: { left: 0.22, right: 0.22 },
    eyebrowSpread: 0.12,
    mouthCurve: -1,
    mouthDrop: 0.1,
  },
  // The sad-but-relieved emoji: brows pushed up at the inner ends, a small
  // downturned mouth, and one tear on the right cheek.
  {
    key: 'worry',
    eyebrowAngle: 0.3,
    // Bowed down in the middle so the ends lift, which is sad's curve and the same
    // sign convention: drawEyebrow puts the control point at -browLen * curve, so a
    // negative value pushes the middle down and leaves the corners standing above it.
    eyebrowCurve: -0.19,
    // The raise has to clear two separate drops before any of it is visible as lift.
    // sad measured them at its own 0.2 tilt: about 7px lost to the tilt at each inner
    // end and another 7 to the curve at the middle. The tilt's share goes with the
    // sine of the angle, so at 0.3 it is 7 x sin(0.3)/sin(0.2), near 10.4 -- about
    // 17px in total, which is 0.145 of an eye width. 0.2 covers that and leaves the
    // rest as the lift that was asked for.
    eyebrowRaise: { left: 0.2, right: 0.2 },
    eyebrowSpread: 0.14,
    mouthCurve: -0.55,
    mouthDrop: 0.12,
    effects: ['cheekTear'],
  },
  // The persevering-face emoji: eyes screwed shut into inward-pointing '><',
  // no brows (the reference has none), and the existing wavy squiggle mouth.
  {
    key: 'persevering',
    eyeShape: 'scrunch',
    // guilt's brows and guilt's mouth. The reference for this face has no brows at
    // all, which is why `eyebrow: false` used to sit here; it is gone now, since a
    // suppressed brow cannot be given a shape.
    //
    // The values transfer as they are, but they do not land as they would on guilt:
    // 'scrunch' is the one eye shape with its own wider brow lengthRatio, 0.72 against
    // the 0.62 every other shape takes, and both the tilt and the curve deflect in
    // proportion to that length. So the same two numbers draw a longer brow here that
    // swings further at the ends. It has room for it -- scrunch's browY carries 0.35
    // of an eye width of built-in clearance where the framed eye carries 0.12.
    eyebrowAngle: 0.3,
    eyebrowCurve: -0.25,
    // Slid outward from the face's centre. Room for it either side: the brow runs
    // 0.72 of an eye width and each eye's centre is 152 units inside the screen edge,
    // so 0.14 more leaves the outer ends well short of the bezel.
    eyebrowSpread: 0.14,
    // No mouthShape, so DEFAULTS' 'curve' -- guilt leaves it there too. Replaces the
    // wavy squiggle, which was the only thing this face and 'worried' still shared.
    // Deeper than guilt's -0.3: this face is straining, where the pensive one is only
    // subdued, and the corners have to come down further to say so.
    mouthCurve: -0.5,
    mouthDrop: 0.1,
  },
  {
    key: 'worried',
    glowColor: SAD_GLOW,
    // guilt's brow: tilted a little harder than the 0.26 this had, and dipping in
    // the middle rather than running straight.
    eyebrowAngle: 0.3,
    eyebrowCurve: -0.25,
    // Not in guilt, and needed only because these eyes are framed. guilt's brow sits
    // over a 'flatDown' eye, which derives browY from the eye's own centre and so
    // starts well clear of anything; a framed eye's browY is 0.12 of a width above
    // the frame, and at this tilt the outer end drops further than that -- both brows
    // ran into the frames. This puts them back above.
    eyebrowRaise: { left: 0.17, right: 0.17 },
    // No mouthShape, so DEFAULTS' 'curve' at mouthCurve 0 -- which is a straight
    // stroke, not a missing mouth. The same thing suspect and curious rely on.
  },

  // --- reactive ------------------------------------------------------------
  // The confused-face emoji: default eyes and brows, with a shallow tilted
  // frown. Only the mouth differs from neutral.
  { key: 'not_sure', mouthShape: 'unsure' },

  {
    key: 'surprised',
    // shock's brows exactly: untilted, arched, pushed high up the forehead. The tilt
    // goes with them -- a -0.25 lean is what an angry brow does, and it was fighting
    // the arch rather than adding to it. scared borrows the same three values, so the
    // three startled faces now hold their brows the same way and differ below the eyes.
    eyebrowAngle: 0,
    eyebrowCurve: 0.4,
    eyebrowRaise: { left: 0.26, right: 0.26 },
    eyeStaticOpenFraction: 1,
    eyeScale: 1.2,
    // The screaming reference's mouth -- see drawScreamMouth. 2.6 sizes it at 0.35 of
    // the screen's width, against 0.39 of the face in the reference; the drop lifts it
    // clear of the bottom of the display, which its full depth would otherwise reach.
    mouthShape: 'scream',
    mouthScale: 2.6,
    mouthDrop: -0.2,
    effects: ['shockLines'],
  },
  {
    key: 'confused',
    // curious' brow, which is suspect's before it: left dead straight, right kinked
    // and lifted. No eyebrowAngle and no eyebrowCurve, so they stay level with each
    // other and the asymmetry is the whole of the expression.
    eyebrowShape: { left: 'arc', right: 'tick' },
    // Not curious' 0.22. That number is a fraction of its own eye's width, and its
    // right eye is scaled to 1.15 -- so it lifts 0.25 of an ordinary eye. These eyes
    // are unscaled, so 0.25 is what reproduces the same lift in pixels.
    eyebrowRaise: { left: 0, right: 0.25 },
    // curious' mouth is DEFAULTS' 'curve' at zero, a straight line. This keeps the
    // shape and drops the corners a little.
    mouthCurve: -0.3,
    mouthDrop: 0.1,
    pupilBias: { x: 0.5, y: -0.3 },
    effects: ['questionMark'],
  },
  {
    key: 'thinking',
    eyeStaticOpenFraction: 0.75,
    mouthCurve: 0.15,
    pupilBias: { x: 0.65, y: -0.55 },
    effects: ['thinkingDots'],
  },
  {
    key: 'curious',
    // Mismatched on purpose: the small eye reads as the squint and the big one as
    // the widened eye, which is the quizzical look a single tilt cannot give.
    eyeScale: { left: 0.85, right: 1.15 },
    // suspect's pair: left brow dead straight, right one kinked and lifted. The
    // kink alone reads as a bent line -- it is the lift that makes it a raised
    // brow -- so both fields come across together, the raise a little under
    // suspect's 0.28 since this eye is scaled up and carries the brow further.
    eyebrowShape: { left: 'arc', right: 'tick' },
    eyebrowRaise: { left: 0, right: 0.22 },
    // No eyebrowAngle and no eyebrowCurve: straight, and level with each other.
    // They still come out different sizes, because each is drawn off its own eye,
    // and the raise above is in fractions of that width too -- so the right brow
    // lifts 1.15 times as far in pixels as the same number would on the left.
    //
    // No mouthShape either, so DEFAULTS' 'curve' at mouthCurve 0 -- which is a flat
    // line, not a missing mouth. The old 'small' ring is gone.
    pupilBias: { x: 0.55, y: -0.2 },
  },

  // --- playful / states ----------------------------------------------------
  {
    key: 'wink',
    // drool's mouth: the closed crescent. Smaller than drool wears it -- 153px
    // against 187 -- and it shrinks in both directions, since the crescent's arcs
    // are fractions of its own width. No mouthCurve any more: drawCrescentMouth
    // carries its own two arcs and ignores it, so the old 1.2 would be dead config.
    mouthShape: 'crescent',
    mouthScale: 1.8,
    eyeShape: 'winkLeft',
    // drool's brow, which is laughing's before it: a gentle arch, outer ends above
    // inner, lifted and pushed apart.
    eyebrowCurve: 0.25,
    eyebrowAngle: 0.15,
    eyebrowRaise: { left: 0.14, right: 0.14 },
    eyebrowSpread: 0.12,
    // 'deepBlush' rather than 'blush' for the depth. Both are pink now that 'blush'
    // has been recoloured, and the two are separated by lightness instead: shy's
    // lands at 107 against the everyday cheek's 144, which is the whole point of a
    // face that is meant to be caught blushing.
    blushRise: 0.15,
    effects: ['deepBlush'],
  },
  // No glowColor override: falls back to DEFAULTS, i.e. exactly neutral's mouth
  // colour. The eyes it would otherwise tint are hidden behind the lenses, and
  // the frame carries its own grey (effects/eyewear.js).
  // smirk's one-sided mouth. No mouthCurve: the 'smirk' shape draws its own slant
  // and never reads it, so the old 0.8 would have been dead config.
  // Wider than the 21% of screen this shape draws at by default, but short of the
  // reference's 37% -- its span is 1.24 of mouthW, so 1.2 lands near 25%.
  {
    key: 'cool',
    mouthShape: 'smirk',
    mouthScale: 1.2,
    // Dropped into the gap the shades leave. The smirk's right end climbs well
    // above its own line, so this shape sits higher than its mouthY suggests.
    mouthDrop: 0.12,
    eyebrow: false,
    effects: ['sunglasses'],
  },
  // The nerd-face emoji: thick spectacles over a wide grin whose upper lip arches.
  // No brows -- the frame's top rim sits where they would be, and the reference has
  // none visible above it.
  //
  // Wears the same frame as cool (effects/eyewear.js) and differs in one thing: the
  // lenses are unfilled, so the eyes stay on and read straight through them.
  { key: 'nerd', eyebrow: false, mouthShape: 'grinArch', effects: ['glasses'] },
  // The astonished-face emoji: brows lifted clear of the eyes and arched, over a
  // tall open oval of a mouth.
  //
  // Distinct from 'surprised', which tilts its brows without arching them and drops
  // the jaw only to a small round dot. Here the arch and the gape do the work, so
  // no shockLines: the face is already saying it, and 'surprised' owns that overlay.
  //
  // The reference shows teeth and a tongue inside the mouth; both are left out.
  //
  // eyeScale is capped here, and 1.2 is close to the cap. eyebrowRaise is measured in
  // eye widths, so a bigger eye carries its brow further up as well as sitting higher
  // itself, and this face already has the largest raise and the largest curve in the
  // registry. Stacked up -- 0.38 of an eye width for the raise, half the curve's
  // control offset for the arch, half a stroke on top -- the brow's highest point
  // leaves 12 units of screen above it at 1.2 and none at all by 1.3.
  //
  // eyebrowAngle was 0, on the reasoning that a mirrored tilt can only give a frown
  // or a scowl where the reference has plain symmetric arches. It is small now and
  // positive, which lifts the inner ends: right brow clockwise, left anticlockwise.
  {
    key: 'shock',
    eyeScale: 1.2,
    eyebrowAngle: 0.16,
    eyebrowCurve: 0.4,
    eyebrowRaise: { left: 0.26, right: 0.26 },
    eyebrowSpread: 0.14,
    mouthShape: 'gape',
  },
  // The zipper-mouth emoji: a zip pulled shut across the mouth, no brows.
  //
  // Brows off for the same reason as cool and nerd: the reference has none, and the
  // zip is what the face is about. Nothing else is overridden -- the zipper mouth
  // ignores glowColor entirely, since it is metal rather than display.
  { key: 'zipper', eyebrow: false, mouthShape: 'zipper' },
  // The nauseated-face emoji: green all over, brows wincing, wavy queasy mouth.
  //
  // The brows measure a 0.55 rad tilt in the reference and sag below their own
  // chord. The tilt is capped at 0.34 with a lift, the same ceiling pleading, hot
  // and cold hit: the framed eye's brow is short and starts just above the frame, so
  // past that the outer end swings down into the frame's top corner and the pair
  // read as antennae. The sag is the measured one.
  //
  // The mouth is its own shape, traced off the reference: none of the existing ones
  // is a flat crest with a deep narrow trough hooked down inside each tip.
  {
    key: 'disgust',
    glowColor: SICK_GLOW,
    browColor: SICK_GLOW,
    eyebrowAngle: 0.34,
    eyebrowCurve: -0.32,
    eyebrowRaise: { left: 0.12, right: 0.12 },
    eyebrowSpread: 0.12,
    mouthShape: 'queasy',
    // Shorter across than the reference's half-a-face. Every proportion of this mouth
    // is a fraction of rx, so the scale takes the corner curls and the droop down with
    // the width and the shape holds together -- nothing here needs a second number.
    mouthScale: 0.68,
    // Hangs the corners further below the lip than the reference's own 0.18. The
    // queasy mouth ignored this field entirely until now -- see drawQueasyMouth.
    mouthCurve: -0.7,
    effects: ['sickBlush'],
  },
  // The vomiting-face emoji: eyes screwed shut, brows wrenched up at the inner ends,
  // a big open mouth with green pouring out of it.
  //
  // The eyes are 'scrunch' unchanged -- that shape is already the reference's inward-
  // pointing wince, built for persevering and tired. The brow tilt is under what the
  // reference measures (0.46 rad): scrunch could carry that much, having no frame for
  // the outer end to collide with, but at full tilt the pair read as a scowl rather
  // than a wince once the '>' '<' beneath them is already pointing the same way.
  //
  // The spread pushes the two apart, away from the bridge of the nose. Without it
  // they crowd the centre, where the eyes' own inner points already are.
  //
  // Features stay on the default purple. Unlike disgust, the reference's own face is
  // its normal colour and only the spill is green.
  {
    key: 'vomit',
    eyeShape: 'scrunch',
    eyebrowAngle: 0.28,
    eyebrowCurve: -0.37,
    eyebrowSpread: 0.14,
    mouthShape: 'maw',
    effects: ['vomitFlow'],
  },
  {
    key: 'dizzy',
    glowColor: SLEEPY_GLOW,
    eyeShape: 'spiral',
    mouthShape: 'wavy',
    // The spirals fill their whole eye boxes, so the squiggle sat close under them
    // with all the spare screen below it. Dropped into that space.
    mouthDrop: 0.12,
  },
  {
    key: 'swirl',
    glowColor: COLORS.glowSecondary,
    eyeShape: 'spiral',
    mouthCurve: 0.2,
    // Same reason as dizzy's, and the same amount: the spirals fill their eye boxes
    // top to bottom, so a mouth at the default height crowds them with the rest of
    // the screen left empty underneath.
    mouthDrop: 0.12,
  },
  {
    key: 'drool',
    glowColor: SLEEPY_GLOW,
    // laughing's brow, geometry only -- its browColor is WARM_GLOW because that is
    // laughing's eye colour, and copying it here would put amber brows on a
    // SLEEPY_GLOW face. These stay on DEFAULTS' purple, as they were.
    eyebrowCurve: 0.25,
    eyebrowAngle: 0.15,
    eyebrowRaise: { left: 0.14, right: 0.14 },
    eyebrowSpread: 0.12,
    eyeStaticOpenFraction: 0.35,
    // The reference's closed smile: a filled crescent, not an open cavity.
    // 'crescent' spans the full mouthW, where the grin family draws 2.3 times its
    // own width, so this needs a scale the others do not. 2.2 puts it at 187px,
    // a little under the reference's 43% of face width.
    mouthShape: 'crescent',
    mouthScale: 2.2,
    effects: ['drool'],
  },
  { key: 'bored', glowColor: SLEEPY_GLOW, eyeStaticOpenFraction: 0.5, mouthCurve: -0.2 },
  // The hot-face emoji: brows pushed up at the inner ends, a small panting mouth
  // with the tongue hanging out, sweat, and a red flush.
  //
  // Light red throughout: glowColor carries the eyes and mouth, browColor the
  // brows (everywhere else they stay on DEFAULTS' purple), and hotBlush reddens the
  // face behind them -- the screen itself is baked into the offscreen cache and
  // can't be tinted per expression. The tongue stays TONGUE_PINK, as flesh does in
  // every other mouth that has one.
  {
    key: 'hot',
    glowColor: HOT_GLOW,
    browColor: HOT_GLOW,
    eyebrowAngle: 0.24,
    // Inverted from the +0.15 it used to carry, so the brow dips in the middle rather
    // than arching over it. That was the last brow on a strained face still arching
    // the other way -- guilt, worry, tired, pleading and persevering all dip. The
    // tilt is untouched: flipping that as well would put the inner ends down, which
    // is an angry brow, not an overheated one.
    eyebrowCurve: -0.15,
    // Clear of the frame. At DEFAULTS' 0.12 the brow's outer end grazes the eye.
    eyebrowRaise: { left: 0.14, right: 0.14 },
    eyebrowSpread: 0.12,
    mouthShape: 'pant',
    sweatScale: 2.2,
    effects: ['hotBlush', 'sweatDrops'],
  },
  // The cold-face emoji: brows pushed up at the inner ends, teeth clenched shut,
  // snowflakes drifting around the face, and a blue chill over the cheeks. Eyes
  // are left on the default shape.
  //
  // Blue throughout: glowColor for the eyes and mouth, browColor for the brows
  // (everywhere else they stay on DEFAULTS' purple). The snowflakes keep their own
  // paler ice colour rather than following glowColor.
  {
    key: 'cold',
    glowColor: COLD_GLOW,
    browColor: COLD_GLOW,
    // The reference traces at ~0.54, but the framed eye can't take that: past
    // ~0.35 the brow's outer end swings into the frame's top corner. Same ceiling
    // that 'pleading' and 'hot' ran into.
    eyebrowAngle: 0.3,
    // Dipping in the middle rather than arching over it, the same inversion hot took
    // and for the same reason -- the two faces are near-twins in everything but
    // colour, mouth and effects, and this was the last +0.15 left between them. The
    // tilt stays as it is: flipping that too would drop the inner ends, which reads
    // as anger rather than as cold.
    eyebrowCurve: -0.15,
    // Clear of the frame, so the tilt has room.
    eyebrowRaise: { left: 0.14, right: 0.14 },
    eyebrowSpread: 0.12,
    mouthShape: 'clench',
    effects: ['coldBlush', 'snowflakes'],
  },
  // The tired-face emoji: brows arched and pushed up at their inner ends, eyes
  // screwed shut into '><', and a wide downturned gape showing teeth and tongue.
  // Shares 'scrunch' with persevering -- and is the reason that shape now draws
  // a brow, since persevering's reference has none and this one's does.
  {
    key: 'tired',
    glowColor: SLEEPY_GLOW,
    eyeShape: 'scrunch',
    // Positive already turns the right brow clockwise and the left anticlockwise --
    // BubuFace negates the angle for the left eye, and drawEyebrow rotates about the
    // brow's own centre where a positive canvas angle turns clockwise. Measured on the
    // render: the left brow runs from y 360.5 at its outer end up to 347.0 at its
    // inner one, and the right mirrors it.
    eyebrowAngle: 0.2,
    // Negative: the brow dips in the middle rather than arching over it, the
    // same inversion 'guilt' uses.
    eyebrowCurve: -0.3,
    // The same split persevering carries. The two faces share the 'scrunch' eye and
    // so share its wider brow, and there was no reason beyond oversight for one of
    // them to sit spread and the other tight.
    eyebrowSpread: 0.14,
    mouthShape: 'weary',
  },
  // The face-in-clouds emoji: nothing but the eyes, with cloud banks across the
  // top and bottom where the brows and mouth would be. The clouds effect draws
  // after the face and genuinely occludes it, but the brow and mouth are switched
  // off as well rather than merely hidden -- a stray glow leaking past a puff's
  // edge would give the trick away.
  //
  // The eyes carry the whole expression here -- there is nothing else on the face --
  // so they run larger than anywhere else. 1.3 is the ceiling: drawClouds sizes its
  // banks to clear the eyes at their worst drift, and past 1.3 the top bank cannot
  // pull back far enough to leave a gap at all.
  { key: 'peaking', eyeScale: 1.3, eyebrow: false, mouth: false, effects: ['clouds'] },

  // The medical-mask emoji: plain eyes over a surgical mask, and nothing else. The
  // brow and mouth are switched off for the same reason 'peaking' switches them off
  // -- the mask covers where the mouth is, but the mouth's glow bloom is wider than
  // the mouth and would haze through the cloth.
  { key: 'mask', eyebrow: false, mouth: false, effects: ['faceMask'] },

  // The face-with-thermometer emoji: worried arched brows, a flat mouth, and a
  // clinical thermometer propped in its left corner.
  //
  // The mouth is DEFAULTS' flat line -- 'curve' with a zero mouthCurve draws a
  // straight stroke, so no new shape is needed. The brows are a shade flatter than
  // 'worried' and arched, which is what separates unwell from anxious.
  {
    key: 'ill',
    // pleading's eyes exactly, and they land the same here without adjustment: both
    // faces wear the default framed eye at full size, so the pupil and its highlights
    // are computed off the same numbers.
    pupilScale: 1.7,
    pupilGlint: 1.45,
    eyebrowAngle: 0.22,
    eyebrowCurve: 0.3,
    // Clear of the frame, the same lift 'hot' needs: at DEFAULTS' 0.12 an arched
    // brow's outer end grazes the top of the eye.
    eyebrowRaise: { left: 0.15, right: 0.15 },
    eyebrowSpread: 0.12,
    // Corners turned down from the dead-flat line this had. Shallow, like guilt's --
    // this face is unwell rather than unhappy, and the thermometer is what carries it.
    mouthCurve: -0.4,
    // Dropped clear of the thermometer as well as for its own sake: the tube is angled
    // up across the left cheek and its bulb ends at the mouth's left corner, so at the
    // old height it lay over the mouth rather than in it.
    mouthDrop: 0.14,
    // Blush before the thermometer, so the tube lies over the flush rather than
    // under it -- it is held in front of the face, not behind the cheek.
    effects: ['feverBlush', 'thermometer'],
  },

  // The sneezing-face emoji: eyes screwed shut, no brows, a zigzag mouth, and a
  // tissue held up to it. Shares 'ill's fever flush -- both faces are running one.
  //
  // Blush first, then the tissue, so the cloth covers the left cheek's flush the way
  // it covers it in the reference.
  {
    key: 'sneeze',
    eyeShape: 'scrunch',
    eyebrow: false,
    mouthShape: 'zigzag',
    effects: ['feverBlush', 'tissue'],
  },

  // The exhaling-face emoji: eyes closed into downward crescents, brows arched and
  // relaxed above them, a pursed mouth, and a breath falling out of it.
  //
  // 'flatDown' is guilt's closed eye unchanged -- it is already the reference's
  // downward-bowing crescent. What separates the two faces is the brow: guilt leaves
  // it flat, and the arch here is what turns a downcast face into a sighing one.
  {
    key: 'exhaust',
    eyeShape: 'flatDown',
    eyebrowCurve: 0.32,
    mouthShape: 'blow',
    effects: ['breathPuff'],
  },

  // The face-with-monocle emoji: one brow cocked high over a monocle, the other
  // resting, and a shallow unimpressed frown.
  //
  // The raise is what makes the face read. eyebrowAngle is applied mirrored, so it
  // can only ever tilt the pair symmetrically -- a single cocked brow has to come
  // from eyebrowRaise, the same mechanism smirk and annoyed use at 0.1. This needs
  // far more than they do: the monocle's rim reaches 0.25 of an eye width above the
  // eye box, so anything under about 0.25 buries the brow in it.
  {
    key: 'suspect',
    // Left brow dead straight (an 'arc' with no curve), right one kinked.
    eyebrowCurve: 0,
    eyebrowShape: { left: 'arc', right: 'tick' },
    eyebrowRaise: { left: 0, right: 0.28 },
    // Mouth left at DEFAULTS' flat line. 'curve' with a zero mouthCurve is a straight
    // stroke, so no shape is needed -- the same thing 'ill' relies on.
    effects: ['monocle'],
  },

  // 'speaking' is a state rather than a mood -- driven while TTS plays, not
  // chosen by the model. Mouth open, everything else neutral.
  // 'speak' opens the resting curve into a wide, shallow oval, hinged at the top
  // the way a jaw is. It shares its construction with 'yawn' -- both interpolate
  // between two outlines sampled at matching parameters, so there is no seam
  // anywhere in the range -- but not its proportions: a yawn is a near-circle, and
  // a mouth held in a circle reads as surprise however fast it moves. BubuFace
  // drives openAmount from the syllable schedule.
  //
  // mouthCurve 0 is a flat line, not neutral's 0.9 smile. Talking over a smile
  // curve meant every closed moment between syllables snapped back to a grin,
  // which is not what a face does mid-sentence -- the smile belongs to the
  // expression on either side of the speech, not underneath it. Flat is also what
  // the 'speak' shape opens *from*: with curve 0 the resting outline is a straight
  // line, so each syllable is a clean line-to-oval-and-back rather than a smile
  // bulging. The change in and out of this face is interpolated like any other, so
  // the smile relaxes into the flat line rather than cutting to it.
  { key: 'speaking', mouthShape: 'speak', mouthCurve: 0, mouthSync: 1 },
];
