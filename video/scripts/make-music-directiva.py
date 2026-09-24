#!/usr/bin/env python3
"""
Writes public/audio/directiva.ogg — an original 120 BPM electro-pop / funky
electronic bed, written around this edit rather than looped under it.

Nothing is sampled. Every bar is built from the section it belongs to, so no
two members arrive over the same pattern:

  bar 0-1    intro, filter opening
  bar 2-4    Secretaria General          four-on-the-floor, funky 16th bass
  bar 5-7    Secretario General Adjunto  half-time kick, shaker, off-beat stabs
  bar 8-10   Director Académico          syncopated kick, vocal chop hook
  bar 11-13  Directoras de Prensa        broken beat, toms, open hats
  bar 14-16  Directoras de Logística     driving kick, double-time hats, chop
  bar 17-18  outro

Each section is: a held-back run-up bar, a bar that lands full on the freeze,
and a bar that grooves and ends on a fill with a beat of silence before the
next downbeat.

Run: python3 scripts/make-music-directiva.py
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48_000
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
STEP = BEAT / 4                     # a sixteenth
BARS = 19
DUR = BARS * BAR
N = int(DUR * SR)

OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "directiva.ogg"
rng = np.random.default_rng(514)


# ---------------------------------------------------------------- helpers ---
def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def env_exp(n, tau, attack=0.002):
    x = np.arange(n) / SR
    return np.clip(x / max(attack, 1e-6), 0, 1) * np.exp(-x / tau)


def lp(x, cutoff):
    c = np.full(len(x), cutoff, dtype=np.float64) if np.isscalar(cutoff) else np.asarray(cutoff)
    a = 1.0 - np.exp(-2 * np.pi * np.clip(c, 20, SR / 2.2) / SR)
    y = np.empty(len(x))
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp(x, cutoff):
    return np.asarray(x, dtype=np.float64) - lp(x, cutoff)


def bp(x, f0, q=6.0):
    """Two-pole resonator — used for the formants of the vocal chop."""
    w = 2 * np.pi * f0 / SR
    r = np.exp(-w / (2 * q))
    a1, a2 = -2 * r * np.cos(w), r * r
    b0 = (1 - r * r) * 0.5
    y = np.zeros(len(x))
    z1 = z2 = 0.0
    for i in range(len(x)):
        v = b0 * x[i] - a1 * z1 - a2 * z2
        y[i] = v - z2 * 0.0
        z2, z1 = z1, v
    return y


def saw(freq, n, phase=0.0):
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    return 2 * ((np.cumsum(f) / SR + phase) % 1.0) - 1


def square(freq, n, duty=0.5):
    return np.where((np.arange(n) * freq / SR) % 1.0 < duty, 1.0, -1.0)


# ------------------------------------------------------------------ voices ---
def kick():
    n = int(0.42 * SR)
    x = np.arange(n) / SR
    f = 46 + (132 - 46) * np.exp(-x / 0.026)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.125)
    click = rng.normal(0, 1, n) * np.exp(-x / 0.0018) * 0.4
    return np.tanh((body + click) * 1.6) * 0.95


def clap():
    n = int(0.36 * SR)
    x = np.arange(n) / SR
    body = lp(hp(rng.normal(0, 1, n), 1100), 4200)
    out = np.zeros(n)
    for k, d in enumerate((0.0, 0.008, 0.017, 0.026)):
        i = int(d * SR)
        out[i:] += body[: n - i] * np.exp(-np.arange(n - i) / SR / 0.010) * (1.0 - 0.18 * k)
    out += body * np.exp(-x / 0.10) * 0.45
    return out * 0.5


def snap():
    n = int(0.13 * SR)
    x = np.arange(n) / SR
    return (lp(hp(rng.normal(0, 1, n), 2200), 8000) * np.exp(-x / 0.009)
            + np.sin(2 * np.pi * 2450 * x) * np.exp(-x / 0.016) * 0.35) * 0.55


def hat(dur=0.05, tone=7000):
    n = int(dur * SR)
    x = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), tone) * np.exp(-x / (dur / 3.6)) * 0.28


def shaker():
    n = int(0.09 * SR)
    x = np.arange(n) / SR
    return lp(hp(rng.normal(0, 1, n), 4200), 11000) * (x / 0.012) * np.exp(-x / 0.022) * 0.30


def tom(f0):
    n = int(0.26 * SR)
    x = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-x / 0.05))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.10) * 0.55


def rim():
    n = int(0.08 * SR)
    x = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1700 * x) + np.sin(2 * np.pi * 2600 * x) * 0.6) * np.exp(-x / 0.008) * 0.4


def chop(freq, dur=0.22, vowel="ah"):
    """An abstract vocal-ish blip: saw through three formants. No words."""
    n = int(dur * SR)
    src = saw(freq, n) * 0.6 + square(freq * 0.5, n, 0.45) * 0.2
    fs = (700, 1220, 2600) if vowel == "ah" else (430, 830, 2760)
    out = bp(src, fs[0], 9) * 1.0 + bp(src, fs[1], 11) * 0.6 + bp(src, fs[2], 13) * 0.3
    out *= env_exp(n, dur / 3.2, 0.012)
    return out / (np.abs(out).max() + 1e-9) * 0.5


KICK, CLAP, SNAP, RIM = kick(), clap(), snap(), rim()
HAT, HATO, SHK = hat(), hat(0.20, 6200), shaker()

# --------------------------------------------------------------- harmony ----
# A rotating progression: no bar repeats its predecessor's chord.
NAMED = {
    "Am": (110.00, [220.00, 261.63, 329.63]),
    "F":  (87.31, [174.61, 220.00, 261.63]),
    "C":  (130.81, [261.63, 329.63, 392.00]),
    "G":  (98.00, [196.00, 246.94, 293.66]),
    "Dm": (73.42, [146.83, 174.61, 220.00]),
    "Bb": (116.54, [233.08, 293.66, 349.23]),
}
PROG = ["Am", "Am",            # intro
        "Am", "F", "C",        # 1 Secretaria General
        "G", "Am", "F",        # 2 Secretario General Adjunto
        "C", "G", "Am",        # 3 Director Académico
        "F", "C", "G",         # 4 Directoras de Prensa
        "Dm", "Bb", "F",       # 5 Directoras de Logística
        "C", "Am"]             # outro

# Per member: kick steps, hat plan, bass steps, stab steps, extras.
GROOVES = [
    dict(kick=[0, 4, 8, 12], hats="8", bass=[0, 3, 6, 8, 11, 14],
         stabs=[6, 14], extra=None),
    dict(kick=[0, 6, 8, 14], hats="shaker", bass=[0, 2, 6, 8, 10, 14],
         stabs=[2, 6, 10, 14], extra="rim"),
    dict(kick=[0, 4, 7, 8, 12, 15], hats="16", bass=[0, 3, 4, 7, 8, 11, 12, 15],
         stabs=[0, 8], extra="chop"),
    dict(kick=[0, 6, 10, 12], hats="open", bass=[0, 4, 6, 10, 12],
         stabs=[3, 7, 11], extra="toms"),
    dict(kick=[0, 4, 8, 12, 14], hats="16fast", bass=[0, 2, 3, 6, 8, 10, 11, 14],
         stabs=[0, 4, 8, 12], extra="chop"),
]

SECTIONS = [(2 + 3 * i, 4 + 3 * i) for i in range(5)]
FREEZE_BARS = [s[0] + 1 for s in SECTIONS]
RUNUP_BARS = {s[0] for s in SECTIONS}
LAST_BARS = {s[1] for s in SECTIONS}


def bar_time(b):
    return b * BAR


drums = np.zeros(N)
bass = np.zeros(N)
stabs = np.zeros(N)
pad = np.zeros(N)
chops = np.zeros(N)
fx = np.zeros(N)
kicks: list[float] = []


def section_of(b):
    for i, (a, z) in enumerate(SECTIONS):
        if a <= b <= z:
            return i
    return None


for b in range(BARS):
    root, triad = NAMED[PROG[b]]
    t0 = bar_time(b)
    sec = section_of(b)
    g = GROOVES[sec] if sec is not None else GROOVES[0]
    runup = b in RUNUP_BARS
    last = b in LAST_BARS
    playing = sec is not None or b in (1, 17)

    # --- kick -------------------------------------------------------------
    if playing:
        for s in g["kick"]:
            # the run-up keeps only the strong beats: it has to feel held back
            if runup and s % 4:
                continue
            at = t0 + s * STEP
            if last and s >= 14:            # a beat of air before the next hit
                continue
            place(drums, KICK, at, 1.0)
            kicks.append(at)

    # --- clap / snap ------------------------------------------------------
    if playing and not runup:
        for s in (4, 12):
            place(drums, CLAP, t0 + s * STEP, 0.95)
        if sec in (1, 4):
            place(drums, SNAP, t0 + 6 * STEP, 0.5)
        if sec == 3:
            place(drums, SNAP, t0 + 14 * STEP, 0.45)

    # --- hats / shaker ----------------------------------------------------
    if playing:
        plan = g["hats"]
        steps = {"8": range(0, 16, 2), "16": range(16), "16fast": range(16),
                 "open": range(0, 16, 2), "shaker": range(0, 16, 2)}[plan]
        for s in steps:
            at = t0 + s * STEP
            if last and s >= 14:
                continue
            if plan == "shaker":
                place(drums, SHK, at, 0.9 if s % 4 == 2 else 0.5)
            elif plan == "open" and s % 8 == 6:
                place(drums, HATO, at, 0.55)
            else:
                acc = 0.95 if s % 4 == 2 else 0.5
                place(drums, HAT, at, acc * (0.7 if runup else 1.0))
        if plan == "16fast" and not runup:
            for s in range(1, 16, 2):
                place(drums, HAT, t0 + s * STEP, 0.3)

    # --- extras -----------------------------------------------------------
    if playing and not runup:
        if g["extra"] == "rim":
            for s in (3, 11):
                place(drums, RIM, t0 + s * STEP, 0.55)
        if g["extra"] == "toms":
            for s, f in ((7, 150), (13, 118)):
                place(drums, tom(f), t0 + s * STEP, 0.7)

    # --- bass -------------------------------------------------------------
    if playing:
        for s in g["bass"]:
            if runup and s % 4:
                continue
            if last and s >= 14:
                continue
            at = t0 + s * STEP
            n = int(0.19 * SR)
            f = root / 2
            e = env_exp(n, 0.075, 0.004)
            cut = 170 + 1100 * np.exp(-np.arange(n) / SR / 0.045)
            v = lp(saw(f, n) * 0.55 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.7, cut)
            place(bass, np.tanh(v * 1.7) * e, at, 0.52 if not runup else 0.4)

    # --- synth stabs ------------------------------------------------------
    if playing and not runup:
        for s in g["stabs"]:
            at = t0 + s * STEP
            n = int(0.30 * SR)
            e = env_exp(n, 0.07, 0.004)
            v = np.zeros(n)
            for f in triad:
                v += saw(f * 2, n, rng.random()) + saw(f * 2 * 1.006, n, rng.random())
            v /= 6
            cut = 1600 + 6000 * np.exp(-np.arange(n) / SR / 0.035)
            place(stabs, lp(v, cut) * e, at, 0.34)

    # --- vocal chop -------------------------------------------------------
    if playing and not runup and g["extra"] == "chop":
        seq = [0, 2, 1, 2] if sec == 2 else [2, 1, 0, 1]
        for k, s in enumerate((2, 6, 10, 14)):
            f = triad[seq[k]] * 2
            sig = chop(f, 0.20, "ah" if k % 2 == 0 else "oh")
            place(chops, sig, t0 + s * STEP, 0.34)
            place(chops, sig, t0 + s * STEP + 3 * STEP, 0.14)

    # --- pad --------------------------------------------------------------
    n = int(BAR * SR)
    x = np.arange(n) / SR
    chord = np.zeros(n)
    for f in triad:
        for det in (-8, 0, 8):
            chord += saw(f * (1 + det / 10000.0), n, rng.random())
    chord /= 9
    swell = np.clip(x / 0.10, 0, 1) * (1 - 0.22 * x / BAR)
    cut = 3000 if (playing and not runup) else 800
    level = 0.17 if (playing and not runup) else 0.10
    place(pad, lp(chord, cut) * swell, t0, level)

    # --- fills: the last beat of every section, and one before each freeze --
    if last:
        for k, s in enumerate((12, 13, 14, 15)):
            at = t0 + s * STEP
            if k < 2:
                place(fx, SNAP, at, 0.5 + 0.15 * k)
            else:
                place(fx, tom(190 - 30 * k), at, 0.55)
        n = int(BEAT * SR)
        xr = np.arange(n) / SR
        r = xr / xr[-1]
        up = lp(hp(rng.normal(0, 1, n), 500), 900 + 11000 * r ** 2) * r ** 2
        place(fx, up, t0 + 12 * STEP, 0.45)

# --- risers into each freeze, and the impact that lands on it --------------
for b in FREEZE_BARS:
    at = bar_time(b) - BEAT * 2
    n = int(BEAT * 2 * SR)
    x = np.arange(n) / SR
    r = x / x[-1]
    sweep = lp(hp(rng.normal(0, 1, n), 400), 500 + 10000 * r ** 2) * r ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(240 * 2 ** (r * 1.4)) / SR) * r ** 3
    place(fx, sweep * 0.55 + tone * 0.22, at, 0.6)

    n = int(1.0 * SR)
    x = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(58 * np.exp(-x / 0.22) + 33) / SR) * np.exp(-x / 0.32)
    crack = lp(hp(rng.normal(0, 1, n), 1600), 10000) * np.exp(-x / 0.09)
    place(fx, sub * 0.9 + crack * 0.32, bar_time(b), 0.95)

# ------------------------------------------------------------- sidechain ----
duck = np.ones(N)
for at in kicks:
    i = int(at * SR)
    n = int(0.28 * SR)
    shape = 0.32 + 0.68 * (1 - np.exp(-np.arange(n) / SR / 0.070))
    j = min(N, i + n)
    duck[i:j] = np.minimum(duck[i:j], shape[: j - i])

mix = drums + (bass + pad + stabs + chops) * duck + fx

open_n = int(BAR * 2 * SR)
mix[:open_n] = lp(mix[:open_n], 260 + 10000 * (np.arange(open_n) / open_n) ** 2)

tail = int(BAR * SR)
mix[-tail:] *= np.linspace(1, 0.0, tail) ** 0.7

mix = np.tanh(mix * 1.18)
mix *= 0.90 / np.abs(mix).max()

OUT.parent.mkdir(parents=True, exist_ok=True)
raw = OUT.with_suffix(".wav")
with wave.open(str(raw), "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(raw), "-c:a", "libopus", "-b:a", "160k", str(OUT)], check=True)
raw.unlink()
print(f"✓ {OUT.name}  {DUR:.1f} s  {BPM:.0f} BPM  {BARS} compases, 5 grooves distintos")
