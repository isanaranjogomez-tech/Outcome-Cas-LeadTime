#!/usr/bin/env python3
"""
Builds data/muncas-tier.json — the edit list for "TIER LIST WITH MUNCAS".

Every dead gap that gets removed sits between two measured speech spans, so no
word loses a syllable. The reaction after "insulting your president" is the
funniest beat in the take and is left whole on purpose.

Items and tiers are what is actually said: ten prompts, each followed by the
tier its speaker calls out.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "muncas-tier.json"
FPS = 30

# Dead air removed, in source seconds. Each one falls inside a measured silence.
# 23.05-23.62 removes the hand-over beat around the 23rd second — the signal
# that the turn was changing — without touching a word on either side.
CUTS = [(5.80, 6.88), (17.55, 18.30), (23.05, 23.62), (30.20, 31.85),
        (35.35, 36.00), (40.30, 40.90), (45.00, 46.30), (47.50, 48.25),
        (51.45, 52.10)]
SRC_IN, SRC_OUT = 0.20, 58.00
INTRO_END = 2.15          # the hook shot ends here

# label, tier, second it is named, second the tier is called
ITEMS = [
    ("CITE UN RESOLUTIONS", "S", 2.82, 7.68),
    ("NAVIGATE POINTS & MOTIONS", "A", 8.54, 12.86),
    ("20-MIN UNMOD CAUCUS", "C", 13.44, 17.20),
    ("SPEECH FROM YOUR PHONE", "D", 18.56, 22.94),
    ("INSULT THE PRESIDENT", "F", 23.80, 28.66),
    ("YOUR BLOC SIGNS FIRST", "B", 32.22, 36.68),
    ("DRESS SO WELL", "B", 37.70, 41.58),
    ("A RESOLUTION THAT SURVIVES", "C", 42.28, 47.16),
    ("CAUCUS, FORGOT THE TOPIC", "D", 48.60, 53.00),
    ("FORGET YOUR COMMITTEE NAME", "F", 53.48, 57.42),
]

# start, end, text — what is heard, for the captions.
LINES = [
    (2.82, 5.50, "Citing specific UN resolutions|by number in your speech"),
    (7.08, 7.68, "S tier"),
    (8.54, 11.22, "Perfectly navigating points|and motions to control the floor"),
    (12.12, 12.86, "A tier"),
    (13.44, 15.68, "Passing a 20-minute|unmoderated caucus"),
    (16.76, 17.20, "C tier"),
    (18.56, 22.10, "Reading your entire opening|speech directly from your phone"),
    (22.48, 22.94, "D tier"),
    (23.80, 26.70, "Accidentally insulting your|president during your speech"),
    (28.20, 28.66, "F tier"),
    (32.22, 35.02, "Making everyone in your bloc|sign your resolution first"),
    (36.26, 36.68, "B tier"),
    (37.70, 39.84, "Dressing so well|that the president notices"),
    (41.18, 41.58, "B tier"),
    (42.28, 44.56, "Writing a good resolution|that doesn't get deleted"),
    (46.70, 47.16, "C tier"),
    (48.60, 51.10, "Asking for a caucus|and forgetting the topic"),
    (52.48, 53.00, "D tier"),
    (53.48, 56.16, "Forgetting the real name|for your own committee"),
    (56.88, 57.42, "F tier"),
]

# Punch-ins: the reactions worth leaning into (source seconds).
ZOOMS = [(22.94, 23.90), (26.70, 28.90), (39.84, 41.00), (56.16, 57.60)]


def keeps():
    """The source ranges that survive, in order."""
    out, cursor = [], SRC_IN
    for a, b in CUTS:
        out.append((cursor, a))
        cursor = b
    out.append((cursor, SRC_OUT))
    return out


KEEPS = keeps()


def to_timeline(t: float) -> float:
    """Source second → timeline second, across the removed gaps."""
    acc = 0.0
    for a, b in KEEPS:
        if t < a:
            return round(acc, 4)
        if t <= b:
            return round(acc + (t - a), 4)
        acc += b - a
    return round(acc, 4)


def main() -> None:
    segments, cursor_frames = [], 0
    for a, b in KEEPS:
        frames = round((b - a) * FPS)
        segments.append({"srcIn": round(a, 4), "frames": frames,
                         "from": cursor_frames})
        cursor_frames += frames

    body = cursor_frames
    final_card = round(1.5 * FPS)
    closing = round(1.5 * FPS)

    data = {
        "fps": FPS, "width": 1080, "height": 1920,
        "source": "source/muncas-tier.mp4",
        "music": "audio/tier.ogg",
        "introFrames": round((INTRO_END - SRC_IN) * FPS),
        "segments": segments,
        "tiers": ["S", "A", "B", "C", "D", "F"],
        "items": [{"label": l, "tier": t,
                   "showAt": round(to_timeline(s) * FPS),
                   "placeAt": round(to_timeline(p) * FPS)}
                  for l, t, s, p in ITEMS],
        "captions": [{"text": tx, "from": round(to_timeline(s) * FPS),
                      "to": round(to_timeline(e) * FPS)}
                     for s, e, tx in LINES],
        "zooms": [{"from": round(to_timeline(s) * FPS), "to": round(to_timeline(e) * FPS)}
                  for s, e in ZOOMS],
        "bodyFrames": body,
        "finalCardFrames": final_card,
        "closingFrames": closing,
        "totalFrames": body + final_card + closing,
        "musicVolume": 0.12,
        "sfxVolume": 0.5,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {OUT.relative_to(ROOT)}  {data['totalFrames']} frames  "
          f"{data['totalFrames'] / FPS:.2f} s  ({len(CUTS)} silencios cortados)")


if __name__ == "__main__":
    main()
