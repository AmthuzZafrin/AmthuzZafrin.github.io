#!/usr/bin/env python3
"""The image on the home page.

Three things are done to the source: the interface rings come off the light
the robot is touching, the glow they sat in comes off after them, and the
generator's sparkle comes off the foot.


---- the rings ----

What the picture should be left with is the white point under the fingertip
and the horizontal flare through it. Everything else drawn around that light
— the concentric arcs, the little radial ticks between them, and the broad
soft crescent further out — is circular, and circular is what goes.

They cannot be painted out: the hand crosses them, the flare crosses them, and
the bloom they sit on is not flat. What tells them apart from everything that
stays is their SHAPE ABOUT THE CENTRE, so the work is done in polar
coordinates around that centre, where each thing in the picture becomes a
direction:

  - an arc is thin in radius and long in angle    -> a thin horizontal line
  - the flare runs out from the middle            -> a tall vertical band
  - the bloom falls away from the middle          -> a smooth vertical ramp
  - the hand is a solid object                    -> a solid blob

A greyscale OPENING along the radius — erode then dilate with a window wider
than the thing you want gone — deletes anything brighter than its
surroundings and thinner than the window, in that direction only. The arcs are
three to five pixels thick, so a 13-pixel window takes every one of them. The
flare is hundreds of pixels long in that same direction and survives untouched
at any window size; a monotone ramp is reconstructed exactly by an opening, so
the bloom survives too, and so does the hand. None of those three needs a mask
— the geometry does it.

A second opening with a 61-pixel window takes the broad crescent, which is
about 35 pixels thick. That one does need the hand kept out of it: at 61 the
window is wider than the fingers are deep, and it eats them. The mask for it
is read off the picture AFTER the arcs have gone, which is what makes it
easy — by then the only bright things left are the bloom, which is deeply
blue, and the metal, which is nearly neutral. G/R separates those two
completely: about 2.0 on the glow, about 1.3 on the hand.

The little radial ticks are the one thing that has to be taken the other way
round, along the ANGLE, because pointing outward is exactly what they have in
common with the flare. What saves it is that the flare is a band of fixed
HEIGHT, so the closer to the middle you look the more of the circle it covers:
at r=40 it spans about 33 degrees and at r=150 only 6. The ticks are three
pixels wide wherever they are. So an angular opening applies out to r=55 and
is faded off by 75 — wide enough there to take a tick, nowhere near wide
enough to take the flare. Past that the ticks are faint enough under the
bloom to leave, and at 150 a window that could take one would take the flare
with it. The ring of ticks immediately around the white point, which reads as
a cog and is the one place they are obvious, is well inside 55.

The white point is the last piece, and it is a special case for one reason:
it does not sit at the centre of the rings. The rings' centre is at
(946, 275), found by minimising the variation in brightness around a circle —
the value is lowest when the circles you are sampling are the drawn ones. The
white point is at (951, 272), five pixels away. So it reads as a bump in the
radius rather than as a ramp, and an opening would flatten it. It is guarded
by hand, as a small disc around its own centre.

Things that were tried and are not here:

  - the angular opening run across the whole disc rather than only near the
    middle. It takes the flare with the ticks from about r=60 outward, where
    the band has narrowed to a few degrees — the picture came back with the
    light isolated and nothing running through it;

  - removing the ring residual by subtracting only what is long in angle, so
    the scattered particles could be kept. The arcs drift by ten pixels in
    radius over their length — they are drawn as a loose spiral, not as
    circles — so at any fixed radius they break into fragments and the test
    fails on them.


---- the glow ----

Taking the rings off leaves the bloom they were drawn on: a soft disc of
light about 350 pixels across, still circular, still the same thing. That
goes too, and what is left is the white point and the flare.

Subtracting it does not work, and the reason is worth keeping. The obvious
move is to measure the bloom as a profile against radius and take it off,
which does remove it — and then every faint thing that was left behind
becomes glaring. A ten-unit ripple sitting on a bloom of 110 is invisible;
the same ripple on a background of 8 is a stain. Removing light amplifies
whatever survives it, so a subtraction has to be perfect or it is worse than
nothing.

So the field is rebuilt instead of corrected. Everything within 400 pixels of
the light is discarded, along with the robot, and what is thrown away is
replaced by the smoothest field that meets the picture at the edge of the
hole — Laplace's equation, whose answer is exactly what an unlit background
is: a slow gradient and nothing else. It is solved on a coarse grid with
over-relaxed Gauss-Seidel, which is ample, because the thing being solved for
has no detail in it by definition.

Four things then keep their own pixels: the white point, with a tight bloom
of its own so it still reads as a light; the flare, as a soft band along its
line; the robot; and the last stretch of the fingertip. That last one is
named as a capsule rather than found, because inside the light nothing tells
metal from bloom — G/R is 1.3 against 2.0 out in the open but both go to 1.1
in the glare, and saturation, which looked more promising, overlaps at every
radius from 18 to 54.


---- the sparkle ----

The source carries the generator's sparkle in its bottom-right corner, and
that corner is the one place on this picture where it could not simply be
lifted out. On the college photograph the same mark sat on grass — stochastic
texture, uniform lighting — and undoing the blend there restored everything
under it. Here it lands in a narrow dark gap between two bright metal edges,
and three attempts at it all left a patch:

  - inverting the blend needs the background under the mark, and every
    estimate of it is pulled bright by the metal a few pixels either side.
    Alpha then comes out near 0.8 where a scanline says the truth is 0.27, and
    dividing by what is left of (1 - a) throws a brown cast across the shape;

  - blending toward an extrapolated background instead avoids the cast, but
    the extrapolation carries that same borrowed brightness inward and the
    diamond stays legible as a pale patch.

The mark is 80% of the way down the frame, so the cheapest correct answer is
to not include it. Cutting the bottom fifth takes it away completely, with no
reconstruction to be wrong about — and it improves the picture for this job:
2.85 : 1 is a better band for a masthead than 2.26, the robot runs off the
bottom edge the way a figure in a hero should, and the head, the pointing
hand and the light it is touching are all above the cut.

Run from the project root:  python3 tools/prep-hero-ai.py
"""

import math
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = pathlib.Path(
    "/home/zafrin/Downloads/Gemini_Generated_Image_au2tbhau2tbhau2t.png"
)
# Under src/, not public/, so the bundler fingerprints it — see the note in
# prep-hero-name.py. A picture that has been through as many passes as this
# one cannot afford to be cached under one name.
OUT = pathlib.Path("src/assets/hero-ai.webp")

# The mark's top edge is at y=548. Three pixels of margin, and nothing of it
# survives into the crop.
CUT = 545

# The picture is almost all dark navy and near-black, which is the easiest
# thing there is to encode. It was 86, which cost 1.37 of a level on the
# hand; 90 costs 1.1 and is worth the 30K here, because with the glow gone
# the metal is most of what is left to look at.
QUALITY = 90

# What the page asks for, with a HiDPI screen counted in. The picture is hung
# at 122% of the window, so a 1512-point window asks for 1845 points of it —
# and 3690 device pixels on a screen that has two per point. At 2400 the
# browser made up the difference on every such screen, which is the one place
# this image had left to lose detail.
WIDE = 3200

# ---- the interface, in source pixels ----

# Where the arcs are drawn from. Not the white point: see the note above.
RING = (946.0, 275.0)
# The white point itself, which is what the fingertip is touching.
DOT = (951.0, 272.0)

# How far out the work goes. The outermost thing being removed ends near 150;
# past 160 the result is faded back into the picture so the disc has no edge.
REACH = 210
FADE = 50

# Angular resolution of the polar image. At the outer edge one column is 1.3
# source pixels across, which is finer than anything being measured.
NTH = 1024

# The openings, as half-windows: 6 -> 13px, for arcs three to five thick;
# 30 -> 61px, for a crescent about 35 thick.
ARC_HALF = 6
CRESCENT_HALF = 30

# The angular one, in columns: 16 -> 33, which is 5px of arc at r=25 and 10px
# at r=50 — past a tick and well short of the flare at either.
TICK_HALF = 16
TICK_TO = 55
TICK_FADE = 20

# Where the wide window and the smoothing are allowed to start. Both of them
# destroy the fingertip, which lies between r=12 and r=50: at 61 the window is
# far wider than the finger is deep across the radius, so it erases it, and
# the blur finishes what is left. Neither has anything to do in there — the
# crescent is at 110 to 150 and the plateaus the blur is for are the wide
# window's own. So both are held off until past the finger.
CRESCENT_FROM = 80
CRESCENT_FADE = 25
SMOOTH_FROM = 58
SMOOTH_FADE = 22

# The white point's guard. Untouched inside KEEP, faded back over the next
# band, which puts the seam out where the bloom is smooth.
DOT_KEEP = 5
DOT_FADE = 7

# How much of the light reads as metal and has to be cut back out of that
# mask. Measured around the circle: at r=26 most of it still passes both
# tests, at r=44 six samples in 180 do, and by 47 none do.
DOT_BLOB = 48

# An opening leaves plateaus — it holds a value flat across the window and
# then steps — and on a bloom this smooth the steps read as faint rings of
# their own, which is the thing being removed. Three pixels in polar takes
# them out and is far too little to touch the flare, which is hundreds of
# pixels long in the direction it would have to be blurred to be lost.
SMOOTH = 3

# The middle is smoothed too, but gently: the 13-pixel window leaves smaller
# steps than the 61-pixel one, and the fingertip is in there. At 1.4 the
# steps go and the finger keeps its edges.
SMOOTH_NEAR = 1.4

# ---- the glow the rings sat in ----

# Past this there is no light left to take: the field around the light reads
# 12 luminance at r=300 and 7.7 at r=400, which is the picture's own dark.
GLOW_REACH = 400
# And the last stretch of it is handed back gradually, so the rebuilt field
# never has to meet the picture along a hard circle.
GLOW_RIM = 110

# The grid the field is solved on, and how hard. The answer is smooth by
# construction, so it is solved coarse and blurred on the way back up.
GLOW_STEP = 12
SOLVE_SWEEPS = 400
SOLVE_OMEGA = 1.85

# How much of its own bloom the white point keeps. Chosen by rendering it:
# at 16 it is a spark, at 46 it is a circle again — which is the thing being
# removed — and 22 is a light.
DOT_SIGMA = 22.0

# The flare's half-height. It keeps whatever is inside this band along its
# own line, which near the middle is bloom as much as flare; that is right,
# since a flare has a thick middle.
FLARE_H = 16.0

# The fingertip, where it is inside the light. Traced off the picture: the
# metal's core runs from the tip out past the edge of the bloom, and nothing
# but its position tells it from the glow around it.
FINGER_A = (957, 281)
FINGER_B = (1014, 316)
FINGER_W = 23

# Inside that capsule, the finger's lit faces: bright and weakly coloured,
# against a bloom that is bright and strongly coloured. Neither test carries
# the separation on its own anywhere in the frame — it is the capsule that
# makes the pair enough. The closing afterwards puts the dark knuckle band
# back, which those faces enclose.
TIP_SAT = 0.40
TIP_LUM = 120
TIP_CLOSE = 19

# And the silhouette the glow stage keeps, closed by enough to bridge a
# knuckle band and then given every pixel of that back, so no bloom is held
# around the robot's edge.
SILHOUETTE = 19


def to_polar(im, reach, pad):
    """The disc around RING, redrawn with angle across and radius down.

    Padded top and bottom so the 1-D filters below, which wrap, never wrap a
    real row into another one. The pad rows repeat the nearest real radius.
    """
    src = im.load()
    w, h = im.size
    rows = reach + 1 + 2 * pad
    out = Image.new("RGB", (NTH, rows))
    dst = out.load()
    cs = [math.cos(2 * math.pi * t / NTH) for t in range(NTH)]
    sn = [math.sin(2 * math.pi * t / NTH) for t in range(NTH)]
    cx, cy = RING

    for j in range(rows):
        r = max(0, j - pad)
        for t in range(NTH):
            x = cx + r * cs[t]
            y = cy + r * sn[t]
            x0, y0 = int(x), int(y)
            if not (0 <= x0 < w - 1 and 0 <= y0 < h - 1):
                continue
            fx, fy = x - x0, y - y0
            a = src[x0, y0]
            b = src[x0 + 1, y0]
            c = src[x0, y0 + 1]
            d = src[x0 + 1, y0 + 1]
            w0 = (1 - fx) * (1 - fy)
            w1 = fx * (1 - fy)
            w2 = (1 - fx) * fy
            w3 = fx * fy
            dst[t, j] = (
                int(a[0] * w0 + b[0] * w1 + c[0] * w2 + d[0] * w3 + 0.5),
                int(a[1] * w0 + b[1] * w1 + c[1] * w2 + d[1] * w3 + 0.5),
                int(a[2] * w0 + b[2] * w1 + c[2] * w2 + d[2] * w3 + 0.5),
            )
    return out


def _open(im, half, dx, dy):
    """Erode then dilate along one axis.

    Done as repeated darker/lighter against shifted copies rather than as a
    rank filter: PIL's are square, and a square window here would take the
    flare along with the arcs. The wrap that `offset` does is what the angle
    axis wants, and what the pad rows exist to absorb on the radius axis.
    """
    def pass_(base, op):
        out = base
        for k in range(1, half + 1):
            out = op(out, ImageChops.offset(base, dx * k, dy * k))
            out = op(out, ImageChops.offset(base, -dx * k, -dy * k))
        return out

    return pass_(pass_(im, ImageChops.darker), ImageChops.lighter)


def open_radially(im, half):
    return _open(im, half, 0, 1)


def inner_ramp(size, pad, to, fade):
    """White out to radius `to`, black past `to + fade`.

    Every gate here is on radius alone, which in this view is the row — so
    each one is a single ramp down the image and costs nothing to apply.
    """
    mask = Image.new("L", size, 0)
    px = mask.load()
    for j in range(size[1]):
        r = j - pad
        if r <= to:
            v = 255
        elif r < to + fade:
            v = round(255 * (to + fade - r) / fade)
        else:
            v = 0
        if v:
            for t in range(size[0]):
                px[t, j] = v
    return mask


def from_polar(polar, base, pad):
    """Draw the polar image back over `base`, faded out at the rim."""
    out = base.copy()
    dst = out.load()
    src = base.load()
    pol = polar.load()
    w, h = base.size
    rows = polar.size[1]
    cx, cy = RING

    for y in range(max(0, int(cy - REACH)), min(h, int(cy + REACH) + 2)):
        dy = y - cy
        for x in range(max(0, int(cx - REACH)), min(w, int(cx + REACH) + 2)):
            dx = x - cx
            r = math.hypot(dx, dy)
            if r > REACH:
                continue
            m = 1.0 if r < REACH - FADE else (REACH - r) / FADE

            th = math.atan2(dy, dx) % (2 * math.pi) * NTH / (2 * math.pi)
            t0 = int(th)
            f = th - t0
            t1 = (t0 + 1) % NTH
            t0 %= NTH
            j = r + pad
            j0 = int(j)
            g = j - j0
            j1 = min(rows - 1, j0 + 1)

            a = pol[t0, j0]
            b = pol[t1, j0]
            c = pol[t0, j1]
            d = pol[t1, j1]
            w0 = (1 - f) * (1 - g)
            w1 = f * (1 - g)
            w2 = (1 - f) * g
            w3 = f * g
            s = src[x, y]
            dst[x, y] = tuple(
                int(
                    s[k] * (1 - m)
                    + (a[k] * w0 + b[k] * w1 + c[k] * w2 + d[k] * w3) * m
                    + 0.5
                )
                for k in range(3)
            )
    return out


def metal_mask(im, grow=True, hole=True):
    """Where the robot is, read off the picture once the arcs are gone.

    Bright and close to neutral is metal; bright and twice as green as it is
    red is the glow. It must be read off the cleaned picture and not the
    original, because a lit arc is 1.36 and would come back as metal.

    Everything this covers is taken from the SOURCE, unfiltered, and it has
    to be: the curled fingers lie across the radius rather than along it, so
    to the 13-pixel window they are as thin as an arc is and it flattens them
    into slabs. The hand is the one part of the frame the polar view gets
    exactly backwards, and the answer is to not process it at all.

    The light itself is what has to be cut back out of the mask. Near the
    middle the bloom goes white and the flare with it, so both pass the two
    tests, and taking THAT from the source would put the innermost arcs
    straight back — which is exactly what it did, as a bright ring at r=28.
    The disc below reaches past where any of it still passes. What lands
    inside it is the first 35 pixels of the fingertip, and those come through
    the filters unharmed: at the tip the finger points at the light, so it
    runs ALONG the radius and reads as long rather than as thin.
    """
    w, h = im.size
    src = im.load()
    mask = Image.new("L", (w, h), 0)
    px = mask.load()
    for y in range(h):
        for x in range(w):
            r, g, b = src[x, y]
            if 0.2126 * r + 0.7152 * g + 0.0722 * b > 85 and g < 1.55 * r + 12:
                px[x, y] = 255

    # Closed, to bridge the dark seams between the finger segments:
    # thresholding alone returns the lit faces as separate islands, and a mask
    # full of holes puts the filtered version back over half the hand.
    #
    # `grow` is what the two callers disagree about. Taking the arcs off, the
    # mask chooses between two pictures that have both had the arcs taken off
    # already, so a few pixels of slack outside the silhouette cost nothing
    # and closing the seams is all that matters. Taking the GLOW off, the same
    # slack is a band of bloom held around every edge of the robot — which is
    # exactly the halo that was hugging the finger — so there the closing has
    # to give back everything it took.
    mask = mask.filter(ImageFilter.MaxFilter(7 if grow else SILHOUETTE))
    if not grow:
        mask = mask.filter(ImageFilter.MinFilter(SILHOUETTE))

    # Then the bloom back out, after the growing rather than before it, or
    # the growing would simply fill it in again. `hole` is off only when the
    # caller wants the fingertip that lives inside the light and will bound
    # it some other way.
    if hole:
        ImageDraw.Draw(mask).ellipse(
            [DOT[0] - DOT_BLOB, DOT[1] - DOT_BLOB,
             DOT[0] + DOT_BLOB, DOT[1] + DOT_BLOB],
            fill=0,
        )
    return mask.filter(ImageFilter.GaussianBlur(3 if grow else 1.2))


def dot_guard(base, out):
    """Put the white point back, since it is not at the rings' centre."""
    dst = out.load()
    src = base.load()
    dx, dy = DOT
    lo = DOT_KEEP
    hi = DOT_KEEP + DOT_FADE
    for y in range(int(dy - hi) - 1, int(dy + hi) + 2):
        for x in range(int(dx - hi) - 1, int(dx + hi) + 2):
            d = math.hypot(x - dx, y - dy)
            if d > hi:
                continue
            m = 1.0 if d <= lo else (hi - d) / DOT_FADE
            s = src[x, y]
            t = dst[x, y]
            dst[x, y] = tuple(int(t[k] * (1 - m) + s[k] * m + 0.5) for k in range(3))
    return out


def dark_field(im, robot):
    """The picture as it would be with no light in it at all.

    Everything within GLOW_REACH of the light is thrown away and put back by
    solving for the smoothest field that meets what is left at the edge of the
    hole. That is Laplace's equation, and its answer is what an unlit
    background is: a slow gradient and nothing else. The robot is thrown away
    with it, everywhere in the frame — it is the other bright thing, and left
    in it would drag the solution toward white. Nothing is lost by that,
    because the composite puts the robot back from the source afterwards.

    Solved on a coarse grid, since the answer is smooth by construction, and
    each cell takes a low percentile of its pixels so that a star inside one
    does not lift it.
    """
    w, h = im.size
    src = im.load()
    rb = robot.load()
    cw, ch = (w + GLOW_STEP - 1) // GLOW_STEP, (h + GLOW_STEP - 1) // GLOW_STEP
    cx, cy = DOT

    fixed = [[None] * cw for _ in range(ch)]
    for j in range(ch):
        for i in range(cw):
            bands = ([], [], [])
            for y in range(j * GLOW_STEP, min(h, j * GLOW_STEP + GLOW_STEP)):
                for x in range(i * GLOW_STEP, min(w, i * GLOW_STEP + GLOW_STEP)):
                    if math.hypot(x - cx, y - cy) <= GLOW_REACH or rb[x, y] > 40:
                        continue
                    p = src[x, y]
                    for c in range(3):
                        bands[c].append(p[c])
            if len(bands[0]) >= GLOW_STEP * GLOW_STEP * 0.45:
                fixed[j][i] = tuple(
                    sorted(band)[int(len(band) * 0.4)] for band in bands)

    seen = [v for row in fixed for v in row if v]
    start = tuple(sum(v[c] for v in seen) / len(seen) for c in range(3))
    grid = [[fixed[j][i] or start for i in range(cw)] for j in range(ch)]

    # Gauss-Seidel, over-relaxed: each unknown cell walks toward the mean of
    # its neighbours, in place, so the boundary reaches the middle of the hole
    # in a few dozen sweeps rather than a few thousand.
    for _ in range(SOLVE_SWEEPS):
        for j in range(ch):
            for i in range(cw):
                if fixed[j][i]:
                    continue
                acc, n = [0.0, 0.0, 0.0], 0
                for dj, di in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    a, b = j + dj, i + di
                    if 0 <= a < ch and 0 <= b < cw:
                        near = grid[a][b]
                        for c in range(3):
                            acc[c] += near[c]
                        n += 1
                here = grid[j][i]
                grid[j][i] = tuple(
                    here[c] + SOLVE_OMEGA * (acc[c] / n - here[c]) for c in range(3))

    small = Image.new("RGB", (cw, ch))
    sp = small.load()
    for j in range(ch):
        for i in range(cw):
            sp[i, j] = tuple(max(0, min(255, round(v))) for v in grid[j][i])
    field = small.resize((cw * GLOW_STEP, ch * GLOW_STEP), Image.BICUBIC)
    return field.crop((0, 0, w, h)).filter(ImageFilter.GaussianBlur(GLOW_STEP))


def fingertip_mask(im):
    """The last stretch of the finger, where it is inside the light.

    Colour cannot find it there. Out in the open G/R separates metal from
    glow completely, 1.3 against 2.0, but in the glare both go to 1.1;
    saturation looked better and overlaps at every radius from 18 to 54. So
    the capsule, traced off the picture, does the finding, and the two tests
    only have to hold inside it — where they do, because what is in there is
    either the lit face of a finger or bloom, and the bloom is the coloured
    one.

    Read off the picture with the ARCS taken off and nothing else — not the
    source, where an arc is 0.29 saturated and sits inside the finger's own
    0.22 to 0.35, and not the fully cleaned picture, where the angular pass
    and the blur have dulled the tip to 0.47 and it is no longer telling
    apart from the bloom's 0.46. In between, the finger reads 0.20 to 0.36
    and the bloom a pixel away from it reads 0.50 to 0.55.

    This is wanted twice: the arcs stage uses it so the tip comes from the
    source rather than through a filter that softens it, and the glow stage
    uses it so the tip is kept rather than rebuilt as background.
    """
    w, h = im.size
    src = im.load()
    x0 = max(0, min(FINGER_A[0], FINGER_B[0]) - FINGER_W)
    x1 = min(w, max(FINGER_A[0], FINGER_B[0]) + FINGER_W)
    y0 = max(0, min(FINGER_A[1], FINGER_B[1]) - FINGER_W)
    y1 = min(h, max(FINGER_A[1], FINGER_B[1]) + FINGER_W)

    core = Image.new("L", (w, h), 0)
    px = core.load()
    for y in range(y0, y1):
        for x in range(x0, x1):
            r, g, b = src[x, y]
            hi, lo = max(r, g, b), min(r, g, b)
            if not hi:
                continue
            if (hi - lo) / hi < TIP_SAT and 0.2126 * r + 0.7152 * g + 0.0722 * b > TIP_LUM:
                px[x, y] = 255
    core = core.filter(ImageFilter.MaxFilter(TIP_CLOSE))
    core = core.filter(ImageFilter.MinFilter(TIP_CLOSE))

    reach = Image.new("L", (w, h), 0)
    ImageDraw.Draw(reach).line([FINGER_A, FINGER_B], fill=255, width=FINGER_W)
    return ImageChops.darker(core, reach).filter(ImageFilter.GaussianBlur(1.2))


def light_mask(size, robot):
    """What keeps its own pixels when the glow comes off.

    Three things, plus whatever `robot` covers: the white point, which keeps a
    tight bloom of its own so it still reads as a light rather than as a
    pinhole; the flare, as a soft band along its own line; and a rim ramp that
    brings the mask back to 1 before GLOW_REACH, so the rebuilt field is never
    asked to meet the picture along a hard circle.
    """
    w, h = size
    cx, cy = DOT
    mask = Image.new("L", size, 0)
    px = mask.load()
    for y in range(h):
        band = math.exp(-((y - cy) / FLARE_H) ** 2)
        for x in range(w):
            r = math.hypot(x - cx, y - cy)
            rim = min(1.0, max(0.0, (r - (GLOW_REACH - GLOW_RIM)) / GLOW_RIM))
            v = max(band, math.exp(-((r / DOT_SIGMA) ** 2)), rim)
            px[x, y] = round(255 * min(1.0, v))

    return ImageChops.lighter(mask, robot)


def deglow(im):
    """Take the arcs, the cog of ticks and the crescent off the light."""
    # Deep enough that the filters' wrap never reaches a real radius: they
    # shift by ARC_HALF and then by CRESCENT_HALF down the same axis.
    pad = ARC_HALF + CRESCENT_HALF + 12
    polar = to_polar(im, REACH, pad)

    size = polar.size

    # The arcs, everywhere.
    arcs = open_radially(polar, ARC_HALF)
    # Held onto: this is the one version of the picture in which the tip of
    # the finger can be told from the bloom around it. See fingertip_mask.
    tip = fingertip_mask(from_polar(arcs, im, pad))
    # The cog of ticks, near the middle only.
    arcs = Image.composite(
        _open(arcs, TICK_HALF, 1, 0), arcs,
        inner_ramp(size, pad, TICK_TO, TICK_FADE))
    # Then the crescent, and the smoothing that the wide window's own
    # plateaus need — both held off the middle, where the fingertip is.
    cleaned = Image.composite(
        arcs, open_radially(arcs, CRESCENT_HALF),
        inner_ramp(size, pad, CRESCENT_FROM, CRESCENT_FADE))
    cleaned = Image.composite(
        cleaned.filter(ImageFilter.GaussianBlur(SMOOTH_NEAR)),
        cleaned.filter(ImageFilter.GaussianBlur(SMOOTH)),
        inner_ramp(size, pad, SMOOTH_FROM, SMOOTH_FADE))

    # The mask is found on the arc-free picture and then applied to the
    # source, so the robot comes through the whole of this untouched.
    arc_free = from_polar(arcs, im, pad)
    # The robot, plus the tip of the finger that the mask's own hole cuts
    # out. Without it the tip is the one piece of metal in the frame that
    # goes through a filter, and it comes back soft.
    mask = ImageChops.lighter(metal_mask(arc_free), tip)
    out = dot_guard(im, Image.composite(im, from_polar(cleaned, im, pad), mask))
    return out, arc_free, tip


def strip_light(im):
    """The rings, and then the glow they sat in.

    Two stages, and the order matters: the field cannot be rebuilt around a
    light that still has arcs drawn across it, because the arcs would be
    measured as part of the background at the edge of the hole.
    """
    cleaned, arc_free, tip = deglow(im)

    # What keeps its own pixels is the silhouette and not a pixel more. The
    # first version of this used the grown mask and the picture came back
    # with a glow tracing the whole hand — the grown part is bloom, and
    # keeping bloom is the one thing this stage exists to stop.
    tight = metal_mask(arc_free, grow=False)

    keep = light_mask(im.size, ImageChops.lighter(tight, tip))

    # The field, though, wants the robot excluded generously — a dark joint
    # left in it would be read as background and pin the solution dark.
    wide = metal_mask(arc_free, hole=False)
    wide = wide.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(15))
    return Image.composite(cleaned, dark_field(cleaned, wide), keep)


def main():
    if not SRC.exists():
        print("missing:", SRC)
        return 1

    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    if CUT >= h:
        print(f"source is {w}x{h}; nothing to cut")
        return 1

    im = strip_light(im)
    band = im.crop((0, 0, w, CUT))

    # Written wider than the file is, because the page draws it wider than the
    # file is. The picture is hung at 122% of the window, so a 1850px window
    # asks for 2257px across from a 1552px source — and a browser upscaling by
    # half does it with a filter that smears every edge in the robot. Lanczos
    # with a light unsharp does not invent detail either, but it keeps the
    # edges it has, which is the whole difference between soft and mushy. The
    # radius follows the scale: 1.1 was set for 2400 across.
    if band.width < WIDE:
        tall = round(band.height * WIDE / band.width)
        band = band.resize((WIDE, tall), Image.LANCZOS)
        band = band.filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=3))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    band.save(OUT, "WEBP", quality=QUALITY, method=6)

    print(f"source {w}x{h} ({w / h:.3f} : 1)")
    print(f"rings off the light at {RING[0]:.0f},{RING[1]:.0f}; glow out to "
          f"{GLOW_REACH}px rebuilt; white point at {DOT[0]:.0f},{DOT[1]:.0f} "
          f"and its flare kept")
    print(f"cut {h - CUT}px from the foot, taking the mark with it")
    print(f"{OUT} — {band.size[0]}x{band.size[1]} ({band.size[0] / band.size[1]:.3f} : 1), "
          f"{OUT.stat().st_size // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
