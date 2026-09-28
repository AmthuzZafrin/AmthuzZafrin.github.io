#!/usr/bin/env python3
"""Prepare the sticker strip that runs along the foot of the contact page.

The sources are background-removed PNGs at around 500px square and 190kB each
— four and a half megabytes for a row of decoration that is never drawn taller
than about seventy pixels. Each one is trimmed to its own content, scaled to
three times the height it is shown at, and written as a lossy WebP with the
alpha kept.

Trimming matters more than the scaling does: these were cut out by an
automatic background remover, so most of them carry a wide margin of fully
transparent pixels. Left in, that margin is what sets the spacing in the row,
and the stickers end up sitting at distances from each other that have nothing
to do with how they look.

Run from the project root:  python3 tools/prep-stickers.py
"""

import json
import pathlib
import sys

from PIL import Image

SRC = pathlib.Path("/home/zafrin/Documents/amthuz_port")
OUT = pathlib.Path("public/stickers")

# Three times the tallest the strip is ever drawn, so it stays sharp on a 2x
# screen with room to spare.
HEIGHT = 210

# In the order given, less the nine taken out afterwards.
FILES = [
    "500+_free_watercolor_pattern_clipart___more-removebg-preview.png",
    "sticker_vintage_pink___Download_free_vector_of_A_red_candle_tied_with_pink_ribbon_bow_illustrat-removebg-preview.png",
    "Kawaii_Cute_Sweets_PNG_Bundle_-_Etsy_UK-removebg-preview.png",
    "Kawaii_Avocado_Sticker_Design___-removebg-preview.png",
    "Ilustración_de_alta_calidad_de_pastel_de_chocolate_con_cerezas-removebg-preview.png",
    "Pin_by_K1m___͙_on_Épingles_créées_par_vous___Cute_dog_drawing__Puppy_drawing-removebg-preview.png",
    "Perfume_Romântico_Rosa_Pintado_à_Mão_PNG___Perfume_Romântico_Rosa_Pintado_à_Mão_PNG___Fita_Rosa__Laço_Rosa_Imagem_PNG_e_PSD_Para_Download_Gratuito-removebg-preview.png",
    "Flower_Cartoon_Images_-_Free_Download_on_Freepik-removebg-preview.png",
    "cute_Valentine_s_treats-removebg-preview.png",
    "Download_premium_png_of_PNG_A_rabbit_rodent_animal_mammal__by_Extra_about_cute_bunny__cute_kawaii_drawings__cute_drawings_chibi__chibi_cute_kawaii_animals__and_kawaii_png_14450975-removebg-preview.png",
    "Cute_Ghost_Clipart_for_Halloween_Decorations_and_Crafts-removebg-preview.png",
    "1102326446325378518-removebg-preview.png",
    "893612751114024835-removebg-preview.png",
    "1107392995898001457-removebg-preview.png",
]


def main():
    missing = [f for f in FILES if not (SRC / f).exists()]
    if missing:
        print("missing:", *missing, sep="\n  ")
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()

    manifest = []
    before = after = 0

    for i, name in enumerate(FILES, 1):
        path = SRC / name
        before += path.stat().st_size

        im = Image.open(path).convert("RGBA")
        # Trim to what is actually drawn. A threshold rather than getbbox(),
        # because the remover leaves a fringe of nearly-transparent pixels that
        # getbbox() counts as content.
        alpha = im.getchannel("A").point(lambda v: 255 if v > 12 else 0)
        box = alpha.getbbox()
        if box:
            im = im.crop(box)

        w, h = im.size
        im = im.resize((max(1, round(w * HEIGHT / h)), HEIGHT), Image.LANCZOS)

        slug = f"s{i:02d}.webp"
        im.save(OUT / slug, "WEBP", quality=86, method=6)
        after += (OUT / slug).stat().st_size
        manifest.append({"src": slug, "w": im.size[0], "h": im.size[1]})

    aspects = sum(m["w"] / m["h"] for m in manifest)
    print(json.dumps(manifest, indent=1))
    print(f"\n{len(manifest)} stickers  {before // 1024}K -> {after // 1024}K")
    # What the row needs, as a multiple of one sticker's height: the sum of the
    # aspect ratios. The CSS sizes the strip off this.
    print(f"sum of aspect ratios: {aspects:.2f}  (row width = {aspects:.2f} x height)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
