import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

/** A drawn globe — thin lines, no sticker. */
const Globe: React.FC<{ size: number; progress: number }> = ({ size, progress }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
    <circle cx="50" cy="50" r="42" stroke={muncas.blue} strokeWidth="3" opacity={progress} />
    <ellipse cx="50" cy="50" rx="18" ry="42" stroke={muncas.blue} strokeWidth="2.4" opacity={progress * 0.85} />
    <line x1="8" y1="50" x2="92" y2="50" stroke={muncas.blue} strokeWidth="2.4" opacity={progress * 0.85} />
    <path d="M14 32 H86" stroke={muncas.blue} strokeWidth="2" opacity={progress * 0.6} />
    <path d="M14 68 H86" stroke={muncas.blue} strokeWidth="2" opacity={progress * 0.6} />
  </svg>
);

export const ClosingCard: React.FC<{ line1: string; line2: string }> = ({
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.5 } });
  const second = spring({
    frame: frame - 0.22 * fps,
    fps,
    config: { damping: 20, mass: 0.5 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", pointerEvents: "none" }}>
      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,18,41,0) 0%, rgba(6,18,41,0.82) 38%, rgba(6,18,41,0.94) 100%)",
          padding: "170px 70px 130px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          opacity: rise,
        }}
      >
        <Globe size={76} progress={rise} />
        <h1
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 84,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: muncas.white,
            margin: 0,
            textAlign: "center",
            transform: `translateY(${interpolate(rise, [0, 1], [34, 0])}px)`,
          }}
        >
          {line1}
        </h1>
        <div
          style={{
            width: 96,
            height: 5,
            backgroundColor: muncas.red,
            borderRadius: 3,
            opacity: second,
          }}
        />
        <p
          style={{
            fontFamily: captionFont,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: "0.22em",
            color: muncas.blue,
            margin: 0,
            opacity: second,
            transform: `translateY(${interpolate(second, [0, 1], [16, 0])}px)`,
          }}
        >
          {line2}
        </p>
      </div>
    </AbsoluteFill>
  );
};
