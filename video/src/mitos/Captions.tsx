import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";
import { MITOS_BLUE, MITOS_RED, SAFE } from "./theme";
import type { MitoSegment } from "./schema";

type Caption = MitoSegment["captions"][number];

const MAX_WORDS = 4;
const MAX_CHARS = 26;

const chunk = (captions: Caption[]) => {
  const out: Caption[][] = [];
  let cur: Caption[] = [];
  for (const w of captions) {
    const chars = cur.reduce((n, c) => n + c.word.length + 1, 0) + w.word.length;
    if (cur.length >= MAX_WORDS || chars > MAX_CHARS) {
      if (cur.length) out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
};

const fill = (accent: Caption["accent"]) =>
  accent === "red" ? MITOS_RED : accent === "blue" ? MITOS_BLUE : muncas.white;

const Word: React.FC<{ caption: Caption }> = ({ caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - caption.start * fps;
  const enter = spring({ frame: age, fps, config: { damping: 16, mass: 0.32, stiffness: 180 } });

  const shared: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 700,
    fontSize: 58,
    letterSpacing: "-0.01em",
    lineHeight: 1.18,
    margin: 0,
    whiteSpace: "pre",
  };

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        margin: "0 8px",
        opacity: interpolate(age, [0, fps * 0.06], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(enter, [0, 1], [10, 0])}px) scale(${interpolate(
          enter,
          [0, 1],
          [0.86, 1],
        )})`,
      }}
    >
      <span
        aria-hidden
        style={{
          ...shared,
          position: "absolute",
          inset: 0,
          color: muncas.navyDeep,
          WebkitTextStroke: `9px ${muncas.navyDeep}`,
          opacity: 0.9,
        }}
      >
        {caption.word}
      </span>
      <span style={{ ...shared, position: "relative", color: fill(caption.accent) }}>
        {caption.word}
      </span>
    </span>
  );
};

/** Word by word, in short groups, inside the safe box. */
export const MitoCaptions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunks = useMemo(() => chunk(captions), [captions]);

  const active = chunks.find(
    (c) =>
      frame >= (c[0].start - 0.1) * fps &&
      frame < (c[c.length - 1].end + 0.35) * fps,
  );
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: SAFE.right,
        bottom: SAFE.bottom + 30,
        // Inline-block words inside a centred block: flex centring was
        // leaving a single-word chunk hard against the left edge.
        display: "block",
        textAlign: "center",
        lineHeight: 1.25,
      }}
    >
      {active.map((w, i) => (
        <Word key={`${w.word}-${i}`} caption={w} />
      ))}
    </div>
  );
};
