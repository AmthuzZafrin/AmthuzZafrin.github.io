"""Scatter a project's stickers around its button without anything touching.

Solved against the panel at its committed size. The stylesheet sizes the
stickers and the button in container units off the panel itself
(container-type: size), so one solve holds at every viewport — the whole
arrangement scales together rather than the stickers keeping their size while
the panel loses height.

    python3 tools/pack-scatter.py bubu
    python3 tools/pack-scatter.py kukai

Emit the array, paste it into src/sections/Projects.jsx. If the panel's aspect
ratio changes, or a sticker is added or resized, re-run this rather than nudging
the numbers by hand.
"""
import math
import random
import sys

PW, PH = 928, 452  # the committed panel

SETS = {
    # base is the sticker's width at scale 1; aspect is height / width
    'bubu': dict(
        base=78.2, aspect=160 / 168, btn=(184, 65),
        edge=30, gap=22, btn_gap=64,
        slugs=['cool', 'wink', 'heart', 'excited', 'celebrating', 'swirl', 'crazy',
               'confused', 'shy', 'sleepy', 'drool', 'sad', 'stressed', 'awkward'],
        scales=[1.40, 0.72, 1.32, 0.85, 1.28, 0.95, 1.35,
                0.78, 1.25, 1.00, 0.70, 1.30, 0.88, 0.92],
    ),
    'kukai': dict(
        base=86.0, aspect=1.0, btn=(196, 65),
        edge=12, gap=8, btn_gap=40,
        slugs=['a', 'b', 'c', 'd', 'f', 'i', 'l', 'v', 'w', 'y',
               'hello', 'yes', 'good', 'bad', 'stop', 'you',
               'call-me', 'i-love-you', 'come-here', 'small'],
        # six deliberately large, the rest a spread of smaller ones
        scales=[1.50, 0.78, 1.42, 0.86, 1.38, 0.72, 1.45, 0.92, 1.35, 0.80,
                1.40, 0.88, 0.75, 1.02, 0.84, 0.95, 0.70, 0.98, 0.82, 1.05],
    ),
    # Words rather than pictures: each name has its own measured box at scale 1
    # (taken off the page with --word-fs at 7cqh), so there is no single base.
    'deen': dict(
        # Words rather than pictures: each name has its own box, measured off the
        # page at --word-fs: 7cqh and scale 1, so there is no single base size.
        boxes=[(65.5, 50.4), (57.3, 51.6), (62.1, 49.5), (40.3, 49.2), (57.5, 47.9), (72.3, 48.2), (68.6, 52.7), (59.2, 49.1), (68.0, 51.5), (56.7, 50.3), (80.3, 49.4), (45.2, 50.7), (55.0, 47.4), (55.2, 49.3), (70.3, 48.5), (60.7, 50.1), (39.4, 48.6), (68.4, 50.0), (52.3, 49.5), (53.0, 49.3), (41.5, 49.1), (37.5, 48.9), (43.3, 47.4), (106.1, 49.9), (76.0, 51.5)],
        btn=(300, 66), edge=14, gap=14, btn_gap=36,
        slugs=['ibrahim', 'al-yasa', 'dawud', 'muhammad', 'musa', 'sulayman', 'harun', 'ishaq', 'shu-ayb', 'yunus', 'ismail', 'lut', 'isa', 'ayyub', 'yaqub', 'ilyas', 'nuh', 'yusuf', 'zakariya', 'salih', 'hud', 'adam', 'yahya', 'dhul-kifl', 'idris'],
        scales=[1.1, 1.2, 1.05, 1.35, 1.4, 0.9, 0.92, 1.15, 0.88, 1.3, 0.85, 1.35, 0.95, 1.25, 0.95, 1.0, 1.45, 1.0, 1.1, 0.95, 1.2, 1.3, 1.45, 0.85, 0.9],
    ),
}

FLOAT_FRAC = 0.014  # 1.4cqh of vertical drift


def solve(cfg, seed):
    rnd = random.Random(seed)
    n = len(cfg['scales'])
    fl = FLOAT_FRAC * PH
    if 'boxes' in cfg:
        w = [bw * s for (bw, _), s in zip(cfg['boxes'], cfg['scales'])]
        h = [bh * s + 2 * fl for (_, bh), s in zip(cfg['boxes'], cfg['scales'])]
    else:
        w = [cfg['base'] * s for s in cfg['scales']]
        # the float is vertical only, so it is charged to the swept height rather
        # than padded onto every side — these end up as true clearances, held at
        # every point in the animation and not just at rest
        h = [cfg['base'] * s * cfg['aspect'] + 2 * fl for s in cfg['scales']]
    edge, gap, bgap = cfg['edge'], cfg['gap'], cfg['btn_gap']
    bw, bh = cfg['btn']
    cx, cy = PW / 2, PH / 2
    btn = (cx - bw / 2 - bgap, cy - bh / 2 - bgap, cx + bw / 2 + bgap, cy + bh / 2 + bgap)

    x = [rnd.uniform(edge + w[i] / 2, PW - edge - w[i] / 2) for i in range(n)]
    y = [rnd.uniform(edge + h[i] / 2, PH - edge - h[i] / 2) for i in range(n)]

    for step in range(1800):
        pull = 0.0025 if step < 900 else 0.0
        for i in range(n):
            x[i] += (cx - x[i]) * pull
            y[i] += (cy - y[i]) * pull

        for i in range(n):
            for j in range(i + 1, n):
                ox = (w[i] + w[j]) / 2 + gap - abs(x[i] - x[j])
                oy = (h[i] + h[j]) / 2 + gap - abs(y[i] - y[j])
                if ox > 0 and oy > 0:  # separate along the cheaper axis
                    if ox < oy:
                        d = ox / 2 * (1 if x[i] > x[j] else -1)
                        x[i] += d
                        x[j] -= d
                    else:
                        d = oy / 2 * (1 if y[i] > y[j] else -1)
                        y[i] += d
                        y[j] -= d

        for i in range(n):
            l, t, r, b = x[i] - w[i] / 2, y[i] - h[i] / 2, x[i] + w[i] / 2, y[i] + h[i] / 2
            ox = min(r, btn[2]) - max(l, btn[0])
            oy = min(b, btn[3]) - max(t, btn[1])
            if ox > 0 and oy > 0:
                if ox < oy:
                    x[i] += ox * (1 if x[i] > cx else -1)
                else:
                    y[i] += oy * (1 if y[i] > cy else -1)
            x[i] = min(max(x[i], edge + w[i] / 2), PW - edge - w[i] / 2)
            y[i] = min(max(y[i], edge + h[i] / 2), PH - edge - h[i] / 2)

    min_gap = math.inf
    for i in range(n):
        for j in range(i + 1, n):
            dx = max(0, abs(x[i] - x[j]) - (w[i] + w[j]) / 2)
            dy = max(0, abs(y[i] - y[j]) - (h[i] + h[j]) / 2)
            min_gap = min(min_gap, math.hypot(dx, dy))
    min_edge = min(min(x[i] - w[i] / 2, y[i] - h[i] / 2,
                       PW - x[i] - w[i] / 2, PH - y[i] - h[i] / 2) for i in range(n))
    min_btn = math.inf
    for i in range(n):
        dx = max(0, abs(x[i] - cx) - (w[i] + bw) / 2)
        dy = max(0, abs(y[i] - cy) - (h[i] + bh) / 2)
        min_btn = min(min_btn, math.hypot(dx, dy))
    # how much the result has settled into rows, which is what a scatter must not do
    rows = sum(1 for i in range(n) for j in range(i + 1, n) if abs(y[i] - y[j]) < 14)
    return x, y, min_gap, min_edge, min_btn, rows


def main():
    name = sys.argv[1] if len(sys.argv) > 1 else 'bubu'
    cfg = dict(SETS[name])
    # optional overrides: base size, then the three clearances
    if len(sys.argv) > 2 and 'boxes' not in cfg:
        cfg['base'] = float(sys.argv[2])
    if len(sys.argv) > 5:
        cfg['edge'], cfg['gap'], cfg['btn_gap'] = (float(v) for v in sys.argv[3:6])
    best = None
    for seed in range(220):
        x, y, g, e, b, rows = solve(cfg, seed)
        if g < cfg['gap'] - 1 or e < cfg['edge'] - 1 or b < cfg['btn_gap'] - 1:
            continue
        score = (rows, -g)  # least row-like first, then the roomiest
        if best is None or score < best[0]:
            best = (score, seed, (x, y, g, e, b, rows))

    if best is None:
        print(f'no arrangement met the constraints for "{name}" — '
              f'loosen a limit or shrink the stickers')
        return

    _, seed, (x, y, g, e, b, rows) = best
    print(f'{name}: seed {seed}  minGap {g:.0f}  minEdge {e:.0f}  '
          f'minToButton {b:.0f}  rowPairs {rows}')
    print('(swept values - they hold at every point in the float)\n')
    for i in sorted(range(len(cfg['slugs'])), key=lambda i: (round(y[i]), x[i])):
        print(f"  {{ slug: '{cfg['slugs'][i]}', x: {x[i] / PW * 100:.1f}, "
              f"y: {y[i] / PH * 100:.1f}, s: {cfg['scales'][i]:.2f} }},")


main()
