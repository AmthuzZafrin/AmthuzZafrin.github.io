"""Turn a screen grab of a 3D icon into an asset that can stand on the page.

    python3 tools/prep-icon.py <in.png> <out.webp> [--erase x,y,w,h]

Two jobs, both of them because the source is a screenshot rather than an export.

The field behind the icon is the screen it was grabbed from, not transparency,
so it has to come off — and it cannot come off by threshold alone, because the
icon's own shadow falls to the same near-black. It is keyed the way the Bubu
faces were: a fill that starts at the border and spreads through dark pixels
only, so the field goes and anything enclosed by the artwork stays. See
tools/cutout-bubu.py, which does the same thing for the same reason.

And the pointer was in the shot. `--erase` names the rectangle it sits in; the
patch is a median of the area around it, which is enough because what is under
it in both of these is a smooth curve of clay with no detail to reconstruct.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

# A pixel belongs to the field if no channel is brighter than this. The grab's
# background sits at 0–20 and the darkest edge of the artwork is well above it.
DARK = 34
# Softens the cut. The icons were rendered against dark, so their edges are
# antialiased into it and a hard cut leaves a fringe on every curve.
FEATHER = 0.8
# Kept around the artwork once it is trimmed, so a glow or a shadow that is
# part of the render is not clipped by the crop.
MARGIN = 6


def erase(im, box):
    """Paint out `box` with a median of what surrounds it."""
    x, y, w, h = box
    pad = 14
    around = im.crop((x - pad, y - pad, x + w + pad, y + h + pad))
    patch = around.filter(ImageFilter.MedianFilter(13)).crop((pad, pad, pad + w, pad + h))
    # Feathered, so the repair has no edge of its own.
    mask = Image.new('L', (w, h), 255).filter(ImageFilter.GaussianBlur(2))
    im.paste(patch, (x, y), mask)
    return im


def cut(im):
    """Make the border-connected dark field transparent."""
    w, h = im.size
    px = im.load()
    field = bytearray(w * h)
    queue = deque()

    def consider(x, y):
        i = y * w + x
        if field[i]:
            return
        r, g, b, _ = px[x, y]
        if max(r, g, b) > DARK:
            return
        field[i] = 1
        queue.append((x, y))

    for x in range(w):
        consider(x, 0)
        consider(x, h - 1)
    for y in range(h):
        consider(0, y)
        consider(w - 1, y)

    while queue:
        x, y = queue.popleft()
        if x > 0:
            consider(x - 1, y)
        if x < w - 1:
            consider(x + 1, y)
        if y > 0:
            consider(x, y - 1)
        if y < h - 1:
            consider(x, y + 1)

    alpha = Image.frombytes('L', (w, h), bytes(0 if f else 255 for f in field))
    im.putalpha(alpha.filter(ImageFilter.GaussianBlur(FEATHER)))
    return im


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    im = Image.open(src).convert('RGBA')

    if '--erase' in sys.argv:
        box = [int(v) for v in sys.argv[sys.argv.index('--erase') + 1].split(',')]
        im = erase(im, box)

    im = cut(im)

    # Trimmed to what is actually drawn, so the two icons can be centred on the
    # card by their artwork rather than by whatever the grab happened to include.
    bounds = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if bounds:
        x0, y0, x1, y1 = bounds
        im = im.crop((
            max(0, x0 - MARGIN),
            max(0, y0 - MARGIN),
            min(im.width, x1 + MARGIN),
            min(im.height, y1 + MARGIN),
        ))

    # Lossless: these are small, and a lossy pass over a smooth clay gradient
    # bands exactly where the render is at its most convincing.
    im.save(out, 'WEBP', lossless=True, method=6)
    print(f'{out}  {im.size}')


main()
