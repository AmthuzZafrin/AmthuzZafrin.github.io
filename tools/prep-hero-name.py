#!/usr/bin/env python3
"""The name and role on the home page, drawn as SVG.

Super Adorable puts a gloss mark inside every letter — a dot near the top and
a curved streak down one side — and those marks are HOLES in the glyph, not
painted shapes. In the foundry's specimen they read as white because the
specimen is black type on a white page and the page shows through.

They are not wanted here, so they are not drawn. Each glyph is rebuilt from
its outer contour and its counters, and the gloss contours are dropped; the
letters come out solid, with the holes that belong to the alphabet — the
triangle in A, the bowl in R — still holes.

Telling one kind of inner contour from the other is the whole of it, and the
font makes it easy once you look at the right measure. A counter is compact:
it fills 0.75 to 0.80 of its own bounding box and runs to 33,000 units² or
more. A gloss dot fills about the same fraction but is a tenth of the size,
5,000 to 10,000. A streak is large but thin, and fills only 0.21 to 0.59 of
its box because it curves across it. So area AND fill together separate them
with a wide margin, where either alone would not: the earlier attempt used
fill on its own and put A's counter and the gloss dots both at about 0.76.

What this replaces, and why it is gone: the marks used to be kept and painted
white, by drawing every glyph's outer contour in white underneath and the
full glyph — holes and all — over it in the gradient, so that whatever the
gradient did not cover came out white. That reproduced the specimen exactly.
It is no longer what the page wants.

Things that were tried while the marks were still wanted, and that do not
work, kept because they are about this font rather than about that decision:

  - a white copy behind the text does not help on its own: it has the same
    holes;

  - thickening that copy with -webkit-text-stroke closes the marks, but a
    stroke grows outward as well as inward, and the stroke needed for the
    widest mark (0.14em) puts a 0.07em white rim around every letter and
    welds the words into a slab;

  - a morphological closing — SVG feMorphology dilate then erode — fills
    holes without moving the outer boundary, which is exactly the right
    operation, but the gaps BETWEEN these letters are no wider than the marks
    inside them. The dilation fuses neighbouring letters and the erosion
    cannot pull them apart again.

It has to be SVG either way, because CSS has no way to name one contour of a
glyph. Vector, so it stays sharp at any size, and each line keeps a real
element and real alt text around it.

Run from the project root:  python3 tools/prep-hero-name.py
"""

import pathlib
import sys

from fontTools.pens.areaPen import AreaPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

FONT = pathlib.Path("public/fonts/super-adorable.ttf")
OUT = pathlib.Path("public")

NAME_LINES = ["AMTHUZ ZAFRIN"]
ROLE = "GEN AI ENGINEER  |  FULL-STACK DEVELOPER"

# Line advance for the name, as a fraction of the em. Unused at one line, and
# kept because the name has been two lines before and may be again.
LEADING = 0.98
# Breathing room around the drawn marks so nothing is clipped by the viewBox.
PAD = 0.04

# What separates a counter from a gloss mark, measured off this font. Area is
# in em², so it does not depend on the units the font happens to use.
COUNTER_AREA = 0.0048
COUNTER_FILL = 0.65

GRADIENT = [("0%", "#dff4ff"), ("52%", "#4fcbff"), ("100%", "#0b7cb4")]
ROLE_COLOUR = "#4fcbff"


def split_contours(recorded):
    """The pen's tape, cut into one list per contour."""
    out, cur = [], []
    for op, args in recorded:
        if op == "moveTo":
            if cur:
                out.append(cur)
            cur = [(op, args)]
        else:
            cur.append((op, args))
    if cur:
        out.append(cur)
    return out


def replay(contour, pen):
    for op, args in contour:
        getattr(pen, op)(*args)


def bounds(contour):
    xs, ys = [], []
    for _, args in contour:
        for pt in args:
            if isinstance(pt, tuple):
                xs.append(pt[0])
                ys.append(pt[1])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def is_inside(box, other):
    return (
        other[0] <= box[0]
        and other[1] <= box[1]
        and other[2] >= box[2]
        and other[3] >= box[3]
    )


def letterform(contours, glyphset, upem):
    """The glyph with its gloss dropped: outer contours and counters only.

    Containment is decided on bounding boxes, which is enough here — a hole
    is wholly inside the box of the shape it is a hole in, and no two outer
    contours of one glyph nest.
    """
    boxes = [bounds(c) for c in contours]
    keep = []
    for i, contour in enumerate(contours):
        box = boxes[i]
        if box is None:
            continue
        inner = any(
            j != i and boxes[j] is not None and is_inside(box, boxes[j])
            for j in range(len(contours))
        )
        if not inner:
            keep.append(contour)
            continue

        area_pen = AreaPen(glyphset)
        replay(contour, area_pen)
        area = abs(area_pen.value)
        span = (box[2] - box[0]) * (box[3] - box[1])
        fill = area / span if span else 0.0
        if area > COUNTER_AREA * upem * upem and fill > COUNTER_FILL:
            keep.append(contour)
    return keep


def to_path(contours, glyphset):
    pen = SVGPathPen(glyphset)
    for contour in contours:
        replay(contour, pen)
    return pen.getCommands()


def line_paths(text, glyphset, cmap, hmtx, upem):
    """One path string per glyph, with the x it sits at."""
    x = 0
    drawn = []
    space = cmap.get(ord(" "))
    for ch in text:
        if ch == " ":
            x += hmtx[space][0] if space else upem * 0.25
            continue
        gname = cmap[ord(ch)]
        rec = RecordingPen()
        glyphset[gname].draw(rec)
        contours = split_contours(rec.value)
        if contours:
            drawn.append((to_path(letterform(contours, glyphset, upem), glyphset),
                          f"translate({x} 0)"))
        x += hmtx[gname][0]
    return drawn, x


def build(lines, colour, gradient, upem, font, glyphset, cmap, hmtx):
    cap = font["OS/2"].sCapHeight if hasattr(font["OS/2"], "sCapHeight") else int(upem * 0.7)
    laid = [line_paths(t, glyphset, cmap, hmtx, upem) for t in lines]
    width = max(l[1] for l in laid)
    step = upem * LEADING
    height = cap + step * (len(lines) - 1)
    pad = upem * PAD

    fill = "url(#ink)" if gradient else colour
    body = []
    for i, (drawn, _) in enumerate(laid):
        base = cap + step * i
        for d, shift in drawn:
            body.append(f'<g transform="translate(0 {base:.0f}) scale(1 -1)">'
                        f'<g transform="{shift}"><path d="{d}" fill="{fill}"/></g></g>')

    defs = ""
    if gradient:
        stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in GRADIENT)
        defs = ('<defs><linearGradient id="ink" x1="0" y1="0" x2="0.18" y2="1">'
                f'{stops}</linearGradient></defs>')

    vb = f"{-pad:.0f} {-pad:.0f} {width + pad * 2:.0f} {height + pad * 2:.0f}"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
            f'{defs}{"".join(body)}</svg>'), width, height


def main():
    if not FONT.exists():
        print("missing:", FONT)
        return 1
    font = TTFont(FONT)
    glyphset = font.getGlyphSet()
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    upem = font["head"].unitsPerEm

    for stem, lines, gradient, colour in (
        ("hero-name", NAME_LINES, True, None),
        ("hero-role", [ROLE], False, ROLE_COLOUR),
    ):
        svg, w, h = build(lines, colour, gradient, upem, font, glyphset, cmap, hmtx)
        path = OUT / f"{stem}.svg"
        path.write_text(svg)
        print(f"{path} — {w:.0f}x{h:.0f} units ({w / h:.3f} : 1), {len(svg) // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
