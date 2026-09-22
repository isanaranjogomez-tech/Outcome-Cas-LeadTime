import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

const CONFETTI = 26;

/** Deterministic scatter — same on every render. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 91.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The close: an arrow onto the right-hand player, WINNER, the final score,
 * and just enough confetti to register.
 */
export const WinnerCard: React.FC<{ name: string; score: [number, number] }> = ({
  name,
  score,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame: frame - 0.1 * fps, fps, config: { damping: 12, mass: 0.4 } });
  const arrow = spring({ frame, fps, config: { damping: 14, mass: 0.4 } });
  const scoreIn = spring({ frame: frame - 0.5 * fps, fps, config: { damping: 13, mass: 0.4 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: CONFETTI }).map((_, i) => {
        const t = frame / fps;
        const x = rand(i) * 100;
        const fall = ((t * (0.5 + rand(i + 40) * 0.6) + rand(i + 9)) % 1.4) * 115 - 12;
        const colour = [muncas.red, muncas.blue, muncas.white][i % 3];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${fall}%`,
              width: 14,
              height: 22,
              backgroundColor: colour,
              opacity: 0.85,
              transform: `rotate(${(t * 220 + i * 47) % 360}deg)`,
            }}
          />
        );
      })}

      {/* The arrow sits over the right-hand player. */}
      <div
        style={{
          position: "absolute",
          top: "36%",
          right: "16%",
          fontSize: 130,
          lineHeight: 1,
          color: muncas.red,
          transform: `translateY(${interpolate(arrow, [0, 1], [-70, 0])}px)`,
          opacity: arrow,
          filter: "drop-shadow(0 10px 22px rgba(6,18,41,0.6))",
        }}
      >
        ▼
      </div>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          marginTop: "12%",
        }}
      >
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 132,
            letterSpacing: "-0.01em",
            color: muncas.white,
            WebkitTextStroke: `14px ${muncas.navyDeep}`,
            paintOrder: "stroke",
            transform: `scale(${interpolate(pop, [0, 1], [0.5, 1])}) rotate(-2deg)`,
            opacity: pop,
          }}
        >
          WINNER
        </span>
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 800,
            fontSize: 52,
            letterSpacing: "0.045em",
            color: muncas.white,
            backgroundColor: muncas.red,
            padding: "16px 32px",
            borderRadius: 16,
            whiteSpace: "nowrap",
            textShadow: "0 4px 14px rgba(6,18,41,0.45)",
            opacity: pop,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 96,
            color: muncas.blue,
            WebkitTextStroke: `10px ${muncas.navyDeep}`,
            paintOrder: "stroke",
            marginTop: 10,
            transform: `scale(${interpolate(scoreIn, [0, 1], [0.6, 1])})`,
            opacity: scoreIn,
          }}
        >
          {score[0]} — {score[1]}
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
