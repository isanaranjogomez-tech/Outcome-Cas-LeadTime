import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Eyebrow } from "../components/Eyebrow";
import { Reveal } from "../components/Reveal";
import { Rule } from "../components/Rule";
import { bezier } from "../easing";
import { colors, easeOut, fonts, themes } from "../theme";
import type { TitleCardProps } from "../schemas";

export const TitleCard: React.FC<TitleCardProps> = ({
  eyebrow,
  title,
  subtitle,
  footnote,
  theme,
}) => {
  const t = themes[theme];
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Hold, then fade the whole card out over the last half second.
  const outro = interpolate(
    frame,
    [durationInFrames - fps * 0.5, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: bezier(easeOut) },
  );

  const ruleWidth = interpolate(frame, [fps * 0.15, fps * 1.05], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: bezier(easeOut),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: t.background, opacity: outro }}>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "0 150px",
        }}
      >
        <Reveal delayInSeconds={0}>
          <Eyebrow color={colors.gold}>{eyebrow}</Eyebrow>
        </Reveal>

        <div style={{ height: 34 }} />
        <Rule color={t.rule} width={ruleWidth} />
        <div style={{ height: 34 }} />

        <Reveal delayInSeconds={0.12}>
          <h1
            style={{
              fontFamily: fonts.display,
              fontSize: 104,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: t.ink,
              margin: 0,
              maxWidth: 1400,
            }}
          >
            {title}
          </h1>
        </Reveal>

        {subtitle ? (
          <Reveal delayInSeconds={0.26}>
            <p
              style={{
                fontFamily: fonts.sans,
                fontSize: 38,
                fontWeight: 400,
                lineHeight: 1.45,
                color: t.inkSoft,
                margin: "36px 0 0",
                maxWidth: 1150,
              }}
            >
              {subtitle}
            </p>
          </Reveal>
        ) : null}
      </AbsoluteFill>

      {footnote ? (
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 150px 110px" }}>
          <Reveal delayInSeconds={0.45}>
            <div
              style={{
                fontFamily: fonts.sans,
                fontSize: 26,
                letterSpacing: "0.02em",
                color: t.inkMuted,
              }}
            >
              {footnote}
            </div>
          </Reveal>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
