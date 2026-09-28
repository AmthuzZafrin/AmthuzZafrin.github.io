"""Turn a phone photo of a certificate into a cropped, web-sized asset.

    python3 tools/prep-cert.py <in.jpg> <out.webp> [--rotate 90] [--inset l,t,r,b]

The inset is per-side, in percent of the image. It is given rather than detected
on purpose: an earlier version tried to find the sheet by looking for pixels that
were bright and near-neutral, which fails on exactly these photos — on one of
them the desk is BRIGHTER than the paper, so the mask swallowed the background
and put the "corners" on the frame edge. Two files do not justify real edge
detection; reading the margins off the image once is more reliable and honest.
"""

import sys
from PIL import Image

LONG_EDGE = 1800  # shown at up to ~660 CSS px, so this covers a retina display
QUALITY = 90


def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default


def main():
    src, out = sys.argv[1], sys.argv[2]
    rot = int(arg('--rotate', 0))
    inset = [float(v) for v in arg('--inset', '0,0,0,0').split(',')]

    im = Image.open(src).convert('RGB')
    if rot:
        im = im.rotate(rot, expand=True)

    w, h = im.size
    l, t, r, b = inset
    im = im.crop((round(w * l / 100), round(h * t / 100),
                  round(w * (1 - r / 100)), round(h * (1 - b / 100))))

    scale = LONG_EDGE / max(im.size)
    if scale < 1:
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=QUALITY, method=6)
    print(f'{out}  {im.size}  ratio={im.width / im.height:.3f}')


main()
