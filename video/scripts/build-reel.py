#!/usr/bin/env python3
"""
One builder for the three conversational reels. It reads the measured speech
spans and their transcription, removes only the dead air between them, and lays
the shared MUNCAS system on top: hook, captions, numbered chapters where the
format has them, a name plate, tags and beat marks.

  python3 scripts/build-reel.py <key>
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCR = Path("/tmp/claude-0/-home-user-Outcome-Cas-LeadTime/cfb8b628-b01d-53f2-b6e4-14e51962ca44/scratchpad")
FPS = 30
NOISE = ("[AUDIO", "[MÚ", "[SIL", "[BLANK", "(RES", "(sonido", "[ Audio")

CFG = json.loads((ROOT / "data" / "reel-config.json").read_text())


def fix(text, rules):
    """Spelling the school owns beats whatever the recogniser heard: committee
    names, the acronyms and MUNCAS itself are spelled the official way."""
    for pat, rep in rules:
        text = re.sub(pat, rep, text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip()


def chunk(text, limit=30):
    """Break a line into balanced pieces so the last card is never a stub."""
    words = text.split()
    base = max(1, -(-len(text) // limit))
    lines = []
    # Cards hold two lines, so an odd count leaves a one-word card at the end of
    # the sentence. Widening the split until it comes out even fixes that.
    for n in (base if base == 1 else base + base % 2, base + 2, base + 4):
        target = len(text) / n
        # The cap has to stretch to whatever those n lines actually need, or a
        # long word pushes an extra line out and the count goes odd again.
        width = max(limit, -(-len(text) // n)) + 2
        lines, cur = [], ""
        for w in words:
            if cur and (len(cur) + 1 + len(w) > width or
                        (len(lines) < n - 1 and len(cur) >= target)):
                lines.append(cur); cur = w
            else:
                cur = f"{cur} {w}".strip()
        if cur:
            lines.append(cur)
        if len(lines) <= 1 or len(lines) % 2 == 0:
            break
    return lines


def sentences(text):
    """One card per sentence: a question and the answer that follows it in the
    same breath belong to different people, so they never share a card."""
    # A question running straight into its answer has no full stop in the
    # transcript; the opening ¿ is the real boundary.
    text = re.sub(r"([0-9a-záéíóúñA-ZÁÉÍÓÚÑ])\s+¿", r"\1. ¿", text)
    parts = [x.strip() for x in re.split(r"(?<=[.?!…])\s+", text) if x.strip()]
    out = []
    for x in parts:
        # "¿Sí? No." is one breath, not two cards.
        if out and len(x) < 16 and len(out[-1]) < 16:
            out[-1] = f"{out[-1]} {x}"
        else:
            out.append(x)
    return out


def cap(text):
    for i, ch in enumerate(text):
        if ch.isalpha():
            return text[:i] + ch.upper() + text[i + 1:]
    return text


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

    def keys(t):
        return {w for w in re.findall(r"[0-9a-záéíóúñü]{3,}", t.lower())}

    def in_card(t, at):
        """The chapter card already carries the question, in bigger type: the
        interviewer asking it does not need a caption under it as well."""
        for i, (a, txt) in enumerate(ch_src):
            b = ch_src[i + 1][0] if i + 1 < len(ch_src) else src_out
            if a <= at < b and txt:
                k = keys(t)
                return bool(k) and len(k & keys(txt)) / len(k) >= 0.45
        return False

    ch_src = c.get("chapters", [])
    rules = [tuple(r) for r in c.get("dict", [])]
    drop = float(c.get("captionsFromSrc", 0.0))
    captions = []
    # Windows the recogniser could not resolve: better no caption than a wrong
    # one, so they are left to the audio.
    omit = [tuple(x) for x in c.get("omit", [])]
    for s in spans:
        if s["end"] <= drop:
            continue
        if any(a <= s["start"] and s["end"] <= b for a, b in omit):
            continue
        limit = c.get("charsPerLine", 30)
        pairs = []
        sents = sentences(fix(s["text"].strip(), rules))
        span_len = max(1e-6, sum(len(x) for x in sents))
        acc_c = 0.0
        for sent in sents:
            at = s["start"] + (s["end"] - s["start"]) * (acc_c + len(sent) / 2) / span_len
            acc_c += len(sent)
            if in_card(sent, at):
                continue
            lines = chunk(cap(sent.rstrip(".")), limit)
            # at most two lines on screen: a long sentence becomes two cards
            pairs += [lines[i:i + 2] for i in range(0, len(lines), 2)]
        if not pairs:
            continue
        f0, f1 = tl(s["start"]), tl(s["end"])
        # Share the span between its cards by how much there is to read, not by
        # card count: a two-word card and a full sentence do not take the same
        # time to say, and an even split drifts out of sync inside long answers.
        w = [sum(len(x) for x in pr) + 1 for pr in pairs]
        acc, tot, t = 0, sum(w), f0
        for k, pr in enumerate(pairs):
            acc += w[k]
            nxt = f0 + (f1 - f0) * acc / tot
            captions.append({"text": "|".join(pr), "from": round(t * FPS), "to": round(nxt * FPS)})
            t = nxt

    # A chapter card stays up, shrunken, until the next question replaces it, so
    # the question is still readable while she answers it.
    chapters = []
    for i, (at, t) in enumerate(ch_src):
        a = round(tl(at) * FPS)
        nxt = round(tl(ch_src[i + 1][0]) * FPS) if i + 1 < len(ch_src) else body
        chapters.append({"index": i + 1, "total": len(ch_src), "text": fix(t, rules),
                         "at": a, "frames": max(FPS, nxt - a)})
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
        "introAt": round(tl(c.get("introAtSrc", 0.0)) * FPS),
        "introFrames": round(c.get("intro", 1.0) * FPS),
        "captionsFrom": round(tl(drop) * FPS),
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
