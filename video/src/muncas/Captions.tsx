import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, layout, muncas } from "./theme";
import type { Caption } from "./schema";

const MAX_WORDS = 3;
const MAX_SPAN = 1.7;
/** Long words earn their own line rather than being crammed three to a card. */
const MAX_CHARS = 21;

type Chunk = { words: Caption[]; start: number; end: number };

/** Two to three words at a time, broken at punctuation, TikTok-style. */
const chunkWords = (captions: Caption[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let current: Caption[] = [];

  const flush = () => {
    if (current.length === 0) return;
    chunks.push({
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
    });
    current = [];
  };

  for (const word of captions) {
    current.push(word);
    const breaksOnPunctuation = /[,.:;!?]$/.test(word.word);
    const tooLong =
      current.length >= MAX_WORDS ||
      current.reduce((n, c) => n + c.word.length + 1, 0) > MAX_CHARS;
    const tooSlow = word.end - current[0].start >= MAX_SPAN;
    if (breaksOnPunctuation || tooLong || tooSlow) flush();
  }
  flush();
  return chunks;
};

const fillFor = (accent: Caption["accent"]) =>
  accent === "red" ? muncas.red : accent === "blue" ? muncas.blue : muncas.white;

const Word: React.FC<{ caption: Caption; frame: number; fps: number }> = ({
  caption,
  frame,
  fps,
}) => {
  const age = frame - caption.start * fps;

  const enter = spring({
    frame: age,
    fps,
    config: { damping: 14, mass: 0.34, stiffness: 190 },
  });
  const scale = interpolate(enter, [0, 1], [0.62, 1]);
  const lift = interpolate(enter, [0, 1], [16, 0]);
  const opacity = interpolate(age, [0, fps * 0.07], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The word being spoken sits a touch forward.
  const spoken = frame >= caption.start * fps && frame < caption.end * fps;
  const emphasis = spoken ? 1.045 : 1;

  const text = caption.word.toUpperCase();
  const shared: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 900,
    fontSize: 72,
    letterSpacing: "-0.015em",
    lineHeight: 1.06,
    margin: 0,
    whiteSpace: "pre",
  };

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        transform: `translateY(${lift}px) scale(${scale * emphasis})`,
        opacity,
        margin: "0 10px",
      }}
    >
      {/* Outline behind the fill — thin, so it reads without shouting. */}
      <span
        aria-hidden
        style={{
          ...shared,
          position: "absolute",
          inset: 0,
          color: muncas.navyDeep,
          WebkitTextStroke: `11px ${muncas.navyDeep}`,
          opacity: 0.92,
        }}
      >
        {text}
      </span>
      <span
        style={{
          ...shared,
          position: "relative",
          color: fillFor(caption.accent),
          textShadow: "0 6px 18px rgba(6, 18, 41, 0.45)",
        }}
      >
        {text}
      </span>
    </span>
  );
};

export const Captions: React.FC<{
  captions: Caption[];
  /** Distance from the top of the frame, 0–1. */
  top?: number;
}> = ({ captions, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunks = useMemo(() => chunkWords(captions), [captions]);

  const active = chunks.find(
    (c) => frame >= (c.start - 0.08) * fps && frame < (c.end + 0.16) * fps,
  );
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: `${(top ?? layout.captionTop) * 100}%`,
        left: layout.safeX,
        right: layout.safeX,
        display: "flex",
        flexWrap: "wrap",
        gap: "6px 0",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      {active.words.map((w, i) => (
        <Word key={`${w.word}-${i}`} caption={w} frame={frame} fps={fps} />
      ))}
    </div>
  );
};
