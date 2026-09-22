#!/usr/bin/env python3
"""
Synthesises the sound effects and the music bed into public/sfx/.

Everything is generated here rather than sampled, so the project carries no
third-party audio and every sound is royalty-free. They are deliberately dry
and short — the brief asks for impact, not cartoon.
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "public" / "sfx"

rng = np.random.default_rng(7)


def t(seconds):
    return np.arange(int(SR * seconds)) / SR


def env(n, attack=0.002, decay=0.05, curve=3.0):
    """Fast attack, exponential decay."""
    a = int(SR * attack)
    e = np.ones(n)
    if a:
        e[:a] = np.linspace(0, 1, a)
    d = np.exp(-curve * np.arange(n) / (SR * decay))
    return e * d


def lowpass(x, cutoff):
    """One-pole lowpass, cutoff may be an array."""
    alpha = np.clip(1 - np.exp(-2 * np.pi * np.asarray(cutoff) / SR), 0, 1)
    alpha = np.broadcast_to(alpha, x.shape)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += alpha[i] * (x[i] - acc)
        y[i] = acc
    return y


def highpass(x, cutoff):
    return x - lowpass(x, cutoff)


def write(name, mono, peak=0.7):
    mono = np.nan_to_num(mono)
    if np.abs(mono).max() > 0:
        mono = mono / np.abs(mono).max() * peak
    # 3 ms fade at both ends so nothing clicks on playback.
    f = int(SR * 0.003)
    mono[:f] *= np.linspace(0, 1, f)
    mono[-f:] *= np.linspace(1, 0, f)
    stereo = np.stack([mono, mono], axis=1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"  {path.name:14} {len(mono)/SR:5.2f}s")


# --------------------------------------------------------------------------

def pop():
    x = t(0.09)
    f = 880 * np.exp(-14 * x) + 320
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    click = highpass(rng.normal(0, 1, len(x)), 2500) * env(len(x), 0.0005, 0.006)
    return tone * env(len(x), 0.001, 0.035) + 0.35 * click


def click_():
    x = t(0.03)
    n = highpass(rng.normal(0, 1, len(x)), 3000)
    return n * env(len(x), 0.0003, 0.006)


def whoosh(length=0.32, up=True):
    x = t(length)
    n = rng.normal(0, 1, len(x))
    shape = np.sin(np.pi * np.arange(len(x)) / len(x)) ** 1.6
    sweep = np.linspace(400, 5200, len(x)) if up else np.linspace(5200, 400, len(x))
    band = highpass(lowpass(n, sweep), 300)
    return band * shape


def impact():
    x = t(0.30)
    f = 92 * np.exp(-9 * x) + 34
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.001, 0.09, curve=4)
    crack = highpass(rng.normal(0, 1, len(x)), 1200) * env(len(x), 0.0005, 0.012)
    return np.tanh(2.2 * (body + 0.22 * crack)) * 0.8


def thump():
    x = t(0.20)
    f = 130 * np.exp(-12 * x) + 52
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.001, 0.05, curve=4)


def cash():
    """Two short metallic hits — a till, not a slot machine."""
    out = np.zeros(int(SR * 0.42))
    for k, (delay, gain) in enumerate(((0.0, 1.0), (0.085, 0.72))):
        x = t(0.30)
        partials = (1.0, 2.76, 5.4, 8.9)
        hit = sum(np.sin(2 * np.pi * 1180 * p * x) / (1 + 1.6 * i)
                  for i, p in enumerate(partials))
        hit *= env(len(x), 0.0008, 0.055, curve=3.4) * gain
        s = int(SR * delay)
        out[s:s + len(hit)] += hit
    return out


def glitch():
    out = np.zeros(int(SR * 0.16))
    step = len(out) // 5
    for i in range(5):
        seg = rng.normal(0, 1, step)
        seg = highpass(lowpass(seg, 900 + 2600 * (i % 2)), 400)
        # Bit-crush: quantise hard, then gate every other slice.
        seg = np.round(seg * 3) / 3 * (1.0 if i % 2 == 0 else 0.35)
        out[i * step:(i + 1) * step] = seg * env(step, 0.0005, 0.012)
    return out


def siren():
    x = t(0.34)
    f = np.where((np.arange(len(x)) // int(SR * 0.085)) % 2 == 0, 760, 950)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    tone = np.tanh(1.6 * tone)
    shape = np.minimum(1, np.arange(len(x)) / (SR * 0.02)) * np.exp(-2.4 * x)
    return tone * shape * 0.8


def clap():
    out = np.zeros(int(SR * 0.22))
    for delay, gain in ((0.0, 1.0), (0.013, 0.7), (0.027, 0.45)):
        x = t(0.12)
        n = highpass(lowpass(rng.normal(0, 1, len(x)), 5200), 900)
        n *= env(len(x), 0.0004, 0.022) * gain
        s = int(SR * delay)
        out[s:s + len(n)] += n
    return out


def shine():
    x = t(0.55)
    tone = (np.sin(2 * np.pi * 2180 * x) * 0.6
            + np.sin(2 * np.pi * 3270 * x) * 0.3
            + np.sin(2 * np.pi * 4400 * x) * 0.15)
    return tone * env(len(x), 0.004, 0.16, curve=2.6)


def splash():
    x = t(0.26)
    n = highpass(lowpass(rng.normal(0, 1, len(x)), np.linspace(6000, 1200, len(x))), 700)
    return n * env(len(x), 0.001, 0.055)


def music(bars=24, bpm=124):
    """
    A deliberately plain bed: sub kick, closed hat, a soft bass and a muted
    pluck in A minor. It sits far under the voices; swap it for a licensed
    track if you want more personality.
    """
    beat = 60 / bpm
    total = int(SR * beat * 4 * bars)
    out = np.zeros(total)

    def place(sig, at):
        s = int(SR * at)
        n = min(len(sig), total - s)
        if n > 0:
            out[s:s + n] += sig[:n]

    def kick():
        x = t(0.24)
        f = 105 * np.exp(-16 * x) + 44
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(x), 0.001, 0.07, curve=4)

    def hat(open_=False):
        d = 0.075 if open_ else 0.032
        x = t(d)
        n = highpass(rng.normal(0, 1, len(x)), 7000)
        return n * env(len(x), 0.0003, d * 0.45) * (0.30 if open_ else 0.20)

    def note(freq, dur, kind="bass"):
        x = t(dur)
        if kind == "bass":
            sig = np.sign(np.sin(2 * np.pi * freq * x)) * 0.35 + np.sin(2 * np.pi * freq * x)
            sig = lowpass(sig, 320)
            return sig * env(len(x), 0.006, dur * 0.5, curve=2.2) * 0.5
        sig = (np.sin(2 * np.pi * freq * x) + 0.4 * np.sin(2 * np.pi * freq * 2 * x))
        return sig * env(len(x), 0.003, dur * 0.35, curve=3.0) * 0.16

    a, c, d, e, g = 110.0, 130.81, 146.83, 164.81, 196.0
    roots = [a, g, c, e]

    for bar in range(bars):
        b0 = bar * 4 * beat
        root = roots[bar % 4]
        for i in range(4):
            place(kick() * (1.0 if i in (0, 2) else 0.0), b0 + i * beat)
        for i in range(8):
            place(hat(open_=(i == 5)), b0 + i * beat / 2)
        for i, step in enumerate((0, 1.5, 2.5, 3)):
            place(note(root, beat * 0.45), b0 + step * beat)
        for i, mult in enumerate((4, 5, 6, 5)):
            place(note(root * mult / 2, beat * 0.3, "pluck"), b0 + (i * 1.0 + 0.5) * beat)

    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print("Writing sound effects:")
    write("pop", pop())
    write("click", click_())
    write("whoosh", whoosh())
    write("whoosh-down", whoosh(0.26, up=False))
    write("impact", impact())
    write("thump", thump(), peak=0.6)
    write("cash", cash())
    write("glitch", glitch(), peak=0.55)
    write("siren", siren(), peak=0.55)
    write("clap", clap())
    write("shine", shine(), peak=0.5)
    write("splash", splash(), peak=0.6)
    print("Writing music bed:")
    write("music-bed", music(), peak=0.85)
    # Ogg/Opus rather than AAC: Chrome Headless Shell, which Remotion renders
    # with, ships no proprietary codecs and refuses to decode an .m4a.
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i",
                    str(OUT / "music-bed.wav"), "-c:a", "libopus", "-b:a", "96k",
                    str(OUT / "music-bed.ogg")], check=True)
    (OUT / "music-bed.wav").unlink()
    print("  music-bed.ogg")


if __name__ == "__main__":
    main()
