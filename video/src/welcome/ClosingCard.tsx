import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { captionFont, muncas } from "../muncas/theme";

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
          padding: "150px 70px 110px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: rise,
        }}
      >
        <div
          style={{
            backgroundColor: muncas.white,
            borderRadius: 22,
            padding: "14px 22px",
            opacity: rise,
            transform: `scale(${interpolate(rise, [0, 1], [0.86, 1])})`,
            boxShadow: "0 18px 44px rgba(6, 18, 41, 0.45)",
          }}
        >
          <Img
            src={staticFile("brand/muncas-logo.png")}
            style={{ width: 240, height: "auto", display: "block" }}
          />
        </div>
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
            fontSize: 32,
            letterSpacing: "0.2em",
            color: muncas.blue,
            margin: 0,
            opacity: second,
            transform: `translateY(${interpolate(second, [0, 1], [16, 0])}px)`,
          }}
        >
          {line2}
        </p>
        <p
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 38,
            letterSpacing: "0.01em",
            color: muncas.white,
            margin: "6px 0 0",
            opacity: second,
          }}
        >
          #ShapingTheFuture
        </p>
      </div>
    </AbsoluteFill>
  );
};
