"""Pull the 25 prophets' names out of DD.pdf in correct logical order.

pdftotext -raw emits the Arabic as right-to-left runs bracketed by U+202B/U+202C,
laid out in visual order. Each run is internally logical, so restoring the text
means reversing the ORDER of the runs while leaving each run alone. Two further
quirks: a name can wrap onto its own line above the one carrying the dash, and a
run that opens the name puts its vowel mark before the letter it belongs to.
"""
import re
import subprocess
import sys
import unicodedata

RLE, PDF = '‫', '‬'
PDF_PATH = '/home/zafrin/Documents/amthuz_port/DD.pdf'


def runs_to_logical(visual):
    """Reverse the run order; each run is already in logical order."""
    runs, buf = [], ''
    for ch in visual:
        if ch in (RLE, PDF):
            if buf:
                runs.append(buf)
            buf = ''
        else:
            buf += ch
    if buf:
        runs.append(buf)
    # Strip the spaces first: they fall out of the run splitting, and a leading
    # one would hide the opening vowel mark from the fix below.
    text = re.sub(r'\s+', '', ''.join(reversed(runs)))
    # A run that opens the name carries its vowel mark ahead of the letter the
    # mark belongs to; every other mark is already in place.
    m = re.match(r'^([\u064B-\u0652\u0670]+)(.)', text)
    if m:
        text = m.group(2) + m.group(1) + text[m.end():]
    return text


def main():
    raw = subprocess.run(['pdftotext', '-enc', 'UTF-8', '-raw', PDF_PATH, '-'],
                         capture_output=True, text=True, check=True).stdout
    lines = [l.rstrip() for l in raw.split('\n') if l.strip()]

    entries, carry = [], ''
    for line in lines:
        if '—' not in line:           # a name that wrapped onto its own line
            carry = line
            continue
        visual, latin = line.split('—', 1)
        # A wrapped word sits on its own line ABOVE the rest of the name, so it
        # leads. Each half is reversed separately — concatenating first would
        # bury the carried word at the end.
        arabic = runs_to_logical(visual)
        if carry:
            arabic = runs_to_logical(carry) + ' ' + arabic
        carry = ''
        latin = latin.strip().rstrip('‫‬ﷺ').strip()
        entries.append((arabic, latin))

    if len(entries) != 25:
        sys.exit(f'expected 25 names, got {len(entries)}')

    # Every vowel mark must sit on a letter. If one leads a word, or follows
    # only other marks with no base, the run reversal went wrong.
    bad = []
    for arabic, latin in entries:
        for i, ch in enumerate(arabic):
            if unicodedata.category(ch) != 'Mn':
                continue
            j = i - 1
            while j >= 0 and unicodedata.category(arabic[j]) == 'Mn':
                j -= 1
            if j < 0 or unicodedata.category(arabic[j]) != 'Lo':
                bad.append(f'{latin}: mark U+{ord(ch):04X} at {i} has no base letter')
    for b in bad:
        print('  !!', b)
    print(f'{len(bad)} orphaned marks across {len(entries)} names')
    print()

    for arabic, latin in entries:
        marks = sum(1 for c in arabic if unicodedata.category(c) == 'Mn')
        cps = ' '.join(f'{ord(c):04X}' for c in arabic)
        print(f'{latin:12s} {marks} marks   {cps}')

    print()
    for arabic, latin in entries:
        slug = re.sub(r"[^a-z0-9]+", '-', latin.lower()).strip('-')
        # a straight apostrophe would close the JS string literal
        safe = latin.replace("'", '\u2019')
        print(f"  {{ slug: '{slug}', ar: '{arabic}', name: '{safe}' }},")


main()
