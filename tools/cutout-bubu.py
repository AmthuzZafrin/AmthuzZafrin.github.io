"""Cut the black field off the Bubu sprites, so a face can stand on a page.

    python3 tools/cutout-bubu.py tools/assets/bubu public/bubu

The faces were exported as opaque squares: the device on black, with an alpha
channel that is 255 everywhere. That is invisible on the work section, where
they sit on a near-black panel, and it is a box the moment one of them is shown
anywhere else — which is what the project page does.

The black is not keyed by threshold alone. Parts of the device are as dark as
the field around it — the gap between the side button and the case runs to 8,
the screen's own corners are darker still — and a threshold takes those with
it, punching holes through the middle of the artwork. What separates the field
from those is not its colour but where it is: the field touches the border and
the dark insides of the device do not. So the fill starts from the border and
spreads through dark pixels only, and whatever it cannot reach stays opaque.

The cut is then feathered by a fraction of a pixel. The device's edge is
antialiased into the black it was drawn on, so a hard cut leaves a stair on
every curve; a slight blur of the alpha puts the ramp back.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

# A pixel belongs to the field if no channel is brighter than this. Measured:
# the field runs 0–6, the darkest thing on the device that touches it is 8.
DARK = 7
# Softens the cut without eating into the artwork.
FEATHER = 0.7


def cut(im):
    """Return `im` with the border-connected black field made transparent."""
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
    alpha = alpha.filter(ImageFilter.GaussianBlur(FEATHER))
    im.putalpha(alpha)
    return im, sum(field)


def main():
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)

    for path in sorted(src.glob('*.webp')):
        im = Image.open(path).convert('RGBA')
        im, cut_px = cut(im)
        # Lossless, and it still comes out smaller than what it replaces: the
        # originals were encoded at a lossy setting so high it cost more than
        # exact would have. The faces are shown at nearly three times their own
        # size on the project page, which is no place to be re-compressing
        # smooth dark gradients.
        im.save(out / path.name, 'WEBP', lossless=True, method=6)
        print(f'{path.name}  {im.size}  cut {cut_px * 100 / (im.width * im.height):.0f}%')


main()
