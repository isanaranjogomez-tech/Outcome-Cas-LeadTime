#!/usr/bin/env python3
"""
Writes public/audio/directiva.ogg — an original instrumental for the directiva
montage: 90 BPM, hypnotic, minimal, built on a pulsing synth bass rather than
on a drop.

Nothing is sampled, there are no vocals and no borrowed melody: the riff, the
chords and the motif are written here. The reference was a feeling — a steady
eighth-note bass pulse, sparse snappy drums, a small figure that keeps coming
back — not a song.

The grid is the edit: one bar is exactly 80 frames at 30 fps, every member
enters on a downbeat, and the five poses land on five different beats, two of
them syncopated. The accents are placed at those exact times, so the hits and
the freezes are the same instant.

Run: python3 scripts/make-music-directiva.py
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48_000
BPM = 90.0
BEAT = 60.0 / BPM               # 0.6667 s
BAR = 4 * BEAT                  # 2.6667 s = 80 frames
STEP = BEAT / 4
BARS = 14
DUR = BARS * BAR                # 37.333 s
N = int(DUR * SR)

OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "directiva.ogg"
rng = np.random.default_rng(9021)

# Where the picture cuts and where it freezes, in seconds.
ENTRIES = [5.3333, 10.6667, 16.0, 21.3333, 26.6667, 32.0]
FREEZES = [7.3333, 12.0, 18.6667, 23.6667, 28.3333]


# ---------------------------------------------------------------- helpers ---
def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf) or i < 0:
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


def saw(freq, n, phase=0.0):
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    return 2 * ((np.cumsum(f) / SR + phase) % 1.0) - 1


def square(freq, n, duty=0.5):
    return np.where((np.arange(n) * freq / SR) % 1.0 < duty, 1.0, -1.0)


# ------------------------------------------------------------------ voices ---
def kick():
    n = int(0.44 * SR)
    x = np.arange(n) / SR
    f = 44 + (120 - 44) * np.exp(-x / 0.030)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.140)
    click = rng.normal(0, 1, n) * np.exp(-x / 0.0016) * 0.32
    return np.tanh((body + click) * 1.5) * 0.95


def snap():
    n = int(0.22 * SR)
    x = np.arange(n) / SR
    noise = lp(hp(rng.normal(0, 1, n), 1500), 6500)
    out = noise * np.exp(-x / 0.013)
    out += noise * np.exp(-x / 0.055) * 0.35
    out += np.sin(2 * np.pi * 2100 * x) * np.exp(-x / 0.012) * 0.25
    return out * 0.6


def hat(dur=0.045, tone=7800):
    n = int(dur * SR)
    x = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), tone) * np.exp(-x / (dur / 4.0)) * 0.26


def rim():
    n = int(0.07 * SR)
    x = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1550 * x) + np.sin(2 * np.pi * 2350 * x) * 0.5) * np.exp(-x / 0.007) * 0.38


def air():
    n = int(0.55 * SR)
    x = np.arange(n) / SR
    r = x / x[-1]
    return lp(hp(rng.normal(0, 1, n), 2500), 3000 + 7000 * r) * np.sin(np.pi * r) ** 2 * 0.22


KICK, SNAP, HAT, RIM, AIR = kick(), snap(), hat(), rim(), air()

# --------------------------------------------------------------- harmony ----
# F# minor. The bass holds the pulse; the chord moves underneath it, slowly.
F_SHARP = 46.25
ROOTS = {"F#m": 46.25, "D": 36.71, "A": 55.00, "E": 41.20, "Bm": 61.74}
TRIADS = {
    "F#m": [369.99, 440.00, 554.37],
    "D": [293.66, 369.99, 440.00],
    "A": [329.63, 440.00, 554.37],
    "E": [329.63, 415.30, 493.88],
    "Bm": [369.99, 493.88, 587.33],
}
PROG = ["F#m", "F#m",          # intro
        "F#m", "D",            # 1 Secretaria General
        "A", "E",              # 2 Secretario General Adjunto
        "F#m", "D",            # 3 Director Académico
        "Bm", "A",             # 4 Directoras de Prensa
        "F#m", "E",            # 5 Directoras de Logística
        "D", "F#m"]            # outro

# Per member: which 16ths the bass pulses on, hat plan, extras.
VOICINGS = [
    dict(bass=[0, 2, 4, 6, 8, 10, 12, 14], hats="off", extra=None),
    dict(bass=[0, 2, 4, 6, 8, 10, 12, 13, 14], hats="off16", extra="rim"),
    dict(bass=[0, 2, 3, 6, 8, 10, 12, 14], hats="8", extra="motif"),
    dict(bass=[0, 4, 6, 8, 12, 14], hats="off", extra="break"),
    dict(bass=[0, 2, 4, 6, 8, 10, 11, 12, 14], hats="16", extra="motif2"),
]

SECTIONS = [(2 + 2 * i, 3 + 2 * i) for i in range(5)]

drums = np.zeros(N)
bass = np.zeros(N)
motif = np.zeros(N)
pad = np.zeros(N)
fx = np.zeros(N)
kicks: list[float] = []


def section_of(b):
    for i, (a, z) in enumerate(SECTIONS):
        if a <= b <= z:
            return i
    return None


for b in range(BARS):
    chord = PROG[b]
    root, triad = ROOTS[chord], TRIADS[chord]
    t0 = b * BAR
    sec = section_of(b)
    v = VOICINGS[sec] if sec is not None else VOICINGS[0]
    intro = b < 2
    outro = b >= 12
    # Member 4 drops the low end for its first bar: the break that makes its
    # syncopated pose hit harder.
    hole = v["extra"] == "break" and b == SECTIONS[3][0]

    # --- kick: on 1 and 3, the hypnotic half-time pulse ---------------------
    if not (intro and b == 0):
        for s in (0, 8):
            if hole and s == 8:
                continue
            place(drums, KICK, t0 + s * STEP, 1.0)
            kicks.append(t0 + s * STEP)
        if sec in (2, 4) and not hole:
            place(drums, KICK, t0 + 14 * STEP, 0.7)
            kicks.append(t0 + 14 * STEP)

    # --- snap on 2 and 4 ---------------------------------------------------
    if sec is not None or outro:
        for s in (4, 12):
            place(drums, SNAP, t0 + s * STEP, 0.95)
        if v["extra"] == "rim":
            for s in (7, 15):
                place(drums, RIM, t0 + s * STEP, 0.6)

    # --- hats: the off-beat push -------------------------------------------
    if not intro or b == 1:
        plan = v["hats"]
        if plan == "off":
            steps = range(2, 16, 4)
        elif plan == "off16":
            steps = list(range(2, 16, 4)) + [6, 14]
        elif plan == "8":
            steps = range(0, 16, 2)
        else:
            steps = range(16)
        for s in steps:
            place(drums, HAT, t0 + s * STEP, 0.95 if s % 4 == 2 else 0.5)

    # --- the pulsing bass: this is the hook --------------------------------
    if not (intro and b == 0):
        for k, s in enumerate(v["bass"]):
            if hole and s >= 8:
                continue
            at = t0 + s * STEP
            n = int(0.22 * SR)
            # a small melodic lift on the last eighth of every second bar
            f = root * (1.5 if (b % 2 == 1 and s >= 14) else 1.0)
            e = env_exp(n, 0.085, 0.003)
            cut = 150 + 1250 * np.exp(-np.arange(n) / SR / 0.05)
            sig = lp(saw(f, n) * 0.5 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.85, cut)
            place(bass, np.tanh(sig * 1.8) * e, at, 0.55)

    # --- the little figure that keeps coming back --------------------------
    if v["extra"] in ("motif", "motif2") and not intro:
        oct_ = 2 if v["extra"] == "motif2" else 1
        seq = [triad[0], triad[2], triad[1], triad[0]]
        for k, s in enumerate((0, 3, 6, 10)):
            f = seq[k] * oct_
            n = int(0.30 * SR)
            e = env_exp(n, 0.055, 0.003)
            cut = 1500 + 5500 * np.exp(-np.arange(n) / SR / 0.028)
            sig = lp(saw(f, n) * 0.45 + square(f * 1.004, n, 0.4) * 0.3, cut) * e * 0.34
            place(motif, sig, t0 + s * STEP, 1.0)
            place(motif, sig, t0 + s * STEP + 3 * STEP, 0.26)
            place(motif, sig, t0 + s * STEP + 6 * STEP, 0.11)

    # --- pad: a thin bed, never a wall -------------------------------------
    n = int(BAR * SR)
    x = np.arange(n) / SR
    c = np.zeros(n)
    for f in triad:
        for det in (-9, 0, 9):
            c += saw(f * (1 + det / 10000.0) / 2, n, rng.random())
    c /= 9
    swell = np.clip(x / 0.15, 0, 1) * (1 - 0.2 * x / BAR)
    place(pad, lp(c, 1700 if not intro else 600) * swell, t0, 0.13 if not intro else 0.08)

    # --- air on the last beat of every other bar ---------------------------
    if b % 2 == 1 and not intro:
        place(fx, AIR, t0 + 13 * STEP, 0.5)

# --- the accents, placed on the picture, not on the grid -------------------
for at in ENTRIES:
    n = int(0.45 * SR)
    x = np.arange(n) / SR
    stab = np.zeros(n)
    for f in TRIADS["F#m"]:
        stab += saw(f, n, rng.random())
    stab = lp(stab / 3, 2200 + 5000 * np.exp(-x / 0.03)) * env_exp(n, 0.07, 0.003)
    place(fx, stab, at, 0.42)
    place(fx, KICK, at, 0.85)

for at in FREEZES:
    n = int(1.0 * SR)
    x = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(56 * np.exp(-x / 0.20) + 34) / SR) * np.exp(-x / 0.30)
    crack = lp(hp(rng.normal(0, 1, n), 1500), 9500) * np.exp(-x / 0.085)
    place(fx, sub * 0.95 + crack * 0.30, at, 0.95)
    # a short lift into it, so the pose is heard coming
    m = int(0.55 * SR)
    r = np.arange(m) / m
    up = lp(hp(rng.normal(0, 1, m), 500), 700 + 9000 * r ** 2) * r ** 2.4
    place(fx, up, at - 0.55, 0.5)

# ------------------------------------------------------------- sidechain ----
duck = np.ones(N)
for at in kicks:
    i = int(at * SR)
    n = int(0.30 * SR)
    shape = 0.36 + 0.64 * (1 - np.exp(-np.arange(n) / SR / 0.080))
    j = min(N, i + n)
    duck[i:j] = np.minimum(duck[i:j], shape[: j - i])

mix = drums + (bass + pad + motif) * duck + fx

open_n = int(BAR * 1.5 * SR)
mix[:open_n] = lp(mix[:open_n], 280 + 9000 * (np.arange(open_n) / open_n) ** 2)

tail = int(BAR * 0.9 * SR)
mix[-tail:] *= np.linspace(1, 0.0, tail) ** 0.8

mix = np.tanh(mix * 1.20)
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
print(f"✓ {OUT.name}  {DUR:.2f} s  {BPM:.0f} BPM  {BARS} compases, instrumental")
