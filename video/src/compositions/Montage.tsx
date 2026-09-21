import React from "react";
import { AbsoluteFill, OffthreadVideo, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Eyebrow } from "../components/Eyebrow";
import { Reveal } from "../components/Reveal";
import { colors, fonts, themes } from "../theme";
import { resolveSrc, sceneDurationInFrames } from "../montage-timing";
import type { MontageProps, Scene } from "../schemas";
import type { ThemeName } from "../theme";

const Card: React.FC<{ scene: Extract<Scene, { type: "card" }>; theme: ThemeName }> = ({
  scene,
  theme,
}) => {
  const t = themes[theme];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: t.background,
        justifyContent: "center",
        padding: "0 150px",
      }}
    >
      {scene.eyebrow ? (
        <Reveal>
          <Eyebrow color={colors.gold}>{scene.eyebrow}</Eyebrow>
        </Reveal>
      ) : null}

      <Reveal delayInSeconds={0.12}>
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 84,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: t.ink,
            margin: scene.eyebrow ? "32px 0 0" : 0,
            maxWidth: 1400,
          }}
        >
          {scene.title}
        </h2>
      </Reveal>

      {scene.subtitle ? (
        <Reveal delayInSeconds={0.24}>
          <p
            style={{
              fontFamily: fonts.sans,
              fontSize: 34,
              lineHeight: 1.5,
              color: t.inkSoft,
              margin: "30px 0 0",
              maxWidth: 1100,
            }}
          >
            {scene.subtitle}
          </p>
        </Reveal>
      ) : null}
    </AbsoluteFill>
  );
};

const Clip: React.FC<{
  scene: Extract<Scene, { type: "clip" }>;
  theme: ThemeName;
}> = ({ scene, theme }) => {
  const { fps } = useVideoConfig();
  const t = themes[theme];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.navyDeeper }}>
      <OffthreadVideo
        src={resolveSrc(scene.src)}
        trimBefore={Math.round((scene.startAtSeconds ?? 0) * fps)}
        muted={scene.muted ?? false}
        volume={scene.volume ?? 1}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {scene.caption ? (
        <AbsoluteFill
          style={{ justifyContent: "flex-end", padding: "0 120px 110px" }}
        >
          <Reveal delayInSeconds={0.3}>
            <div
              style={{
                display: "inline-block",
                fontFamily: fonts.sans,
                fontSize: 30,
                lineHeight: 1.4,
                color: t.ink,
                backgroundColor:
                  theme === "dark"
                    ? "rgba(7, 13, 27, 0.74)"
                    : "rgba(252, 251, 249, 0.88)",
                borderLeft: `3px solid ${colors.gold}`,
                padding: "16px 24px",
                maxWidth: 1100,
              }}
            >
              {scene.caption}
            </div>
          </Reveal>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * The edit itself: a list of scenes, joined by one transition style.
 * Everything comes from props, so a render is fully described by a JSON
 * file — see data/*.json and `npm run render:all`.
 */
export const Montage: React.FC<MontageProps> = ({
  scenes,
  theme,
  transition,
  transitionInSeconds,
}) => {
  const { fps } = useVideoConfig();
  const transitionFrames = Math.round(transitionInSeconds * fps);

  const presentation =
    transition === "slide" ? slide() : transition === "fade" ? fade() : null;

  return (
    <AbsoluteFill style={{ backgroundColor: themes[theme].background }}>
      <TransitionSeries>
        {scenes.map((scene, i) => (
          <React.Fragment key={i}>
            {i > 0 && presentation ? (
              <TransitionSeries.Transition
                presentation={presentation}
                timing={linearTiming({ durationInFrames: transitionFrames })}
              />
            ) : null}
            <TransitionSeries.Sequence
              durationInFrames={sceneDurationInFrames(scene, fps)}
            >
              {scene.type === "card" ? (
                <Card scene={scene} theme={theme} />
              ) : (
                <Clip scene={scene} theme={theme} />
              )}
            </TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
