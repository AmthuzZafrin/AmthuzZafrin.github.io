import { drawBlush, drawDeepBlush, drawHotBlush, drawColdBlush, drawSickBlush, drawFeverBlush } from './blush';
import { drawZzz } from './zzz';
import {
  drawTears, drawLaughTears, drawSweatDrops, drawSweatBead, drawCheekTear, drawFrightDrops,
} from './tears';
import { drawSparkles } from './sparkles';
import { drawFloatingHearts, drawKissHeart } from './hearts';
import { drawShockLines } from './shockLines';
import { drawThinkingDots } from './thinkingDots';
import { drawSunglasses, drawGlasses } from './eyewear';
import { drawDrool } from './drool';
import { drawSnowflakes } from './snowflakes';
import { drawClouds } from './clouds';
import { drawVomitFlow } from './vomit';
import { drawFaceMask } from './mask';
import { drawThermometer } from './thermometer';
import { drawTissue } from './tissue';
import { drawBreathPuff } from './breath';
import { drawMonocle } from './monocle';
import { drawPartyHorn, drawConfetti } from './party';
import { drawQuestionMark } from './questionMark';

/**
 * Every effect has the signature drawX(ctx, geometry, tMs, config) and animates
 * from tMs alone -- no internal timers, so everything stays in step with the
 * single requestAnimationFrame loop in BubuFace.jsx.
 *
 * Names here are what expressions/definitions.js references by string;
 * expressions.test.mjs asserts the two stay in sync, because a typo'd effect
 * name renders nothing and raises no error.
 */
export const EFFECTS = {
  blush: drawBlush,
  deepBlush: drawDeepBlush,
  hotBlush: drawHotBlush,
  coldBlush: drawColdBlush,
  sickBlush: drawSickBlush,
  feverBlush: drawFeverBlush,
  zzz: drawZzz,
  tears: drawTears,
  laughTears: drawLaughTears,
  sweatDrops: drawSweatDrops,
  frightDrops: drawFrightDrops,
  sweatBead: drawSweatBead,
  cheekTear: drawCheekTear,
  sparkles: drawSparkles,
  floatingHearts: drawFloatingHearts,
  kissHeart: drawKissHeart,
  shockLines: drawShockLines,
  thinkingDots: drawThinkingDots,
  sunglasses: drawSunglasses,
  glasses: drawGlasses,
  drool: drawDrool,
  snowflakes: drawSnowflakes,
  clouds: drawClouds,
  vomitFlow: drawVomitFlow,
  faceMask: drawFaceMask,
  thermometer: drawThermometer,
  tissue: drawTissue,
  breathPuff: drawBreathPuff,
  monocle: drawMonocle,
  partyHorn: drawPartyHorn,
  confetti: drawConfetti,
  questionMark: drawQuestionMark,
};
