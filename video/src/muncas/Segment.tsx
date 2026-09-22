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
import { Captions } from "./Captions";
import { Chip } from "./Chip";
import { EmojiRow } from "./EmojiRow";
import { gradeCss } from "./Grade";
import { sfxForAnim } from "./sfx";
import { muncas } from "./theme";
import type { Segment as SegmentType } from "./schema";

/**
 * The camera never quite sits still: a slow push through the whole shot, plus
 * a punch towards the faces when the last emoji lands.
 */
const useZoom = (segment: SegmentType, totalFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const drift = interpolate(frame, [0, totalFrames], [1.02, 1.055], {
    extrapolateRight: "clamp",
  });

  const punchAt =
    segment.emojis.length > 0
      ? segment.emojis[segment.emojis.length - 1].at
      : segment.durationInSeconds * 0.55;

  const punch = spring({
    frame: frame - punchAt * fps,
    fps,
    config: { damping: 200, mass: 0.7 },
    durationInFrames: Math.round(fps * 0.55),
  });

  // A few frames of extra push on the cut itself — the "zoom cut" feel,
  // gone before anyone can name it.
  const cutPunch = interpolate(frame, [0, 6], [0.055, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return drift + punch * 0.075 + cutPunch;
};

export const SegmentView: React.FC<{
  segment: SegmentType;
  source: string;
  fps: number;
  sfxVolume: number;
}> = ({ segment, source, fps, sfxVolume }) => {
  const videoFrames = Math.round(segment.durationInSeconds * fps);
  const freezeFrames = Math.round(segment.freezeInSeconds * fps);
  const totalFrames = videoFrames + freezeFrames;

  const zoom = useZoom(segment, totalFrames);

  // Hoisted so the volumes stay plain numbers at the call site.
  const cutVolume = sfxVolume * 0.42;
  const chipVolume = sfxVolume * 0.7;
  const freezeVolume = sfxVolume * 0.55;

  const plate: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${zoom})`,
    transformOrigin: "50% 34%",
    filter: gradeCss(segment.id),
  };

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Sequence durationInFrames={videoFrames}>
          <OffthreadVideo
            src={staticFile(source)}
            trimBefore={Math.round(segment.srcIn * fps)}
            trimAfter={Math.round(segment.srcOut * fps)}
            style={plate}
          />
        </Sequence>

        {freezeFrames > 0 ? (
          <Sequence from={videoFrames} durationInFrames={freezeFrames}>
            <Img src={staticFile(`freeze/${segment.id}.jpg`)} style={plate} />
          </Sequence>
        ) : null}
      </AbsoluteFill>

      {/* A navy wash top and bottom keeps white text legible over daylight. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,18,41,0.46) 0%, rgba(6,18,41,0) 26%," +
            " rgba(6,18,41,0) 58%, rgba(6,18,41,0.52) 100%)",
          pointerEvents: "none",
        }}
      />

      {segment.label ? <Chip label={segment.label} /> : null}
      <EmojiRow segment={segment} />
      <Captions captions={segment.captions} />

      {/* --- sound ------------------------------------------------------- */}
      <Audio src={staticFile("sfx/whoosh.wav")} volume={cutVolume} />

      {segment.label ? (
        <Sequence from={Math.round(0.12 * fps)}>
          <Audio src={staticFile("sfx/click.wav")} volume={chipVolume} />
        </Sequence>
      ) : null}

      {segment.emojis.map((beat, i) => {
        const cue = sfxForAnim(beat.anim);
        const volume = sfxVolume * cue.gain;
        return (
          <Sequence key={`${beat.char}-${i}`} from={Math.round(beat.at * fps)}>
            <Audio src={staticFile(`sfx/${cue.file}.wav`)} volume={volume} />
          </Sequence>
        );
      })}

      {freezeFrames > 0 ? (
        <Sequence from={videoFrames}>
          <Audio src={staticFile("sfx/thump.wav")} volume={freezeVolume} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
