#!/usr/bin/env python3
"""The name and role on the home page, drawn as SVG.

Super Adorable puts a gloss mark inside every letter — a dot and a curved
streak — and those marks are HOLES in the glyph, not painted shapes. In the
foundry's specimen they look white because the specimen is black type on a
white page and the page shows through. On a black page they go black, which
is what they were doing here.

Everything simple was tried first and none of it works:

  - a white copy behind the text does not help: it has the same holes;

  - thickening that copy with -webkit-text-stroke closes the marks, but a
    stroke grows outward as well as inward, and the stroke needed for the
    widest mark (0.14em) puts a 0.07em white rim around every letter and
    welds the words into a slab;

  - a morphological closing — SVG feMorphology dilate then erode — fills
    holes without moving the outer boundary, which is exactly the right
    operation, but the gaps BETWEEN these letters are no wider than the marks
    inside them. The dilation fuses neighbouring letters and the erosion
    cannot pull them apart again;

  - filling only the marks and leaving the letters' own counters alone needs
    the two told apart, and they cannot be. This face is so fat that its
    counters are the size of its gloss dots: C's streak is 0.142em across
    where P's bowl is 0.109em, and a fill-ratio test puts A's counter and the
    gloss dots both at about 0.76.

So the holes are not filled at all. The letters are backed instead: every
glyph's OUTER contours, and nothing else, painted white underneath, with the
full glyph — holes and all — laid over it in the gradient. Whatever the
gradient does not cover is white, which is every hole in the face and nothing
besides. That is the specimen, reproduced exactly rather than approximated.

It has to be SVG because CSS has no way to name the outer contour of a glyph.
Vector, so it stays sharp at any size, and each line keeps a real element and
real alt text around it.

Run from the project root:  python3 tools/prep-hero-name.py
"""

import pathlib
import sys

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

FONT = pathlib.Path("public/fonts/super-adorable.ttf")
OUT = pathlib.Path("public")

NAME_LINES = ["AMTHUZ", "ZAFRIN"]
ROLE = "GEN AI ENGINEER  |  FULL-STACK DEVELOPER"

# Line advance for the name, as a fraction of the em.
LEADING = 0.98
# Breathing room around the drawn marks so nothing is clipped by the viewBox.
PAD = 0.04

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


def bounds(contour):
    xs, ys = [], []
    for _, args in contour:
        for pt in args:
            if isinstance(pt, tuple):
                xs.append(pt[0])
                ys.append(pt[1])
    return (min(xs), min(ys), max(xs), max(ys)) if xs else None


def outer_only(contours):
    """The contours that are not sitting inside another one.

    Bounding-box containment is enough here: a hole in a letter is wholly
    within the box of the shape it is a hole in, and no two outer contours of
    one glyph nest.
    """
    boxes = [bounds(c) for c in contours]
    keep = []
    for i, b in enumerate(boxes):
        if b is None:
            continue
        inside = any(
            j != i
            and boxes[j] is not None
            and boxes[j][0] <= b[0]
            and boxes[j][1] <= b[1]
            and boxes[j][2] >= b[2]
            and boxes[j][3] >= b[3]
            for j in range(len(boxes))
        )
        if not inside:
            keep.append(contours[i])
    return keep


def to_path(contours, glyphset):
    pen = SVGPathPen(glyphset)
    for contour in contours:
        for op, args in contour:
            getattr(pen, op)(*args)
    return pen.getCommands()


def line_paths(text, font, glyphset, cmap, hmtx):
    """Two path strings for one line — the white backing, and the lettering."""
    x = 0
    under, over = [], []
    for ch in text:
        if ch == " ":
            x += hmtx[cmap[ord("n")]][0] * 0.5
            continue
        gname = cmap[ord(ch)]
        rec = RecordingPen()
        glyphset[gname].draw(rec)
        contours = split_contours(rec.value)
        if contours:
            shift = f"translate({x} 0)"
            under.append((to_path(outer_only(contours), glyphset), shift))
            over.append((to_path(contours, glyphset), shift))
        x += hmtx[gname][0]
    return under, over, x


def build(lines, size_em, colour, gradient, upem, font, glyphset, cmap, hmtx):
    cap = font["OS/2"].sCapHeight if hasattr(font["OS/2"], "sCapHeight") else int(upem * 0.7)
    laid = [line_paths(t, font, glyphset, cmap, hmtx) for t in lines]
    width = max(l[2] for l in laid)
    step = upem * LEADING
    height = cap + step * (len(lines) - 1)
    pad = upem * PAD

    body = []
    for i, (under, over, _) in enumerate(laid):
        base = cap + step * i
        for d, shift in under:
            body.append(f'<g transform="translate(0 {base:.0f}) scale(1 -1)">'
                        f'<g transform="{shift}"><path d="{d}" fill="#fff"/></g></g>')
        for d, shift in over:
            fill = "url(#ink)" if gradient else colour
            body.append(f'<g transform="translate(0 {base:.0f}) scale(1 -1)">'
                        f'<g transform="{shift}"><path d="{d}" fill="{fill}"/></g></g>')

    defs = ""
    if gradient:
        stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in GRADIENT)
        defs = f'<defs><linearGradient id="ink" x1="0" y1="0" x2="0.18" y2="1">{stops}</linearGradient></defs>'

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
        svg, w, h = build(lines, 1.0, colour, gradient, upem, font, glyphset, cmap, hmtx)
        path = OUT / f"{stem}.svg"
        path.write_text(svg)
        print(f"{path} — {w:.0f}x{h:.0f} units ({w / h:.3f} : 1), {len(svg) // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
