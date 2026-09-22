import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

type Props = {
  left: string;
  right: string;
  score: [number, number];
  /** Set on the segment where a point lands, so the pill can react. */
  point?: { side: "left" | "right"; at: number };
};

const Pill: React.FC<{
  name: string;
  value: number;
  hot: number;
  align: "left" | "right";
}> = ({ name, value, hot, align }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: align === "left" ? "flex-start" : "flex-end",
      gap: 6,
      backgroundColor: muncas.navy,
      border: `3px solid ${interpolateColour(hot)}`,
      borderRadius: 22,
      padding: "14px 26px",
      minWidth: 250,
      boxShadow: `0 16px 40px rgba(6, 18, 41, ${0.45 + hot * 0.3})`,
      transform: `scale(${1 + hot * 0.07})`,
    }}
  >
    <span
      style={{
        fontFamily: captionFont,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: "0.14em",
        color: hot > 0.2 ? muncas.white : muncas.blue,
      }}
    >
      {name}
    </span>
    <span
      style={{
        fontFamily: captionFont,
        fontWeight: 900,
        fontSize: 64,
        lineHeight: 1,
        color: muncas.white,
      }}
    >
      {value}
    </span>
  </div>
);

/** Border goes from the quiet blue to MUNCAS red as a point lands. */
const interpolateColour = (hot: number) =>
  hot > 0.02 ? muncas.red : "rgba(79, 168, 232, 0.35)";

export const Scoreboard: React.FC<Props> = ({ left, right, score, point }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sincePoint = point ? (frame - point.at * fps) / fps : -1;
  const landed = sincePoint >= 0;

  const shown: [number, number] = landed
    ? [
        score[0] + (point?.side === "left" ? 1 : 0),
        score[1] + (point?.side === "right" ? 1 : 0),
      ]
    : score;

  // Highlight decays over half a second.
  const hot = landed ? Math.max(0, 1 - sincePoint / 0.55) : 0;
  const plusOne = landed
    ? spring({
        frame: frame - (point?.at ?? 0) * fps,
        fps,
        config: { damping: 12, mass: 0.4 },
      })
    : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: "4.2%",
        left: 54,
        right: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
      }}
    >
      <div style={{ position: "relative" }}>
        <Pill
          name={left}
          value={shown[0]}
          hot={point?.side === "left" ? hot : 0}
          align="left"
        />
        {point?.side === "left" && plusOne > 0 ? <PlusOne progress={plusOne} /> : null}
      </div>

      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 40,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        —
      </span>

      <div style={{ position: "relative" }}>
        <Pill
          name={right}
          value={shown[1]}
          hot={point?.side === "right" ? hot : 0}
          align="right"
        />
        {point?.side === "right" && plusOne > 0 ? <PlusOne progress={plusOne} /> : null}
      </div>
    </div>
  );
};

const PlusOne: React.FC<{ progress: number }> = ({ progress }) => (
  <span
    style={{
      position: "absolute",
      top: -18,
      right: -14,
      fontFamily: captionFont,
      fontWeight: 900,
      fontSize: 52,
      color: muncas.red,
      WebkitTextStroke: `6px ${muncas.navyDeep}`,
      paintOrder: "stroke",
      transform: `translateY(${interpolate(progress, [0, 1], [26, -18])}px) scale(${interpolate(
        progress,
        [0, 1],
        [0.4, 1],
      )})`,
      opacity: interpolate(progress, [0, 0.25, 0.8, 1], [0, 1, 1, 0]),
    }}
  >
    +1
  </span>
);
