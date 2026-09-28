#!/usr/bin/env python3
"""The image on the home page.

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

import pathlib
import sys

from PIL import Image

SRC = pathlib.Path(
    "/home/zafrin/Downloads/Gemini_Generated_Image_au2tbhau2tbhau2t.png"
)
OUT = pathlib.Path("public/hero-ai.webp")

# The mark's top edge is at y=548. Three pixels of margin, and nothing of it
# survives into the crop.
CUT = 545

# The picture is almost all dark navy and near-black, which is the easiest
# thing there is to encode; the detail that matters is the rim light on the
# robot and the rings of the interface, and both hold at this.
QUALITY = 86


def main():
    if not SRC.exists():
        print("missing:", SRC)
        return 1

    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    if CUT >= h:
        print(f"source is {w}x{h}; nothing to cut")
        return 1

    band = im.crop((0, 0, w, CUT))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    band.save(OUT, "WEBP", quality=QUALITY, method=6)

    print(f"source {w}x{h} ({w / h:.3f} : 1)")
    print(f"cut {h - CUT}px from the foot, taking the mark with it")
    print(f"{OUT} — {band.size[0]}x{band.size[1]} ({band.size[0] / band.size[1]:.3f} : 1), "
          f"{OUT.stat().st_size // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
