#!/usr/bin/env python3
"""public/audio/tier.ogg — a light, upbeat instrumental bed for the tier list.
Soft kick, shaker, a small plucked figure. It sits far under the voices; its job
is rhythm and continuity, not attention. Nothing sampled, no vocals."""
import subprocess, wave
from pathlib import Path
import numpy as np

SR, BPM, BARS = 48_000, 110.0, 25
BEAT = 60.0 / BPM; BAR = 4 * BEAT; STEP = BEAT / 4
DUR = BARS * BAR; N = int(DUR * SR)
OUT = Path(__file__).resolve().parent.parent / "public" / "audio" / "tier.ogg"
rng = np.random.default_rng(31)

def lp(x, c):
    c = np.full(len(x), c, float) if np.isscalar(c) else np.asarray(c)
    a = 1 - np.exp(-2 * np.pi * np.clip(c, 20, SR / 2.2) / SR)
    y = np.empty(len(x)); acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc); y[i] = acc
    return y

def hp(x, c): return np.asarray(x, float) - lp(x, c)
def saw(f, n, p=0.0): return 2 * ((np.arange(n) * f / SR + p) % 1.0) - 1
def ee(n, tau, at=0.002):
    x = np.arange(n) / SR
    return np.clip(x / max(at, 1e-6), 0, 1) * np.exp(-x / tau)
def put(buf, sig, at, g=1.0):
    i = int(at * SR)
    if 0 <= i < len(buf):
        j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i] * g

def kick():
    n = int(0.30 * SR); x = np.arange(n) / SR
    f = 48 + 90 * np.exp(-x / 0.025)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.10) * 1.3) * 0.8
def shaker():
    n = int(0.07 * SR); x = np.arange(n) / SR
    return lp(hp(rng.normal(0, 1, n), 4500), 11000) * (x / 0.010) * np.exp(-x / 0.018) * 0.28
def clap():
    n = int(0.22 * SR); x = np.arange(n) / SR
    b = lp(hp(rng.normal(0, 1, n), 1300), 5000)
    return (b * np.exp(-x / 0.011) + b * np.exp(-x / 0.06) * 0.35) * 0.4

K, SH, CL = kick(), shaker(), clap()
CH = [(220.0, [261.63, 329.63, 392.00]), (196.0, [246.94, 293.66, 392.00]),
      (174.61, [220.00, 261.63, 349.23]), (196.0, [246.94, 293.66, 369.99])]

drums = np.zeros(N); bass = np.zeros(N); pluck = np.zeros(N); pad = np.zeros(N)
kicks = []
for b in range(BARS):
    root, tri = CH[b % 4]; t0 = b * BAR
    for s in (0, 8):
        put(drums, K, t0 + s * STEP); kicks.append(t0 + s * STEP)
    if b % 4 != 3:
        for s in (4, 12): put(drums, CL, t0 + s * STEP, 0.8)
    for s in range(0, 16, 2):
        put(drums, SH, t0 + s * STEP, 0.9 if s % 4 == 2 else 0.5)
    for s in (0, 6, 8, 14):
        n = int(0.20 * SR); f = root / 2
        v = lp(saw(f, n) * 0.4 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.8,
               160 + 700 * np.exp(-np.arange(n) / SR / 0.05))
        put(bass, np.tanh(v * 1.5) * ee(n, 0.08, 0.004), t0 + s * STEP, 0.42)
    seq = [tri[0], tri[2], tri[1], tri[2] * 2]
    for k, s in enumerate((0, 4, 8, 12)):
        n = int(0.26 * SR); f = seq[k]
        v = lp(saw(f, n) * 0.4, 1600 + 4200 * np.exp(-np.arange(n) / SR / 0.03)) * ee(n, 0.06, 0.003)
        put(pluck, v, t0 + s * STEP, 0.24)
        put(pluck, v, t0 + s * STEP + 3 * STEP, 0.12)
    n = int(BAR * SR); x = np.arange(n) / SR; c = np.zeros(n)
    for f in tri:
        for d in (-7, 0, 7): c += saw(f * (1 + d / 10000.0), n, rng.random())
    put(pad, lp(c / 9, 1500) * np.clip(x / 0.12, 0, 1), t0, 0.10)

duck = np.ones(N)
for at in kicks:
    i = int(at * SR); n = int(0.24 * SR)
    sh = 0.45 + 0.55 * (1 - np.exp(-np.arange(n) / SR / 0.06))
    j = min(N, i + n); duck[i:j] = np.minimum(duck[i:j], sh[: j - i])

mix = drums * 0.85 + (bass + pluck + pad) * duck
mix[: int(BAR * SR)] = lp(mix[: int(BAR * SR)], 300 + 8000 * (np.arange(int(BAR * SR)) / (BAR * SR)) ** 2)
tail = int(BAR * SR); mix[-tail:] *= np.linspace(1, 0, tail) ** 0.8
mix = np.tanh(mix * 1.1); mix *= 0.85 / np.abs(mix).max()

OUT.parent.mkdir(parents=True, exist_ok=True)
raw = OUT.with_suffix(".wav")
with wave.open(str(raw), "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(raw), "-c:a", "libopus", "-b:a", "144k", str(OUT)], check=True)
raw.unlink(); print(f"✓ {OUT.name} {DUR:.1f}s {BPM:.0f} BPM")
