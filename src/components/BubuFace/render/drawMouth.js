import { drawGlow } from './glow';
import { roundedRectPath } from './path';
import { METAL_LIGHT, METAL_SHADE } from './metal';

/**
 * Draws the glowing mouth.
 *
 * The default 'curve' shape is a single quadratic:
 * curve > 0 bows the midpoint downward (smile, corners read as turned up);
 * curve < 0 bows the midpoint upward (frown, corners read as turned down);
 * curve === 0 is a flat neutral line.
 *
 * Other shapes exist because some expressions in spec §2 need a different mouth
 * outline, not a different curvature -- a laughing open mouth with teeth or a
 * surprised 'o' cannot be reached by any value of `curve`.
 */
export function drawMouth(ctx, params) {
  const {
    cx, y, width, curve = 0, glowColor, shape = 'curve', openAmount = 0, dpr = 1,
    // Multiplies how deep the mouth hangs, without touching how far it runs. Every
    // shape here derives both from `width`, so mouthScale alone can only make a
    // mouth bigger or smaller -- never taller and narrower, which is a different
    // mouth. Only the grin family reads it; nothing else has asked yet.
    heightScale = 1,
    // Animation clock, shared with the eyes and the effects. Only the mouths that
    // actually move read it; the rest are a pure function of their geometry.
    tMs = 0,
  } = params;

  const halfW = width / 2;
  const amplitude = width * 0.32 * curve;

  if (shape === 'crescent') {
    drawCrescentMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'yawn') {
    drawYawnMouth(ctx, { cx, y, width, curve, glowColor, dpr, openAmount });
    return;
  }

  if (shape === 'speak') {
    drawSpeakingMouth(ctx, { cx, y, width, curve, glowColor, dpr, openAmount });
    return;
  }

  if (shape === 'grin' || shape === 'grinTongue' || shape === 'grinArch' || shape === 'beam' || shape === 'laugh' || shape === 'grinRow') {
    drawGrinMouth(ctx, {
      cx, y, width, glowColor, dpr, heightScale,
      withTongue: shape === 'grinTongue',
      // nerd: the upper lip lifts instead of running dead straight across. 'beam'
      // goes the other way -- a negative rise bows the top edge down in the middle,
      // which is what puts the cheeks up at the corners of a real beam. 'laugh'
      // takes a gentler version of the same dip.
      lipRise: shape === 'grinArch' ? width * 0.16
        : shape === 'beam' ? width * -0.1
        : shape === 'laugh' || shape === 'grinRow' ? width * -0.08
        : 0,
      teethFill: shape === 'beam',
      teethBand: shape === 'laugh' || shape === 'grinRow',
      // 'grinRow' is 'laugh' stripped back: the same silhouette and the same white
      // row along the top, but a plain row with no divisions and nothing lying in
      // the cavity below it. Its own name rather than a pair of flags on 'laugh',
      // so the faces already reviewed wearing that mouth keep it exactly.
      teethLines: shape === 'laugh',
      innerTongue: shape === 'laugh',
      // nerd's two front teeth. Hung off 'grinArch' rather than given a shape name
      // of its own because that shape has exactly one user and this is what it is
      // for -- a new name would mean five more registry entries for no new mouth.
      buckTeeth: shape === 'grinArch',
    });
    return;
  }

  if (shape === 'pucker') {
    drawPuckerMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'anguished') {
    drawAnguishedMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'weary') {
    drawWearyMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'pant') {
    drawPantMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'clench') {
    drawClenchMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'tongue') {
    drawTongueMouth(ctx, { cx, y, width, glowColor, tMs });
    return;
  }

  if (shape === 'smirk') {
    drawSmirkMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'unsure') {
    drawUnsureMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'zipper') {
    drawZipperMouth(ctx, { cx, y, width });
    return;
  }

  if (shape === 'queasy') {
    drawQueasyMouth(ctx, { cx, y, width, curve, glowColor });
    return;
  }

  if (shape === 'scream') {
    drawScreamMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (shape === 'zigzag') {
    drawZigzagMouth(ctx, { cx, y, width, glowColor, dpr });
    return;
  }

  if (OPEN_MOUTH_SIZES[shape]) {
    drawOpenMouth(ctx, { cx, y, width, glowColor, shape, dpr });
    return;
  }

  // No separate drawGlow bloom, for the reason drawSlantMouth, drawQueasyMouth and
  // drawFlatEye all give: it is 1.3 mouth-widths across against a stroke a fifteenth
  // of that thick, so on anything but a deep smile the disc shows above and below the
  // line as a haze rather than hugging it. Centring it on the curve's midpoint, which
  // is what it used to do, does not help -- the stroke still only covers a sliver of
  // it. The stroke's own shadowBlur below carries the halo.
  ctx.beginPath();
  ctx.moveTo(cx - halfW, y);

  if (shape === 'wavy') {
    // A squiggle for confusion/worry -- four alternating control points across
    // the same span the quadratic would have covered.
    const step = width / 4;
    const amp = width * 0.14;
    ctx.quadraticCurveTo(cx - halfW + step * 0.5, y - amp, cx - halfW + step, y);
    ctx.quadraticCurveTo(cx - halfW + step * 1.5, y + amp, cx - halfW + step * 2, y);
    ctx.quadraticCurveTo(cx - halfW + step * 2.5, y - amp, cx - halfW + step * 3, y);
    ctx.quadraticCurveTo(cx - halfW + step * 3.5, y + amp, cx + halfW, y);
  } else {
    ctx.quadraticCurveTo(cx, y + amplitude, cx + halfW, y);
  }

  ctx.lineWidth = width * 0.075;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
}

/**
 * The wide beaming grin of the heart-eyes emoji: a half-disc, flat across the
 * top and round underneath.
 *
 * It can't be built from 'open' -- that's a full ellipse, so its top edge is
 * always curved -- and it can't be built from any `curve` value either, since
 * 'curve' is a stroked line with no enclosed area to fill.
 *
 * `lipRise` arches the top edge up by that many pixels at its middle, which is all
 * that separates 'grinArch' from 'grin'. Zero leaves it dead straight.
 */
/**
 * The closed-smile crescent: a filled lens between two downward arcs, thickest in
 * the middle and tapering to a point at each corner.
 *
 * Both numbers are quadratic control offsets as fractions of the mouth width. The
 * reference deflects about 0.026 of its width along the top edge and 0.202 along
 * the bottom, and a symmetric quadratic reaches half its control offset at the
 * midpoint, so each is doubled. The top edge is very nearly straight -- the bulge
 * is entirely the bottom edge's, and that asymmetry is what makes it a smile
 * rather than a lens lying on its side.
 *
 * Exported for the same reason GRIN_SIZE is: the drool hangs off this lip, and
 * needs the curve to find it. At parameter u along the width, the lower lip sits
 * (blunt + 2u(1-u) * bottomCtrl) below the mouth line -- the blunt term because
 * rounding the corners pushes the whole bottom edge down by that much.
 */
export const CRESCENT = { topCtrl: 0.052, bottomCtrl: 0.404, blunt: 0.025, rim: 0.03 };

function drawCrescentMouth(ctx, { cx, y, width, glowColor, dpr }) {
  const halfW = width / 2;
  const top = width * CRESCENT.topCtrl;
  const bottom = width * CRESCENT.bottomCtrl;
  // Half the height of the rounded end each corner gets. The two arcs are pulled
  // apart by this much and joined round, because where they used to meet directly
  // they formed a cusp -- and lineJoin 'round' cannot blunt one of those, it only
  // rounds by half the stroke width. The same fix 'weary' and 'scream' needed.
  const blunt = width * CRESCENT.blunt;

  drawGlow(ctx, cx, y + bottom * 0.35, width * 1.3, glowColor, dpr, 0.4);

  // xDir bulges the control outward past halfW so the corner reads as a rounded
  // end rather than as a flat edge cutting the tip off; yDir is which way along
  // the corner we are travelling. They are separate because the right corner
  // bulges right while running upward, and the left one bulges left running down.
  const cap = (cornerX, xDir, yDir) =>
    ctx.quadraticCurveTo(cornerX + xDir * blunt * 0.9, y, cornerX, y + yDir * blunt);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfW, y + blunt);
  ctx.quadraticCurveTo(cx, y + bottom + blunt, cx + halfW, y + blunt);
  cap(cx + halfW, 1, -1);
  ctx.quadraticCurveTo(cx, y + top - blunt, cx - halfW, y - blunt);
  cap(cx - halfW, -1, 1);
  ctx.closePath();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  // Thinner in proportion than the grin's rim: `width` here is the whole mouth,
  // where the grin's is only 1/2.3 of its own drawn width. Shared through CRESCENT
  // because the drool has to start where this stroke ends, and a stroke straddles
  // its path -- half of this lies below the lip curve.
  ctx.lineWidth = width * CRESCENT.rim;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.06;
  ctx.stroke();
  ctx.restore();
}

/**
 * The grin's radii, as fractions of the mouth width. Larger than the other mouths:
 * geometry.js sizes mouthW for a stroked line, and an open grin has to be wide to
 * read as one at all.
 *
 * Exported for the same reason OPEN_MOUTH_SIZES is -- an effect that has to meet
 * this mouth's edge needs its shape. The lower lip is the bottom half of an
 * ellipse, so at a horizontal offset dx from the centre it sits at
 * ry * sqrt(1 - (dx/rx)^2) below the mouth line.
 */
export const GRIN_SIZE = { rx: 1.15, ry: 0.72 };

function drawGrinMouth(ctx, {
  cx, y, width, glowColor, dpr, heightScale = 1, withTongue = false, lipRise = 0,
  // 'beam': the same silhouette packed with teeth instead of opening onto a dark
  // cavity, plus the bite line dividing the two rows. Which one it is turns out to
  // be the whole difference between a laugh and a beam -- 'grin' reads as an open
  // mouth, this reads as a face grinning so hard the teeth fill it.
  teethFill = false,
  // 'laugh': the tears-of-joy mouth. Not teethFill's packed grin and not the bare
  // cavity of 'grin' either -- one white row along the top with the cavity open
  // below it, and a tongue lying in the bottom of that cavity. Measured off the
  // reference at a third of the mouth's height for the row, and a tongue a third
  // of its width sitting 84% of the way down.
  teethBand = false,
  // Divisions between one tooth and the next. Off leaves the row a plain white band.
  teethLines = true,
  innerTongue = false,
  // 'grinArch': two big front teeth hanging from under the upper lip, rather than a
  // row across the whole mouth. Distinct from teethBand in what it is, not just in
  // width -- the band is a wall of teeth behind the lip, these are two objects in
  // front of an otherwise empty cavity.
  buckTeeth = false,
}) {
  const rx = width * GRIN_SIZE.rx;
  // Only ry takes heightScale. Everything inside -- the teeth row, the tongue, the
  // bite line -- is already measured in ry, so they all deepen with it and none of
  // them needs its own factor.
  const ry = width * GRIN_SIZE.ry * heightScale;

  drawGlow(ctx, cx, y + ry * 0.3, width * 2.2, glowColor, dpr, 0.5);

  // Top edge, then the lower half of an ellipse sweeping back to the start.
  //
  // The top is a cubic with both control points at the same height, so it lifts to
  // a broad plateau between the two corners rather than to a point -- the same
  // construction the 'pant' and 'weary' upper lips use, including the 1/0.75 factor
  // that puts a symmetric cubic's midpoint exactly `lipRise` above the corner line.
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(cx - rx, y);
    ctx.bezierCurveTo(
      cx - rx * 0.45, y - lipRise / 0.75,
      cx + rx * 0.45, y - lipRise / 0.75,
      cx + rx, y,
    );
    ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI);
    ctx.closePath();
  };

  // The rim, optionally carrying its glow. Split into a callable because the teeth
  // need it laid down twice -- see below.
  const rimStroke = (withGlow) => {
    ctx.save();
    outline();
    ctx.lineWidth = width * 0.07;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = withGlow ? glowColor : 'transparent';
    ctx.shadowBlur = withGlow ? width * 0.14 : 0;
    ctx.stroke();
    ctx.restore();
  };

  ctx.save();
  outline();
  ctx.fillStyle = teethFill ? TEETH_WHITE : CAVITY;
  ctx.fill();

  // Both of these go on *before* the crisp rim, not after. The rim stroke straddles
  // the outline, so half its width lies inside the shape, and anything painted over
  // that afterwards climbs on top of the lip instead of stopping at it -- the same
  // ordering the 'scream' mouth needs, discovered there the hard way.
  //
  // They go *after* the rim's glow, though, and that is the other half of it. The
  // glow spreads inward as well as outward, so a rim stroked over the teeth washed
  // them in the face's own colour -- lilac on a purple face, warm on an amber one --
  // and a lilac tooth stops reading as a tooth. Laying the glow down first lets the
  // white cover its inward half; the crisp rim then goes back on top. The outward
  // half survives untouched, since nothing paints outside the outline.
  if (teethBand || innerTongue || buckTeeth) {
    rimStroke(true);
    ctx.save();
    outline();
    ctx.clip();
    // Neither of these is a glowing feature, and the caller's shadow can survive
    // into here; a white row wearing a coloured halo reads as a smear.
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    if (teethBand) {
      // Started well above the lip and left to the clip: the row then picks up the
      // top edge's own dip rather than cutting straight across underneath it.
      const bandBottom = y - ry + ry * 1.33;
      ctx.beginPath();
      ctx.rect(cx - rx, y - ry, rx * 2, ry * 1.33);
      ctx.fillStyle = TEETH_WHITE;
      ctx.fill();

      // What separates a row of teeth from a white bar is that it is a row.
      //
      // Everything below is measured from y, not from the rect's own top. The rect
      // starts a whole ry above the lip and the outline clip throws all of that away
      // -- the visible band is only the strip from the upper lip down to bandBottom,
      // so divisions and shading drawn against the rect land outside the clip and
      // paint nothing at all, which is exactly what they did.
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - rx, y - ry, rx * 2, ry * 1.33);
      ctx.clip();

      // Laid out from the centre outward rather than from the left edge, so a
      // division falls exactly on the midline where the two front teeth meet. Fixed
      // pitch, so a wider mouth shows more teeth rather than wider ones. Each stops
      // short of the biting edge: teeth are joined at the gum, not at the tip.
      if (teethLines) {
        ctx.lineWidth = Math.max(1, rx * 0.018);
        ctx.lineCap = 'round';
        ctx.strokeStyle = TEETH_GAP;
        const pitch = rx * 0.29;
        for (let k = -Math.ceil(rx / pitch); k <= Math.ceil(rx / pitch); k++) {
          ctx.beginPath();
          ctx.moveTo(cx + k * pitch, y - ry * 0.1);
          ctx.lineTo(cx + k * pitch, bandBottom - ry * 0.06);
          ctx.stroke();
        }
      }

      // The upper lip's shadow across the top of the row. Without it the teeth read
      // as painted on the lip rather than set behind it.
      const shade = ctx.createLinearGradient(0, y - ry * 0.1, 0, y + ry * 0.18);
      shade.addColorStop(0, TEETH_SHADE);
      shade.addColorStop(1, 'rgba(52,14,74,0)');
      ctx.fillStyle = shade;
      ctx.fillRect(cx - rx, y - ry * 0.1, rx * 2, ry * 0.28);
      ctx.restore();
    }

    if (buckTeeth) {
      // Each starts a whole ry above the lip and is left to the outline clip, the
      // same trick teethBand uses: the tooth then meets the lip along the lip's own
      // curve, and keeps meeting it if lipRise or the mouth's size ever change. The
      // crisp rim goes back on top afterwards, so what shows is the tooth beginning
      // exactly at the lip's inner edge -- no arithmetic to keep in step.
      const toothW = rx * 0.34;
      // A hair of cavity between them, so they read as two teeth and not one slab.
      const split = rx * 0.035;
      const bottom = y + ry * 0.62;

      // Flat white the whole way down, with none of the lip shadow teethBand wears
      // across its top. That shadow is what makes a wall of teeth read as set behind
      // the lip, but these two are meant to hang in front of the cavity, and a
      // graded top just made them look dirty.
      //
      // Opaque, unlike the shared TEETH_WHITE at 0.92: that alpha exists so a row
      // packed behind a lip picks up a little of what is behind it, and here there
      // is only the dark cavity to pick up, which greyed them.
      [-1, 1].forEach((side) => {
        const x0 = side < 0 ? cx - split / 2 - toothW : cx + split / 2;
        // Rounded all round, at the biting edge because that is the shape of a tooth
        // and at the top because the outline clip discards those corners anyway.
        roundedRectPath(ctx, x0, y - ry, toothW, bottom - (y - ry), toothW * 0.26);
        ctx.fillStyle = TOOTH_SOLID;
        ctx.fill();
      });
    }

    if (innerTongue) {
      // Seated at 0.75 rather than the 0.84 the reference measures. At 0.84 the
      // tongue's own 0.145 radius puts its lower edge within a pixel of the lip,
      // which is inside the rim stroke and deep inside the 14px glow the rim casts
      // inward -- it came out ringed in amber, reading as a lozenge stuck to the
      // mouth rather than a tongue lying in it. 0.75 leaves a band of cavity below.
      const tcy = y + ry * 0.75;
      const trx = rx * 0.31;
      const trY = ry * 0.145;

      // Lit at the front edge and falling away into the back of the mouth. The
      // gradient is centred forward of the tongue's own middle, so the darkest part
      // is the far side rather than a ring around it.
      const body = ctx.createRadialGradient(
        cx, tcy + trY * 0.5, 0,
        cx, tcy + trY * 0.5, trx * 1.15,
      );
      body.addColorStop(0, TONGUE_LIT);
      body.addColorStop(0.45, TONGUE_PINK);
      body.addColorStop(1, TONGUE_DEEP);
      ctx.beginPath();
      ctx.ellipse(cx, tcy, trx, trY, 0, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();

      // The groove down the middle, and a wet highlight either side of it. Clipped
      // to the tongue so neither can spill onto the cavity behind.
      ctx.save();
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(cx, tcy - trY * 0.55);
      ctx.lineTo(cx, tcy + trY * 0.75);
      ctx.lineWidth = Math.max(1, trx * 0.055);
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(120,8,44,0.55)';
      ctx.stroke();

      const gloss = ctx.createRadialGradient(cx, tcy - trY * 0.3, 0, cx, tcy - trY * 0.3, trx * 0.8);
      gloss.addColorStop(0, 'rgba(255,255,255,0.32)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(cx, tcy - trY * 0.3, trx * 0.8, trY * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = gloss;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // The crisp lip back over the inner half the white just covered. No glow this
    // time -- the glow is already down, and a second pass of it would put the wash
    // straight back onto the teeth.
    //
    // rimStroke builds its own path, which also settles an old trap here: save and
    // restore do not cover the *current path*, only the drawing state, so the block
    // above leaves the tongue as the path. A bare stroke here would silhouette the
    // tongue and the mouth would come out rimless.
    rimStroke(false);
  } else {
    rimStroke(true);
  }
  ctx.restore();

  // The bite line, bowed downward so it follows the mouth rather than cutting a
  // straight slash across a curved shape. Both ends and the midpoint are held well
  // inside the ellipse -- at 0.3 of ry down it is still 0.95 of rx wide, so ending
  // at 0.78 leaves a clear margin of teeth beyond the line at every point.
  if (teethFill) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.78, y + ry * 0.3);
    ctx.quadraticCurveTo(cx, y + ry * 0.62, cx + rx * 0.78, y + ry * 0.3);
    ctx.lineWidth = width * 0.05;
    ctx.lineCap = 'round';
    ctx.strokeStyle = glowColor;
    ctx.stroke();
    ctx.restore();
  }

  // crazy: the tongue lolls out of the grin. Drawn last, over the rim rather
  // than under it, because it hangs *over* the lower lip -- clipping it inside
  // the silhouette (the trick the 'tongue' shape uses) would cut off exactly
  // the part that sells it.
  if (withTongue) {
    // hot's tongue -- the arched top, the round body and the centre crease -- but at
    // the flat-topped half-disc's own position and size, which is what this face was
    // reviewed wearing. Only the shape changed.
    //
    // The three numbers are the old ones exactly: 0.12 of the mouth's width below the
    // lip, 0.34 across, and 0.95 long. drawLollingTongue builds its body at 1.63x its
    // half-width, which is the proportion that makes it read as a tongue rather than
    // a blob, so reaching the old length is a matter of scaling that: 0.95 / (1.63 x
    // 0.34). Written as the division rather than as 1.71, so it stays correct if the
    // shared aspect is ever retuned.
    const tongueRx = width * 0.34;
    drawLollingTongue(ctx, {
      cx,
      topY: y + width * 0.12,
      rx: tongueRx,
      lengthScale: (width * 0.95) / (1.63 * tongueRx),
      // Straight across the top, as the half-disc this replaced was. The arch is
      // hot's, and hot needs it: that tongue sits in a mouth whose upper lip curves
      // down over it, so a flat top would show a crescent of gap. This grin's upper
      // lip runs dead straight, and the tongue meets it along its whole width.
      archRatio: 0,
      // A straight top meets the round sides at a right angle, and a right angle on
      // something soft reads as cut rather than as flesh. Taken off by a sixth of the
      // tongue's half-width, which is enough to round it and not so much that the top
      // stops reading as straight.
      bluntRatio: 0.17,
      glowBlur: width * 0.22,
    });
  }
}

/**
 * Shared by 'smirk' and 'unsure': a lopsided mouth whose two ends sit at
 * different heights.
 *
 * The 'curve' shape can't do either. It's a symmetric quadratic with both ends
 * pinned to the same baseline, so every value of `curve` gives a mouth that
 * mirrors about its centre. Asymmetry needs the ends free and the control point
 * pushed off-centre, which is what this takes as parameters.
 *
 * `bow` below both ends arcs the curve upward into a frown; between or beneath
 * them it bows down into a smile. All ratios are of `width`, except ctrlX which
 * is of halfW.
 */
// No dpr parameter: it existed only for the drawGlow bloom removed below.
function drawSlantMouth(ctx, {
  cx, y, width, glowColor, start, end, bow, ctrlX,
  // 'butt' cuts each end square across the path, so a nearly horizontal end reads
  // as a vertical cut and a steeply climbing one as a near-horizontal cut. That
  // asymmetry is a feature of the smirk reference, not an accident of it.
  cap = 'round',
}) {
  const halfW = width * 0.62;

  // No separate drawGlow bloom here, unlike the other mouths. Its centre would
  // have to be derived from the curve, and on a mouth that bows upward a fixed
  // centre sits well below the stroke and reads as a stray dot. The stroke's own
  // shadowBlur below already gives it the neon halo.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - halfW, y + width * start);
  ctx.quadraticCurveTo(cx + halfW * ctrlX, y + width * bow, cx + halfW, y + width * end);
  ctx.lineWidth = width * 0.075;
  ctx.lineCap = cap;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

/**
 * smirk: low and flat on the left, curling up hard at the right.
 *
 * The reference's right end sits 43% of the span above its left, which over this
 * shape's 1.24-width span would put start and end 0.53 apart. They are 0.40 apart
 * here -- a 32% rise -- because the full 43% pulled the corner up level with the
 * eyes and read as a leer rather than a smirk.
 *
 * The bow is held just above `start` so the curve sags barely a pixel before it
 * climbs, matching a reference that is nearly flat for its first third; a deeper
 * bow turns it back into an ordinary smile. ctrlX pushes the control right, which
 * is what concentrates the sweep at that end.
 *
 * Ends cut square, off the reference. The stroke stays at the shared 0.075 that
 * neutral's mouth uses -- the reference's is proportionally heavier, but a thicker
 * line was tried here and read as a slab rather than a mouth.
 */
function drawSmirkMouth(ctx, params) {
  drawSlantMouth(ctx, { ...params, start: 0.16, end: -0.24, bow: 0.3, ctrlX: 0.3, cap: 'butt' });
}

/** not_sure: a shallow frown, tilted so the left corner hangs lower. */
function drawUnsureMouth(ctx, params) {
  drawSlantMouth(ctx, { ...params, start: 0.16, end: -0.14, bow: -0.18, ctrlX: 0 });
}

/**
 * kissing: puckered lips -- an 'M' laid on its right side, so its two peaks
 * face right. Stroked rather than filled, as two bumps sharing a middle point.
 *
 * Centred under the eyes; the kissHeart effect in effects/hearts.js clears the
 * lips' right edge rather than the mouth stepping aside for it. The two are a
 * matched pair -- move this and the heart lands on top of the lips.
 */
function drawPuckerMouth(ctx, { cx, y, width, glowColor, dpr }) {
  const x = cx;
  const hw = width * 0.3;
  const hh = width * 0.4;

  drawGlow(ctx, x, y, width * 1.3, glowColor, dpr, 0.45);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - hw, y - hh);
  // upper bump out to the right and back to the waist
  ctx.quadraticCurveTo(x + hw * 1.7, y - hh * 0.6, x - hw * 0.2, y);
  // lower bump, mirrored
  ctx.quadraticCurveTo(x + hw * 1.7, y + hh * 0.6, x - hw, y + hh);
  ctx.lineWidth = width * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();
}

/**
 * scared: the open grimace of the anguished-face emoji -- wide across the top,
 * walls tapering inward, rounded at the bottom.
 *
 * 'open' and 'small' are both plain ellipses. An ellipse is symmetric top to
 * bottom, so no radius pair can give the tapered, top-heavy silhouette this
 * needs; it has to be traced as its own path.
 */
function drawAnguishedMouth(ctx, { cx, y, width, glowColor, dpr }) {
  const rx = width * 0.5;
  const ry = width * 0.44;
  const cy = y + ry * 0.4;

  drawGlow(ctx, cx, cy, width * 1.5, glowColor, dpr, 0.45);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rx, cy - ry);
  // top edge, dipping slightly at its middle
  ctx.quadraticCurveTo(cx, cy - ry * 0.68, cx + rx, cy - ry);
  // walls tapering in to a rounded bottom
  ctx.quadraticCurveTo(cx + rx * 0.8, cy + ry, cx, cy + ry);
  ctx.quadraticCurveTo(cx - rx * 0.8, cy + ry, cx - rx, cy - ry);
  ctx.closePath();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.lineWidth = width * 0.07;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();
}

// How many points the yawn's outline is sampled at. 64 is well past the point where
// the straight segments show at this size, and it costs nothing next to the glows.
const YAWN_STEPS = 64;

/**
 * sleepy: the resting mouth opening into a circle and closing again, as the lids fall.
 *
 * openAmount 0 is the ordinary 'curve' mouth and 1 is a near-circle, with everything
 * between a genuine blend of the two -- not a crossfade and not a switch at a
 * threshold. Both outlines are sampled at the same parameter values and the points
 * are interpolated, which is the only construction here that has no seam anywhere in
 * its range: at 0 the two halves land exactly on top of each other, so the shape
 * encloses no area, the fill is invisible and what you see is the plain stroked curve.
 *
 * Both are traced left corner -> along the top -> right corner -> back along the
 * bottom, so corresponding samples are at corresponding places on the two shapes.
 * Sampling them in different directions is what would make it turn inside out
 * mid-open.
 */
/**
 * The mouth while BUBU talks: the resting curve opening into a wide, shallow oval.
 *
 * Built on exactly the same construction as the yawn below -- both outlines
 * sampled at matching parameter values and the points interpolated, so there is no
 * seam anywhere in the range and at 0 the two halves land on top of each other and
 * vanish into the plain resting curve. What differs is the shape being opened
 * *into*, and that difference is the whole point.
 *
 * A yawn is a near-circle: rx and ry within 5% of each other. Speech is not. A
 * mouth held in a circle reads as surprise or as a yawn no matter how fast it
 * moves, which is exactly how the first version of this looked. A speaking mouth
 * is consistently wider than it is tall -- so ry is 0.42 of rx here, and rx itself
 * is a little narrower than the yawn's, because a mouth that spans the whole face
 * is shouting.
 *
 * The vertical centre shifts down as it opens, by a third of ry. Jaws hinge at the
 * top: the upper lip barely moves while the lower one drops. Opening symmetrically
 * about the resting line is the other thing that made it look like a hole rather
 * than a mouth.
 */
function drawSpeakingMouth(ctx, { cx, y, width, curve, glowColor, dpr, openAmount }) {
  const halfW = width / 2;
  const amplitude = width * 0.32 * curve;
  const rx = width * 0.42;
  const ry = rx * 0.42;
  const a = Math.min(1, Math.max(0, openAmount));
  // Hinged at the top rather than the middle -- see above.
  const cy = y + ry * 0.33 * a;

  const restAt = (u) => ({
    x: (1 - u) ** 2 * (cx - halfW) + 2 * (1 - u) * u * cx + u ** 2 * (cx + halfW),
    y: y + 2 * (1 - u) * u * amplitude,
  });

  ctx.beginPath();
  for (let i = 0; i <= YAWN_STEPS; i++) {
    const t = i / YAWN_STEPS;
    const rest = restAt(t <= 0.5 ? t * 2 : (1 - t) * 2);
    const angle = Math.PI + t * Math.PI * 2;
    const ex = cx + Math.cos(angle) * rx;
    const ey = cy + Math.sin(angle) * ry;
    const px = rest.x + (ex - rest.x) * a;
    const py = rest.y + (ey - rest.y) * a;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  if (a > 0.02) {
    // Softer than the yawn's 0.45: a talking mouth flickers open and shut several
    // times a second, and a glow that strong pulsing at that rate reads as flashing.
    drawGlow(ctx, cx, y, width * 1.4 * a, glowColor, dpr, 0.26 * a);
    ctx.fillStyle = CAVITY;
    ctx.fill();
  }

  ctx.save();
  ctx.lineWidth = width * 0.075;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

function drawYawnMouth(ctx, { cx, y, width, curve, glowColor, dpr, openAmount }) {
  const halfW = width / 2;
  const amplitude = width * 0.32 * curve;
  const rx = width * 0.62;
  // Just under rx: a yawn that is exactly circular reads as 'surprised', and the
  // reference for a yawn is always a shade taller than it is wide at the corners.
  const ry = rx * 0.95;
  const a = Math.min(1, Math.max(0, openAmount));

  // Quadratic through the resting curve, at parameter u.
  const restAt = (u) => ({
    x: (1 - u) ** 2 * (cx - halfW) + 2 * (1 - u) * u * cx + u ** 2 * (cx + halfW),
    y: y + 2 * (1 - u) * u * amplitude,
  });

  ctx.beginPath();
  for (let i = 0; i <= YAWN_STEPS; i++) {
    const t = i / YAWN_STEPS;
    // t < 0.5 walks the top edge left to right, t > 0.5 walks the bottom back.
    const rest = restAt(t <= 0.5 ? t * 2 : (1 - t) * 2);
    const angle = Math.PI + t * Math.PI * 2;
    const ex = cx + Math.cos(angle) * rx;
    const ey = y + Math.sin(angle) * ry;

    const px = rest.x + (ex - rest.x) * a;
    const py = rest.y + (ey - rest.y) * a;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  if (a > 0.02) {
    drawGlow(ctx, cx, y, width * 1.9 * a, glowColor, dpr, 0.45 * a);
    ctx.fillStyle = CAVITY;
    ctx.fill();
  }

  ctx.save();
  ctx.lineWidth = width * 0.075;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

// The tongue keeps its own colour rather than following glowColor: it's flesh,
// not glowing display, and tinting it purple with the rest of the face loses it.
const TONGUE_PINK = '#ff5c8a';
// The crease down a lolling tongue's middle. Shared by every tongue that has one.
const TONGUE_CREASE = 'rgba(120,10,45,0.55)';
// The mouth interior, shared by every filled mouth shape.
const CAVITY = 'rgba(30,4,48,0.92)';
// Teeth keep their own colour for the same reason the tongue does -- they are not
// glowing display. Shared by 'teeth' and 'clench'.
const TEETH_WHITE = 'rgba(245,240,255,0.92)';
// The shadow the upper lip throws across the top of the row, and the line between
// one tooth and the next. Both are the cavity showing through rather than a grey:
// what is behind a tooth is the inside of the mouth, so anything else reads as dirt.
const TEETH_SHADE = 'rgba(52,14,74,0.5)';
const TEETH_GAP = 'rgba(52,14,74,0.34)';
// nerd's two front teeth, which are their own object rather than part of a row and
// are meant to read as flat white. Fully opaque and neutral where TEETH_WHITE is
// 0.92 and faintly lilac: that alpha and tint let a packed row take a little of the
// mouth's colour, which is right behind a lip and wrong for a tooth hanging in front
// of an open cavity, where it came out grey.
const TOOTH_SOLID = '#ffffff';
// The tongue's own two ends. It is a wet, rounded muscle sitting in shadow at the
// back of the mouth, so it runs light at the tip and dark where it disappears --
// the same up-and-forward light the kiss heart and the drool use.
const TONGUE_LIT = '#ff96b4';
const TONGUE_DEEP = '#a3123f';

/**
 * cold: the clenched teeth of the cold-face emoji -- one wide stadium of teeth
 * with a single line dividing the upper row from the lower.
 *
 * Not 'teeth', which is an ellipse of dark cavity with a white band across its
 * top. Here there is no cavity at all: the jaw is shut, so the whole shape is
 * teeth and the only interior feature is the bite line.
 */
function drawClenchMouth(ctx, { cx, y, width, glowColor, dpr }) {
  // Wider and flatter than the stroked mouths. The reference measures half the
  // face's width, but that reads as too broad on a squarer screen than a round
  // emoji face, so this sits back at about 0.39 of the screen.
  const rx = width * 1.15;
  const ry = rx * 0.47;
  const cy = y + ry * 0.2;

  drawGlow(ctx, cx, cy, width * 2, glowColor, dpr, 0.5);

  ctx.save();
  // Corner radius equal to the half-height, which turns the rounded rect into a
  // stadium -- fully rounded ends, as in the reference.
  roundedRectPath(ctx, cx - rx, cy - ry, rx * 2, ry * 2, ry);
  ctx.fillStyle = TEETH_WHITE;
  ctx.fill();
  ctx.lineWidth = width * 0.07;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();

  // The bite line. Held short of the rounded ends so it reads as a division
  // between two rows rather than a slash across the whole mouth.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rx + ry * 0.5, cy);
  ctx.lineTo(cx + rx - ry * 0.5, cy);
  ctx.lineWidth = width * 0.055;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.stroke();
  ctx.restore();
}

/**
 * hot: the small panting mouth of the hot-face emoji, with the tongue hanging out
 * well below it.
 *
 * Distinct from 'grinTongue', which hangs its tongue over a wide beaming grin:
 * here the opening is small and arched at the top, and the tongue is more than
 * twice its depth, which is what reads as panting rather than as a joke.
 *
 * All proportions are fractions of rx, the half-width, measured off the reference.
 */
/**
 * The lolling tongue: round below, creased down its middle, and topped either by an
 * arch of its own or by a curve the caller supplies.
 *
 * Everything is a fraction of `rx`, its own half-width, so it scales as one object
 * from a single number. The ratios are the ones measured off the panting reference,
 * expressed against the tongue instead of against the mouth that held it -- which is
 * what lets a second mouth borrow the same tongue at its own size.
 *
 * `topAt` is that second case: a mouth whose tongue has to sit *on* its lip rather
 * than hang free passes the lip's own outer edge as a function of x, and the top of
 * the tongue is traced along it. Contact is then exact across the whole width by
 * construction, at any mouth width, curve or stroke thickness -- there is no number
 * to tune and nothing to drift. The free-hanging case keeps its arch and its clean
 * half-ellipse body untouched.
 */
function drawLollingTongue(ctx, {
  cx, topY, rx, glowBlur, creaseEnd = 0.42, lengthScale = 1, tilt = 0, topAt = null,
  // How far the top edge bows up between the shoulders, as a fraction of rx, when it
  // makes its own. Zero leaves it a straight line -- the control points collapse onto
  // the end line and the cubic degenerates, so no separate branch is needed.
  archRatio = 0.26,
  // Takes the two top corners off, as a fraction of rx. Zero leaves them square,
  // which is where every tongue here started.
  bluntRatio = 0,
}) {
  // Same cubic and same 1/0.75 apex factor the upper lips use.
  const arch = rx * archRatio;
  const ry = rx * 1.63 * lengthScale;
  const xL = cx - rx;
  const xR = cx + rx;
  const yAt = (x) => (topAt ? topAt(x) : topY);
  const yL = yAt(xL);

  // The body's own axes. `tilt` swings the tongue away from straight down -- positive
  // to the viewer's left -- and `down` is the direction it points, `side` the one
  // across it. Every offset in the lobe below is written in these two rather than in
  // x and y, so the shape is the same shape at any tilt instead of shearing as it
  // leans. Tilting the body alone, not the whole tongue: the top edge is welded to
  // the lip and a rotation would carry it off.
  const down = { x: -Math.sin(tilt), y: Math.cos(tilt) };
  const side = { x: down.y, y: -down.x };
  // Along the body from the middle of the top edge by `d`, and across it by `s`.
  const at = (d, s) => ({
    x: cx + down.x * d + side.x * s,
    y: yAt(cx) + down.y * d + side.y * s,
  });

  // How far back from each top corner the blunting starts. Only the tongue that
  // makes its own top edge can be blunted -- the one welded to a lip has no corner
  // of its own, its shoulders are wherever the lip is.
  const blunt = topAt ? 0 : rx * bluntRatio;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(xL + blunt, yL);

  if (topAt) {
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      const x = xL + ((xR - xL) * i) / steps;
      ctx.lineTo(x, topAt(x));
    }
    // Out from each shoulder, down the length, and round the tip. The shoulder
    // controls are offset from the shoulders themselves so the sides leave the lip
    // where the tongue actually meets it; the tip controls are offset from the tip.
    const outR = at(ry * 0.5, rx * 1.28);
    const outL = at(ry * 0.5, -rx * 1.28);
    const tipR = at(ry, rx * 0.62);
    const tipL = at(ry, -rx * 0.62);
    const tip = at(ry, 0);
    ctx.bezierCurveTo(outR.x, outR.y, tipR.x, tipR.y, tip.x, tip.y);
    ctx.bezierCurveTo(tipL.x, tipL.y, outL.x, outL.y, xL, yL);
  } else {
    // The angle at which the body has dropped `blunt` down its own side. Taking the
    // corner off means the top edge stops `blunt` short of the corner and the side
    // starts `blunt` below it, with a quadratic through the corner itself joining
    // them -- so the corner is where the curve is pulled towards, not a point on it.
    // Both ends are exact points of the ellipse, so nothing has to be closed by an
    // implicit line.
    const t0 = ry > 0 ? Math.asin(Math.min(1, blunt / ry)) : 0;
    ctx.bezierCurveTo(
      cx - rx * 0.45, topY - arch / 0.75,
      cx + rx * 0.45, topY - arch / 0.75,
      xR - blunt, topY,
    );
    if (blunt) ctx.quadraticCurveTo(xR, topY, cx + rx * Math.cos(t0), topY + ry * Math.sin(t0));
    ctx.ellipse(cx, topY, rx, ry, 0, t0, Math.PI - t0);
    if (blunt) ctx.quadraticCurveTo(xL, topY, xL + blunt, topY);
  }

  ctx.closePath();
  ctx.fillStyle = TONGUE_PINK;
  ctx.shadowColor = TONGUE_PINK;
  ctx.shadowBlur = glowBlur;
  ctx.fill();
  ctx.restore();

  // The crease, starting just under the tongue's highest point -- the apex of its
  // own arch, or the lip it is sitting against -- and running down the body's own
  // axis, so it stays the centre line of the tongue however far the tongue leans.
  ctx.save();
  ctx.beginPath();
  if (topAt) {
    const from = at(rx * 0.14, 0);
    const to = at(ry * creaseEnd, 0);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
  } else {
    ctx.moveTo(cx, topY - arch + rx * 0.05);
    // How far down the crease runs, as a fraction of the body.
    ctx.lineTo(cx, topY + ry * creaseEnd);
  }
  ctx.lineWidth = rx * 0.06;
  ctx.lineCap = 'round';
  ctx.strokeStyle = TONGUE_CREASE;
  ctx.stroke();
  ctx.restore();
}

function drawPantMouth(ctx, { cx, y, width, glowColor, dpr }) {
  const rx = width * 1.05;
  // `y` is the corner line -- the mouth's widest point. The top arches above it
  // and the floor drops below.
  const topRise = rx * 0.36;
  const depth = rx * 0.5;

  // Half the height of the blunt end capping each corner. The two lips used to meet
  // at a single point on the corner line, and at the angle they arrive that came out
  // as a spike -- lineJoin 'round' cannot help, since it only rounds a join by half
  // the stroke width, which is nothing against a corner that acute. The same fix
  // drawWearyMouth reached for: the lips stop short, above and below the corner line,
  // and a short outward bulge carries one round to the other.
  const blunt = rx * 0.07;
  const xL = cx - rx;
  const xR = cx + rx;

  // Bulges past the corner by slightly less than its own half-height, so the cap
  // reads as blunt rather than as a bump grown out of the side of the mouth.
  const cap = (x, dir) => ctx.quadraticCurveTo(x + dir * blunt * 0.85, y, x, y + dir * blunt);

  const cavity = () => {
    ctx.beginPath();
    // Arched top, flat-ish in the middle as in the reference, now landing a little
    // above the corner line at each end instead of on it.
    ctx.moveTo(xL, y - blunt);
    ctx.bezierCurveTo(
      cx - rx * 0.45, y - topRise / 0.75,
      cx + rx * 0.45, y - topRise / 0.75,
      xR, y - blunt,
    );
    cap(xR, 1);
    ctx.quadraticCurveTo(cx + rx * 0.9, y + depth, cx, y + depth);
    ctx.quadraticCurveTo(cx - rx * 0.9, y + depth, xL, y + blunt);
    cap(xL, -1);
    ctx.closePath();
  };

  drawGlow(ctx, cx, y + depth * 0.2, width * 1.7, glowColor, dpr, 0.5);

  ctx.save();
  cavity();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.lineWidth = width * 0.07;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();

  // Tongue drawn last, over the rim rather than under it -- it hangs *past* the
  // lower lip, so clipping it inside the cavity would cut off the whole point.
  //
  // It deliberately keeps clear of the upper lip. The lip curve sits at about
  // -0.25 rx out where the tongue's edges are, and the highest the tongue reaches
  // is its arch apex at -0.13 rx, so a band of cavity always shows between them.
  // No clip guards this: a clip would silently swallow the gap if these numbers
  // were ever retuned, and the gap is the point.
  drawLollingTongue(ctx, { cx, topY: y + rx * 0.02, rx: rx * 0.57, glowBlur: width * 0.2 });
}

/**
 * tired: a wide arch over a straight lower lip -- the top edge rises to a flat
 * plateau and drops steeply to the corners, and the mouth closes along the level
 * line joining them.
 *
 * Not reachable from 'anguished': that one dips its top edge and tapers its walls
 * inward, which is the opposite silhouette. Not reachable from 'grin' either --
 * that's the mirror of this, flat across the top and round underneath.
 *
 * All proportions are fractions of rx, the half-width, so the whole mouth scales
 * from that one number.
 */
function drawWearyMouth(ctx, { cx, y, width, glowColor, dpr }) {
  // Wider than the stroked mouths, like 'grin': geometry.js sizes mouthW for a
  // line, and a gape has to be wide to read as open rather than as a smudge.
  const rx = width * 1.4;
  // Both lips sit on this line; the arch rises above it. Held below the mouth
  // baseline so the arch stays centred on it -- otherwise the whole shape rides
  // up towards the eyes.
  const cornerY = y + rx * 0.26;
  const topRise = rx * 0.62;
  // Just enough to take the dead-straight look off the lower lip without
  // reopening the mouth into a crescent.
  const lowerRise = rx * 0.1;
  // Half the height of the blunt end capping each corner. The two lips used to meet
  // at a single point, and at the angle they arrive it came out as a spike -- a round
  // lineJoin cannot help there, since it only rounds the join by half the stroke
  // width, which is nothing against a corner that acute. So the lips now end a little
  // above and below the corner line and a short outward bulge joins them.
  const blunt = rx * 0.08;

  // Cubics rather than quadratics: two control points at the same height give the
  // flat plateau between steeply dropping corners, where a quadratic can only
  // give a dome. Both lips share the shape and differ only in how far they rise.
  //
  // A symmetric cubic reaches 3/4 of its control offset at the midpoint, hence
  // the 1/0.75 factor to put each apex exactly `rise` above its own end line.
  const lip = (rise, toX, endY) => {
    const ctrlY = endY - rise / 0.75;
    const rightward = toX > cx;
    ctx.bezierCurveTo(
      cx + rx * (rightward ? -0.45 : 0.45), ctrlY,
      cx + rx * (rightward ? 0.45 : -0.45), ctrlY,
      toX, endY,
    );
  };

  // Bulges past the corner by slightly less than its own half-height, so the cap
  // reads as blunt rather than as a bump grown out of the side of the mouth.
  const cap = (x, dir) => ctx.quadraticCurveTo(x + dir * blunt * 0.85, cornerY, x, cornerY + dir * blunt);

  const silhouette = () => {
    ctx.beginPath();
    ctx.moveTo(cx - rx, cornerY - blunt);
    lip(topRise, cx + rx, cornerY - blunt);
    cap(cx + rx, 1);
    lip(lowerRise, cx - rx, cornerY + blunt);
    cap(cx - rx, -1);
    ctx.closePath();
  };

  drawGlow(ctx, cx, cornerY - topRise * 0.55, width * 1.9, glowColor, dpr, 0.5);

  ctx.save();
  silhouette();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.lineWidth = width * 0.07;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();
}

/**
 * yummy: a smile with the tongue licking out at one corner.
 *
 * Built as a normal smile curve plus a separate blob, drawn tongue-first so the
 * lip line lands over its root and the two read as connected rather than as a
 * shape parked next to a mouth.
 */
/**
 * yummy: a smile with the tongue licking out at the left corner.
 *
 * Distinct from 'grinTongue', which hangs its tongue over a filled grin. Here
 * the mouth is a stroked curve with no interior, so the tongue is clipped to
 * below the lip line instead.
 */
// No dpr: that was only ever for the drawGlow bloom, which this no longer has.
const LICK_MS = 2600;
// The four moments of one lick, as fractions of the cycle: parked at the left
// corner, drawn back in behind the lip, back out at the right corner, then the
// sweep across. The rest of the cycle is the sweep.
const LICK_PARK_END = 0.38;
const LICK_PULL_END = 0.5;
const LICK_OUT_END = 0.6;

/**
 * Where the tongue is in its lick, at time `tMs`.
 *
 * `across` runs 0 at the right corner to 1 at the left, and `reach` is how far the
 * body is out from behind the lip -- 0 while it is hidden. Splitting the two is what
 * lets the tongue get from the left corner back to the right one without sliding
 * backwards across the lip: it pulls in, moves while it cannot be seen, and comes
 * back out. A lick has a direction, and a tongue that slid back would undo it.
 *
 * The long park is at the *left* corner, the pose this expression rests in, so the
 * loop always returns to the face rather than to a moment mid-sweep.
 */
function lickPhase(tMs) {
  const p = ((((tMs % LICK_MS) + LICK_MS) % LICK_MS)) / LICK_MS;

  if (p < LICK_PARK_END) return { across: 1, reach: 1 };
  if (p < LICK_PULL_END) {
    return { across: 1, reach: 1 - (p - LICK_PARK_END) / (LICK_PULL_END - LICK_PARK_END) };
  }
  if (p < LICK_OUT_END) {
    return { across: 0, reach: (p - LICK_PULL_END) / (LICK_OUT_END - LICK_PULL_END) };
  }

  const t = (p - LICK_OUT_END) / (1 - LICK_OUT_END);
  // Smoothstep, so the sweep starts and finishes gently instead of setting off and
  // stopping at full speed, which is the thing that makes a linear pan read as
  // mechanical.
  return { across: t * t * (3 - 2 * t), reach: 1 };
}

function drawTongueMouth(ctx, { cx, y, width, glowColor, tMs = 0 }) {
  // Wider and deeper than the standard 'curve' mouth (halfW width/2, amplitude
  // ~0.29-0.43 x width), so the smile carries the tongue instead of being
  // dwarfed by it.
  const halfW = width * 0.72;
  // Same convention as 'curve': positive bows the midpoint downward, which
  // reads as a smile because the corners are left sitting higher.
  const amplitude = width * 0.62;

  const lipCurve = () => {
    ctx.moveTo(cx - halfW, y);
    ctx.quadraticCurveTo(cx, y + amplitude, cx + halfW, y);
  };

  // No drawGlow bloom. This mouth is a stroked line with no interior, so a disc
  // 1.8 widths across has nothing to sit behind and reads as a lit haze hanging
  // under the smile -- the same conclusion drawSlantMouth, drawQueasyMouth and
  // drawFlatEye each reached on their own. The stroke's own shadowBlur below still
  // gives the lip its neon halo.

  // Clip to everything *below* the lip line before drawing the tongue. Doing it
  // geometrically rather than by positioning the blob low enough means the
  // tongue can never poke above the mouth no matter how the sizes are tuned --
  // and the stroke below, drawn after, covers the cut edge so the tongue reads
  // as emerging from under the lip.
  //
  // Carried out past both corners along the corner line before it turns down. The
  // corners are the highest the lip reaches, so a horizontal ray from each one is
  // still "below the mouth" -- and without them the clip is a box a mouth wide, whose
  // side walls sliced the leaning tongue off in a dead straight vertical cut.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - width * 2, y);
  ctx.lineTo(cx - halfW, y);
  ctx.quadraticCurveTo(cx, y + amplitude, cx + halfW, y);
  ctx.lineTo(cx + width * 2, y);
  ctx.lineTo(cx + width * 2, y + width * 3);
  ctx.lineTo(cx - width * 2, y + width * 3);
  ctx.closePath();
  ctx.clip();

  // hot's tongue rather than the tilted blob this used to be -- the same arched top,
  // the same round body and the same crease, at this mouth's own size. It stays at
  // the left corner, which is what this expression is: a lick, not a pant.
  //
  // Its top edge is the lip's own outer edge, traced rather than approximated: the
  // lip is a quadratic from (cx - halfW, y) to (cx + halfW, y), so at parameter u it
  // has fallen 2u(1-u) of its amplitude, and its outer edge is half a stroke below
  // that. Handing that curve to the tongue makes the whole upper line touch, and
  // makes it bow downward, at any mouth width or curve -- both by construction, with
  // no number to tune. The clip above now has nothing to cut, and stays only as a
  // guard against a future change putting the tongue back over the lip.
  const lipOuterAt = (x) => {
    const u = (x - (cx - halfW)) / (2 * halfW);
    return y + 2 * u * (1 - u) * amplitude + (width * 0.075) / 2;
  };
  const { across, reach } = lickPhase(tMs);
  // Two hours round the dial either side of straight down -- four o'clock at the
  // right corner, eight at the left -- and every angle between as it crosses, so the
  // tongue swings round rather than sliding sideways keeping one attitude. Two hours
  // is a sixth of the dial, so a third of pi.
  //
  // Nothing has to be done to make it dip in the middle: its top edge is the lip's
  // own curve, so it follows the lip down and back up as it goes.
  drawLollingTongue(ctx, {
    cx: cx + halfW * 0.46 * (1 - across * 2),
    rx: width * 0.3,
    glowBlur: width * 0.22,
    lengthScale: 1.35 * reach,
    tilt: (across * 2 - 1) * (Math.PI / 3),
    topAt: lipOuterAt,
  });
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  lipCurve();
  ctx.lineWidth = width * 0.075;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

/**
 * disgust: the queasy mouth of the nauseated-face emoji -- a wide, barely-curved line
 * with a small curl hooked back inward at each corner.
 *
 * Not reachable from `curve`: that is a single quadratic, so its middle is always a
 * dome and it has nothing to say about its corners. Here the middle is a long shallow
 * plateau -- the cubic-with-two-level-control-points construction 'weary''s upper lip
 * uses, inverted -- and the two corner curls are the character of it. Stroked, not
 * filled, and with no lower lip: in the reference this mouth is a line, with skin
 * showing either side.
 *
 * Each corner carries a small arc bulging *inward*, its two arms flaring outward, and
 * it is attached to the lip by its own centre rather than by an end -- so one arm sits
 * above the lip's end and the other below it, with the lip meeting the arc halfway
 * along. That is what resolves the three-way junction the reference appears to have at
 * each end of the mouth.
 *
 * The arc's bulge is set equal to how far its arms reach the other way, which is not a
 * coincidence: for a quadratic the midpoint is (P0 + 2*P1 + P2) / 4, so making those
 * two distances equal is exactly the condition for the midpoint to land on the corner.
 * Retune either alone and the arc slides off the lip end.
 *
 * All proportions are fractions of rx, the half-width.
 */
// No dpr parameter, for the same reason drawSlantMouth has none: it existed only for
// the drawGlow bloom, which this mouth does not draw.
function drawQueasyMouth(ctx, { cx, y, width, curve, glowColor }) {
  // Wide, as the reference is -- about half the face across. geometry.js sizes
  // mouthW for a short stroked line, hence the multiplier, as 'weary' does.
  const rx = width * 1.3;
  // How far the corners hang below the baseline. 0.18 is the reference's measurement
  // and stays what a curve of 0 gives; mouthCurve moves it from there, negative
  // hanging them further, which is the same sense the field has on every other mouth.
  // Wired to the descriptor rather than retuned in place so the droop is a property
  // of the expression, as it is everywhere else.
  const drop = rx * (0.18 - curve * 0.12);
  // Both control points sit here. A symmetric cubic reaches 3/4 of its control offset
  // at the midpoint, so this leaves the middle a hair above the baseline while
  // holding it flat across the centre. Together with `drop` it puts the whole arch at
  // about 0.10 of the mouth's width, which is what the reference measures -- the lip
  // is very nearly straight, and the curls do the work.
  const ctrlY = y - rx * 0.1;
  // The corner arcs: how far each arm reaches above and below the lip's end, and how
  // far the two arms flare outward of it -- which doubles as the inward bulge, per the
  // midpoint condition in the comment above.
  const armReach = rx * 0.16;
  const armOut = rx * 0.09;

  // How far each arc leans, applied mirrored so both tops lean away from the face
  // centre -- the same convention eyebrowAngle uses.
  const tilt = 0.3;

  // No drawGlow bloom, unlike most mouths here -- for the same reason drawSlantMouth
  // has none. A bloom needs a centre, and every fixed centre on a mouth that bows
  // upward lands in the empty space under the lip, where it reads as a glowing dot
  // rather than as the mouth's halo. The stroke's own shadowBlur below carries it.
  //
  // side: -1 for the left corner, +1 for the right, so one expression serves both and
  // the pair cannot drift apart.
  //
  // The arc is built around a translated, rotated origin rather than by rotating five
  // coordinates by hand. That also keeps the attachment safe for free: the rotation is
  // about the corner point itself, and rotating a shape about a point cannot move that
  // point, so the arc's midpoint stays welded to the lip's end at any tilt.
  const cornerArc = (side) => {
    ctx.save();
    ctx.translate(cx + side * rx, y + drop);
    ctx.rotate(side * tilt);
    ctx.moveTo(side * armOut, -armReach);
    ctx.quadraticCurveTo(side * -armOut, 0, side * armOut, armReach);
    ctx.restore();
  };

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - rx, y + drop);
  ctx.bezierCurveTo(cx - rx * 0.45, ctrlY, cx + rx * 0.45, ctrlY, cx + rx, y + drop);
  cornerArc(-1);
  cornerArc(1);
  ctx.lineWidth = width * 0.075;
  ctx.lineCap = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

/**
 * zipper: the mouth sealed shut by a zip, as in the zipper-mouth emoji -- two fabric
 * tapes carrying a row of interlocked teeth, an end stop at the left, and the slider
 * with its pull hanging off the right.
 *
 * The only mouth that takes no glowColor. It is a physical object lying over the
 * screen rather than part of the display, so it is lit like cool's frame and gets no
 * glowing stroke and no bloom (see render/metal.js).
 *
 * What makes it read as metal rather than as a cut-out is that every piece is shaded
 * *individually*. This used to run one gradient across the whole assembly, which is
 * consistent lighting but the wrong kind: a single gradient over many objects says
 * they are one flat surface. Each tooth now gets its own top-to-bottom gradient and
 * its own specular, so its crown catches light and its base falls into shade, and the
 * row reads as a line of separate solids. The tapes are matte and darker so the teeth
 * sit proud of them, and a contact shadow under the whole thing lands it on the face.
 *
 * Every number is in units of `width` with the seam's centre as the origin, run
 * through u() which applies the one scale factor -- so the zip can be resized without
 * unpicking the parts.
 */
// Taken literally the reference's zip spans 0.83 of the face, but that face is a
// circle crossed at its widest point, while this mouth sits at 0.7 of a rounded
// rectangle's height where the corners are already closing in. At 1.0 the pull ends
// up 4px from the screen edge. 0.75 is as large as it goes and still clear.
const ZIP_SCALE = 0.75;

// Fabric, not metal: flatter and darker than the teeth so they stand off it. Woven
// tape has no specular to speak of, which is most of what separates the two
// materials here -- a tape lit like the teeth turns the whole zip into one ingot.
const ZIP_TAPE_LIT = '#6a6776';
const ZIP_TAPE_DEEP = '#35333d';
// The hard line of light along a tooth's crown. Brighter than METAL_LIGHT, and thin:
// a specular is the light source's reflection, so it stays a sliver however big the
// object gets.
const ZIP_SPEC = 'rgba(255,255,255,0.7)';
// What the zip casts on the face beneath it.
const ZIP_CONTACT = 'rgba(0,0,0,0.45)';

function drawZipperMouth(ctx, { cx, y, width }) {
  const u = (n) => width * n * ZIP_SCALE;

  const trackLeft = cx - u(2.0);
  // Where the teeth stop and the slider begins. Off-centre to the right, as in the
  // reference: the zip has been pulled most of the way shut.
  const trackRight = cx + u(0.82);

  // Tape runs from its outer edge in to where the teeth emerge from under it. Kept
  // to a thin strip: on a real zip the teeth are the dominant feature and the tape is
  // a border. At the 0.15 inner edge this had, the tape was three times the teeth's
  // height and the pair of them read as one grey bar with a slot cut in it.
  const tapeOuter = u(0.52);
  const tapeInner = u(0.30);
  // toothW against pitch is what decides whether this reads as a zip at all. The loop
  // alternates rows each step, so within one row the teeth stand two pitches apart --
  // a tooth narrower than the pitch leaves a hole in its own row that the opposite
  // row cannot fill, and the result is scattered pegs. At 0.34 against 0.40 the
  // consecutive teeth of the two rows very nearly touch, which is what meshing is.
  const toothW = u(0.34);
  const pitch = u(0.40);
  // How far past the seam a tooth reaches -- almost all the way to the opposite tape,
  // stopping u(0.05) short of it.
  //
  // This is the number that decides whether the row reads as closed. A tooth only
  // spanning its own half plus a token overlap leaves, at its own x, a band of bare
  // face on the far side; the rows alternate, so that band alternates too and the
  // whole thing comes out as blocks with ragged black gaps between them. On a real
  // closed zip the two rows fill the channel completely and what you see between
  // neighbours is a seam, not a hole.
  const reach = tapeInner - u(0.05);
  const bodyH = u(0.46);

  // A vertical gradient over an arbitrary span, which is how every metal piece here
  // is shaded: lit along its own top edge, falling to shade at its own bottom. Doing
  // it per piece rather than once for the whole zip is the point -- see above.
  const metal = (top, bottom) => {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#d6d3de');
    g.addColorStop(0.42, METAL_LIGHT);
    g.addColorStop(1, METAL_SHADE);
    return g;
  };

  const tape = (top, bottom) => {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, ZIP_TAPE_LIT);
    g.addColorStop(1, ZIP_TAPE_DEEP);
    return g;
  };

  ctx.save();

  // Contact shadow first, under everything: one soft slab the length of the zip.
  ctx.save();
  ctx.fillStyle = ZIP_CONTACT;
  ctx.shadowColor = ZIP_CONTACT;
  ctx.shadowBlur = u(0.3);
  ctx.fillRect(trackLeft, y - tapeOuter * 0.55, trackRight - trackLeft + u(1.1), tapeOuter * 1.3);
  ctx.restore();

  // The two tapes. Drawn before the teeth so the teeth land on top and appear to be
  // set into them, and dark side inward on both so the seam reads as a valley.
  const tapeRight = trackRight + u(1.2);
  [-1, 1].forEach((side) => {
    const outer = y + side * tapeOuter;
    const inner = y + side * tapeInner;
    ctx.fillStyle = side < 0 ? tape(outer, inner) : tape(inner, outer);
    ctx.fillRect(trackLeft, Math.min(outer, inner), tapeRight - trackLeft, tapeOuter - tapeInner);

    // The stitched bead along the tape's inner edge, where a real tape is folded
    // over and sewn against the teeth.
    // Faint. At 0.16 it read as a chrome rail down each side, which turned the tapes
    // back into metal -- the one thing they are not.
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(trackLeft, inner - side * u(0.03), tapeRight - trackLeft, u(0.03));
  });

  // One tooth: a shank emerging from under the tape and a rounded head crossing the
  // seam. `side` is -1 for the upper row, +1 for the lower.
  const tooth = (tx, side) => {
    const half = toothW / 2;
    const base = y + side * (tapeInner + u(0.02));
    const head = y - side * reach;
    const r = half * 0.62;

    ctx.beginPath();
    ctx.moveTo(tx - half, base);
    ctx.lineTo(tx + half, base);
    ctx.lineTo(tx + half, head + side * r);
    ctx.quadraticCurveTo(tx + half, head, tx + half - r, head);
    ctx.lineTo(tx - half + r, head);
    ctx.quadraticCurveTo(tx - half, head, tx - half, head + side * r);
    ctx.closePath();

    const top = Math.min(base, head);
    const bottom = Math.max(base, head);
    ctx.fillStyle = metal(top, bottom);
    ctx.fill();

    // Specular along the crown, inside the tooth so it cannot spill onto its
    // neighbours. A quarter of the tooth's height, at its lit edge.
    ctx.save();
    ctx.clip();
    ctx.fillStyle = ZIP_SPEC;
    ctx.fillRect(tx - half * 0.72, top, toothW * 0.72, (bottom - top) * 0.16);
    ctx.restore();
  };

  // End stop: taller than a tooth and solid across both rows, which is what stops the
  // eye reading the leftmost tooth as a tooth that lost its pair.
  ctx.beginPath();
  roundedRectPath(ctx, trackLeft + u(0.04), y - bodyH, u(0.4), bodyH * 2, u(0.1));
  ctx.fillStyle = metal(y - bodyH, y + bodyH);
  ctx.fill();

  // Teeth, alternating rows. The loop runs until one would overrun the slider.
  const first = trackLeft + u(0.66);
  for (let tx = first; tx + toothW / 2 <= trackRight; tx += pitch) {
    tooth(tx, Math.round((tx - first) / pitch) % 2 === 0 ? -1 : 1);
  }

  // Slider: narrow at the closed end and widening towards the open one, which is the
  // way round a real slider sits -- its throat is where the two tapes part.
  const sx0 = trackRight;
  const sx1 = trackRight + u(1.3);
  // Longer than it is tall, and barely tapered. Both matter: at u(0.82) long against
  // a 0.58 half-height the body came out taller than it was wide, which no slider is,
  // and a 0.44-to-0.6 flare on top of that made it a megaphone. A real one is a long
  // shallow box that narrows just slightly towards the closed end.
  const nose = u(0.44);
  const tail = u(0.5);
  ctx.beginPath();
  ctx.moveTo(sx0, y - nose);
  ctx.lineTo(sx1 - u(0.12), y - tail);
  ctx.quadraticCurveTo(sx1, y - tail, sx1, y - tail + u(0.12));
  ctx.lineTo(sx1, y + tail - u(0.12));
  ctx.quadraticCurveTo(sx1, y + tail, sx1 - u(0.12), y + tail);
  ctx.lineTo(sx0, y + nose);
  ctx.quadraticCurveTo(sx0 - u(0.14), y, sx0, y - nose);
  ctx.closePath();
  ctx.fillStyle = metal(y - tail, y + tail);
  ctx.fill();

  // The crown: the raised upper face of the slider body, which is what stops it
  // reading as a flat lozenge. Clipped to the body so it cannot overhang.
  ctx.save();
  ctx.clip();
  // A narrow band, not a broad one: widened out it stops being the edge catching
  // light and becomes a lens flare across the middle of the body.
  ctx.fillStyle = 'rgba(255,255,255,0.42)';
  ctx.fillRect(sx0, y - tail, sx1 - sx0, tail * 0.16);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(sx0, y + tail * 0.52, sx1 - sx0, tail * 0.48);
  ctx.restore();

  // Bail: the little bar the pull swings on. Without it the tab floats.
  const bailX = sx1 - u(0.3);
  ctx.beginPath();
  roundedRectPath(ctx, bailX - u(0.09), y + tail * 0.55, u(0.18), u(0.34), u(0.08));
  ctx.fillStyle = metal(y + tail * 0.55, y + tail * 0.55 + u(0.34));
  ctx.fill();

  // Pull: a flat tab with a hole through it, hanging from the bail. A ring on a stick
  // was what this used to be, and a ring is a keyring -- a zip pull is a plate.
  const tabTop = y + tail * 0.55 + u(0.26);
  const tabW = u(0.62);
  const tabH = u(1.15);
  ctx.beginPath();
  roundedRectPath(ctx, bailX - tabW / 2, tabTop, tabW, tabH, tabW * 0.34);
  ctx.fillStyle = metal(tabTop, tabTop + tabH);
  ctx.fill();

  // The hole, punched dark so it reads as through the plate rather than printed on.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(bailX, tabTop + tabH * 0.24, tabW * 0.19, tabH * 0.11, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20,16,28,0.9)';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Every mouth that is just an ellipse of cavity, as radii in fractions of `width`.
 * A table rather than the chain of ternaries this used to be: at four shapes that
 * chain was already hard to read, and the shapes differ in nothing but their radii.
 *
 * 'small' is the surprised/curious dot; 'kiss' is a narrow pucker; 'open' and
 * 'teeth' are the wide laugh, with 'teeth' adding an upper row; 'gape' is shock's
 * tall astonished oval, the only one taller than it is wide; 'maw' is vomit's, by
 * far the widest -- the reference's mouth is 0.38 of the face across and only half
 * as tall as it is wide, because the vomit flow hides everything below its waist
 * and what is left reads as a thick arch.
 *
 * Membership of this table is also what routes a shape here, so adding a row is
 * all it takes to add an elliptical mouth.
 *
 * Exported because effects/vomit.js has to start its flow inside the 'maw' cavity,
 * and deriving that from the same numbers the mouth is drawn from is the only way
 * the two cannot drift apart.
 */
export const OPEN_MOUTH_SIZES = {
  small: { rx: 0.2, ry: 0.22 },
  kiss: { rx: 0.16, ry: 0.24 },
  open: { rx: 0.4, ry: 0.34 },
  teeth: { rx: 0.4, ry: 0.34 },
  gape: { rx: 0.46, ry: 0.6 },
  // exhaust: the pursed mouth of the exhaling emoji. Distinctly wider than tall
  // (1.4:1, measured), where 'open' is near enough circular -- which is the whole
  // difference between a mouth blowing and a mouth saying "oh".
  blow: { rx: 0.54, ry: 0.38 },
  maw: { rx: 1.12, ry: 0.5 },
};

/**
 * sneeze: a sharp zigzag, screwed up against the sneeze.
 *
 * Not 'wavy' with a bigger number. 'wavy' is four quadratics, so its crests are round
 * and it reads as a wobble -- confusion, which is what it was built for. This one is
 * straight segments with mitred corners at twice the amplitude, which is what the
 * reference's scrunched mouth actually is. Measured off it: peak to trough is 0.55 of
 * the mouth's own width, against 'wavy's 0.28.
 */
function drawZigzagMouth(ctx, { cx, y, width, glowColor, dpr }) {
  // Half again as wide as geometry.js's mouthW. That width is tuned for a stroked
  // line whose whole shape is its curvature; a five-point M at mouth width is so
  // steep it reads as a letter rather than as a mouth, and widening it is what turns
  // it back into an expression.
  const span = width * 1.5;
  const halfW = span / 2;
  const amp = span * 0.17;
  const crests = [
    { t: 0, c: 1 },
    { t: 0.25, c: -1 },
    { t: 0.5, c: 0.35 },
    { t: 0.75, c: -1 },
    { t: 1, c: 1 },
  ];

  drawGlow(ctx, cx, y, span * 1.3, glowColor, dpr, 0.45);

  ctx.save();
  ctx.beginPath();
  crests.forEach((crest, i) => {
    const px = cx - halfW + span * crest.t;
    const py = y + amp * crest.c;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.lineWidth = width * 0.085;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.12;
  ctx.stroke();
  ctx.restore();
}

/**
 * surprised: the screaming mouth -- a gently domed top edge, straight sides falling
 * inward, and a blunt rounded base.
 *
 * Not 'teeth' with a bigger number, which is where this started. That shape is an
 * ellipse, so its widest point is halfway down and its sides bulge outward all the
 * way; the reference is widest near the top and tapers, which is what makes it read
 * as a jaw dropped open rather than as a hole. Measured off it: 128 wide by 106 tall,
 * widest about a fifth of the way down, upper teeth taking the top third.
 *
 * `y` is the corner line, as in every other mouth here: the dome rises above it and
 * everything else hangs below.
 *
 * The base is blunt because a true V closes to a point, and a stroked point at this
 * width reads as a spike -- the same reason drawWearyMouth caps its corners.
 */
function drawScreamMouth(ctx, { cx, y, width, glowColor, dpr }) {
  const rx = width * 0.4;
  const topRise = rx * 0.18;
  // A U rather than a V with the point knocked off: the base is half the mouth's own
  // half-width, so the sides taper into a broad round bottom instead of converging.
  const baseHalf = rx * 0.5;
  // How far the base bows below the corner line where the sides end. Doubled into the
  // control point, since a symmetric quadratic reaches half of its offset.
  const bulge = baseHalf * 0.9;
  // Shortened from 1.3 to make room for that bulge. The two together come to about
  // 1.22 of the mouth's height against its width, which is the reference's own
  // proportion -- the earlier deep-V version had to be squatter than the reference to
  // fit, and no longer does.
  const depth = rx;
  const top = y - topRise;
  const floor = y + depth;

  // How much of the dome and of each side is given up to rounding the two upper
  // corners. They were a hard join between the dome's end tangent and a straight side
  // meeting it at a steep angle, and lineJoin only rounds by half the stroke width --
  // nothing at this scale, the same limit drawWearyMouth ran into.
  const CORNER_T = 0.24;
  const CORNER_SIDE = 0.18;

  // The dome is the symmetric quadratic (cx-rx, y) -> (cx, y - 2*topRise) -> (cx+rx, y),
  // whose control offset is doubled because a symmetric quadratic reaches half of it.
  // Both of these fall out of that in closed form, so no sampling is needed:
  const domeAt = (t) => ({ x: cx + rx * (2 * t - 1), y: y - 4 * topRise * (1 - t) * t });
  // ...and de Casteljau's sub-curve control for the span [t, 1-t] lands on the axis,
  // its offset scaled by (1-t)^2 + t^2.
  const domeCtrlY = y - 2 * topRise * ((1 - CORNER_T) ** 2 + CORNER_T ** 2);

  const domeStart = domeAt(CORNER_T);
  const domeEnd = domeAt(1 - CORNER_T);
  // A little way down each side from the sharp corner, which then serves as the
  // rounding arc's control point.
  const sideX = (dir) => cx + dir * (rx + (baseHalf - rx) * CORNER_SIDE);
  const sideY = y + (floor - y) * CORNER_SIDE;

  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(domeStart.x, domeStart.y);
    ctx.quadraticCurveTo(cx, domeCtrlY, domeEnd.x, domeEnd.y);
    ctx.quadraticCurveTo(cx + rx, y, sideX(1), sideY);
    ctx.lineTo(cx + baseHalf, floor);
    ctx.quadraticCurveTo(cx, floor + bulge * 2, cx - baseHalf, floor);
    ctx.lineTo(sideX(-1), sideY);
    ctx.quadraticCurveTo(cx - rx, y, domeStart.x, domeStart.y);
    ctx.closePath();
  };

  drawGlow(ctx, cx, y + depth * 0.35, width * 1.5, glowColor, dpr, 0.45);

  ctx.save();
  outline();
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.restore();

  // Upper teeth: the top third of the opening's full height, clipped to the outline
  // so the band picks up the dome above it and the taper at its ends.
  //
  // Drawn before the rim, not after. The outline is the stroke's centreline and the
  // stroke straddles it, so teeth clipped to that path run half a stroke-width out
  // under the rim -- painting them first lets the rim cover exactly that half, and the
  // white then stops on the rim's inner edge instead of climbing over it.
  ctx.save();
  outline();
  ctx.clip();
  ctx.beginPath();
  ctx.rect(cx - rx, top, rx * 2, (floor + bulge - top) * 0.33);
  ctx.fillStyle = TEETH_WHITE;
  ctx.fill();
  ctx.restore();

  ctx.save();
  outline();
  ctx.lineWidth = width * OPEN_MOUTH_RIM_RATIO;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();
}

/** Where drawOpenMouth centres its ellipse, shared with effects/vomit.js. */
export function openMouthCentreY(y, width, shape) {
  return y + width * OPEN_MOUTH_SIZES[shape].ry * 0.35;
}

/**
 * Width of the rim stroke, as a fraction of the mouth width. Exported because the
 * vomit flow has to cover the rim's lower half exactly -- the stroke straddles the
 * ellipse path, so half of this sits outside the radii above.
 */
export const OPEN_MOUTH_RIM_RATIO = 0.07;

function drawOpenMouth(ctx, { cx, y, width, glowColor, shape, dpr }) {
  const { rx: rxRatio, ry: ryRatio } = OPEN_MOUTH_SIZES[shape];
  const rx = width * rxRatio;
  const ry = width * ryRatio;
  const cy = openMouthCentreY(y, width, shape);

  drawGlow(ctx, cx, cy, width * 1.3, glowColor, dpr, 0.45);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = CAVITY;
  ctx.fill();
  ctx.lineWidth = width * OPEN_MOUTH_RIM_RATIO;
  ctx.strokeStyle = glowColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = width * 0.14;
  ctx.stroke();
  ctx.restore();

  if (shape === 'teeth') {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.rect(cx - rx, cy - ry, rx * 2, ry * 0.55);
    ctx.fillStyle = TEETH_WHITE;
    ctx.fill();
    ctx.restore();
  }
}
