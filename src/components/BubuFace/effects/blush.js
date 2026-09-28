/**
 * One cheek: a soft oval flush whose falloff actually reaches zero at the edge.
 *
 * The obvious way to draw this -- a *circular* gradient of radius radiusX under an
 * ellipse fill whose radiusY is only 0.6 of that -- leaves the gradient at ~40%
 * alpha along the short axis when the fill ends, a hard cut measurable as a step
 * from 47 to 9 in the red channel. That is what every cheek here used to do.
 * Drawing inside a scaled space instead makes the ellipse a circle, so one circular
 * gradient matches the fill in every direction.
 *
 * The extra stop concentrates the colour into the core, which is what gives the
 * deep centre fading out to a light wash rather than one flat linear ramp.
 */
function drawFeatheredCheek(ctx, cx, cy, radiusX, radiusY, rgb, strength) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(cx, cy);
  ctx.scale(1, radiusY / radiusX);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
  gradient.addColorStop(0, `rgba(${rgb},${strength})`);
  gradient.addColorStop(0.45, `rgba(${rgb},${strength * 0.5})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);

  ctx.beginPath();
  ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

/**
 * `outward` slides both cheeks away from the face centre, in fractions of eye
 * width. It exists because effects draw *after* the mouth: a wide mouth sits on
 * top of the cheek cores, and where that mouth is filled near-white the additive
 * blend has no headroom left, so the flush vanishes into it and only a dim fringe
 * survives. Moving the cores clear of the mouth is the fix.
 *
 * `rise` lifts both cheeks towards the eyes, in fractions of eye height. Same
 * problem, solved along the other axis: the deeper the smile, the higher its
 * corners come, and a cheek left at the default height ends up sitting on the
 * mouth rather than above it.
 */
function cheeks(ctx, geometry, rgb, strength, scale, draw = drawFeatheredCheek, outward = 0, rise = 0) {
  const { leftEyeX, rightEyeX, eyeY, eyeW, eyeH } = geometry;
  const cheekY = eyeY + eyeH * (1.5 - rise);
  const radius = eyeW * 0.55 * scale;

  draw(ctx, leftEyeX + eyeW * (0.5 - outward), cheekY, radius, radius * 0.6, rgb, strength);
  draw(ctx, rightEyeX + eyeW * (0.5 + outward), cheekY, radius, radius * 0.6, rgb, strength);
}

/**
 * Static blush under each eye, for happy, genuinely_happy and heart.
 *
 * The same cheek 'ill' wears in radius and falloff, but no longer in colour: this one
 * is SOFT_PINK where the fever flush stays red. A flush from happiness and a flush
 * from a temperature are not the same colour, and only the fever one has a reason to
 * be red.
 *
 * Pink, but emphatically not CSS lightpink (255,182,193), which is what this was on
 * the old hard-edged path: on this dark violet screen it landed as a flat grey smudge
 * rather than a flush, because that pink's green and blue are both high, additive
 * blending on a near-black screen keeps them, and at the 0.22 strength it used there
 * was not enough of anything for a hue to read at all. SOFT_PINK holds green well
 * down for exactly that reason.
 *
 * Reads `blushRise` off the descriptor, the way drawSweatDrops reads `sweatScale`:
 * the expressions sharing this effect wear mouths of very different depths, and
 * genuinely_happy's is the deepest in the set, so a height that clears the mouth on
 * one of them does not on another.
 */
export function drawBlush(ctx, geometry, tMs, config) {
  drawFlush(ctx, geometry, config?.blushRise ?? 0, SOFT_PINK, 0.7);
}

/**
 * kissing, wink and shy: the deep end of the same pink.
 *
 * Same radius, same falloff, same shadow clearing as drawBlush; it differs in landing
 * lightness, 107 against 144. It used to differ in hue instead, back when drawBlush
 * was the fever red -- see SOFT_PINK for why that axis is no longer available.
 *
 * It was the last cheek on the old hard-edged path, drawn in CSS lightpink, and it
 * showed: two flat blobs with a visible cut across the bottom edge where the gradient
 * was still at 40% alpha when the fill stopped.
 */
export function drawDeepBlush(ctx, geometry, tMs, config) {
  drawFlush(ctx, geometry, config?.blushRise ?? 0, DEEP_PINK);
}

// Blue pulled down relative to the pink family: the screen under the cheeks is a
// dark violet (~15,6,23), and 'lighter' adds to it, so an equal-blue red comes out
// leaning pink.
const LIGHT_RED = '255,96,72';

/**
 * The fever flush's pink: LIGHT_RED with only its blue channel moved.
 *
 * Green stays exactly where LIGHT_RED has it. It is the *low* green that keeps a
 * flush from going grey on this screen, which is what sank the old lightpink cheek
 * -- see drawBlush. So the hue is moved with blue alone.
 *
 * Where to put it is fixed rather than tuned: 'lighter' onto the (15,6,23) screen
 * makes the landing colour base + rgb x strength, so at 0.55 this pair of cheeks
 * lands at red 155, green 59. Hue 330 -- LOVE_GLOW's own hue, and shy wears
 * LOVE_GLOW everywhere else -- then wants blue at 107, which needs 153 here. The
 * result is the glow's exact hue at about a third of its lightness, which is the
 * separation the hot, cold and sick cheeks all keep from their own glow colours so
 * the features still read against the flush.
 */
const DEEP_PINK = '255,96,153';

/**
 * The everyday blush's pink, for happy, genuinely_happy and heart.
 *
 * Separated from DEEP_PINK by lightness rather than by hue, which is the only axis
 * left: both are pink, and two cheeks five degrees apart in hue are the same cheek.
 * Landing them apart in lightness is also what the two effect names have claimed all
 * along -- 'blush' against 'deepBlush' -- while it was actually hue doing the work,
 * because this one used to be red.
 *
 * Derived the way the rest of this file derives colours. 'lighter' onto the (15,6,23)
 * screen lands at base + rgb x strength, so this pair at 0.7 lands on (194,95,138):
 * hue 334, and a midpoint lightness of 144 against shy's 107. Same saturation to
 * within a percent, so the two read as one flush at two depths rather than as two
 * different colours.
 *
 * The strength has to rise with it. Red is capped at 255, so at the old 0.55 the
 * lightest this could land was 155 -- the same lightness as shy -- and a light pink
 * simply is not reachable there.
 */
const SOFT_PINK = '255,127,164';

/**
 * hot: a light red flush across the inner face.
 *
 * Wider and far stronger than the pink blush -- the strength is not comparable
 * between the two. 'lighter' composites onto a near-black screen, so what lands on
 * the canvas is roughly the base plus colour x strength: at the pink variants' 0.22
 * this red peaked at a muddy maroon (102,39,52). 0.78 is what puts it at about
 * (215,81,78), an actual light red.
 *
 * This carries the whole "red face" for 'hot' -- the screen itself is baked into
 * the offscreen cache and can't be tinted per expression.
 *
 * Uses drawFeatheredCheek, as every cheek here now does -- 'shy' was the last one
 * still on the hard-edged falloff and has since moved across too.
 */
export function drawHotBlush(ctx, geometry) {
  cheeks(ctx, geometry, LIGHT_RED, 0.78, 1.35, drawFeatheredCheek);
}

// Red pulled well down and green up, for the same reason LIGHT_RED's blue is low:
// 'lighter' adds onto a dark violet screen, so the channels have to be chosen for
// where they land, not for how the colour looks on its own.
const LIGHT_BLUE = '100,192,236';

/**
 * cold: a light blue chill across the cheeks.
 *
 * Kept a shade deeper than COLD_GLOW so the blue features still read against it --
 * the same separation drawHotBlush keeps from HOT_GLOW. See that function for why
 * the strength here is nowhere near the pink variants'.
 *
 * The only variant needing `outward`: 'cold' wears the wide 'clench' mouth, which
 * would otherwise sit over a centred cheek. 'hot' does not, because its 'pant'
 * mouth is narrow enough that the cheeks already clear it.
 */
export function drawColdBlush(ctx, geometry) {
  cheeks(ctx, geometry, LIGHT_BLUE, 0.82, 1.35, drawFeatheredCheek, 0.18);
}

/**
 * ill and sneeze: the fever flush of the face-with-thermometer emoji.
 *
 * drawBlush and drawDeepBlush share this function's geometry and its shadow clearing,
 * passing their own colour and strength. Only the fever variant keeps the red.
 *
 * The same red as 'hot' rather than the reference's orange (242,125,11): that orange
 * is the emoji's yellow skin *plus* the flush, and there is no yellow skin here to
 * add it to.
 *
 * Lighter than hot's -- a touch of fever rather than overheating -- but the strengths
 * are not comparable, because this is the one variant that clears the shadow first.
 *
 * 'ill' wears the default 'curve' mouth, and that branch of drawMouth is the only one
 * without a save/restore, so it leaves its shadowColor and shadowBlur on the shared
 * context. Effects draw after the mouth. drawSickBlush lives with the same leak by
 * halving its strength, but it gets away with that only because disgust's glow is
 * green and so is its blush: here the leaked shadow is *purple*, and it does not just
 * amplify the flush, it turns it mauve. Measured (153,77,121) with the leak against
 * (156,60,63) without. Cleared locally rather than at the source, since fixing
 * drawMouth would visibly dim every effect on every curve-mouthed expression.
 */
function drawFlush(ctx, geometry, rise, rgb = LIGHT_RED, strength = 0.55) {
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  cheeks(ctx, geometry, rgb, strength, 1.25, drawFeatheredCheek, 0, rise);
  ctx.restore();
}

export function drawFeverBlush(ctx, geometry) {
  drawFlush(ctx, geometry, 0);
}

// Yellow-green, taken from the reference's own skin. Blue is nearly out: the screen
// it lands on is a dark violet, so leaving blue in turns the green grey.
const SICK_GREEN = '120,200,64';

/**
 * disgust: the queasy green of the nauseated-face emoji, across the cheeks.
 *
 * Held a shade deeper than SICK_GLOW so the green features still read against it,
 * the same separation the hot and cold variants keep from their own glow colours.
 * See drawHotBlush for why the strength here is nowhere near the pink variants'.
 *
 * Lower than hot's and cold's, and not comparable to them: disgust wears the 'wavy'
 * mouth, and drawMouth's default branch leaks its shadowColor/shadowBlur onto the
 * shared context (it is the only branch there without a save/restore). Effects draw
 * after the mouth, so this fill lands with a shadow under it and composites about
 * 1.8x. At hot's 0.8 the green channel clipped at 255 and the core went white-yellow,
 * destroying the very gradient this variant exists for.
 *
 * Then set by perceived brightness rather than by channel value, which is the second
 * reason it cannot be compared with the other variants: green carries roughly three
 * times red's luminance, so a green core with the same numbers as hot's red glares.
 * 0.34 puts this within about 20% of hot's flush by luminance.
 */
export function drawSickBlush(ctx, geometry) {
  // 0.34 was half strength, dialled back once because drawMouth's default branch
  // leaks its shadow onto everything drawn after it and this cheek came out doubled.
  // The queasy mouth is not that branch and never was, so the halving was paid for by
  // the wrong expression: at 0.34 the flush barely showed at all. 0.6 is what it needs
  // to read as a colour on this dark screen.
  //
  // Slid outward as well. Effects draw after the mouth, and a cheek this much stronger
  // sitting over the mouth's ends washes them green -- which is what `outward` is for.
  cheeks(ctx, geometry, SICK_GREEN, 0.6, 1.35, drawFeatheredCheek, 0.2);
}
