#!/usr/bin/env python3
"""
Builds data/muncas-mitos.json.

Each myth is one complete sentence. Word timings come from the audio energy
under each sentence, the same method the other MUNCAS pieces use, so the
captions land on the words rather than on a guess.
"""
import json, subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "source" / "muncas-mitos.mp4"
FREEZE = ROOT / "public" / "freeze"
OUT = ROOT / "data" / "muncas-mitos.json"
FPS = 30
STAMP_HOLD = 0.50  # the frozen beat the FALSO stamp lands on

INTRO = (0.80, 2.55, "Mitos de MUNCAS")

# start, end, the sentence, and the phrases to lift out of the white.
MITOS = [
    (3.20, 5.25, "Para ser el mejor delegado tienes que hablar mucho",
     {"mejor delegado": "red", "hablar mucho": "blue"}),
    (5.62, 9.15, "En el comité de fotografía los delegados que tienen la mejor cámara son los que destacan",
     {"mejor cámara": "red"}),
    (9.66, 11.15, "En prensa no se hace nada",
     {"prensa": "blue", "no se hace nada": "red"}),
    (11.34, 13.65, "Es súper recomendable usar tacones",
     {"tacones": "red"}),
    (14.68, 18.12, "Que los delegados de logística no se pueden vestir lindos durante el modelo",
     {"logística": "blue", "vestir lindos": "red"}),
    (18.18, 21.55, "Que los delegados de logística solo trabajan durante el modelo",
     {"logística": "blue", "solo trabajan": "red"}),
    (22.02, 25.74, "Una buena investigación consiste solo en buscar estadísticas",
     {"estadísticas": "red"}),
    (25.82, 30.20, "Para ser el mejor delegado debes imponer toda tu perspectiva a lo largo del comité",
     {"mejor delegado": "blue", "imponer": "red"}),
]


def envelope(path: Path, hop: float = 0.01):
    wav = path.parent / "_mitos_env.wav"
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(path),
                    "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", str(wav)], check=True)
    with wave.open(str(wav)) as w:
        sr = w.getframerate()
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    wav.unlink()
    n = int(sr * hop)
    frames = pcm[: len(pcm) // n * n].reshape(-1, n).astype(np.float64) / 32768.0
    rms = np.sqrt((frames ** 2).mean(axis=1))
    return np.maximum(rms, rms.max() * 0.02), hop


def strip(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s.lower())
                   if unicodedata.category(c) != "Mn")


def align(text, start, end, env, hop):
    words = text.split()
    i0, i1 = int(start / hop), max(int(end / hop), int(start / hop) + 1)
    window = env[i0:i1]
    cumulative = np.concatenate([[0.0], np.cumsum(window)])
    weights = np.array([max(len(strip(w)), 2) for w in words], dtype=np.float64)
    edges = np.concatenate([[0.0], np.cumsum(weights) / weights.sum()]) * cumulative[-1]
    times = np.interp(edges, cumulative, np.arange(len(cumulative)) * hop + start)
    return [{"word": w, "start": float(a), "end": float(b)}
            for w, a, b in zip(words, times[:-1], times[1:])]


def accents(words, phrases):
    """Colour every word of a highlighted phrase, matching on whole words."""
    keys = [strip(w).strip(",.") for w in (x["word"] for x in words)]
    out = ["white"] * len(words)
    for phrase, colour in phrases.items():
        target = strip(phrase).split()
        for i in range(len(keys) - len(target) + 1):
            if keys[i:i + len(target)] == target:
                for j in range(i, i + len(target)):
                    out[j] = colour
    return out


def main():
    env, hop = envelope(SOURCE)
    FREEZE.mkdir(parents=True, exist_ok=True)

    segments, timeline = [], 0.0

    a, b, text = INTRO
    words = align(text, a, b, env, hop)
    segments.append({
        "id": "intro", "kind": "intro", "srcIn": round(a, 3), "srcOut": round(b, 3),
        "durationInSeconds": round(b - a, 3), "holdInSeconds": 0.0,
        "timelineStart": 0.0, "still": None,
        "captions": [{"word": w["word"], "start": round(w["start"] - a, 3),
                      "end": round(w["end"] - a, 3), "accent": "white"} for w in words],
    })
    timeline += b - a

    for n, (a, b, text, phrases) in enumerate(MITOS, start=1):
        words = align(text, a, b, env, hop)
        colours = accents(words, phrases)
        still = f"freeze/mito-{n}.jpg"
        subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                        "-ss", f"{b - 1.5 / FPS:.3f}", "-i", str(SOURCE), "-frames:v", "1",
                        "-q:v", "2", str(ROOT / "public" / still)], check=True)
        segments.append({
            "id": f"mito{n}", "kind": "myth",
            "srcIn": round(a, 3), "srcOut": round(b, 3),
            "durationInSeconds": round(b - a, 3),
            "holdInSeconds": STAMP_HOLD,
            "timelineStart": round(timeline, 3),
            "still": still,
            "captions": [{"word": w["word"], "start": round(w["start"] - a, 3),
                          "end": round(w["end"] - a, 3), "accent": c}
                         for w, c in zip(words, colours)],
        })
        timeline += (b - a) + STAMP_HOLD

    doc = {
        "fps": FPS, "width": 1080, "height": 1920,
        "source": "source/muncas-mitos.mp4",
        "title": "MITOS DE MUNCAS XX",
        "closingInSeconds": 1.6,
        "musicVolume": 0.30,
        "sfxVolume": 0.30,
        "totalInSeconds": round(timeline + 1.6, 3),
        "segments": segments,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

    print(f"{len(MITOS)} mitos · total {doc['totalInSeconds']} s")
    for s in segments:
        hi = " ".join(c["word"] for c in s["captions"] if c["accent"] != "white")
        print(f"  {s['id']:7} {s['timelineStart']:6.2f}s {s['durationInSeconds']:5.2f}s"
              f"  {len(s['captions']):2d}w   destacado: {hi}")


if __name__ == "__main__":
    main()
