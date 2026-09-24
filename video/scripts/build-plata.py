#!/usr/bin/env python3
"""
Builds data/muncas-plata.json — the edit list for "Adivina la plata".

The spans come from an RMS-envelope segmentation of the source and the words
from Whisper (medium, cross-checked with small on the closing guesses), block
by block. Nothing here is invented: every caption is something said out loud,
and the only two amounts anyone names are 85 and 50.

The game, as recorded: eight "¿con tu plata puedo…?" questions, then two
guesses — 85 ("no") and 50 ("sí"). The player on the LEFT holds $100.000 and
is the one who guesses; the player on the RIGHT holds the $50.000 she guesses.
So the winner label belongs to the left, not to the right.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "muncas-plata.json"
FPS = 30
SOURCE = "source/muncas-plata.mp4"

W, R, B, M = "white", "red", "blue", "money"


def cap(start, end, *runs):
    """A caption line: cap(t0, t1, ("TEXTO", colour), …). Times are source s."""
    return {"start": start, "end": end,
            "runs": [{"text": t, "color": c} for t, c in runs]}


def mark(kind, start, end, text=""):
    return {"kind": kind, "text": text, "start": start, "end": end}


# id, src in, src out, zoom from → to, origin x/y, chips, captions, marks
SEGMENTS = [
    # Hook: the two hosts, and the title. No money chips here — different shot.
    ("intro", 0.05, 2.05, 1.08, 1.16, 0.50, 0.40, False, [], []),

    # The two players, and the chips that tell the audience what they hold.
    ("setup", 3.60, 5.30, 1.06, 1.10, 0.50, 0.45, True,
     [cap(3.86, 4.80, ("Y MI PLATA ES…", W))], []),

    ("q-avion", 6.10, 9.60, 1.06, 1.12, 0.50, 0.45, True,
     [cap(6.30, 8.75, ("¿UN ", W), ("TIQUETE DE AVIÓN", B), ("?", W))],
     [mark("no", 9.02, 9.60)]),

    ("q-disney", 10.25, 14.55, 1.08, 1.14, 0.50, 0.45, True,
     [cap(10.44, 13.80, ("¿PUEDO IR A ", W), ("DISNEY", B), ("?", W))],
     [mark("no", 14.12, 14.55)]),

    ("q-zara", 19.40, 24.15, 1.06, 1.14, 0.50, 0.45, True,
     [cap(19.58, 22.20, ("¿", W), ("ROPA EN ZARA", B), ("?", W))],
     [mark("si", 23.68, 24.15)]),

    ("q-helado-a", 32.80, 35.05, 1.06, 1.12, 0.50, 0.45, True,
     [cap(32.86, 34.95, ("¿CON TU PLATA PUEDO…?", W))], []),

    # The long pause after "un helado" is the joke, so it stays.
    ("q-helado-b", 39.05, 44.70, 1.14, 1.22, 0.50, 0.42, True,
     [cap(39.12, 40.50, ("¿UN ", W), ("HELADO", B), ("? 🍦", W)),
      cap(42.72, 44.70, ("NO… O SEA, ", W), ("SÍ", B))],
     [mark("thinking", 40.70, 42.40)]),

    ("q-viaje-a", 50.75, 53.05, 1.06, 1.12, 0.50, 0.45, True,
     [cap(50.86, 53.00, ("¿CON TU PLATA PUEDO…?", W))], []),

    ("q-viaje-b", 53.80, 58.15, 1.10, 1.18, 0.50, 0.44, True,
     [cap(53.94, 55.60, ("¿IRME DE VIAJE ", W), ("CÓMODAMENTE", B), ("?", W)),
      cap(56.42, 58.15, ("DEPENDE DE DÓNDE VAYAS", R))], []),

    ("q-accesorios", 59.75, 63.50, 1.06, 1.14, 0.50, 0.45, True,
     [cap(59.82, 62.45, ("¿", W), ("ACCESORIOS", B), ("?", W))],
     [mark("si", 63.10, 63.50)]),

    ("q-pantalones", 75.40, 80.00, 1.08, 1.16, 0.50, 0.44, True,
     [cap(75.56, 77.70, ("¿CUATRO ", W), ("PANTALONES", B), ("? ¿DOS?", W)),
      cap(78.54, 80.00, ("SÍ, PUES", B))], []),

    # First guess: 85. It misses.
    ("guess-85", 85.50, 88.40, 1.12, 1.20, 0.50, 0.44, True,
     [cap(87.92, 88.40, ("NO", R))],
     [mark("amount", 85.66, 87.80, "¿$85K?")]),

    # The win: she says 50, and the answer is yes. Punch in on the LEFT player.
    ("winner", 88.50, 93.70, 1.10, 1.22, 0.40, 0.44, True,
     [cap(88.64, 90.70, ("TU PLATA ES…", W))],
     [mark("amount-win", 90.88, 92.60, "¡$50K!"),
      mark("winner", 92.10, 93.70)]),

    ("closing", None, 1.60, 1.0, 1.0, 0.5, 0.5, False, [], []),
]

# Absolute timeline seconds are filled in below; these are (segment id, offset).
SFX = [
    ("intro", 0.00, "cash", 0.9),
    ("setup", 0.45, "pop", 0.8),
    ("setup", 0.62, "pop", 0.8),
    ("q-avion", 9.02 - 6.10, "buzzer", 0.32),
    ("q-disney", 14.12 - 10.25, "buzzer", 0.32),
    ("q-zara", 23.68 - 19.40, "ding", 0.45),
    ("q-helado-b", 40.70 - 39.05, "tick", 0.5),
    ("q-helado-b", 41.30 - 39.05, "tick", 0.5),
    ("q-helado-b", 41.90 - 39.05, "tick", 0.5),
    ("q-accesorios", 63.10 - 59.75, "ding", 0.45),
    ("guess-85", 85.66 - 85.50, "pop", 0.9),
    ("guess-85", 87.92 - 85.50, "buzzer", 0.5),
    ("winner", 90.88 - 88.50, "ding", 1.0),
    ("winner", 90.98 - 88.50, "shine", 0.6),
    ("winner", 92.10 - 88.50, "clap", 0.8),
    ("winner", 92.18 - 88.50, "cash", 0.7),
    ("closing", 0.00, "whoosh", 0.5),
]


def main() -> None:
    segments, cursor_frames, starts = [], 0, {}

    for sid, a, b, zf, zt, ox, oy, chips, caps, marks in SEGMENTS:
        frames = round((b if a is None else b - a) * FPS)
        cursor = cursor_frames / FPS
        starts[sid] = cursor
        segments.append({
            "id": sid,
            "kind": "closing" if sid == "closing" else "video",
            "srcIn": a,
            "durationInSeconds": round(frames / FPS, 4),
            "timelineStart": round(cursor, 4),
            "zoomFrom": zf, "zoomTo": zt, "originX": ox, "originY": oy,
            "chips": chips,
            "captions": [
                {**c, "start": round(c["start"] - a, 3), "end": round(c["end"] - a, 3)}
                for c in caps
            ],
            "marks": [
                {**m, "start": round(m["start"] - a, 3), "end": round(m["end"] - a, 3)}
                for m in marks
            ],
        })
        cursor_frames += frames

    sfx = [{"at": round(starts[sid] + off, 4), "name": name, "gain": gain}
           for sid, off, name, gain in SFX]

    data = {
        "fps": FPS, "width": 1080, "height": 1920,
        "source": SOURCE,
        "title": "ADIVINA LA PLATA",
        "leftAmount": "$100K", "rightAmount": "$50K",
        "segments": segments,
        "sfx": sfx,
        "sfxVolume": 0.5,
        "musicVolume": 0.0,
        "totalInSeconds": round(cursor_frames / FPS, 4),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {OUT.relative_to(ROOT)}  {cursor_frames / FPS:.2f} s  {len(segments)} segmentos")


if __name__ == "__main__":
    main()
