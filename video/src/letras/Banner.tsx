import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

/** The short interjections: PROCESANDO…, EMPATE, POR MILISEGUNDOS. */
export const Banner: React.FC<{ text: string; at: number; life?: number }> = ({
  text,
  at,
  life = 0.85,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - at * fps;
  if (age < 0 || age / fps > life) return null;

  const enter = spring({ frame: age, fps, config: { damping: 13, mass: 0.35 } });
  const out = interpolate(age / fps, [life - 0.18, life], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: "63%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: enter * out,
        transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])}) rotate(-1.5deg)`,
      }}
    >
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 56,
          letterSpacing: "0.02em",
          color: muncas.white,
          backgroundColor: muncas.red,
          padding: "14px 34px",
          borderRadius: 18,
          boxShadow: "0 18px 44px rgba(168,19,12,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};
