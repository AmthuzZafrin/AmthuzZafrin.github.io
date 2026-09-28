export const COLORS = {
  pageBg: '#000000',
  shellBase: '#221f2c',
  shellShadow: '#0a0810',
  screenBg: '#050006',
  glowPrimary: '#cc44ff',
  glowSecondary: '#9944ff',
  faceGlow: '#cc88ff',
  eyeFrame: '#c084fc',
  pupil: '#0a0510',
  highlight: '#ffffff',
};

export const CANVAS_SIZE = 640;

export const TIMING = {
  idleTriggerMs: 7000,
  idleHoldMinMs: 4000,
  idleHoldMaxMs: 6000,
  blinkIntervalMinMs: 2500,
  blinkIntervalMaxMs: 6000,
  blinkCloseMs: 90,
  blinkHoldMs: 60,
  blinkOpenMs: 120,
  doubleBlinkChance: 0.13,
  doubleBlinkGapMs: 200,
  pupilDamping: 0.12,
  bobPeriodMs: 3200,
  bobAmplitudePx: 6,
};

// All 30 expression names from spec §2. The authoritative definitions live in
// expressions/definitions.js; this list exists so other modules (and the backend
// vocabulary check) can reference the names without importing the render data.
export const EXPRESSION_KEYS = [
  'neutral', 'happy', 'genuinely_happy', 'sad', 'crying', 'furious', 'angry',
  'scared', 'excited', 'sleepy', 'love', 'heart', 'surprised', 'hiding_sadness', 'speaking',
  'shy', 'thinking', 'laughing', 'curious', 'bored', 'dizzy', 'drool', 'wink', 'cool',
  'kissing', 'swirl', 'celebrating', 'confused', 'proud', 'worried',
  // added after spec §2
  'smile', 'awkward', 'yummy', 'crazy', 'smirk', 'annoyed', 'worry', 'guilt', 'not_sure', 'persevering', 'tired', 'pleading', 'hot', 'cold', 'peaking', 'nerd', 'shock', 'zipper', 'disgust', 'vomit', 'mask', 'ill', 'sneeze', 'exhaust', 'suspect',
];

/**
 * The subset BUBU cycles through when idle (spec: random, after 7s of silence).
 *
 * Deliberately not all 30. An idle face is BUBU sitting there unprompted, so
 * anything that would read as a reaction to the user is excluded: crying,
 * worried, furious, angry, scared, hiding_sadness and crying have no
 * business appearing at someone who hasn't said anything, and 'speaking' is a
 * TTS state rather than a mood. What's left is calm, warm or playful.
 *
 * love, heart and kissing were in this pool until 12 Sep 2026, when BUBU stopped
 * wearing romantic faces at all (backend/emotion.py NEVER_WORN). Idle is BUBU's
 * own choice, so it is held to the same rule as a reply.
 */
export const IDLE_SAFE_EXPRESSIONS = [
  'neutral', 'happy', 'genuinely_happy', 'sleepy', 'excited',
  'shy', 'thinking', 'laughing', 'curious', 'bored', 'dizzy', 'wink', 'cool',
  'swirl', 'celebrating', 'proud', 'surprised', 'smile', 'yummy', 'crazy', 'smirk',
  // Warm and playful with nothing to read as a reaction, same as 'cool' and 'smile'
  // above. The other recent additions (tired, pleading, hot, cold, peaking, shock,
  // zipper) are all held out of the pool because unprompted they'd read as responses
  // to the user -- a startle is a reaction by definition, and a zipped mouth
  // appearing at someone who hasn't spoken reads as refusing to talk to them.
  'nerd',
];
