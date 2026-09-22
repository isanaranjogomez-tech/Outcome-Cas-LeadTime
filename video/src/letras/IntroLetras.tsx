import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

/** Game-show open: two lines snap in, then the edition kicker. */
export const IntroLetras: React.FC<{
  line1: string;
  line2: string;
  kicker: string;
}> = ({ line1, line2, kicker }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const one = spring({ frame: frame - 0.06 * fps, fps, config: { damping: 15, mass: 0.42 } });
  const two = spring({ frame: frame - 0.26 * fps, fps, config: { damping: 15, mass: 0.42 } });
  const three = spring({ frame: frame - 0.5 * fps, fps, config: { damping: 12, mass: 0.35 } });
  const out = interpolate(frame, [2.85 * fps, 3.15 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (out <= 0) return null;

  const line: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 900,
    fontSize: 84,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    color: muncas.white,
    margin: 0,
    backgroundColor: muncas.navy,
    padding: "14px 30px",
    borderRadius: 20,
    boxShadow: "0 18px 44px rgba(6,18,41,0.55)",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "8%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: out,
      }}
    >
      <h1
        style={{
          ...line,
          transform: `translateX(${interpolate(one, [0, 1], [-520, 0])}px)`,
          opacity: one,
        }}
      >
        {line1}
      </h1>
      <h1
        style={{
          ...line,
          borderLeft: `10px solid ${muncas.red}`,
          transform: `translateX(${interpolate(two, [0, 1], [520, 0])}px)`,
          opacity: two,
        }}
      >
        {line2}
      </h1>
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "0.3em",
          color: muncas.blue,
          marginTop: 6,
          transform: `scale(${interpolate(three, [0, 1], [0.6, 1])})`,
          opacity: three,
          textShadow: "0 6px 18px rgba(6,18,41,0.7)",
        }}
      >
        {kicker}
      </span>
    </div>
  );
};
