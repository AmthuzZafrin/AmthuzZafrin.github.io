#!/usr/bin/env python3
"""The college photograph on the Education page.

The source is an upscale of a small web JPEG, and it arrives with the
generator's sparkle mark laid over the grass in the bottom-right corner.

The mark is removed by undoing the blend rather than by painting over it. It is
white laid on at some alpha:

    observed = (1 - a) * original + a * 255

A patch transplant is the usual answer for a mark sitting on texture, and it
would be fine on plain grass — but a wire crosses this exact spot, and a
transplant snaps it. Inverting the blend keeps everything still underneath:
the texture is only attenuated by (1 - a), never destroyed, so dividing it back
out brings it and the wire back.

Getting `a` right is the whole job, and it is done in two passes because the
first estimate of the background is contaminated by the mark itself:

  1. a rough pass locates the mark, using a background taken from a median far
     wider than it. Only the WHERE matters here, so the contamination is fine;

  2. that location is grown and masked off, and the background is estimated
     again by pushing the surrounding colour inward across the hole — the same
     premultiplied blur-and-divide used on the moon. Now nothing under the mark
     is informing the estimate of what is under the mark, and alpha is right at
     the edge as well as in the middle.

One thing the alpha model cannot carry is the mark's own hairline stroke: a
sharp one-pixel ridge is not a smooth alpha ramp, and inverting leaves it as a
faint outline. So the last step medians the boundary band alone — a band that
narrow erases a one-pixel ridge and leaves the wire, which is wider, crossing
it intact.

Run from the project root:  python3 tools/prep-college-photo.py
"""

import pathlib
import shutil
import sys

from PIL import Image, ImageChops, ImageFilter

SRC = pathlib.Path("/home/zafrin/Downloads/Gemini_Generated_Image_r67iv8r67iv8r67i.png")
OUT = pathlib.Path("public/education/college-campus.webp")
PARK = pathlib.Path("tools/assets/education")

# Generous box around the mark. Alpha falls to nothing well inside it, so the
# exact bounds do not matter — only that the mark is comfortably enclosed.
BOX = (1330, 505, 1480, 655)

HIT = 0.07      # alpha above this counts as "mark here" when locating it
GROW = 9        # how far the located mark is grown before masking it off
REACH = 14      # how far the surrounding colour is pushed inward
A_MAX = 0.88    # never divide by less than this much of the original
A_MIN = 0.03    # below this, the pixel is left alone

QUALITY = 88

# The Education slide draws this photograph by its height, so its width is
# whatever the ratio gives — and at 2.158 : 1 that left 280px of the column
# empty either side. Widening it means cropping, because there is no vertical
# room left in the section to grow into (two pixels, measured).
#
# The crop is taken here rather than left to object-fit, which would centre it
# and take equal bites off the top and the bottom. The top cannot spare them:
# the clock tower's apex is 32 pixels from the edge. So the sky gives up 20 and
# the foreground grass gives up the rest, which is the part of the frame with
# nothing in it.
RATIO = 2.85     # fills the column at a 1480px window
SKY = 20         # all the top can spare before the tower is touched


def alpha_against(reg, bg):
    """Per-pixel alpha of a white overlay, given the background under it."""
    w, h = reg.size
    rp, bp = reg.load(), bg.load()
    out = Image.new("L", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            px, bx = rp[x, y], bp[x, y]
            acc = 0.0
            for c in range(3):
                head = 255.0 - bx[c]
                acc += (px[c] - bx[c]) / head if head > 1 else 0.0
            a = acc / 3.0
            op[x, y] = 0 if a <= 0 else 255 if a >= 1 else int(a * 255)
    return out


def spread(rgb, keep, radius):
    """Colour from `keep` carried across the whole frame.

    A blurred premultiplied image divided by its own blurred mask is the
    surface extended into the space beside it.
    """
    w, h = rgb.size
    weight = keep.filter(ImageFilter.GaussianBlur(radius)).load()
    chans = []
    for ch in rgb.split():
        blurred = ImageChops.multiply(ch, keep).filter(ImageFilter.GaussianBlur(radius)).load()
        out = Image.new("L", (w, h))
        op = out.load()
        for y in range(h):
            for x in range(w):
                a = weight[x, y]
                if a:
                    v = blurred[x, y] * 255 // a
                    op[x, y] = 255 if v > 255 else v
        chans.append(out)
    return Image.merge("RGB", chans)


def coarse_background(reg):
    """The scene without the mark, at a scale the mark cannot survive."""
    w, h = reg.size
    small = reg.resize((w // 4, h // 4), Image.LANCZOS)
    return (small.filter(ImageFilter.MedianFilter(21))
                 .filter(ImageFilter.GaussianBlur(3))
                 .resize((w, h), Image.BICUBIC))


def main():
    if not SRC.exists():
        print("missing:", SRC)
        return 1

    im = Image.open(SRC).convert("RGB")
    reg = im.crop(BOX)
    w, h = reg.size

    # 1 — where is it
    rough = alpha_against(reg, coarse_background(reg))
    shape = rough.point(lambda p: 255 if p > HIT * 255 else 0).filter(ImageFilter.MedianFilter(7))

    # 2 — what is under it, estimated with it masked off
    grown = shape.filter(ImageFilter.MaxFilter(GROW))
    bg = spread(reg, ImageChops.invert(grown), REACH)

    a_map = (alpha_against(reg, bg)
             .filter(ImageFilter.MedianFilter(5))
             .filter(ImageFilter.GaussianBlur(0.6)))

    rp, ap = reg.load(), a_map.load()
    clean = Image.new("RGB", (w, h))
    cp = clean.load()
    peak = 0.0
    for y in range(h):
        for x in range(w):
            a = ap[x, y] / 255.0
            if a < A_MIN:
                cp[x, y] = rp[x, y]
                continue
            a = min(a, A_MAX)
            peak = max(peak, a)
            px = rp[x, y]
            cp[x, y] = tuple(
                max(0, min(255, int(round((px[c] - a * 255.0) / (1.0 - a))))) for c in range(3)
            )

    # 3 — the stroke the alpha model could not carry
    band = ImageChops.subtract(shape.filter(ImageFilter.MaxFilter(7)),
                               shape.filter(ImageFilter.MinFilter(7)))
    band = band.filter(ImageFilter.GaussianBlur(1.2)).point(lambda p: 255 if p > 40 else 0)
    clean = Image.composite(clean.filter(ImageFilter.MedianFilter(5)), clean, band)

    im.paste(clean, (BOX[0], BOX[1]))

    keep = round(im.width / RATIO)
    if keep < im.height:
        im = im.crop((0, SKY, im.width, SKY + keep))

    PARK.mkdir(parents=True, exist_ok=True)
    if OUT.exists() and not (PARK / "college-campus-night.webp").exists():
        shutil.copy2(OUT, PARK / "college-campus-night.webp")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, "WEBP", quality=QUALITY, method=6)
    print(f"mark removed, peak alpha {peak:.2f}")
    print(f"{OUT} — {im.size[0]}x{im.size[1]} ({im.size[0] / im.size[1]:.3f} : 1), "
          f"{OUT.stat().st_size // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
