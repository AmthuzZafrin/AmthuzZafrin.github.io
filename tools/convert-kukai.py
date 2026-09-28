"""Convert the sign-language GIFs to animated WebP with a clean alpha channel.

Some frames in the source GIFs carry no transparency index at all — their
background is laid down as solid near-white. Straight conversion leaves those
frames as opaque white cards that flash once per loop.

Keying out every near-white pixel would punch holes in the pale hands, so the
background is found by flooding inward from the border instead: the hands have a
dark outline, so the fill stops at them.
"""
import glob
import os
import re
import sys
from PIL import Image, ImageSequence

SRC = '/home/zafrin/Documents/amthuz_port'
DST = '/home/zafrin/Documents/amthuz_portfolio/public/kukai'
SIZE = 132
WHITE = 232  # a channel at or above this counts as background, if reachable


def strip_background(rgba):
    """Alpha-out every background-coloured pixel connected to the border."""
    w, h = rgba.size
    px = rgba.load()

    def is_bg(x, y):
        r, g, b, a = px[x, y]
        return a < 10 or (r >= WHITE and g >= WHITE and b >= WHITE)

    border = [(x, y) for x in range(w) for y in (0, h - 1)]
    border += [(x, y) for y in range(h) for x in (0, w - 1)]
    if all(px[x, y][3] < 10 for x, y in border):
        return rgba  # already clean, nothing to do

    seen = bytearray(w * h)
    stack = [p for p in border if is_bg(*p)]
    for x, y in stack:
        seen[y * w + x] = 1
    while stack:
        x, y = stack.pop()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_bg(nx, ny):
                seen[ny * w + nx] = 1
                stack.append((nx, ny))
    return rgba


def main():
    os.makedirs(DST, exist_ok=True)
    total = 0
    for path in sorted(glob.glob(os.path.join(SRC, 'sign-*.gif'))):
        slug = re.sub(r'^sign-\d+-|\s*\(1\)$', '', os.path.splitext(os.path.basename(path))[0])
        im = Image.open(path)
        frames, durations = [], []
        for frame in ImageSequence.Iterator(im):
            rgba = strip_background(frame.convert('RGBA'))
            frames.append(rgba.resize((SIZE, SIZE), Image.LANCZOS))
            durations.append(frame.info.get('duration', 60))
        out = os.path.join(DST, slug + '.webp')
        # The GIF's background index rides along in .info and the WebP writer
        # rejects it, so hand it a clean frame to save from.
        first = frames[0].copy()
        first.info = {}
        first.save(out, save_all=True, append_images=frames[1:], duration=durations,
                   loop=0, quality=80, method=4, background=(0, 0, 0, 0))
        kb = os.path.getsize(out) // 1024
        total += kb
        print(f'{slug:12s} {SIZE}x{SIZE} frames={len(frames)} {kb}KB')
    print(f'total {total}KB')


main()
