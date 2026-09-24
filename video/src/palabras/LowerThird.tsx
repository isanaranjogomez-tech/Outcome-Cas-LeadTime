import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SAFE, font, pal } from "./theme";

/**
 * Institutional identification: a navy plate with a red rule, the delegation
 * in light blue. It enters once, softly, and then holds — the game's three
 * full-screen cards are outside the sequence that mounts it, so it never
 * stacks under a graphic and never re-animates on a cut.
 */
export const LowerThird: React.FC<{ text: string; accent: string }> = ({
  text,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - 0.35 * fps,
    fps,
    config: { damping: 20, mass: 0.5, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        bottom: SAFE.bottom + 10,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(11, 21, 40, 0.88)",
        borderLeft: `6px solid ${pal.red}`,
        borderTop: "1px solid rgba(114, 197, 229, 0.35)",
        borderBottom: "1px solid rgba(114, 197, 229, 0.35)",
        borderRadius: 9,
        padding: "10px 22px 10px 18px",
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-24, 0])}px)`,
        boxShadow: "0 10px 26px rgba(6, 12, 26, 0.45)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: "0.09em",
          color: pal.white,
          whiteSpace: "nowrap",
        }}
      >
        {text}
        {accent ? (
          <>
            <span style={{ color: pal.red, padding: "0 9px" }}>·</span>
            <span style={{ fontWeight: 700, color: pal.blue }}>{accent}</span>
          </>
        ) : null}
      </span>
    </div>
  );
};
