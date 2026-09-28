import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CANVAS_SIZE, TIMING } from './constants';
import { smoothstep as ease } from './ease';
import { useFaceAnimation } from './useFaceAnimation';
import { faceAt } from './transition';
import { getShellLayer } from './render/drawHeadShell';
import { getScreenLayer } from './render/drawScreen';
import { getFaceGeometry } from './render/geometry';
import { drawEye } from './render/drawEye';
import { drawMouth } from './render/drawMouth';
import { EFFECTS } from './effects';
import { setGlowScale } from './render/glow';

// The dev caption and its keyboard stepper used to live here, gated on
// import.meta.env.DEV. Both are gone: the caption read "dev — [ ] step (1/55:
// neutral) · 1-4 core · 0 idle" under BUBU's face on every dev run, including the
// welcome screen, and a stepper with nothing to read the current expression off
// is worse than neither. dev-face.html?expr=<name> serves that review workflow
// properly, and window.replayEntrance() covers the arrival -- see dev-face.jsx.

/**
 * The lids sagging shut and being hauled back open, on a loop.
 *
 * Half the cycle to fall, a third of it held down, and a short snap back up -- a
 * nod-off is slow going down and quick coming back, and an even in-out reads as
 * breathing rather than as fighting sleep. Both ends are smoothstepped so the loop
 * has no visible corner, and the two constants below meet at the same value.
 *
 * Lives here rather than in drawEye because it is a property of the expression, not
 * of the shape: it feeds the same staticOpenFraction any other descriptor sets.
 */
const DROOP_FALL = 0.5;
const DROOP_HOLD = 0.82;
// The yawn runs from just before the lids finish falling to just as they start to
// lift, so the mouth is shut again before the eyes are open. Held inside
// [DROOP_FALL, DROOP_HOLD] rather than spanning the whole cycle, which is what keeps
// the two from looking like one shape scaling.
const YAWN_START = 0.46;
const YAWN_END = 0.82;

function droopOpenFraction(phase, closed) {
  if (phase < DROOP_FALL) return 1 + (closed - 1) * ease(phase / DROOP_FALL);
  if (phase < DROOP_HOLD) return closed;
  return closed + (1 - closed) * ease((phase - DROOP_HOLD) / (1 - DROOP_HOLD));
}

/** 0 -> 1 -> 0 across the yawn window. A sine bump: no corner at either end. */
function yawnAmount(phase) {
  if (phase < YAWN_START || phase > YAWN_END) return 0;
  return Math.sin(((phase - YAWN_START) / (YAWN_END - YAWN_START)) * Math.PI);
}

function draw(ctx, w, h, dpr, state, now) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // The cached layers and glow sprites are built at dpr and blitted at 1:1, so this
  // only bites where a sprite's rounded bitmap size lands off the device grid by a
  // fraction of a pixel. Cheap insurance, not a fix for anything visible.
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, w, h);

  const geometryForBob = getFaceGeometry(w, h);
  // The face as it stands this frame, mid-change or settled. See transition.js.
  const expr = faceAt(state, now);

  // Excited/laughing expressions add a faster springy hop on top of the idle bob.
  const bounce = expr.bounce
    ? Math.abs(Math.sin((now / 260) * Math.PI)) * -TIMING.bobAmplitudePx * 1.6
    : 0;
  // One phase drives both the lids and the yawn, so they cannot drift apart.
  const droopPhase = expr.eyeDroopMs
    ? ((now % expr.eyeDroopMs) + expr.eyeDroopMs) % expr.eyeDroopMs / expr.eyeDroopMs
    : 0;

  // Amplitude from the live timing rather than the constant: how far BUBU floats
  // is part of how activated it is. Falls back to the constant for a state that
  // predates the affect layer.
  const bob = Math.sin(state.bobPhase * Math.PI * 2) * (state.timing ?? TIMING).bobAmplitudePx + bounce;
  ctx.translate(0, bob);

  ctx.drawImage(getShellLayer(w, h, dpr), 0, 0, w, h);
  ctx.drawImage(getScreenLayer(w, h, dpr), 0, 0, w, h);

  const geometry = geometryForBob;

  // A fixed pupilBias (looking away, glancing up in thought) overrides tracking
  // and idle wander -- the direction of gaze is part of the expression itself.
  const pupilOffset = expr.pupilBias ?? state.pupil;

  // eyeScale is either one number for both eyes or a per-eye {left, right}, the
  // same shape eyebrowRaise takes -- and for the same reason, since one number
  // cannot make the eyes different sizes from each other.
  const scaleFor = (side) =>
    (typeof expr.eyeScale === 'number' ? expr.eyeScale : expr.eyeScale?.[side]) ?? 1;

  // Grown about each eye's centre rather than its top-left corner, so scaling moves
  // the pair apart symmetrically instead of sliding both to the right. The brow
  // follows for free: drawEye sizes and places it off this width.
  const eyeBox = (side, x) => {
    const width = geometry.eyeW * scaleFor(side);
    const height = geometry.eyeH * scaleFor(side);
    return {
      width,
      height,
      x: x - (width - geometry.eyeW) / 2,
      y: geometry.eyeY - (height - geometry.eyeH) / 2,
    };
  };

  // Same one-or-per-eye shape as eyeScale. null is meaningful here and is not a
  // missing value: it means "no held height", which hands the lid back to the
  // blink -- so a per-eye {left: null, right: 0.15} is one ordinary eye beside one
  // held nearly shut, and that is the only way to express it.
  const openFor = (side) => {
    const spec = expr.eyeStaticOpenFraction;
    const held = spec === null || typeof spec === 'number' ? spec : spec?.[side] ?? null;
    return expr.eyeDroopMs ? droopOpenFraction(droopPhase, held ?? 0.4) : held;
  };

  const eyeCommon = {
    glowColor: expr.glowColor,
    browColor: expr.browColor ?? expr.glowColor,
    pupilOffset,
    pupilScale: expr.pupilScale,
    pupilGlint: expr.pupilGlint,
    blinkFraction: state.blinkFraction,
    eyebrow: expr.eyebrow,
    eyebrowCurve: expr.eyebrowCurve,
    eyebrowSpread: expr.eyebrowSpread,
    eyeWater: expr.eyeWater,
    eyeArc: expr.eyeArc,
    tMs: now,
    dpr,
  };

  // One name for both eyes, or a per-eye {left, right} -- the same one-or-per-eye
  // shape eyeScale and eyeStaticOpenFraction take. 'winkLeft' predates that and is
  // kept as its own name because the registry and its test both refer to it; it is
  // exactly the pair below.
  const shapes =
    expr.eyeShape === 'winkLeft'
      ? { left: 'flat', right: 'default' }
      : typeof expr.eyeShape === 'string'
        ? { left: expr.eyeShape, right: expr.eyeShape }
        : { left: 'default', right: 'default', ...expr.eyeShape };
  const leftShape = shapes.left;
  const rightShape = shapes.right;

  drawEye(ctx, {
    ...eyeCommon,
    ...eyeBox('left', geometry.leftEyeX),
    staticOpenFraction: openFor('left'),
    eyebrowAngle: -expr.eyebrowAngle,
    eyebrowRaise: expr.eyebrowRaise?.left ?? 0,
    eyebrowShape: expr.eyebrowShape?.left ?? 'arc',
    eyeShape: leftShape,
    side: 'left',
  });
  drawEye(ctx, {
    ...eyeCommon,
    ...eyeBox('right', geometry.rightEyeX),
    staticOpenFraction: openFor('right'),
    eyebrowAngle: expr.eyebrowAngle,
    eyebrowRaise: expr.eyebrowRaise?.right ?? 0,
    eyebrowShape: expr.eyebrowShape?.right ?? 'arc',
    eyeShape: rightShape,
    side: 'right',
  });

  // 'peaking' has no mouth at all -- cloud covers where it would be. Guarded here
  // rather than with a 'none' shape inside drawMouth, to mirror how expr.eyebrow
  // suppresses the brow.
  if (expr.mouth) {
    drawMouth(ctx, {
      cx: geometry.mouthCx,
      y: geometry.mouthY + geometry.eyeH * expr.mouthDrop,
      width: geometry.mouthW * expr.mouthScale,
      heightScale: expr.mouthHeight,
      curve: expr.mouthCurve,
      shape: expr.mouthShape,
      // Two things drive the same parameter and only ever one at a time. The
      // yawn belongs to 'sleepy', whose eyeDroopMs is what makes it a yawn at
      // all; everything else that opens its mouth is BUBU talking.
      //
      // Scaled by the expression's own mouthSync, which is 0 for all but the
      // resting faces -- so BUBU holds a laugh or a sob still and speaks over the
      // top of it, and only lip-syncs on a face whose mouth is otherwise idle.
      // See mouthSync in expressions/definitions.js.
      openAmount: expr.eyeDroopMs
        ? yawnAmount(droopPhase)
        : state.mouthOpenAmount * expr.mouthSync,
      glowColor: expr.glowColor,
      tMs: now,
      dpr,
    });
  }

  expr.effects.forEach(({ key, alpha }) => {
    const effect = EFFECTS[key];
    if (!effect) return;
    if (alpha >= 1) {
      effect(ctx, geometry, now, expr);
      return;
    }
    if (alpha > 0.01) drawEffectFaded(ctx, effect, geometry, now, expr, alpha, w, h, dpr, bob);
  });

  ctx.restore();
}

/**
 * One reusable layer for fading an effect in or out. Kept at module scope and
 * resized only when the canvas is, the same bargain the shell and screen layers
 * make: allocating a full-size canvas per effect per frame would cost more than
 * everything else in draw() put together.
 */
let scratchLayer = null;

function getScratchLayer(w, h, dpr) {
  const width = Math.round(w * dpr);
  const height = Math.round(h * dpr);
  if (!scratchLayer || scratchLayer.canvas.width !== width || scratchLayer.canvas.height !== height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    scratchLayer = { canvas, ctx: canvas.getContext('2d') };
  }
  return scratchLayer;
}

/**
 * Draws one effect at partial strength.
 *
 * It has to go through a layer rather than simply setting globalAlpha first,
 * because that would not survive contact with the effects themselves: drawGlow
 * and ten of the effect modules *assign* globalAlpha inside their own
 * save/restore rather than multiplying it, so an alpha set out here is
 * overwritten by the first glow they draw. Compositing the finished effect is the
 * only way to fade one without editing all of them.
 *
 * The layer is given the same device scale and the same bob translate as the main
 * context, so the effect lands in the same place; the composite itself is done
 * with the identity transform, blitting device pixel to device pixel.
 */
function drawEffectFaded(ctx, effect, geometry, now, expr, alpha, w, h, dpr, bob) {
  const { canvas, ctx: layer } = getScratchLayer(w, h, dpr);
  layer.setTransform(dpr, 0, 0, dpr, 0, 0);
  layer.clearRect(0, 0, w, h);
  layer.imageSmoothingQuality = 'high';
  layer.translate(0, bob);
  effect(layer, geometry, now, expr);

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
}

// The displayed size, as a CSS length. The default is what every app screen uses. The
// marketing site (site/components/LiveFace.jsx) passes its own, because it shows the
// face at several sizes on one page. Width and height are always the same value: the
// face is drawn into a square, and resize() below takes the smaller of the two anyway.
const DEFAULT_SIZE = 'min(60vw, 42vh)';

// Hands each face the frame in the cycle it draws on, so a page of faces that each draw
// every few frames spreads them across the cycle rather than landing them all on one.
let nextDrawPhase = 0;

/**
 * `drawEvery` draws the face on one frame in every `drawEvery`, for pages showing many
 * faces at once -- the website's intro puts up fifty-five, and drawing every one of
 * them every frame took it to 16 frames a second in headless Chrome. The state still
 * advances every frame, and blinks and transitions are timed off the clock rather than
 * the frame count, so a face drawn less often moves exactly as far, in fewer and larger
 * steps. The app shows one face and leaves it at 1.
 */
/*
 * `glow` scales every soft glow the face draws -- the washes of light around its eyes and
 * mouth -- where 1 is as designed. `supersample` draws the face at that many times the
 * screen's own resolution, for a crisper face on a low-density monitor, where the neon
 * edges otherwise come out twice as wide as the drawing intends; it never goes past 3x,
 * so a phone that is already dense is left alone. Both default to exactly what every
 * face did before; the website's home face uses them (14 Sep 2026).
 */
const MAX_SUPERSAMPLED_DPR = 3;

const BubuFace = forwardRef(function BubuFace(
  { size = DEFAULT_SIZE, drawEvery = 1, glow = 1, supersample = 1 },
  ref
) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dprRef = useRef(window.devicePixelRatio || 1);
  const sizeRef = useRef({ w: CANVAS_SIZE, h: CANVAS_SIZE });
  const rafRef = useRef(null);
  const drawPhaseRef = useRef(null);
  if (drawPhaseRef.current === null) {
    drawPhaseRef.current = nextDrawPhase;
    nextDrawPhase += 1;
  }
  const {
      stateRef, setExpression, playSequence, releaseToIdle, setTrackedFacePosition,
      playEntrance, startTalking, stopTalking, setAffect, tick,
    } =
    useFaceAnimation('neutral');

  // setAffect is how VoiceInterface hands the face BUBU's own mood, every emotion
  // frame. It was implemented in useFaceAnimation but missing from this handle, so
  // each call threw "setAffect is not a function" and the mood never arrived.
  useImperativeHandle(
    ref,
    () => ({
      setExpression, playSequence, releaseToIdle, setTrackedFacePosition,
      playEntrance, startTalking, stopTalking, setAffect,
    }),
    [setExpression, playSequence, releaseToIdle, setTrackedFacePosition, playEntrance, startTalking, stopTalking, setAffect]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    // Set when the canvas is resized, because resizing a canvas clears it: the next
    // frame draws whatever its turn, or a face drawn every few frames -- or one being
    // held still -- would sit blank.
    let redrawNow = false;
    let frameCount = 0;

    function resize() {
      // The layout size, not getBoundingClientRect(). That one includes CSS transforms
      // on every ancestor, so a face mounted inside something scaled -- the website
      // intro's grid, pulled back to 64%, or a face part-way through arriving at 82% --
      // was sized, and then drawn for good, at the scaled size. A transform changing
      // does not fire the ResizeObserver, so nothing ever corrected it.
      const size = Math.max(1, Math.min(container.offsetWidth, container.offsetHeight));
      const native = window.devicePixelRatio || 1;
      const dpr =
        supersample > 1 ? Math.max(native, Math.min(native * supersample, MAX_SUPERSAMPLED_DPR)) : native;
      dprRef.current = dpr;
      sizeRef.current = { w: size, h: size };
      const pixels = Math.round(size * dpr);
      // Only when it has actually changed. Giving a canvas the width it already has
      // still clears it, and this runs again whenever drawEvery changes -- so a face
      // just told to hold still would have wiped the very frame it was to hold. A new
      // canvas is 300x150, never square, so a face's first run always lands here.
      if (canvas.width !== pixels || canvas.height !== pixels) {
        canvas.width = pixels;
        canvas.height = pixels;
        redrawNow = true;
      }
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function frame(now) {
      // The state advances every frame whatever drawEvery says, so blinks and
      // transitions keep their timing -- see drawEvery above. A drawEvery of 0 holds
      // the last frame drawn: for faces on their way off the screen, where every
      // frame drawn costs and none of them can be seen to matter.
      tick(now);
      const due = drawEvery > 0 && frameCount % drawEvery === drawPhaseRef.current % drawEvery;
      if (redrawNow || due) {
        setGlowScale(glow);
        draw(ctx, sizeRef.current.w, sizeRef.current.h, dprRef.current, stateRef.current, now);
        setGlowScale(1);
        redrawNow = false;
      }
      frameCount += 1;
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, [tick, stateRef, drawEvery, glow, supersample]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        ref={containerRef}
        style={{ width: size, height: size }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

export default BubuFace;
