#!/usr/bin/env python3
"""
Builds data/muncas-letras.json — the "Adivina el comité según la letra" round.

The cut is authored in the EDIT table below; word timings are the only thing
measured, and they come from the audio energy under each spoken burst, the
same way the emoji reel does it. No colour analysis: the source is already
evenly lit.
"""
import json, subprocess, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "source" / "muncas-letras.mp4"
OUT = ROOT / "data" / "muncas-letras.json"
FPS = 30

# Speech bursts (silencedetect, -36 dB) with the transcript corrected by hand.
BURSTS = [
    (0.176, 3.578, "Adivina el comité según la letra con MUNCAS"),
    (3.916, 5.046, "La letra es S"),
    (5.257, 5.963, "Security Council"),
    (6.392, 7.556, "La letra es C"),
    (8.320, 9.139, "Corte del Distrito Sur"),
    (9.406, 10.552, "La letra es F"),
    (10.953, 11.563, "FIFA"),
    (12.173, 13.320, "La letra es U"),
    (15.534, 16.204, "UNODC"),
    (16.667, 18.115, "La letra es M"),
    (25.099, 25.715, "Mesa de Diálogo"),
    (26.302, 27.520, "La letra es G"),
    (28.139, 28.795, "GAC"),
]

RED = {"muncas", "s", "c", "f", "u", "m", "g"}
BLUE = {"security", "council", "corte", "distrito", "sur", "fifa", "unodc",
        "mesa", "diálogo", "gac", "comité", "letra"}

# The edit. `kind` drives the camera move; everything else is what goes on top.
EDIT = [
    dict(id="intro",   src=(0.10, 3.66),  kind="push",  score=(0, 0)),

    dict(id="letter-s", src=(3.86, 5.24),  kind="push",  letter="S", score=(0, 0)),
    dict(id="answer-s", src=(5.16, 6.12),  kind="punch", score=(0, 0),
         point=dict(side="left", at=0.34)),

    dict(id="letter-c", src=(6.30, 8.05),  kind="push",  letter="C", score=(1, 0)),
    dict(id="answer-c", src=(8.24, 9.28),  kind="punch", score=(1, 0),
         point=dict(side="right", at=0.46), banner=dict(text="EMPATE", at=0.72)),

    dict(id="letter-f", src=(9.34, 10.92), kind="push",  letter="F", score=(1, 1)),
    dict(id="answer-f", src=(10.84, 11.78), kind="punch", score=(1, 1),
         point=dict(side="right", at=0.30),
         banner=dict(text="POR MILISEGUNDOS", at=0.52)),

    dict(id="letter-u", src=(12.10, 13.52), kind="push",  letter="U", score=(1, 2)),
    dict(id="think-u",  src=(13.52, 14.92), kind="creep", score=(1, 2),
         banner=dict(text="PROCESANDO…", at=0.24)),
    dict(id="answer-u", src=(15.42, 16.34), kind="punch", score=(1, 2),
         point=dict(side="left", at=0.26), banner=dict(text="2 — 2  EMPATE", at=0.54)),

    dict(id="letter-m", src=(16.58, 18.58), kind="push",  letter="M", score=(2, 2)),
    # The long think: three jump cuts out of seven seconds of silence.
    dict(id="think-m1", src=(18.62, 19.48), kind="creep", score=(2, 2),
         banner=dict(text="…", at=0.10)),
    dict(id="think-m2", src=(20.80, 21.58), kind="punch", score=(2, 2),
         banner=dict(text="PROCESANDO…", at=0.06)),
    dict(id="think-m3", src=(23.95, 24.78), kind="creep", score=(2, 2)),
    dict(id="answer-m", src=(24.96, 25.92), kind="punch", score=(2, 2),
         point=dict(side="right", at=0.22)),

    dict(id="letter-g", src=(26.20, 28.00), kind="push",  letter="G", score=(2, 3),
         tension=True),
    dict(id="answer-g", src=(28.02, 28.98), kind="punch", score=(2, 3),
         point=dict(side="right", at=0.24)),

    # The close reuses a beat from the M silence.
    dict(id="winner",  src=(21.00, 22.60), kind="punch", score=(2, 4), winner=True),
]

LEAD = 0.0  # the table already carries hand-set in/out points


def load_envelope(path: Path, hop: float = 0.01):
    wav = path.parent / "_env.wav"
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i",
                    str(path), "-vn", "-ac", "1", "-ar", "16000", "-c:a",
                    "pcm_s16le", str(wav)], check=True)
    with wave.open(str(wav)) as w:
        sr = w.getframerate()
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    wav.unlink()
    n = int(sr * hop)
    frames = pcm[: len(pcm) // n * n].reshape(-1, n).astype(np.float64) / 32768.0
    rms = np.sqrt((frames ** 2).mean(axis=1))
    return np.maximum(rms, rms.max() * 0.02), hop


def strip_accents(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def accent_of(word):
    key = strip_accents(word.lower()).strip(",.¿?¡!…")
    if key in {strip_accents(w) for w in RED}:
        return "red"
    if key in {strip_accents(w) for w in BLUE}:
        return "blue"
    return "white"


def align(text, start, end, env, hop):
    words = text.split()
    i0, i1 = int(start / hop), max(int(end / hop), int(start / hop) + 1)
    window = env[i0:i1]
    if window.size == 0:
        window = np.ones(1)
    cumulative = np.concatenate([[0.0], np.cumsum(window)])
    weights = np.array([max(len(strip_accents(w).strip(",.")), 2) for w in words],
                       dtype=np.float64)
    edges = np.concatenate([[0.0], np.cumsum(weights) / weights.sum()]) * cumulative[-1]
    times = np.interp(edges, cumulative, np.arange(len(cumulative)) * hop + start)
    out = [{"word": w, "start": float(a), "end": float(b), "accent": accent_of(w)}
           for w, a, b in zip(words, times[:-1], times[1:])]
    out[-1]["end"] = end
    return out


def main():
    env, hop = load_envelope(SOURCE)

    words = []
    for a, b, text in BURSTS:
        words.extend(align(text, a, b, env, hop))

    segments = []
    timeline = 0.0
    for spec in EDIT:
        src_in, src_out = spec["src"]
        duration = src_out - src_in

        captions = [
            {"word": w["word"],
             "start": round(max(0.0, w["start"] - src_in), 3),
             "end": round(min(duration, w["end"] - src_in), 3),
             "accent": w["accent"]}
            for w in words
            if w["end"] > src_in + 0.04 and w["start"] < src_out - 0.04
        ]

        seg = {
            "id": spec["id"],
            "srcIn": round(src_in, 3),
            "srcOut": round(src_out, 3),
            "durationInSeconds": round(duration, 3),
            "timelineStart": round(timeline, 3),
            "kind": spec["kind"],
            "score": list(spec["score"]),
            "captions": captions,
        }
        if "letter" in spec:
            # The letter card lands on the letter itself, the last word spoken.
            seg["letter"] = spec["letter"]
            seg["letterAt"] = round(captions[-1]["start"], 3) if captions else 0.5
        if "point" in spec:
            seg["point"] = spec["point"]
        if "banner" in spec:
            seg["banner"] = spec["banner"]
        if spec.get("tension"):
            seg["tension"] = True
        if spec.get("winner"):
            seg["winner"] = True

        segments.append(seg)
        timeline += duration

    doc = {
        "fps": FPS, "width": 1080, "height": 1920,
        "source": "source/muncas-letras.mp4",
        "title": {"line1": "ADIVINA EL COMITÉ", "line2": "SEGÚN LA LETRA",
                  "kicker": "MUNCAS EDITION"},
        "players": {"left": "DIRECTOR", "right": "SGA"},
        "totalInSeconds": round(timeline, 3),
        "musicVolume": 0.15,
        "sfxVolume": 0.34,
        "segments": segments,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {OUT.name}: {len(segments)} segments, {doc['totalInSeconds']}s "
          f"(source 29.2s)")
    for s in segments:
        mark = s.get("letter", "") or ("+1 " + s["point"]["side"] if "point" in s else "")
        print(f"  {s['id']:10} {s['timelineStart']:6.2f}s {s['durationInSeconds']:5.2f}s "
              f"{str(tuple(s['score'])):8} {len(s['captions']):2d}w  {mark}")


if __name__ == "__main__":
    main()
