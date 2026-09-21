import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { bezier } from "../easing";
import { colors, easeOut, fonts, themes } from "../theme";
import type { LowerThirdProps } from "../schemas";

/**
 * Name-and-role strap. Transparent background, so it can be layered over a
 * clip with <Sequence>, or rendered on its own as a PNG/ProRes overlay.
 */
export const LowerThird: React.FC<LowerThirdProps> = ({
  name,
  role,
  side,
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = themes[theme];

  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: fps });
  const exit = interpolate(
    frame,
    [durationInFrames - fps * 0.45, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: bezier(easeOut) },
  );

  const offset = interpolate(enter, [0, 1], [side === "left" ? -60 : 60, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: side === "left" ? "flex-start" : "flex-end",
        padding: "0 120px 120px",
      }}
    >
      <div
        style={{
          opacity: enter * exit,
          transform: `translateX(${offset}px)`,
          borderLeft: side === "left" ? `3px solid ${colors.gold}` : undefined,
          borderRight: side === "right" ? `3px solid ${colors.gold}` : undefined,
          padding: side === "left" ? "6px 0 6px 28px" : "6px 28px 6px 0",
          textAlign: side === "left" ? "left" : "right",
          backgroundColor:
            theme === "dark" ? "rgba(7, 13, 27, 0.72)" : "rgba(252, 251, 249, 0.86)",
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: t.ink,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: t.inkMuted,
            marginTop: 10,
          }}
        >
          {role}
        </div>
      </div>
    </AbsoluteFill>
  );
};
