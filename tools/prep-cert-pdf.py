"""Turn a certificate PDF into the web-sized asset the gallery shows.

    python3 tools/prep-cert-pdf.py <in.pdf> <out.webp> [--long-edge 2100]

The companion to prep-cert.py, which takes a photograph. A PDF needs no
cropping — the page is already the certificate — so the whole job is rendering
it large enough for a retina display and encoding it the same way the rest of
the set was encoded, which is what keeps one card's worth of artwork looking
like the next one's.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

LONG_EDGE = 1600  # the size the rest of the gallery was rendered at
QUALITY = 90


def main():
    src, out = sys.argv[1], sys.argv[2]
    # A sheet shown at full height rather than in a card wants more than the
    # gallery's 1600 — the education mark sheets are rendered taller.
    long_edge = int(sys.argv[sys.argv.index('--long-edge') + 1]
                    if '--long-edge' in sys.argv else LONG_EDGE)

    with tempfile.TemporaryDirectory() as tmp:
        stem = Path(tmp) / 'page'
        # -r is not used: the page boxes in this set vary, and asking for a
        # size in pixels gives every certificate the same one whatever its
        # points. -scale-to takes the longer side, so a portrait sheet and a
        # landscape one come out equally big rather than equally wide.
        subprocess.run(
            ['pdftoppm', '-png', '-singlefile', '-scale-to', str(long_edge),
             src, str(stem)],
            check=True,
        )
        im = Image.open(f'{stem}.png').convert('RGB')

    im.save(out, 'WEBP', quality=QUALITY, method=6)
    print(f'{out}  {im.size}  ratio={im.width / im.height:.3f}')


main()
