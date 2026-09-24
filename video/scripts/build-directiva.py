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
BAR = 80          # frames, at 90 BPM
INTRO = 2 * BAR   # 160
BLOCK = 2 * BAR   # every member owns exactly two bars
OUTRO = 2 * BAR

# id, role line 1, role line 2, names, anchor side, x nudge, y of the block.
# The nudge is what pushes the type across each subject, so the body always
# cuts into the words instead of sitting beside them.
# …, x nudge, y of the block, type size, frames of run-up. Each member holds
# two bars; the split between run-up and pose differs, so the five freezes land
# on five different beats — three on the pulse, two syncopated.
MEMBERS = [
    ("sg", "SECRETARIA", "GENERAL", ["María Angélica Hoyos"], "left", 170, 246, 196, 60),
    # Three lines for the adjunto: his shoulders sat right across the middle
    # of a two-line block, so only the tail of the first line hides now.
    ("sga", "SECRETARIO", "GENERAL", ["Jerónimo Padilla"], "left", 184, 214, 142, 40, "ADJUNTO"),
    ("academico", "DIRECTOR", "ACADÉMICO", ["José Alejandro Reyes"], "left", 300, 140, 196, 80),
    ("prensa", "DIRECTORAS", "DE PRENSA", ["Gabriela Valbuena", "Juana Pineda"], "right", 210, 140, 196, 70),
    ("logistica", "DIRECTORAS", "DE LOGÍSTICA", ["Sara Mora", "María José Cujar"], "left", 150, 140, 196, 50),
]


def main() -> None:
    members, cursor = [], INTRO
    for entry in MEMBERS:
        mid, l1, l2, names, side, tx, ty, size, move = entry[:9]
        l3 = entry[9] if len(entry) > 9 else ""
        members.append({
            "id": mid,
            "roleLine1": l1,
            "roleLine2": l2,
            "roleLine3": l3,
            "names": names,
            "side": side,
            "textX": tx,
            "textY": ty,
            "fontSize": size,
            "from": cursor,
            "moveFrames": move,
            "holdFrames": BLOCK - move,
            "video": f"source/directiva/{mid}.mp4",
            "plate": f"freeze/directiva/{mid}.jpg",
            "cutout": f"freeze/directiva/{mid}-cut.png",
        })
        cursor += BLOCK

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
