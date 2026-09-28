"""Education page assets: the school photograph and the HSC mark certificate.

The mark certificate is a DigiLocker PDF — an A4 page whose content stops a
third of the way down, so it is rendered at 300dpi and cropped to the drawn
border rather than to the page. Cropping to the page would put a third of a
blank sheet in the layout and shrink the type that has to stay readable. It
stands nearly the full height of the section, so it is rendered larger than it
is ever displayed and left to the browser to sample down.

The photograph is only converted: it arrived already cut out of its background,
so every pixel it has is kept rather than thrown away to a thumbnail. It is
written outside public/ because the section does not currently show it — parked
rather than deleted, so putting it back is a move and not a re-run.
"""
import os
import subprocess
import tempfile

from PIL import Image, ImageChops

DST = '/home/zafrin/Documents/amthuz_portfolio/public/education'
PARKED = '/home/zafrin/Documents/amthuz_portfolio/tools/assets/education'
PHOTO = '/home/zafrin/Downloads/bharathiyar_school_clean.png'
SHEET = '/home/zafrin/Downloads/12th_digi_no_photo.pdf'

# Room for the drawn border to breathe once it is on a dark page.
PAD = 10


def ink_box(im):
    """The bounding box of everything that is not paper."""
    diff = ImageChops.difference(im.convert('RGB'), Image.new('RGB', im.size, (255, 255, 255)))
    return diff.convert('L').point(lambda p: 255 if p > 18 else 0).getbbox()


def main():
    os.makedirs(DST, exist_ok=True)
    os.makedirs(PARKED, exist_ok=True)

    photo = Image.open(PHOTO).convert('RGB')
    out = os.path.join(PARKED, 'bharathiyar-school.webp')
    photo.save(out, quality=90, method=6)
    print(f'school photo {photo.size} {os.path.getsize(out) // 1024}KB')

    with tempfile.TemporaryDirectory() as tmp:
        stem = os.path.join(tmp, 'p')
        subprocess.run(['pdftoppm', '-r', '300', '-png', '-f', '1', '-l', '1', SHEET, stem],
                       check=True)
        sheet = Image.open(stem + '-1.png').convert('RGB')

    l, t, r, b = ink_box(sheet)
    sheet = sheet.crop((max(0, l - PAD), max(0, t - PAD),
                        min(sheet.width, r + PAD), min(sheet.height, b + PAD)))
    sheet.thumbnail((1550, 2100), Image.LANCZOS)
    out = os.path.join(DST, 'hsc-marksheet.webp')
    sheet.save(out, quality=88, method=6)
    print(f'mark certificate {sheet.size} {os.path.getsize(out) // 1024}KB')


main()
