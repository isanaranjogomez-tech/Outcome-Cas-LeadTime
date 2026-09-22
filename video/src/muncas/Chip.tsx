import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, layout, muncas } from "./theme";

const IN_AT = 0.1;
const OUT_AT = 1.35;

/** The committee name: a small chip, on screen for about a second. */
export const Chip: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - IN_AT * fps,
    fps,
    config: { damping: 15, mass: 0.4, stiffness: 170 },
  });
  const exit = interpolate(
    frame,
    [OUT_AT * fps, (OUT_AT + 0.22) * fps],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  if (exit <= 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: `${layout.chipTop * 100}%`,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: enter * exit,
        transform: `translateY(${interpolate(enter, [0, 1], [-34, 0])}px)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          backgroundColor: muncas.navy,
          borderRadius: 999,
          padding: "20px 38px 20px 28px",
          boxShadow: "0 18px 44px rgba(6, 18, 41, 0.5)",
          maxWidth: 940,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: muncas.red,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 800,
            fontSize: 40,
            letterSpacing: "0.07em",
            color: muncas.white,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
