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

/**
 * The close. The mark sits over the sky rather than over the navy wash at the
 * bottom: it is a navy mark, and on navy it disappears. Up there it reads on
 * its own, with nothing behind it. The message holds the lower third, with
 * the hashtag carrying more weight than the line above it.
 */
export const ClosingCard: React.FC<{ line1: string; line2: string }> = ({
  line1,
  line2,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.5 } });
  const second = spring({
    frame: frame - 0.24 * fps,
    fps,
    config: { damping: 20, mass: 0.5 },
  });
  const third = spring({
    frame: frame - 0.44 * fps,
    fps,
    config: { damping: 18, mass: 0.45 },
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", pointerEvents: "none" }}>
      <Img
        src={staticFile("brand/muncas-logo.png")}
        style={{
          position: "absolute",
          top: "7%",
          left: "50%",
          width: 430,
          height: "auto",
          marginLeft: -215,
          opacity: rise,
          transform: `scale(${interpolate(rise, [0, 1], [0.9, 1])}) translateY(${interpolate(
            rise,
            [0, 1],
            [-26, 0],
          )}px)`,
          filter: "drop-shadow(0 12px 30px rgba(255, 255, 255, 0.45))",
        }}
      />

      <div
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,18,41,0) 0%, rgba(6,18,41,0.72) 26%," +
            " rgba(6,18,41,0.93) 58%, rgba(6,18,41,0.97) 100%)",
          padding: "210px 70px 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: rise,
        }}
      >
        <h1
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 82,
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
            color: muncas.white,
            margin: "10px 0 0",
            textAlign: "center",
            transform: `translateY(${interpolate(rise, [0, 1], [30, 0])}px)`,
          }}
        >
          {line1}
        </h1>

        <div
          style={{
            width: 88,
            height: 4,
            backgroundColor: muncas.red,
            borderRadius: 3,
            opacity: second,
          }}
        />

        <p
          style={{
            fontFamily: captionFont,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: "0.2em",
            color: muncas.blue,
            margin: 0,
            opacity: second * 0.9,
          }}
        >
          {line2}
        </p>

        <p
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 54,
            letterSpacing: "-0.01em",
            color: muncas.white,
            margin: "10px 0 0",
            opacity: third,
            transform: `translateY(${interpolate(third, [0, 1], [18, 0])}px)`,
            textShadow: "0 6px 20px rgba(6, 18, 41, 0.5)",
          }}
        >
          #ShapingTheFuture
        </p>
      </div>
    </AbsoluteFill>
  );
};
