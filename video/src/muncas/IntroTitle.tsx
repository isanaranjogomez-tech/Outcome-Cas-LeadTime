import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "./theme";

type Props = { line1: string; line2: string; count: string; line3: string };

/**
 * The concept, stated once: the first line drops in, then "3 EMOJIS" pops.
 * It sits above everyone's heads and is gone before the first answer.
 */
export const IntroTitle: React.FC<Props> = ({ line1, line2, count, line3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drop = spring({
    frame: frame - 0.08 * fps,
    fps,
    config: { damping: 16, mass: 0.5, stiffness: 150 },
  });
  const pop = spring({
    frame: frame - 0.46 * fps,
    fps,
    config: { damping: 11, mass: 0.4, stiffness: 165 },
  });
  const out = interpolate(frame, [2.34 * fps, 2.62 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (out <= 0) return null;

  const headline: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 900,
    fontSize: 88,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    color: muncas.white,
    margin: 0,
    textShadow: "0 8px 26px rgba(6, 18, 41, 0.6)",
    WebkitTextStroke: `2px ${muncas.navyDeep}`,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "7.5%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        opacity: out,
      }}
    >
      <div
        style={{
          transform: `translateY(${interpolate(drop, [0, 1], [-190, 0])}px)`,
          opacity: drop,
          backgroundColor: muncas.navy,
          borderRadius: 26,
          padding: "18px 34px",
          boxShadow: "0 20px 50px rgba(6, 18, 41, 0.55)",
        }}
      >
        <h1 style={headline}>{line1}</h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          transform: `scale(${interpolate(pop, [0, 1], [0.55, 1])})`,
          opacity: pop,
        }}
      >
        <span style={{ ...headline, fontSize: 80 }}>{line2}</span>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 108,
            height: 108,
            borderRadius: 28,
            backgroundColor: muncas.red,
            transform: `rotate(${interpolate(pop, [0, 1], [-14, -4])}deg)`,
            boxShadow: "0 16px 38px rgba(168, 19, 12, 0.55)",
          }}
        >
          <span
            style={{
              fontFamily: captionFont,
              fontWeight: 900,
              fontSize: 82,
              lineHeight: 1,
              color: muncas.white,
            }}
          >
            {count}
          </span>
        </span>
        <span style={{ ...headline, fontSize: 80, color: muncas.blue }}>{line3}</span>
      </div>
    </div>
  );
};
