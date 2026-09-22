#!/usr/bin/env python3
"""
Prepares the six "Welcome MUNCAS" clips and writes data/muncas-welcome.json.

Each source is a 4K 16:9 HDR phone clip. Per clip this script:
  · trims to the phrase, dropping the "tres..." count and the dead air;
  · tone-maps HLG to SDR and scales to 1080x1920 (the clips are already
    9:16 — they are stored 3840x2160 with a -90 rotation, so nothing is
    cropped and the framing the phone shot is kept intact);
  · applies a static gain that brings its loudness near the others', without
    compressing — a child who shouts louder still sounds louder.
"""
import json, subprocess, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UP = Path("/root/.claude/uploads/cfb8b628-b01d-53f2-b6e4-14e51962ca44")
OUT_DIR = ROOT / "public" / "source" / "welcome"
FREEZE = ROOT / "public" / "freeze"
DATA = ROOT / "data" / "muncas-welcome.json"
FPS = 30
TARGET_LUFS = -16.0

# id, file, trim in/out, crop x in the 4K frame, when "welcome" and "muncas"
# land (seconds from the trim point), and the one edit gesture for that clip.
CLIPS = [
    # 1 — the hook: he jumps, both arms up, and shouts straight away.
    dict(id="hook",   file="20c5663a-IMG_2278.mov", trim=(0.06, 1.08),
         welcome=0.09, muncas=0.54, move="punch"),
    # 2 — a change of face and pace: open hand, calmer.
    dict(id="hand",   file="e7b1252f-IMG_2280.mov", trim=(0.33, 1.58),
         welcome=0.07, muncas=0.40, move="drift"),
    # 3 — arms thrown up. Worth a freeze.
    dict(id="arms",   file="6fdd87dc-IMG_2276.mov", trim=(0.83, 2.60),
         welcome=0.07, muncas=0.72, move="punch", freeze=0.26),
    # 4 — the flex.
    dict(id="flex",   file="2d4ff6e5-IMG_2281.mov", trim=(0.48, 1.78),
         welcome=0.07, muncas=0.52, move="drift"),
    # 5 — two of them at once. The other freeze.
    dict(id="duo",    file="77e01013-IMG_2284.mov", trim=(0.62, 2.86),
         welcome=0.05, muncas=1.38, move="punch", freeze=0.26),
    # 6 — the flags, and the close.
    dict(id="flags",  file="7a60c54c-IMG_2285.mov", trim=(0.18, 1.76),
         welcome=0.07, muncas=0.45, move="punch", hold=1.05),
]


def measure(path: Path):
    """Integrated loudness and true peak, in one pass."""
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-vn",
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True)
    lufs = re.findall(r"I:\s+(-?\d+\.\d+) LUFS", r.stderr)
    peak = re.findall(r"Peak:\s+(-?\d+\.\d+) dBFS", r.stderr)
    return (float(lufs[-1]) if lufs else TARGET_LUFS,
            float(peak[-1]) if peak else -6.0)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FREEZE.mkdir(parents=True, exist_ok=True)

    # First pass: cut and grade the picture, keeping the audio untouched.
    for c in CLIPS:
        src = UP / c["file"]
        a, b = c["trim"]
        tmp = OUT_DIR / f"_{c['id']}.mp4"
        vf = (
            "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,"
            "tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,"
            "scale=1080:1920:flags=lanczos,format=yuv420p,fps=30"
        )
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(src),
             "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "17",
             "-c:a", "pcm_s16le", "-ar", "48000", str(tmp)], check=True)
        c["_tmp"] = tmp
        c["_lufs"], c["_peak"] = measure(tmp)

    # Second pass: one static gain per clip, clamped, plus a 25 ms fade at
    # each end so no cut can click.
    for c in CLIPS:
        # Asymmetric: pulling a quiet clip up is worth more than pushing a
        # loud one down, but not so far that the wind comes up with it.
        gain = max(-6.0, min(11.0, TARGET_LUFS - c["_lufs"]))
        # …but never past the ceiling: a shout that already touches 0 dBFS
        # must not be lifted into clipping.
        gain = min(gain, -1.5 - c["_peak"])
        dur = c["trim"][1] - c["trim"][0]
        out = OUT_DIR / f"{c['id']}.mp4"
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(c["_tmp"]),
             "-af", f"volume={gain:.2f}dB,"
                    f"afade=t=in:st=0:d=0.025,"
                    f"afade=t=out:st={max(0, dur - 0.045):.3f}:d=0.045",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-ar", "48000",
             str(out)], check=True)
        c["_tmp"].unlink()
        c["_gain"] = gain
        c["_out"] = out

        if c.get("freeze") or c.get("hold"):
            subprocess.run(
                ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                 "-sseof", "-0.08", "-i", str(out), "-frames:v", "1", "-q:v", "2",
                 str(FREEZE / f"welcome-{c['id']}.jpg")], check=True)

    segments, timeline = [], 0.0
    for c in CLIPS:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                            "format=duration", "-of", "csv=p=0", str(c["_out"])],
                           capture_output=True, text=True)
        dur = round(float(r.stdout.strip()), 3)
        extra = c.get("freeze", 0.0) or c.get("hold", 0.0)
        segments.append({
            "id": c["id"],
            "clip": f"source/welcome/{c['id']}.mp4",
            "durationInSeconds": dur,
            "holdInSeconds": extra,
            "still": f"freeze/welcome-{c['id']}.jpg" if extra else None,
            "isFreeze": bool(c.get("freeze")),
            "timelineStart": round(timeline, 3),
            "welcomeAt": c["welcome"],
            "muncasAt": c["muncas"],
            "move": c["move"],
            "closing": bool(c.get("hold")),
            "measuredLufs": round(c["_lufs"], 2),
            "gainDb": round(c["_gain"], 2),
        })
        timeline += dur + extra

    doc = {
        "fps": FPS, "width": 1080, "height": 1920,
        "totalInSeconds": round(timeline, 3),
        "musicVolume": 0.085,
        "sfxVolume": 0.26,
        "closing": {"line1": "WELCOME TO MUNCAS", "line2": "LET THE DEBATE BEGIN."},
        "segments": segments,
    }
    DATA.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

    print(f"Wrote {DATA.name}: {len(segments)} clips, {doc['totalInSeconds']}s")
    for s in segments:
        print(f"  {s['id']:6} {s['timelineStart']:6.2f}s  {s['durationInSeconds']:5.2f}s"
              f" + {s['holdInSeconds']:.2f}  {s['measuredLufs']:7.2f} LUFS"
              f" -> {s['gainDb']:+.2f} dB  {s['move']}")


if __name__ == "__main__":
    main()
