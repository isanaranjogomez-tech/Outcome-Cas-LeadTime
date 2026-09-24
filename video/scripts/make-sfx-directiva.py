#!/usr/bin/env python3
"""
Extra effects for the directiva montage, synthesised here so nothing is sampled:
a finger snap, a discreet camera shutter, a short riser, a sub drop and a soft
swish for transitions. Written into public/sfx/.
"""
import wave
from pathlib import Path

import numpy as np

SR = 48_000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"
rng = np.random.default_rng(7)


def lp(x, cutoff):
    """One-pole low pass; cutoff may be a scalar or a per-sample array in Hz."""
    c = np.full(len(x), cutoff, dtype=np.float64) if np.isscalar(cutoff) else np.asarray(cutoff)
    a = 1.0 - np.exp(-2 * np.pi * np.clip(c, 20, SR / 2.2) / SR)
    y = np.empty(len(x), dtype=np.float64)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def hp(x, cutoff):
    return np.asarray(x, dtype=np.float64) - lp(x, cutoff)


def write(name: str, sig: np.ndarray, peak: float = 0.85) -> None:
    sig = sig / (np.abs(sig).max() + 1e-9) * peak
    e = int(0.004 * SR)
    sig[:e] *= np.linspace(0, 1, e)
    sig[-e:] *= np.linspace(1, 0, e)
    with wave.open(str(OUT / name), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((sig * 32767).astype(np.int16).tobytes())
    print(f"✓ {name}  {len(sig)/SR:.2f}s")


def snap():
    n = int(0.14 * SR)
    x = np.arange(n) / SR
    body = lp(hp(rng.normal(0, 1, n), 1800), 7000) * np.exp(-x / 0.011)
    ring = np.sin(2 * np.pi * 2300 * x) * np.exp(-x / 0.02) * 0.4
    return body + ring


def shutter():
    """Two quick mechanical clacks — discreet, not a toy camera."""
    n = int(0.16 * SR)
    out = np.zeros(n)
    for at, g in ((0.0, 1.0), (0.048, 0.75)):
        i = int(at * SR)
        m = n - i
        x = np.arange(m) / SR
        clack = lp(hp(rng.normal(0, 1, m), 900), 5200) * np.exp(-x / 0.006)
        tick = np.sin(2 * np.pi * 620 * x) * np.exp(-x / 0.004) * 0.5
        out[i:] += (clack + tick) * g
    return out


def riser():
    n = int(0.75 * SR)
    x = np.arange(n) / SR
    r = x / x[-1]
    sweep = lp(hp(rng.normal(0, 1, n), 300), 600 + 11000 * r ** 2) * r ** 2
    tone = np.sin(2 * np.pi * np.cumsum(260 * 2 ** (r * 1.6)) / SR) * r ** 3 * 0.5
    return sweep + tone


def sub():
    n = int(0.75 * SR)
    x = np.arange(n) / SR
    f = 34 + 70 * np.exp(-x / 0.14)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.26)


def swish():
    n = int(0.30 * SR)
    x = np.arange(n) / SR
    r = x / x[-1]
    band = 700 + 5200 * np.sin(np.pi * r) ** 2
    return lp(hp(rng.normal(0, 1, n), 500), band) * np.sin(np.pi * r) ** 1.5 * 0.8


OUT.mkdir(parents=True, exist_ok=True)
write("snap.wav", snap())
write("shutter.wav", shutter(), 0.7)
write("riser.wav", riser(), 0.8)
write("sub.wav", sub())
write("swish.wav", swish(), 0.7)
