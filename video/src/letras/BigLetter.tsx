import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

/** Half a second of a very large letter, then straight back to their faces. */
export const BigLetter: React.FC<{ letter: string; at: number }> = ({ letter, at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - at * fps;
  const life = age / fps;

  if (age < 0 || life > 0.62) return null;

  const enter = spring({
    frame: age,
    fps,
    config: { damping: 11, mass: 0.4, stiffness: 190 },
  });
  const out = interpolate(life, [0.44, 0.62], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: out,
        background:
          "radial-gradient(circle at 50% 46%, rgba(11,27,60,0.86) 0%, rgba(6,18,41,0.62) 45%, rgba(6,18,41,0.12) 75%)",
      }}
    >
      <div
        style={{
          position: "relative",
          transform: `scale(${interpolate(enter, [0, 1], [0.35, 1])}) rotate(${interpolate(
            enter,
            [0, 1],
            [-16, -4],
          )}deg)`,
        }}
      >
        <span
          style={{
            display: "block",
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 620,
            lineHeight: 0.82,
            color: muncas.white,
            WebkitTextStroke: `18px ${muncas.red}`,
            paintOrder: "stroke",
            textShadow: "0 34px 70px rgba(6,18,41,0.75)",
          }}
        >
          {letter}
        </span>
      </div>
    </AbsoluteFill>
  );
};
