#!/usr/bin/env python3
"""
Builds data/muncas-emojis.json — the edit list the Muncas composition renders.

Everything here is derived from measurements of the source clip:
  · shot boundaries      → ffmpeg scene detection
  · speech bursts        → ffmpeg silencedetect
  · word timings         → each burst's words are spread over the burst in
                           proportion to the audio energy under them, so a
                           word that lands after a breath lands late
  · colour correction    → mean RGB of each shot, matched to the median shot

The transcript itself was produced with Whisper and corrected by hand; it is
the one thing in this file that a human should re-read.
"""
import json, math, os, subprocess, sys, wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "source" / "muncas-emojis.mp4"
OUT = ROOT / "data" / "muncas-emojis.json"
FPS = 30

# --------------------------------------------------------------------------
# The edit, as authored. Times are seconds in the source clip.
# --------------------------------------------------------------------------

# Shot boundaries from scene detection.
SHOTS = [
    ("intro",   0.000,  3.137),
    ("banco",   3.137,  7.708),
    ("fifa",    7.708, 14.182),
    ("camara",  14.182, 20.272),
    ("council", 20.272, 27.813),
    ("who",     27.813, 32.518),
    ("edicion", 32.518, 38.475),
    ("muncas",  38.475, 43.780),
]

# Speech bursts (silencedetect, -38dB / 0.14s) with the corrected transcript.
# `shot` ties each burst to the shot it belongs to.
BURSTS = [
    ("intro",   0.561,  3.111, "Describe tu comité en tres emojis"),
    ("banco",   3.525,  7.653, "A nuestra comisión nos representa una bomba, un fuego y un trofeo"),
    ("fifa",    8.255, 10.258, "The FIFA committee is represented by"),
    ("fifa",   10.495, 12.479, "a soccer ball, a soccer arch"),
    ("fifa",   12.678, 14.182, "and a stack of dollars"),
    ("camara", 14.680, 17.067, "A Cámara de Representantes lo representa"),
    ("camara", 17.252, 19.995, "una vaca, una bandera de Colombia y una planta"),
    ("council", 20.631, 27.333, "United Nations Security Council is represented by an Earth globe, "
                                "by a Wi-Fi signal and by a robot"),
    ("who",    28.238, 32.203, "WHO 1 is represented by a virus, the hospital and a cruise"),
    ("edicion", 32.950, 35.690, "Edición y producción lo representa una claqueta"),
    ("edicion", 35.860, 38.157, "una paleta de pinturas y un computador"),
    ("muncas", 39.322, 40.781, "A MUNCAS lo representa"),
    ("muncas", 41.051, 41.885, "cerebro"),
    ("muncas", 42.094, 43.365, "rayo y alarma"),
]

# Per shot: the label chip, and which spoken word each emoji is pinned to.
# `word` is matched against the transcript (accent- and case-insensitive);
# `row` is the order the three emojis settle into at the end of the answer.
SHOT_PLAN = {
    "intro": {
        "label": None,
        "emojis": [],
    },
    "banco": {
        "label": "GAC BANDO LATINOAMERICANO",
        "emojis": [
            {"char": "💣", "word": "bomba",  "anim": "impact"},
            {"char": "🔥", "word": "fuego",  "anim": "pop"},
            {"char": "🏆", "word": "trofeo", "anim": "bounce"},
        ],
        "row": ["🏆", "🔥", "💣"],
        "rowShake": True,
        "freeze": 0.22,
    },
    "fifa": {
        "label": "FIFA",
        "emojis": [
            {"char": "⚽️", "word": "ball",    "anim": "roll"},
            {"char": "🥅", "word": "arch",    "anim": "scale"},
            {"char": "💵", "word": "dollars", "anim": "cash"},
        ],
        "row": ["⚽️", "🥅", "💵"],
        "freeze": 0.20,
    },
    "camara": {
        "label": "CÁMARA DE REPRESENTANTES",
        "emojis": [
            {"char": "🐄", "word": "vaca",     "anim": "bounce"},
            {"char": "🇨🇴", "word": "Colombia", "anim": "wave"},
            {"char": "🌱", "word": "planta",   "anim": "grow"},
        ],
        "row": ["🐄", "🇨🇴", "🌱"],
        "freeze": 0.20,
    },
    "council": {
        "label": "SECURITY COUNCIL",
        "emojis": [
            {"char": "🌎", "word": "globe",  "anim": "spin"},
            {"char": "🛜", "word": "Wi-Fi",  "anim": "waves"},
            {"char": "🤖", "word": "robot",  "anim": "glitch"},
        ],
        "row": ["🌎", "🤖", "🛜"],
        "freeze": 0.22,
    },
    "who": {
        "label": "WHO I",
        "emojis": [
            {"char": "🦠", "word": "virus",    "anim": "float"},
            {"char": "🏥", "word": "hospital", "anim": "pop"},
            {"char": "🛳️", "word": "cruise",   "anim": "sail"},
        ],
        "row": ["🦠", "🏥", "🛳️"],
        "freeze": 0.20,
    },
    "edicion": {
        "label": "EDICIÓN & PRODUCCIÓN",
        "emojis": [
            {"char": "🎬", "word": "claqueta",   "anim": "clap"},
            {"char": "🎨", "word": "paleta",     "anim": "splash"},
            {"char": "💻", "word": "computador", "anim": "shine"},
        ],
        "row": ["🎬", "🎨", "💻"],
        "freeze": 0.22,
    },
    "muncas": {
        "label": "MUNCAS",
        "emojis": [
            {"char": "🧠", "word": "cerebro", "anim": "pop"},
            {"char": "⚡️", "word": "rayo",    "anim": "impact"},
            {"char": "🚨", "word": "alarma",  "anim": "siren"},
        ],
        "row": ["🧠", "🚨", "⚡️"],
        "rowPunch": True,
        "freeze": 0.42,
    },
}

# Words the subtitles should lift out of the white. Everything else is white.
ACCENT_RED = {
    "bomba", "fuego", "trofeo", "dollars", "robot", "virus", "rayo", "alarma",
    "cerebro", "emojis",
}
ACCENT_BLUE = {
    "ball", "arch", "globe", "wi-fi", "vaca", "colombia", "planta", "claqueta",
    "paleta", "computador", "hospital", "cruise", "tres",
}

LEAD_IN = 0.22   # video kept before the first word of a shot
TAIL = 0.30      # video kept after the last word of a shot


# --------------------------------------------------------------------------
# Measurement helpers
# --------------------------------------------------------------------------

def load_envelope(path: Path, hop: float = 0.01):
    """RMS energy of the source audio, one value every `hop` seconds."""
    wav = path.parent / "muncas-envelope.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(path),
         "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)],
        check=True,
    )
    with wave.open(str(wav)) as w:
        sr = w.getframerate()
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    wav.unlink()

    n = int(sr * hop)
    usable = len(pcm) // n * n
    frames = pcm[:usable].reshape(-1, n).astype(np.float64) / 32768.0
    rms = np.sqrt((frames ** 2).mean(axis=1))
    # A floor keeps a quiet word from collapsing to zero width.
    return np.maximum(rms, rms.max() * 0.02), hop


def strip_accents(s: str) -> str:
    import unicodedata
    return "".join(
        c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn"
    )


def align_words(text: str, start: float, end: float, env, hop: float):
    """
    Spread a burst's words across [start, end] in proportion to the audio
    energy under them, so pauses inside a burst push later words later.
    """
    words = text.split()
    if not words:
        return []

    i0, i1 = int(start / hop), max(int(end / hop), int(start / hop) + 1)
    window = env[i0:i1]
    if window.size == 0:
        window = np.ones(1)

    cumulative = np.concatenate([[0.0], np.cumsum(window)])
    total = cumulative[-1]

    # A word's share of the burst is driven by its length; short function
    # words get a floor so they stay readable.
    weights = np.array([max(len(strip_accents(w).strip(",.¿?¡!")), 2) for w in words],
                       dtype=np.float64)
    edges = np.concatenate([[0.0], np.cumsum(weights) / weights.sum()]) * total

    times = np.interp(edges, cumulative, np.arange(len(cumulative)) * hop + start)

    out = []
    for w, a, b in zip(words, times[:-1], times[1:]):
        out.append({"word": w, "start": round(float(a), 3), "end": round(float(b), 3)})
    out[-1]["end"] = round(end, 3)
    return out


def shot_colour(src: Path, shots):
    """Mean RGB per shot, and the gains that match each shot to the median."""
    from PIL import Image
    import tempfile

    measured = {}
    with tempfile.TemporaryDirectory() as tmp:
        for name, a, b in shots:
            samples = []
            for frac in (0.25, 0.5, 0.75):
                t = a + (b - a) * frac
                png = Path(tmp) / f"{name}-{frac}.png"
                subprocess.run(
                    ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                     "-ss", f"{t:.3f}", "-i", str(src), "-frames:v", "1",
                     "-vf", "scale=180:-1", str(png)], check=True)
                samples.append(np.asarray(Image.open(png).convert("RGB"), dtype=np.float64) / 255)
            a_ = np.concatenate([s.reshape(-1, 3) for s in samples])
            measured[name] = a_.mean(axis=0)

    rgb = np.array(list(measured.values()))
    target = np.median(rgb, axis=0)
    target_lum = float(np.median(rgb @ np.array([0.2126, 0.7152, 0.0722])))

    corrections = {}
    for name, mean in measured.items():
        lum = float(mean @ np.array([0.2126, 0.7152, 0.0722]))
        # Exposure: nudge a third of the way to the median, and never far.
        exposure = float(np.clip(1 + (target_lum / lum - 1) * 0.55, 0.90, 1.12))
        # White balance: same idea, per channel, normalised so it only shifts
        # colour and leaves brightness to the exposure term.
        gains = np.clip(1 + (target / mean - 1) * 0.5, 0.94, 1.07)
        gains = gains / float(gains @ np.array([0.2126, 0.7152, 0.0722]))
        corrections[name] = {
            "exposure": round(exposure, 4),
            "gain": [round(float(g), 4) for g in gains],
            "measuredRgb": [round(float(v), 4) for v in mean],
        }
    return corrections


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------

def main():
    if not SOURCE.exists():
        sys.exit(f"Source clip not found: {SOURCE}")

    env, hop = load_envelope(SOURCE)
    colour = shot_colour(SOURCE, SHOTS)

    # Word timings, per burst, in source time.
    words_by_shot = {name: [] for name, _, _ in SHOTS}
    for shot, a, b, text in BURSTS:
        words_by_shot[shot].extend(align_words(text, a, b, env, hop))

    segments = []
    timeline = 0.0

    for name, shot_a, shot_b in SHOTS:
        plan = SHOT_PLAN[name]
        words = words_by_shot[name]
        if not words:
            continue

        src_in = max(shot_a, words[0]["start"] - LEAD_IN)
        src_out = min(shot_b, words[-1]["end"] + TAIL)
        freeze = plan.get("freeze", 0.0)

        def rel(t):
            """Source time → seconds from the start of this segment."""
            return round(t - src_in, 3)

        captions = [
            {
                "word": w["word"],
                "start": rel(w["start"]),
                "end": rel(w["end"]),
                "accent": accent_of(w["word"]),
            }
            for w in words
        ]

        emojis = []
        for spec in plan["emojis"]:
            hit = find_word(words, spec["word"])
            if hit is None:
                sys.exit(f"{name}: no word matching {spec['word']!r} in the transcript")
            emojis.append({
                "char": spec["char"],
                "anim": spec["anim"],
                "at": rel(hit["start"]),
            })

        segments.append({
            "id": name,
            "label": plan["label"],
            "srcIn": round(src_in, 3),
            "srcOut": round(src_out, 3),
            "durationInSeconds": round(src_out - src_in, 3),
            "freezeInSeconds": freeze,
            "timelineStart": round(timeline, 3),
            "captions": captions,
            "emojis": emojis,
            "row": plan.get("row", []),
            "rowShake": plan.get("rowShake", False),
            "rowPunch": plan.get("rowPunch", False),
            "colour": colour[name],
        })
        timeline += (src_out - src_in) + freeze

    doc = {
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "source": "source/muncas-emojis.mp4",
        "title": {"line1": "DESCRIBE TU COMITÉ", "line2": "EN", "count": "3", "line3": "EMOJIS"},
        "totalInSeconds": round(timeline, 3),
        # Measured: the voices sit at -17.3 LUFS, the bed at -19.6 LUFS before
        # gain. 0.15 puts the bed about 18 dB under the voices — present, never
        # competing. Raise or lower this one number to taste.
        "musicVolume": 0.15,
        "sfxVolume": 0.34,
        "segments": segments,
    }

    write_freeze_frames(segments)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(f"  {len(segments)} segments, {doc['totalInSeconds']}s "
          f"(source is 43.78s — {round(43.78 - timeline, 2)}s of pauses removed)")
    for s in segments:
        print(f"  {s['id']:8} {s['timelineStart']:6.2f}s  "
              f"{s['durationInSeconds']:5.2f}s + {s['freezeInSeconds']:.2f}s freeze  "
              f"{len(s['captions']):2d} words  {''.join(e['char'] for e in s['emojis'])}")


def write_freeze_frames(segments):
    """
    One still per segment, taken from the last frame of its slice. The freeze
    is a held still rather than a paused video: Remotion can show an image
    frame-accurately, and it keeps the three emoji on screen for a beat before
    the hard cut.
    """
    out_dir = ROOT / "public" / "freeze"
    out_dir.mkdir(parents=True, exist_ok=True)
    for seg in segments:
        if seg["freezeInSeconds"] <= 0:
            continue
        t = seg["srcOut"] - 1.5 / FPS
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-ss", f"{t:.3f}", "-i", str(SOURCE), "-frames:v", "1",
             "-q:v", "2", str(out_dir / f"{seg['id']}.jpg")], check=True)
    print(f"  freeze frames → public/freeze/ ({len([s for s in segments if s['freezeInSeconds'] > 0])})")


def accent_of(word: str) -> str:
    key = strip_accents(word.lower()).strip(",.¿?¡!")
    if key in {strip_accents(w) for w in ACCENT_RED}:
        return "red"
    if key in {strip_accents(w) for w in ACCENT_BLUE}:
        return "blue"
    return "white"


def find_word(words, target: str):
    key = strip_accents(target.lower())
    for w in words:
        if strip_accents(w["word"].lower()).strip(",.¿?¡!") == key:
            return w
    return None


if __name__ == "__main__":
    main()
