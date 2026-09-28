#!/usr/bin/env python3
"""Build the moon that rises across the foot of the home page.

The source is expected to arrive already in the shape the page wants: a shallow
band of planet, crest near the top edge and the limb running down towards both
bottom corners. Everything else is worked out from the picture.

The limb is found by luminance rather than by alpha, because these sources come
either background-removed or sitting on a black sky, and a bright run ten pixels
deep tells the two apart from a star. A circle is then fitted through those
points by least squares, with the worst tenth thrown out three times over —
stars, a dark patch on the terminator and the clipped crest all put points where
the limb is not, and a plain fit through everything lands nowhere near it. The
fit and its residual are printed on every run, so a source this does not suit
says so rather than quietly producing a lopsided moon.

What the fit is then used for:

  - the alpha is redrawn from it at output resolution, so the limb is a clean
    curve rather than whatever the source's edge happens to be;

  - the colour is pushed out past a slightly eroded copy of it, because the
    outermost pixels of a limb are half planet and half black sky. Drawn to the
    true circle without this, those pixels become a dark hairline along the top
    of the moon — and the browser's own scaling fringes it besides;

  - the frame is padded above the crest, which otherwise sits a pixel or so
    above the top edge and comes out shaved flat, and trimmed at the sides to
    where the arc actually meets the bottom row, so that stretching the band
    across a window puts its two ends in the two corners.

Run from the project root:  python3 tools/prep-moon.py
"""

import math
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = pathlib.Path(
    "/home/zafrin/Downloads/Gemini_Generated_Image_2fen1z2fen1z2fen.png"
)
OUT = pathlib.Path("public/moon.webp")

# Written a little larger than the page draws it, so there is something in hand
# on a wide monitor. Past about this the file grows and the picture does not.
BAND_W = 1500

# Room above the crest, in source pixels.
PAD = 4

# Finding the limb: how bright counts as planet, and how deep a run of it has to
# be before a column believes it. A star is a pixel or two.
LIT = 30
RUN = 10

# How far inside the fitted circle the colour is taken as trustworthy, and how
# far it is then carried back out past it.
ERODE = 5
EDGE = 7

# Light, because the source is larger than the output and this is a downscale —
# a Lanczos reduction is already sharp and only wants its edges put back.
SHARPEN = dict(radius=1.2, percent=40, threshold=3)

# The source is a photograph and holds no large flats, so the encoder earns its
# keep here; past this the file grows faster than the picture improves.
QUALITY = 80


def find_limb(rgb):
    """Points along the top edge of the planet, one per column."""
    w, h = rgb.size
    px = rgb.load()
    pts = []
    for x in range(6, w - 6, 4):
        for y in range(h - RUN):
            if all(
                0.2126 * px[x, y + k][0] + 0.7152 * px[x, y + k][1] + 0.0722 * px[x, y + k][2]
                > LIT
                for k in range(RUN)
            ):
                # y == 0 means the limb is above the frame at this column, so
                # the point is the frame's edge and not the planet's.
                if y:
                    pts.append((x, y))
                break
    return pts


def fit_circle(pts):
    """Least squares, three rounds of it, dropping the worst tenth each time.

    2a·x + 2b·y + c = x² + y² is the circle written so that the unknowns are
    linear, which makes this three equations rather than an optimisation.
    """

    def once(points):
        m = [[0.0] * 3 for _ in range(3)]
        v = [0.0] * 3
        for x, y in points:
            row = (2 * x, 2 * y, 1.0)
            z = x * x + y * y
            for i in range(3):
                for j in range(3):
                    m[i][j] += row[i] * row[j]
                v[i] += row[i] * z
        # Gaussian elimination with partial pivoting.
        aug = [m[i][:] + [v[i]] for i in range(3)]
        for i in range(3):
            p = max(range(i, 3), key=lambda k: abs(aug[k][i]))
            aug[i], aug[p] = aug[p], aug[i]
            for k in range(i + 1, 3):
                f = aug[k][i] / aug[i][i]
                for j in range(i, 4):
                    aug[k][j] -= f * aug[i][j]
        out = [0.0] * 3
        for i in (2, 1, 0):
            out[i] = (aug[i][3] - sum(aug[i][j] * out[j] for j in range(i + 1, 3))) / aug[i][i]
        a, b, c = out
        return a, b, math.sqrt(c + a * a + b * b)

    cx, cy, r = once(pts)
    for _ in range(3):
        off = [abs(math.hypot(x - cx, y - cy) - r) for x, y in pts]
        cut = sorted(off)[int(len(off) * 0.9)]
        pts = [p for p, d in zip(pts, off) if d <= cut]
        cx, cy, r = once(pts)
    off = [abs(math.hypot(x - cx, y - cy) - r) for x, y in pts]
    return cx, cy, r, len(pts), sum(off) / len(off), max(off)


def spread_colour(rgb, hard, radius):
    """The colour pushed outward past `hard`, and the original kept inside it.

    A blurred premultiplied image divided by its own blurred alpha is the
    surface colour extended into the space around it — the standard way to stop
    a dark halo creeping in when something is rescaled or remasked.
    """
    blurred = [
        ImageChops.multiply(ch, hard).filter(ImageFilter.GaussianBlur(radius))
        for ch in rgb.split()
    ]
    weight = hard.filter(ImageFilter.GaussianBlur(radius)).load()

    w, h = rgb.size
    spread = []
    for ch in blurred:
        src_px = ch.load()
        out = Image.new("L", (w, h))
        out_px = out.load()
        for y in range(h):
            for x in range(w):
                a_w = weight[x, y]
                if a_w:
                    v = src_px[x, y] * 255 // a_w
                    out_px[x, y] = 255 if v > 255 else v
        spread.append(out)

    return Image.composite(rgb, Image.merge("RGB", spread), hard)


def disc_mask(size, cx, cy, r, ss=1):
    """A filled circle, supersampled and brought back down for its edge."""
    w, h = size
    m = Image.new("L", (w * ss, h * ss), 0)
    ImageDraw.Draw(m).ellipse(
        [round((cx - r) * ss), round((cy - r) * ss), round((cx + r) * ss), round((cy + r) * ss)],
        fill=255,
    )
    return m.resize((w, h), Image.LANCZOS) if ss > 1 else m


def main():
    if not SRC.exists():
        print("missing:", SRC)
        return 1

    rgb = Image.open(SRC).convert("RGB")
    w, h = rgb.size

    pts = find_limb(rgb)
    if len(pts) < 40:
        print(f"only {len(pts)} limb points — this source is not a band of planet")
        return 1
    cx, cy, r, kept, mean, worst = fit_circle(pts)
    print(f"limb: {len(pts)} points, {kept} kept | centre ({cx:.0f}, {cy:.0f}) r {r:.0f}")
    print(f"      residual mean {mean:.2f}px, worst {worst:.2f}px | crest y {cy - r:.1f}")
    if mean > 6:
        print("      residual is large — check the fit before trusting the output")

    # The colour carried out past a circle drawn just inside the limb, so the
    # arc never lands on the half-sky pixels at the very edge.
    filled = spread_colour(rgb, disc_mask((w, h), cx, cy, r - ERODE), EDGE)

    padded = Image.new("RGB", (w, h + PAD), (0, 0, 0))
    padded.paste(filled, (0, PAD))
    cy += PAD

    # Trimmed to where the arc reaches the bottom row.
    half = math.sqrt(max(0.0, r * r - (h + PAD - 1 - cy) ** 2))
    x0, x1 = int(round(cx - half)), int(round(cx + half))
    trimmed = padded.crop((x0, 0, x1, h + PAD))

    scale = BAND_W / trimmed.size[0]
    band_h = int(round(trimmed.size[1] * scale))
    band = trimmed.resize((BAND_W, band_h), Image.LANCZOS)
    band = band.filter(ImageFilter.UnsharpMask(**SHARPEN))

    out = band.convert("RGBA")
    out.putalpha(disc_mask((BAND_W, band_h), (cx - x0) * scale, cy * scale, r * scale, ss=4))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "WEBP", quality=QUALITY, method=6)

    print(f"band {BAND_W}x{band_h} ({BAND_W / band_h:.2f} : 1) from a source of {w}x{h}")
    print(f"{OUT} — {OUT.stat().st_size // 1024}K")
    return 0


if __name__ == "__main__":
    sys.exit(main())
