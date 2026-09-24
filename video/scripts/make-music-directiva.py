#!/usr/bin/env python3
"""
Writes public/audio/directiva.ogg — an original 120 BPM electro-pop bed for the
directiva montage. Nothing is sampled: every sound is synthesised here, and the
arrangement is cut to the edit, one section per member.

  bar 1-2    intro, filter opening
  bar 3-5    Secretaria General        (bar 1 movement, bars 2-3 freeze)
  bar 6-8    Secretario General Adjunto
  bar 9-11   Director Académico
  bar 12-14  Directoras de Prensa
  bar 15-17  Directoras de Logística
  bar 18-19  outro

Run: python3 scripts/make-music-directiva.py
"""
from pathlib import Path

import numpy as np

SR = 48_000
BPM = 120.0
BEAT = 60.0 / BPM          # 0.5 s
BAR = 4 * BEAT             # 2.0 s
BARS = 19
DUR = BARS * BAR           # 38 s
N = int(DUR * SR)

OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "directiva.ogg"

rng = np.random.default_rng(20251124)
t = np.arange(N) / SR
mix = np.zeros(N, dtype=np.float64)


# ---------------------------------------------------------------- helpers ---
def place(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i] * gain


def env_exp(n: int, tau: float, attack: float = 0.002) -> np.ndarray:
    x = np.arange(n) / SR
    a = np.clip(x / max(attack, 1e-6), 0, 1)
    return a * np.exp(-x / tau)


def one_pole_lp(x: np.ndarray, cutoff) -> np.ndarray:
    """Cheap time-varying low pass; cutoff may be a scalar or an array in Hz."""
    c = np.full(len(x), cutoff, dtype=np.float64) if np.isscalar(cutoff) else cutoff
    a = 1.0 - np.exp(-2 * np.pi * np.clip(c, 20, SR / 2.2) / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp(x: np.ndarray, cutoff: float) -> np.ndarray:
    return x - one_pole_lp(x, cutoff)


def saw(freq: np.ndarray | float, n: int, phase: float = 0.0) -> np.ndarray:
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    ph = (np.cumsum(f) / SR + phase) % 1.0
    return 2 * ph - 1


def square(freq: float, n: int, duty: float = 0.5) -> np.ndarray:
    ph = (np.arange(n) * freq / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


# ------------------------------------------------------------------ drums ---
def kick() -> np.ndarray:
    n = int(0.40 * SR)
    x = np.arange(n) / SR
    f = 48 + (118 - 48) * np.exp(-x / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.115)
    click = rng.normal(0, 1, n) * np.exp(-x / 0.0022) * 0.35
    return np.tanh((body + click) * 1.5) * 0.92


def clap() -> np.ndarray:
    n = int(0.34 * SR)
    x = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    body = one_pole_lp(hp(noise, 900), 3600)
    out = np.zeros(n)
    for k, d in enumerate((0.0, 0.009, 0.018)):
        i = int(d * SR)
        out[i:] += body[: n - i] * np.exp(-np.arange(n - i) / SR / 0.012) * (0.9 - 0.2 * k)
    out += body * np.exp(-x / 0.115) * 0.5
    return out * 0.55


def hat(open_: bool = False) -> np.ndarray:
    n = int((0.22 if open_ else 0.055) * SR)
    x = np.arange(n) / SR
    noise = hp(rng.normal(0, 1, n), 6500)
    return noise * np.exp(-x / (0.075 if open_ else 0.013)) * 0.30


def snare_roll(beats: float, at: float) -> np.ndarray:
    """A short build: 16ths that speed up to 32nds."""
    n = int(beats * BEAT * SR)
    out = np.zeros(n + int(0.3 * SR))
    pos, step = 0.0, 0.25
    while pos < beats:
        i = int(pos * BEAT * SR)
        seg = clap()[: int(0.10 * SR)] * (0.25 + 0.75 * pos / beats)
        out[i:i + len(seg)] += seg
        if pos > beats * 0.55:
            step = 0.125
        pos += step
    return out * 0.6


KICK, CLAP, HAT, HATO = kick(), clap(), hat(), hat(True)


# ------------------------------------------------------- harmony & voices ---
# Am – F – C – G, one chord per bar.
CHORDS = [
    (110.00, [220.00, 261.63, 329.63]),   # Am
    (87.31, [174.61, 220.00, 261.63]),    # F
    (130.81, [261.63, 329.63, 392.00]),   # C
    (98.00, [196.00, 246.94, 293.66]),    # G
]

kicks: list[float] = []
bass = np.zeros(N)
pluck = np.zeros(N)
pad = np.zeros(N)
drums = np.zeros(N)

# Sections: (first bar, last bar) per member, plus intro and outro.
SECTIONS = [(2 + 3 * i, 4 + 3 * i) for i in range(5)]
FREEZE_BARS = [s[0] + 1 for s in SECTIONS]          # where each pose lands


def bar_time(b: float) -> float:
    return b * BAR


MOVE_BARS = {s[0] for s in SECTIONS}                 # the approach, held back
FULL_BARS = {b for s in SECTIONS for b in (s[0] + 1, s[0] + 2)} | {17}
PLUCK_OCT = {2: 1, 5: 1, 8: 2, 11: 1, 14: 2}         # a little colour per member

for b in range(BARS):
    root, triad = CHORDS[b % 4]
    t0 = bar_time(b)
    move = b in MOVE_BARS          # kick and hats only: it is the run-up
    full = b in FULL_BARS          # everything in
    intro = b < 2
    outro = b == 18

    # --- drums
    for beat in range(4):
        at = t0 + beat * BEAT
        if full or move or (intro and b == 1):
            place(drums, KICK, at, 1.0)
            kicks.append(at)
        if full and beat in (1, 3):
            place(drums, CLAP, at, 0.9)
        if full or move:
            for eighth in (0.0, 0.5):
                # the last eighth of a section drops out: a hole before the hit
                if move and beat == 3 and eighth == 0.5:
                    continue
                place(drums, HATO if (beat == 3 and eighth == 0.5) else HAT,
                      at + eighth * BEAT, 0.9 if eighth else 0.55)

    # --- bass: syncopated 16ths, thinner on the run-up
    if full or move or (intro and b == 1):
        pattern = [0, 3, 4, 6, 8, 11, 12, 14] if not move else [0, 4, 8, 12]
        for s16 in pattern:
            at = t0 + s16 * BEAT / 4
            n = int(0.16 * SR)
            f = root / 2
            e = env_exp(n, 0.085, 0.004)
            cut = 180 + 900 * np.exp(-np.arange(n) / SR / 0.05)
            v = one_pole_lp(saw(f, n) * 0.6 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.6, cut)
            place(bass, np.tanh(v * 1.6) * e, at, 0.5 if not move else 0.38)

    # --- pluck: the hook. It only plays where the pose is held.
    if full or outro:
        oct_ = PLUCK_OCT.get(b - 1, 1) if full else 1
        notes = triad + [triad[1] * 2, triad[2], triad[1], triad[0] * 2, triad[1]]
        for s16 in range(16):
            if s16 % 2 == 1 and s16 % 8 != 3:
                continue
            f = notes[s16 % len(notes)] * 2 * oct_
            at = t0 + s16 * BEAT / 4
            n = int(0.24 * SR)
            e = env_exp(n, 0.055, 0.003)
            cut = 1400 + 5200 * np.exp(-np.arange(n) / SR / 0.03)
            v = one_pole_lp(saw(f, n) * 0.5 + square(f * 1.005, n, 0.42) * 0.35, cut)
            sig = v * e * (0.42 if full else 0.30)
            place(pluck, sig, at, 1.0)
            place(pluck, sig, at + 3 * BEAT / 8, 0.28)     # dotted delay
            place(pluck, sig, at + 6 * BEAT / 8, 0.12)

    # --- pad: supersaw chord, opening up where the pose lands
    n = int(BAR * SR)
    x = np.arange(n) / SR
    chord = np.zeros(n)
    for f in triad:
        for det in (-7, 0, 7):
            chord += saw(f * (1 + det / 10000.0), n, rng.random())
    chord /= 9
    swell = np.clip(x / 0.12, 0, 1) * (1 - 0.25 * x / BAR)
    cut = 2600 if full else (900 if move else 700)
    level = 0.19 if full else (0.12 if move else 0.10)
    place(pad, one_pole_lp(chord, cut) * swell, t0, level)

# --- risers into each member, and an impact on each freeze
riser = np.zeros(N)
for b in FREEZE_BARS:
    at = bar_time(b) - BEAT * 2
    n = int(BEAT * 2 * SR)
    x = np.arange(n) / SR
    sweep = hp(rng.normal(0, 1, n), 400) * (x / x[-1]) ** 2
    sweep = one_pole_lp(sweep, 500 + 9000 * (x / x[-1]) ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (x / x[-1] * 1.5)) / SR) * (x / x[-1]) ** 3
    place(riser, (sweep * 0.5 + tone * 0.25), at, 0.55)
    place(riser, snare_roll(2, at), at, 0.35)

impact = np.zeros(N)
for b in FREEZE_BARS:
    at = bar_time(b)
    n = int(0.9 * SR)
    x = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(60 * np.exp(-x / 0.25) + 32) / SR) * np.exp(-x / 0.30)
    crack = one_pole_lp(hp(rng.normal(0, 1, n), 1800), 9000) * np.exp(-x / 0.10)
    place(impact, sub * 0.85 + crack * 0.30, at, 0.9)

# ------------------------------------------------------------- sidechain ----
duck = np.ones(N)
for at in kicks:
    i = int(at * SR)
    n = int(0.30 * SR)
    shape = 0.30 + 0.70 * (1 - np.exp(-np.arange(n) / SR / 0.075))
    j = min(N, i + n)
    duck[i:j] = np.minimum(duck[i:j], shape[: j - i])

mix = drums + (bass + pad + pluck) * duck + riser * 0.9 + impact

# A slow filter opening over the intro so it arrives rather than just starting.
open_n = int(BAR * 2 * SR)
mix[:open_n] = one_pole_lp(mix[:open_n], 300 + 9000 * (np.arange(open_n) / open_n) ** 2)

# Tail: let the last bar ring out instead of stopping dead.
tail = int(BAR * SR)
mix[-tail:] *= np.linspace(1, 0.0, tail) ** 0.7

mix = np.tanh(mix * 1.15)
mix *= 0.89 / np.abs(mix).max()

# --------------------------------------------------------------- write out --
OUT.parent.mkdir(parents=True, exist_ok=True)
raw = OUT.with_suffix(".wav")
import wave

with wave.open(str(raw), "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())

import subprocess

subprocess.run(["ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(raw), "-c:a", "libopus", "-b:a", "160k", str(OUT)], check=True)
raw.unlink()
print(f"✓ {OUT.name}  {DUR:.1f} s  {BPM:.0f} BPM  {BARS} compases")
