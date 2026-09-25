#!/usr/bin/env python3
"""
One builder for the three conversational reels. It reads the measured speech
spans and their transcription, removes only the dead air between them, and lays
the shared MUNCAS system on top: hook, captions, numbered chapters where the
format has them, a name plate, tags and beat marks.

  python3 scripts/build-reel.py <key>
"""
import json, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCR = Path("/tmp/claude-0/-home-user-Outcome-Cas-LeadTime/cfb8b628-b01d-53f2-b6e4-14e51962ca44/scratchpad")
FPS = 30
NOISE = ("[AUDIO", "[MÚ", "[SIL", "[BLANK", "(RES", "(sonido", "[ Audio")

CFG = json.loads((ROOT / "data" / "reel-config.json").read_text())


def chunk(text, limit=30):
    words, lines, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > limit:
            lines.append(cur); cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return lines


def main() -> None:
    key = sys.argv[1]
    c = CFG[key]
    spans = json.load(open(SCR / c["dir"] / "fine-tr.json"))
    spans = [s for s in spans if s["text"] and not s["text"].startswith(NOISE)]
    src_out = c["srcOut"]
    spans = [s for s in spans if s["start"] < src_out]

    # Remove every gap longer than MAXGAP, leaving KEEPGAP of air.
    maxgap, keepgap = c.get("maxGap", 0.80), c.get("keepGap", 0.32)
    cuts = []
    for a, b in zip(spans, spans[1:]):
        gap = b["start"] - a["end"]
        if gap > maxgap:
            cuts.append((round(a["end"] + keepgap / 2, 3), round(b["start"] - keepgap / 2, 3)))
    cuts += [tuple(x) for x in c.get("extraCuts", [])]
    cuts.sort()

    src_in = max(0.0, spans[0]["start"] - 0.25)
    keeps, cursor = [], src_in
    for a, b in cuts:
        if a > cursor:
            keeps.append((cursor, a))
        cursor = max(cursor, b)
    keeps.append((cursor, src_out))
    keeps = [(a, b) for a, b in keeps if b - a > 0.05]

    def tl(t):
        acc = 0.0
        for a, b in keeps:
            if t < a:
                return acc
            if t <= b:
                return acc + (t - a)
            acc += b - a
        return acc

    segments, cur = [], 0
    for a, b in keeps:
        f = round((b - a) * FPS)
        segments.append({"srcIn": round(a, 4), "frames": f, "from": cur})
        cur += f
    body = cur

    captions = []
    for s in spans:
        lines = chunk(s["text"].strip().rstrip("."), c.get("charsPerLine", 30))
        # at most two lines on screen: long spans split into consecutive cards
        pairs = [lines[i:i + 2] for i in range(0, len(lines), 2)]
        f0, f1 = tl(s["start"]), tl(s["end"])
        step = (f1 - f0) / max(1, len(pairs))
        for k, pr in enumerate(pairs):
            captions.append({"text": "|".join(pr),
                             "from": round((f0 + k * step) * FPS),
                             "to": round((f0 + (k + 1) * step) * FPS)})

    chapters = [{"index": i + 1, "total": len(c.get("chapters", [])), "text": t,
                 "at": round(tl(at) * FPS)} for i, (at, t) in enumerate(c.get("chapters", []))]
    tags = [{"text": t, "at": round(tl(at) * FPS), "frames": 40} for at, t in c.get("tags", [])]
    zooms = [{"from": round(tl(a) * FPS), "to": round(tl(b) * FPS)} for a, b in c.get("zooms", [])]
    beats = [round(tl(a) * FPS) for a in c.get("beats", [])]
    lt = c.get("lowerThird")
    lower = None if not lt else {"name": lt[0], "role": lt[1],
                                 "at": round(tl(lt[2]) * FPS), "frames": round(lt[3] * FPS)}

    closing = round(1.5 * FPS)
    data = {
        "fps": FPS, "width": 1080, "height": 1920,
        "source": c["source"], "music": c["music"],
        "titleTop": c["titleTop"], "titleBottom": c["titleBottom"], "titleTag": c.get("titleTag", ""),
        "introFrames": round(c.get("intro", 1.0) * FPS),
        "segments": segments, "captions": captions, "chapters": chapters,
        "lowerThird": lower, "tags": tags, "zooms": zooms, "beats": beats,
        "bodyFrames": body, "closingFrames": closing, "totalFrames": body + closing,
        "musicVolume": c.get("musicVolume", 0.11), "sfxVolume": 0.45,
    }
    out = ROOT / "data" / c["out"]
    out.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    print(f"✓ {out.name}  {data['totalFrames']} frames  {data['totalFrames']/FPS:.1f}s  "
          f"{len(cuts)} cortes  {len(captions)} subtítulos")


if __name__ == "__main__":
    main()
