#!/usr/bin/env python3
"""
Surgical replacement of the two mispronounced "caucus" in the tier-list take.

Each word comes from the re-recording made by the person who says that line —
audio_1 for the first, the WhatsApp note for the second, never crossed. Only the
word is swapped: it is band-limited to the take's own range, matched to the RMS
of the word it replaces, laid over the room tone already there, and crossfaded
in and out over 15 ms. Everything around it — timing, breaths, ambience — is
untouched, so nothing downstream moves.
"""
import subprocess, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "source" / "muncas-tier.mp4"
SCRATCH = Path("/tmp/claude-0/-home-user-Outcome-Cas-LeadTime/cfb8b628-b01d-53f2-b6e4-14e51962ca44/scratchpad/tl")
SR = 48_000
XF = int(0.015 * SR)

# (patch wav, word span in it, window it replaces in the take)
JOBS = [(SCRATCH / "a1.wav", 2.35, 2.70, 14.88, 15.28),
        (SCRATCH / "a2.wav", 1.79, 2.20, 49.03, 49.44)]


def read(p):
    with wave.open(str(p)) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    return a, sr


def lp(x, c):
    a = 1 - np.exp(-2 * np.pi * c / SR)
    y = np.empty(len(x)); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y


def band(x):
    """Same rough band as the take: no phone proximity boom, no fizz."""
    return lp(x - lp(x, 110), 7600)


subprocess.run(["ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(SRC), "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le",
                str(SCRATCH / "take.wav")], check=True)
take, _ = read(SCRATCH / "take.wav")

for patch_path, wa, wb, ta, tb in JOBS:
    patch, psr = read(patch_path)
    if psr != SR:
        idx = (np.arange(int(len(patch) * SR / psr)) * psr / SR).astype(int)
        patch = patch[np.clip(idx, 0, len(patch) - 1)]
    word = band(patch[int(wa * SR):int(wb * SR)])

    i, j = int(ta * SR), int(tb * SR)
    window = j - i
    # Match the level of the word being replaced.
    target_rms = np.sqrt((take[i:j] ** 2).mean() + 1e-12)
    word *= target_rms / (np.sqrt((word ** 2).mean()) + 1e-12)

    # Keep the take's own room tone under the whole window, then lay the word
    # in the middle of it so the join never lands on a hard edge.
    tone = take[i:j] * 0.16
    slot = tone.copy()
    if len(word) > window:
        word = word[:window]
    off = (window - len(word)) // 2
    env = np.ones(len(word))
    env[:XF] = np.linspace(0, 1, XF)
    env[-XF:] = np.linspace(1, 0, XF)
    slot[off:off + len(word)] += word * env

    # Crossfade the whole slot against what was there.
    out = take[i:j].copy()
    blend = np.ones(window)
    blend[:XF] = np.linspace(1, 0, XF)
    blend[-XF:] = np.linspace(0, 1, XF)
    take[i:j] = out * blend + slot * (1 - blend)
    print(f"✓ {patch_path.name} → {ta:.2f}-{tb:.2f}s  ({len(word)/SR:.2f}s de palabra)")

take = np.clip(take, -0.99, 0.99)
fixed = SCRATCH / "take-fixed.wav"
with wave.open(str(fixed), "w") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((take * 32767).astype(np.int16).tobytes())

out_mp4 = SRC.with_name("muncas-tier-fixed.mp4")
subprocess.run(["ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(SRC), "-i", str(fixed), "-map", "0:v", "-map", "1:a",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", str(SR),
                str(out_mp4)], check=True)
out_mp4.replace(SRC)
print("✓ audio reemplazado en public/source/muncas-tier.mp4")
