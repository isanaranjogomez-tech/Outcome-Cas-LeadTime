#!/usr/bin/env python3
"""
Builds data/muncas-directiva.json — the edit list for the MUNCAS XX directiva
montage. The grid is the music: 120 BPM, one bar = 60 frames, so every freeze
lands on a downbeat.

  intro      2 bars
  member × 5 3 bars each — 1 bar of movement, 2 bars held on the pose
  outro      2 bars
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "muncas-directiva.json"

FPS = 30
BAR = 60          # frames, at 120 BPM
INTRO = 2 * BAR
MOVE = 1 * BAR
HOLD = 2 * BAR
OUTRO = 2 * BAR

# id, role line 1, role line 2, names, anchor side, x nudge, y of the block.
# The nudge is what pushes the type across each subject, so the body always
# cuts into the words instead of sitting beside them.
MEMBERS = [
    ("sg", "SECRETARIA", "GENERAL", ["María Angélica Hoyos"], "left", 170, 246, 196),
    ("sga", "SECRETARIO", "GENERAL ADJUNTO", ["Jerónimo Padilla"], "right", 260, 236, 176),
    ("academico", "DIRECTOR", "ACADÉMICO", ["José Alejandro Reyes"], "left", 300, 140, 196),
    ("prensa", "DIRECTORAS", "DE PRENSA", ["Gabriela Valbuena", "Juana Pineda"], "right", 210, 140, 196),
    ("logistica", "DIRECTORAS", "DE LOGÍSTICA", ["Sara Mora", "María José Cujar"], "left", 150, 140, 196),
]


def main() -> None:
    members, cursor = [], INTRO
    for mid, l1, l2, names, side, tx, ty, size in MEMBERS:
        members.append({
            "id": mid,
            "roleLine1": l1,
            "roleLine2": l2,
            "names": names,
            "side": side,
            "textX": tx,
            "textY": ty,
            "fontSize": size,
            "from": cursor,
            "moveFrames": MOVE,
            "holdFrames": HOLD,
            "video": f"source/directiva/{mid}.mp4",
            "plate": f"freeze/directiva/{mid}.jpg",
            "cutout": f"freeze/directiva/{mid}-cut.png",
        })
        cursor += MOVE + HOLD

    total = cursor + OUTRO
    data = {
        "fps": FPS,
        "width": 1920,
        "height": 1080,
        "bar": BAR,
        "title": "MUNCAS XX",
        "subtitle": "MESA DIRECTIVA",
        "introFrames": INTRO,
        "outroFrames": OUTRO,
        "members": members,
        "music": "audio/directiva.ogg",
        "musicVolume": 0.82,
        "sfxVolume": 0.55,
        "totalFrames": total,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {OUT.relative_to(ROOT)}  {total} frames  {total / FPS:.2f} s")


if __name__ == "__main__":
    main()
