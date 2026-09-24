import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { font, pal } from "./theme";

/**
 * The TikTok cover. It is a still, not a frame of the edit — the video never
 * shows it. Both players are visible and both amounts are on screen in the
 * same neutral chip, so nothing in the design hints at who wins.
 */
export const Cover: React.FC<{
  source: string;
  frameSeconds: number;
  leftAmount: string;
  rightAmount: string;
}> = ({ source, frameSeconds, leftAmount, rightAmount }) => {
  const chip: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(11, 21, 40, 0.92)",
    border: `4px solid ${pal.blue}`,
    borderRadius: 999,
    padding: "14px 30px",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navy, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(source)}
        trimBefore={Math.round(frameSeconds * 30)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.12)",
          transformOrigin: "44% 38%",
          filter: "contrast(1.06) saturate(1.06) brightness(0.97)",
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,21,40,0.72) 0%, rgba(11,21,40,0.12) 26%," +
            " rgba(11,21,40,0.10) 46%, rgba(11,21,40,0.86) 76%, rgba(11,21,40,0.94) 100%)",
        }}
      />

      {/* the two amounts, over each player, in the same neutral chip */}
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 36,
        }}
      >
        <div style={chip}>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: 62, color: pal.money }}>
            {leftAmount}
          </span>
          <span style={{ fontSize: 46, lineHeight: 1 }}>💵</span>
        </div>
        <span style={{ fontFamily: font, fontWeight: 800, fontSize: 52, color: pal.white }}>vs</span>
        <div style={chip}>
          <span style={{ fontFamily: font, fontWeight: 800, fontSize: 62, color: pal.money }}>
            {rightAmount}
          </span>
          <span style={{ fontSize: 46, lineHeight: 1 }}>💵</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontWeight: 800,
            fontSize: 118,
            lineHeight: 1.02,
            letterSpacing: "-0.04em",
            textAlign: "center",
            color: pal.white,
            textShadow: "0 16px 44px rgba(6, 12, 26, 0.85)",
          }}
        >
          ADIVINA<br />EL DINERO <span style={{ color: pal.money }}>💸</span>
        </span>
        <div style={{ width: 240, height: 9, backgroundColor: pal.red, borderRadius: 5 }} />
        <span
          style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 44,
            letterSpacing: "0.22em",
            color: pal.blue,
          }}
        >
          MUNCAS XX
        </span>
      </div>
    </AbsoluteFill>
  );
};
