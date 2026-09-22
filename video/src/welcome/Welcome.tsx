import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { muncas } from "../muncas/theme";
import { ClosingCard } from "./ClosingCard";
import { Shout } from "./Shout";
import type { WelcomeProps, WelcomeSegment } from "./schema";

/**
 * Text placement rotates through these so the same two words never sit in
 * the same spot twice running. All of them clear the children's faces.
 */
const PLACEMENT = [
  { welcome: 0.135, muncas: 0.70, tilt: -2.5 },
  { welcome: 0.72, muncas: 0.135, tilt: 2 },
  { welcome: 0.125, muncas: 0.715, tilt: 2.5 },
  { welcome: 0.715, muncas: 0.13, tilt: -2 },
  { welcome: 0.12, muncas: 0.705, tilt: -1.5 },
  { welcome: 0.125, muncas: 0.70, tilt: 1.5 },
];

/** One gesture per clip: a punch on the shout, or a slow drift. Never both. */
const useCamera = (segment: WelcomeSegment, totalFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (segment.move === "punch") {
    const hit = spring({
      frame: frame - segment.muncasAt * fps,
      fps,
      config: { damping: 200, mass: 0.6 },
      durationInFrames: Math.round(fps * 0.4),
    });
    return 1.01 + hit * 0.1;
  }

  return interpolate(frame, [0, totalFrames], [1.0, 1.05], {
    extrapolateRight: "clamp",
  });
};

const SegmentView: React.FC<{
  segment: WelcomeSegment;
  index: number;
  closing: WelcomeProps["closing"];
  sfxVolume: number;
}> = ({ segment, index, closing, sfxVolume }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const videoFrames = Math.round(segment.durationInSeconds * fps);
  const holdFrames = Math.round(segment.holdInSeconds * fps);
  const totalFrames = videoFrames + holdFrames;
  const zoom = useCamera(segment, totalFrames);

  const place = PLACEMENT[index % PLACEMENT.length];

  // The freeze gets a small extra push and a thin frame; the closing hold
  // just sits still under the card.
  const inHold = frame >= videoFrames;
  const freezePush =
    segment.isFreeze && inHold
      ? interpolate(frame - videoFrames, [0, holdFrames], [0, 0.035], {
          extrapolateRight: "clamp",
        })
      : 0;

  const plate: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${zoom + freezePush})`,
    transformOrigin: "50% 40%",
    filter: "contrast(1.03) saturate(1.06)",
  };

  const popVolume = sfxVolume * 0.62;
  // The impact used to land right on top of a short shout and swallow its
  // last syllable. It punctuates now, it does not compete.
  const impactVolume = sfxVolume * 0.38;
  const dingVolume = sfxVolume * 0.75;
  const shineVolume = sfxVolume * 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Sequence durationInFrames={videoFrames}>
          <OffthreadVideo src={staticFile(segment.clip)} style={plate} />
        </Sequence>
        {holdFrames > 0 && segment.still ? (
          <Sequence from={videoFrames} durationInFrames={holdFrames}>
            <Img src={staticFile(segment.still)} style={plate} />
          </Sequence>
        ) : null}
      </AbsoluteFill>

      {segment.isFreeze && inHold ? (
        <AbsoluteFill
          style={{
            border: `7px solid ${muncas.blue}`,
            margin: 34,
            borderRadius: 10,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* On the last clip the shout clears the frame when the card rises,
          so the two never stack. */}
      <Sequence durationInFrames={segment.closing ? videoFrames : totalFrames}>
        <Shout
          text="WELCOME"
          at={segment.welcomeAt}
          size={104}
          top={place.welcome}
          tilt={place.tilt}
          stroke={muncas.navyDeep}
        />
        <Shout
          text="MUNCAS!"
          at={segment.muncasAt}
          size={136}
          top={place.muncas}
          tilt={-place.tilt}
          stroke={muncas.red}
        />
      </Sequence>

      {segment.closing ? (
        <Sequence from={videoFrames}>
          <ClosingCard {...closing} />
        </Sequence>
      ) : null}

      {/* Sound: a pop on the word, a soft impact on the shout. No whoosh at
          the cuts — the children supply the energy. */}
      <Sequence from={Math.round(segment.welcomeAt * fps)}>
        <Audio src={staticFile("sfx/pop.wav")} volume={popVolume} />
      </Sequence>
      <Sequence from={Math.round(segment.muncasAt * fps)}>
        <Audio src={staticFile("sfx/impact.wav")} volume={impactVolume} />
      </Sequence>
      {segment.closing ? (
        <Sequence from={videoFrames}>
          <Audio src={staticFile("sfx/ding.wav")} volume={dingVolume} />
          <Audio src={staticFile("sfx/shine.wav")} volume={shineVolume} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * "Welcome MUNCAS" — six children, one phrase, passed along.
 * The whole piece carries exactly one whoosh, at the very top.
 */
export const Welcome: React.FC<WelcomeProps> = ({
  fps,
  segments,
  closing,
  musicVolume,
  sfxVolume,
}) => {
  let cursor = 0;
  const openingWhoosh = sfxVolume * 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      {segments.map((segment, i) => {
        const frames =
          Math.round(segment.durationInSeconds * fps) +
          Math.round(segment.holdInSeconds * fps);
        const from = cursor;
        cursor += frames;

        return (
          <Sequence key={segment.id} from={from} durationInFrames={frames}>
            <SegmentView
              segment={segment}
              index={i}
              closing={closing}
              sfxVolume={sfxVolume}
            />
          </Sequence>
        );
      })}

      <Audio src={staticFile("sfx/whoosh.wav")} volume={openingWhoosh} />

      {musicVolume > 0 ? (
        <Audio src={staticFile("sfx/music-bed.ogg")} volume={musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};

export const welcomeDurationInFrames = ({ fps, segments }: WelcomeProps) =>
  segments.reduce(
    (acc, s) =>
      acc +
      Math.round(s.durationInSeconds * fps) +
      Math.round(s.holdInSeconds * fps),
    0,
  );
