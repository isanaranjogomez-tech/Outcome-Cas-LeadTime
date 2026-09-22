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
import { Captions } from "../muncas/Captions";
import { muncas } from "../muncas/theme";
import { Banner } from "./Banner";
import { BigLetter } from "./BigLetter";
import { IntroLetras } from "./IntroLetras";
import { Scoreboard } from "./Scoreboard";
import { WinnerCard } from "./WinnerCard";
import type { LetrasProps, LetrasSegment } from "./schema";

/**
 * Four camera behaviours. The plain ones matter as much as the moves: a zoom
 * only reads as a zoom if the shot before it sat still.
 *   hold  — no move at all
 *   push  — a barely-there drift, for the rounds being announced
 *   creep — a slow close-in, for the thinking pauses
 *   punch — snaps in on the answer, then holds
 */
const useCamera = (segment: LetrasSegment, totalFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (segment.kind === "hold") {
    return 1.01;
  }

  if (segment.kind === "creep") {
    return (
      1.03 +
      interpolate(frame, [0, totalFrames], [0, 0.13], { extrapolateRight: "clamp" })
    );
  }

  if (segment.kind === "punch") {
    const at = (segment.point?.at ?? 0.12) * fps;
    const hit = spring({
      frame: frame - at,
      fps,
      config: { damping: 200, mass: 0.6 },
      durationInFrames: Math.round(fps * 0.45),
    });
    // Only the punch keeps a touch of push on the cut itself.
    const cut = interpolate(frame, [0, 6], [0.03, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return 1.02 + hit * 0.11 + cut;
  }

  return interpolate(frame, [0, totalFrames], [1.015, 1.035], {
    extrapolateRight: "clamp",
  });
};

const SegmentView: React.FC<{
  segment: LetrasSegment;
  source: string;
  players: LetrasProps["players"];
  sfxVolume: number;
}> = ({ segment, source, players, sfxVolume }) => {
  const { fps } = useVideoConfig();
  const frames = Math.round(segment.durationInSeconds * fps);
  const zoom = useCamera(segment, frames);

  const plate: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${zoom})`,
    transformOrigin: "50% 36%",
    // Light touch: the source is already well exposed.
    filter: "contrast(1.03) saturate(1.05)",
  };

  const cutVolume = sfxVolume * 0.4;
  const letterVolume = sfxVolume * 0.85;
  const dingVolume = sfxVolume * 0.95;
  const impactVolume = sfxVolume * 0.6;
  const bannerVolume = sfxVolume * 0.7;
  const tickVolume = sfxVolume * 0.55;
  const tensionVolume = sfxVolume * 0.6;

  // Ticking under the long thinking beats — the silence becomes the joke.
  // Sparser ticking, and only under the creeping zooms — elsewhere the real
  // room tone is funnier than a sound effect.
  const ticks = segment.kind === "creep" ? [0.18, 0.92] : [];

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        {segment.still ? (
          <Img src={staticFile(segment.still)} style={plate} />
        ) : (
          <OffthreadVideo
            src={staticFile(source)}
            trimBefore={Math.round(segment.srcIn * fps)}
            trimAfter={Math.round(segment.srcOut * fps)}
            style={plate}
          />
        )}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,18,41,0.52) 0%, rgba(6,18,41,0) 22%," +
            " rgba(6,18,41,0) 60%, rgba(6,18,41,0.55) 100%)",
          pointerEvents: "none",
        }}
      />

      {segment.id === "intro" ? null : (
        <Scoreboard
          left={players.left}
          right={players.right}
          score={segment.score}
          point={segment.point}
        />
      )}

      <Captions captions={segment.captions} />

      {segment.letter && segment.letterAt !== undefined ? (
        <BigLetter letter={segment.letter} at={segment.letterAt} />
      ) : null}

      {segment.banner ? (
        <Banner text={segment.banner.text} at={segment.banner.at} />
      ) : null}

      {segment.winner ? (
        <WinnerCard
          name="SECRETARIO GENERAL ADJUNTO"
          score={[segment.score[0], segment.score[1]]}
        />
      ) : null}

      {/* --- sound -------------------------------------------------------
          Whooshes are rationed: the open, and the two letters that carry
          weight. Every other cut is just a cut. */}
      {segment.letter && segment.letterAt !== undefined ? (
        <Sequence from={Math.round(segment.letterAt * fps)}>
          <Audio
            src={staticFile(segment.whoosh ? "sfx/whoosh-down.wav" : "sfx/pop.wav")}
            volume={letterVolume}
          />
        </Sequence>
      ) : null}

      {segment.whoosh && !segment.letter ? (
        <Audio src={staticFile("sfx/whoosh.wav")} volume={cutVolume} />
      ) : null}

      {segment.tension ? (
        <Audio src={staticFile("sfx/tension.wav")} volume={tensionVolume} />
      ) : null}

      {segment.point ? (
        <Sequence from={Math.round(segment.point.at * fps)}>
          <Audio src={staticFile("sfx/ding.wav")} volume={dingVolume} />
          <Audio src={staticFile("sfx/impact.wav")} volume={impactVolume} />
        </Sequence>
      ) : null}

      {segment.banner ? (
        <Sequence from={Math.round(segment.banner.at * fps)}>
          <Audio src={staticFile("sfx/pop.wav")} volume={bannerVolume} />
        </Sequence>
      ) : null}

      {ticks.map((at, i) => (
        <Sequence key={i} from={Math.round(at * fps)}>
          <Audio src={staticFile("sfx/tick.wav")} volume={tickVolume} />
        </Sequence>
      ))}

      {segment.winner ? (
        <>
          <Audio src={staticFile("sfx/shine.wav")} volume={sfxVolume * 0.8} />
          <Audio src={staticFile("sfx/cash.wav")} volume={sfxVolume * 0.6} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * "Adivina el comité según la letra" — the MUNCAS game-show round.
 * Six letters, two players, one scoreboard that never leaves the screen.
 */
export const Letras: React.FC<LetrasProps> = ({
  fps,
  source,
  title,
  players,
  segments,
  musicVolume,
  sfxVolume,
}) => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      {segments.map((segment) => {
        const frames = Math.round(segment.durationInSeconds * fps);
        const from = cursor;
        cursor += frames;

        return (
          <Sequence key={segment.id} from={from} durationInFrames={frames}>
            <SegmentView
              segment={segment}
              source={source}
              players={players}
              sfxVolume={sfxVolume}
            />
            {segment.id === "intro" ? <IntroLetras {...title} /> : null}
          </Sequence>
        );
      })}

      {musicVolume > 0 ? (
        <Audio src={staticFile("sfx/music-bed.ogg")} volume={musicVolume} loop />
      ) : null}
    </AbsoluteFill>
  );
};

export const letrasDurationInFrames = ({ fps, segments }: LetrasProps) =>
  segments.reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);
