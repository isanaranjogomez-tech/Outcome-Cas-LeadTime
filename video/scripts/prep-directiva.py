#!/usr/bin/env python3
"""
Prepares the media for the MUNCAS XX directiva montage.

For each member: a speed-ramped "movement" clip that lands exactly on the pose
(one bar long, so the freeze always falls on a downbeat), the frozen pose frame
itself, and an alpha cut-out of the subject so the role can sit behind them.

Run once: python3 scripts/prep-directiva.py
"""
import subprocess
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
UP = Path("/root/.claude/uploads/cfb8b628-b01d-53f2-b6e4-14e51962ca44")
OUT_V = ROOT / "public" / "source" / "directiva"
OUT_F = ROOT / "public" / "freeze" / "directiva"
MODEL = "/tmp/u2net.onnx"

BPM = 120.0                       # 2.0 s per bar = 60 frames exactly
FPS = 30
BAR = 4 * 60.0 / BPM              # 1.935484 s
MOVE_FRAMES = round(BAR * FPS)    # 58
SLOW = 0.60                       # the landing, in slow motion
SLOW_OUT = 0.5667                 # seconds of output spent in slow motion
FAST_MAX = 1.30                   # the approach, when there is source for it

# id, source file, pose second. The clips are short, so the approach speed is
# whatever fits in front of each pose — never faster than FAST_MAX.
MEMBERS = [
    ("sg",        "a809f0a6-IMG_0664", 2.30),
    ("sga",       "4cace7ea-IMG_0657", 3.00),
    ("academico", "5e361afc-IMG_0663", 2.30),
    ("prensa",    "4e4883c1-IMG_0650", 4.60),
    ("logistica", "ebae18c8-IMG_0656", 2.15),
]


def run(*args):
    subprocess.run(args, check=True)


def ramp(src: Path, pose: float, dst: Path) -> None:
    """Movement into the pose: quick approach, then a slow landing on the pose."""
    fast_out = MOVE_FRAMES / FPS - SLOW_OUT
    b = pose - SLOW_OUT * SLOW
    fast = min(FAST_MAX, max(0.9, (b - 0.02) / fast_out))
    a = max(0.0, b - fast_out * fast)
    run("ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(src),
        "-filter_complex",
        f"[0:v]trim=start={a:.4f}:end={b:.4f},setpts=(PTS-STARTPTS)/{fast:.4f}[v1];"
        f"[0:v]trim=start={b:.4f}:end={pose:.4f},setpts=(PTS-STARTPTS)/{SLOW}[v2];"
        f"[v1][v2]concat=n=2:v=1:a=0,fps={FPS},format=yuv420p[v]",
        "-map", "[v]", "-an", "-frames:v", str(MOVE_FRAMES),
        "-c:v", "libx264", "-crf", "16", "-preset", "medium", str(dst))


def still(src: Path, pose: float, dst: Path) -> None:
    run("ffmpeg", "-nostdin", "-y", "-hide_banner", "-loglevel", "error",
        "-ss", f"{pose:.4f}", "-i", str(src), "-frames:v", "1", str(dst))


_sess = None


def matte(frame: Path, dst: Path) -> None:
    """u2net alpha for the subject, softened so the edge is not a cut-out look."""
    global _sess
    if _sess is None:
        _sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    img = Image.open(frame).convert("RGB")
    w, h = img.size
    x = np.asarray(img.resize((320, 320), Image.BILINEAR), dtype=np.float32) / 255.0
    x = (x - np.array([0.485, 0.456, 0.406])) / np.array([0.229, 0.224, 0.225])
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    m = _sess.run(None, {_sess.get_inputs()[0].name: x})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    alpha = Image.fromarray((m * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    # A touch of blur on the matte hides the 320px upscale on hair edges.
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.6))
    rgba = img.convert("RGBA")
    rgba.putalpha(alpha)
    rgba.save(dst)


def main() -> None:
    OUT_V.mkdir(parents=True, exist_ok=True)
    OUT_F.mkdir(parents=True, exist_ok=True)
    for mid, name, pose in MEMBERS:
        src = UP / f"{name}.MOV"
        ramp(src, pose, OUT_V / f"{mid}.mp4")
        still(src, pose, OUT_F / f"{mid}.png")
        matte(OUT_F / f"{mid}.png", OUT_F / f"{mid}-cut.png")
        # The background plate does not need alpha; JPEG keeps the bundle light.
        Image.open(OUT_F / f"{mid}.png").convert("RGB").save(
            OUT_F / f"{mid}.jpg", quality=93, subsampling=1)
        (OUT_F / f"{mid}.png").unlink()
        print(f"✓ {mid}: movimiento {MOVE_FRAMES}f, pose {pose:.2f}s, recorte listo")


if __name__ == "__main__":
    main()
