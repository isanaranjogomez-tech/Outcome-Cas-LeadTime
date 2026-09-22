import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { GradeDefs } from "./Grade";
import { IntroTitle } from "./IntroTitle";
import { SegmentView } from "./Segment";
import { muncas } from "./theme";
import type { MuncasProps } from "./schema";

/**
 * "Describe tu comité en 3 emojis" — the whole reel.
 *
 * The cut is a plain list of segments: each one is a slice of the source clip
 * with its pause trimmed off, so the answers run straight into each other.
 * Everything on top — chip, emoji, captions, sound — is driven by the timings
 * in data/muncas-emojis.json.
 */
export const Muncas: React.FC<MuncasProps> = ({
  fps,
  source,
  title,
  segments,
  musicVolume,
  sfxVolume,
}) => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <GradeDefs segments={segments} />

      {segments.map((segment) => {
        const frames =
          Math.round(segment.durationInSeconds * fps) +
          Math.round(segment.freezeInSeconds * fps);
        const from = cursor;
        cursor += frames;

        return (
          <Sequence key={segment.id} from={from} durationInFrames={frames}>
            <SegmentView
              segment={segment}
              source={source}
              fps={fps}
              sfxVolume={sfxVolume}
            />
            {segment.id === "intro" ? <IntroTitle {...title} /> : null}
          </Sequence>
        );
      })}

      {musicVolume > 0 ? (
        <Audio src={staticFile("sfx/music-bed.ogg")} volume={musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};

/** Total length of the cut, in frames. */
export const muncasDurationInFrames = ({ fps, segments }: MuncasProps) =>
  segments.reduce(
    (acc, s) =>
      acc +
      Math.round(s.durationInSeconds * fps) +
      Math.round(s.freezeInSeconds * fps),
    0,
  );
