import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { captionFont, muncas } from "../muncas/theme";

type Props = {
  text: string;
  at: number;
  size: number;
  /** 0–1 down the frame. */
  top: number;
  tilt: number;
  stroke: string;
};

/**
 * The words are graphics, not captions: WELCOME lands when they say it,
 * MUNCAS! lands bigger when they shout it. Position and tilt shift from clip
 * to clip so six repetitions never look like the same card six times.
 */
export const Shout: React.FC<Props> = ({ text, at, size, top, tilt, stroke }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - at * fps;
  if (age < 0) return null;

  const pop = spring({
    frame: age,
    fps,
    config: { damping: 12, mass: 0.38, stiffness: 200 },
  });
  // A single settle, no constant bouncing.
  const scale = interpolate(pop, [0, 1], [0.55, 1]);

  const shared: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 900,
    fontSize: size,
    letterSpacing: "-0.02em",
    lineHeight: 1,
    margin: 0,
    whiteSpace: "pre",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: `${top * 100}%`,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${scale}) rotate(${tilt}deg)`,
        opacity: interpolate(age, [0, fps * 0.06], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <span style={{ position: "relative", display: "inline-block" }}>
        <span
          aria-hidden
          style={{
            ...shared,
            position: "absolute",
            inset: 0,
            color: stroke,
            WebkitTextStroke: `16px ${stroke}`,
          }}
        >
          {text}
        </span>
        <span
          style={{
            ...shared,
            position: "relative",
            color: muncas.white,
            textShadow: "0 8px 22px rgba(6, 18, 41, 0.45)",
          }}
        >
          {text}
        </span>
      </span>
    </div>
  );
};
