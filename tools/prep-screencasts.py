#!/usr/bin/env python3
"""Prepare the site screencasts that run on the full-stack page.

The recordings are VP8 captures of a 1829x962 desktop, seventy-seven and a
hundred-and-forty megabytes of it. Three things are wrong with shipping them
as they are: VP8 in a .webm has no Safari story, that much video is a fortnight
of somebody's data plan, and a screen capture at full desktop resolution is
carrying detail nobody will look at in a panel two thirds of a page wide.

The single largest saving is the frame rate, and it is not obvious. Both files
were written with a **1000fps timebase**, so ffmpeg faithfully encoded a
quarter of a million frames of a four-minute recording and the first attempt
came out at 60MB. Capping the rate took the same recording to 13MB and the
encode from ten and a half minutes to thirty-nine seconds. A screencast has
nothing in it that thirty frames a second cannot show.

Each entry names where the recording should start and where its poster comes
from, because the two are not always the same frame:

  - Kala Master opens on the finished page, so the poster is frame zero and
    the still and the first frame of playback are the same picture.
  - BUBU is cut to begin on the blank screen, three seconds in, so that the
    site is watched building itself. Its poster cannot be that frame — an
    empty rectangle reads as a broken video — so it is taken from the hero
    the page settles into.

Posters come from the finished mp4 rather than the source: a poster cut from
the original would carry detail the encode does not have, and would be
visibly sharper than the video that replaces it.

Run from the project root:  python3 tools/prep-screencasts.py
"""

import pathlib
import subprocess
import sys

CAPTURES = pathlib.Path("/home/zafrin/Videos/Screencasts")
OUT = pathlib.Path("public/projects")

SCREENCASTS = [
    {
        "name": "kalamaster",
        "src": CAPTURES / "Screencast from 27-09-26 04:23:38 PM IST.webm",
        # Opens on the finished page; nothing to trim.
        "start": None,
        "poster_at": "00:00:00",
    },
    {
        "name": "bubu-site",
        "src": CAPTURES / "Screencast from 27-09-26 07:05:54 PM IST.webm",
        # The first three seconds are the page as it was before the demo. The
        # recording proper begins at the blank frame, where it reloads.
        "start": "00:00:03",
        # 30s into the original, which is 27s into this — where the build-in
        # finishes and the hero is on screen.
        "poster_at": "00:00:27",
    },
    {
        "name": "deen-demo",
        "src": CAPTURES / "Screencast from 27-09-26 06:04:14 PM IST.webm",
        # Opens straight on the app, mid-question; nothing to trim.
        "start": None,
        "poster_at": "00:00:00",
    },
]

# The width the panel draws them at on a large screen. Above this is detail
# the page throws away on the way to the screen.
WIDTH = 1280
# Constant quality rather than a bitrate. A screencast is mostly static
# pixels, so a fixed bitrate spends the same on a still frame as on a scroll;
# this spends what each second needs. 30 is where text stays crisp.
CRF = 30
# See the note above. This one number is most of this file.
FPS = 30


def run(cmd):
    subprocess.run(cmd, check=True, capture_output=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    missing = [s["name"] for s in SCREENCASTS if not s["src"].exists()]
    if missing:
        print("missing source for:", ", ".join(missing))
        return 1

    for shot in SCREENCASTS:
        video = OUT / f"{shot['name']}.mp4"
        poster = OUT / f"{shot['name']}-poster.webp"
        before = shot["src"].stat().st_size

        cut = ["-ss", shot["start"]] if shot["start"] else []
        run([
            "ffmpeg", "-y", *cut, "-i", str(shot["src"]),
            # -2 rather than a number: the height is whatever keeps the aspect,
            # rounded to even, which H.264 requires.
            "-vf", f"scale={WIDTH}:-2,fps={FPS}",
            "-c:v", "libx264", "-preset", "slow", "-crf", str(CRF),
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-an",
            str(video),
        ])
        run([
            "ffmpeg", "-y", "-ss", shot["poster_at"], "-i", str(video),
            "-frames:v", "1", "-quality", "82", str(poster),
        ])

        after = video.stat().st_size
        trimmed = f", from {shot['start']}" if shot["start"] else ""
        print(f"{shot['name']:<12} {before // 1024 // 1024:>4}M -> {after // 1024 // 1024:>3}M"
              f"  ({after / before * 100:>2.0f}%){trimmed}"
              f"  | poster {poster.stat().st_size // 1024}K at {shot['poster_at']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
