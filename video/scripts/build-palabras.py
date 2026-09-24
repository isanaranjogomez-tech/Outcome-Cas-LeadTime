#!/usr/bin/env python3
"""
Builds data/muncas-palabras.json — the edit list for "7 PALABRAS, 20 INTENTOS".

Everything here is measured, not guessed. The spans come from an RMS-envelope
segmentation of the source (public/source/muncas-palabras.mp4) and the words
from a Whisper-medium pass over each speech burst, hand-checked block by block.

Three rounds are dropped whole — COMITÉ (14.3-25.1 s), ALIANZA (56.9-165 s) and
LÍDER (165-169.2 s) — leaving the seven the brief asks for. Every cut sits in a
measured silence, so no word loses its start or its end.

The attempts counter is driven by ATTEMPTS below and nothing else: each entry is
a word actually proposed out loud in the material that survives the edit. Clues
("guerra", "paloma", "cartel", "anuncio", "levantar", "norma") and thinking
noises never move it. "anuncio" is read as a third clue for PLAQUETA, not as a
guess: it is the only candidate the presenter never answers, while every real
miss in the recording draws an immediate "no" or "casi".
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "muncas-palabras.json"
FPS = 30
SOURCE = "source/muncas-palabras.mp4"

WORDS = ["DEBATE", "PAÍS", "PAZ", "MESA", "VOTO", "PLAQUETA", "REGLA"]

# id, src in, src out, zoom from → to, origin x/y, captions (source seconds).
# A `None` span is a full-screen graphic card and carries its own duration.
SEGMENTS = [
    ("intro", 0.30, 3.30, 1.16, 1.24, 0.46, 0.34, []),
    ("setup", 3.44, 4.70, 1.14, 1.20, 0.50, 0.38, [
        ("LAS PALABRAS SON…", "ok", 3.62, 4.52),
    ]),
    ("list", None, 3.00, 1.00, 1.00, 0.50, 0.50, []),

    ("r-debate", 5.40, 9.75, 1.16, 1.26, 0.50, 0.38, [
        ("DISCUSIÓN", "hint", 5.90, 6.98),
        ("¿DEBATE?", "guess", 8.08, 8.72),
        ("MUY BIEN", "ok", 8.96, 9.56),
    ]),
    ("r-pais", 10.10, 14.30, 1.15, 1.25, 0.50, 0.38, [
        ("NACIÓN", "hint", 11.22, 11.94),
        ("¿PAÍS?", "guess", 12.40, 13.58),
        ("SÍ", "ok", 13.68, 14.10),
    ]),

    # PAZ keeps its thinking, minus 0.8 s of dead air after the first clue.
    ("r-paz-a", 25.05, 26.95, 1.14, 1.20, 0.50, 0.38, [
        ("GUERRA", "hint", 25.22, 26.66),
    ]),
    ("r-paz-b", 27.75, 35.05, 1.20, 1.30, 0.50, 0.38, [
        ("¿CONFLICTO?", "guess", 28.46, 29.10),
        ("NO", "no", 29.28, 29.72),
        ("PALOMA", "hint", 31.70, 32.86),
        ("¡PAZ!", "guess", 33.28, 33.92),
        ("¡BIEN!", "ok", 34.28, 34.90),
    ]),
    ("r-mesa", 35.05, 41.35, 1.15, 1.26, 0.50, 0.38, [
        ("DIRECTIVA", "hint", 36.60, 38.14),
        ("MESA", "guess", 39.52, 40.22),
        ("MUY BIEN", "ok", 40.26, 41.30),
    ]),
    ("r-voto", 41.35, 48.60, 1.16, 1.28, 0.50, 0.38, [
        ("ELEGIR", "hint", 41.96, 43.18),
        ("¿VOTAR?", "guess", 44.70, 45.82),
        ("CASI", "no", 46.02, 46.98),
        ("¡VOTO!", "guess", 47.32, 47.86),
        ("SÍ", "ok", 47.90, 48.40),
    ]),
    ("r-plaqueta", 48.75, 56.85, 1.16, 1.28, 0.50, 0.38, [
        ("CARTEL", "hint", 50.30, 51.04),
        ("ANUNCIO", "hint", 53.12, 53.86),
        ("LEVANTAR", "hint", 54.00, 55.04),
        ("PLAQUETA", "guess", 55.56, 56.26),
        ("MUY BIEN", "ok", 56.28, 56.88),
    ]),
    ("r-regla", 169.20, 173.20, 1.16, 1.28, 0.50, 0.38, [
        ("NORMA", "hint", 170.48, 171.16),
        ("REGLA", "guess", 171.76, 172.26),
        ("MUY BIEN", "ok", 172.46, 173.00),
    ]),

    ("recap", None, 2.80, 1.00, 1.00, 0.50, 0.50, []),
    ("closing", None, 3.00, 1.00, 1.00, 0.50, 0.50, []),
]

# Every word proposed out loud, in source seconds. Seven land, two miss.
ATTEMPTS = [
    (8.10, "DEBATE", True),
    (12.42, "PAÍS", True),
    (28.50, "CONFLICTO", False),
    (33.30, "PAZ", True),
    (39.54, "MESA", True),
    (44.72, "VOTAR", False),
    (47.34, "VOTO", True),
    (55.58, "PLAQUETA", True),
    (171.78, "REGLA", True),
]

# Long pauses where a soft clock keeps the beat alive, in source seconds.
TICKS = [7.05, 7.55, 30.15, 30.65, 38.55]


def main() -> None:
    segments, cursor_frames = [], 0
    # src second → timeline second, per segment, for the events below.
    spans = []

    for sid, a, b, zf, zt, ox, oy, caps in SEGMENTS:
        # Durations are whole frames, and each segment starts where the last
        # one ends — a rounding gap of one frame would flash the background.
        frames = round((b if a is None else b - a) * FPS)
        dur = frames / FPS
        cursor = cursor_frames / FPS
        if a is None:
            src_in = None
        else:
            src_in = a
            spans.append((a, b, cursor))
        segments.append({
            "id": sid,
            "kind": sid if sid in ("list", "recap", "closing") else "video",
            "srcIn": src_in,
            "durationInSeconds": round(dur, 4),
            "timelineStart": round(cursor, 4),
            "zoomFrom": zf,
            "zoomTo": zt,
            "originX": ox,
            "originY": oy,
            "captions": [
                {"text": t, "role": r,
                 "start": round(s - a, 3), "end": round(e - a, 3)}
                for t, r, s, e in caps
            ],
        })
        cursor_frames += frames

    def to_timeline(t: float) -> float:
        for a, b, start in spans:
            if a <= t <= b:
                return round(start + (t - a), 4)
        raise ValueError(f"{t} s is not inside the edit")

    attempts = [{"at": to_timeline(t), "word": w, "correct": c}
                for t, w, c in ATTEMPTS]
    solved = [{"at": a["at"], "word": a["word"]} for a in attempts if a["correct"]]

    data = {
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "source": SOURCE,
        "words": WORDS,
        "attemptLimit": 20,
        "segments": segments,
        "attempts": attempts,
        "solved": solved,
        "ticks": [to_timeline(t) for t in TICKS],
        "sfxVolume": 0.5,
        "musicVolume": 0.0,
        "totalInSeconds": round(cursor_frames / FPS, 4),
    }

    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {OUT.relative_to(ROOT)}  {cursor_frames / FPS:.2f} s  "
          f"{len(attempts)} intentos ({sum(a['correct'] for a in attempts)} aciertos)")


if __name__ == "__main__":
    main()
