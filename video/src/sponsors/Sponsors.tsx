import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { captionFont, muncas } from "../muncas/theme";
import type { SponsorsProps, SponsorSegment } from "./schema";

/**
 * TikTok keeps its buttons down the right edge and across the bottom, and
 * the caption sits low on the left. Everything here stays inside this box.
 */
const SAFE = { left: 96, right: 200, top: 0.11, bottom: 0.72 } as const;

const useCamera = (segment: SponsorSegment, totalFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (segment.kind === "question") {
    const hit = spring({ frame, fps, config: { damping: 200, mass: 0.6 },
      durationInFrames: Math.round(fps * 0.5) });
    return 1.02 + hit * 0.08;
  }
  if (segment.kind === "name") {
    return interpolate(frame, [0, totalFrames], [1.05, 1.0], {
      extrapolateRight: "clamp",
    });
  }
  // Answers breathe: a very slow push, nothing that pulls focus off the face.
  return interpolate(frame, [0, totalFrames], [1.0, 1.035], {
    extrapolateRight: "clamp",
  });
};

/** Name and area, bottom-left of the safe box, on for about a second. */
const NameChip: React.FC<{ name: string; role: string }> = ({ name, role }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 0.1 * fps, fps, config: { damping: 16, mass: 0.42 } });

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: SAFE.right,
        top: `${SAFE.bottom * 100}%`,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 62,
          letterSpacing: "-0.015em",
          color: muncas.white,
          backgroundColor: muncas.navy,
          padding: "12px 26px",
          borderRadius: 14,
          borderLeft: `8px solid ${muncas.red}`,
          boxShadow: "0 16px 40px rgba(6, 18, 41, 0.5)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: muncas.white,
          backgroundColor: muncas.blueDeep,
          padding: "10px 20px",
          borderRadius: 10,
        }}
      >
        {role}
      </span>
    </div>
  );
};

/** The question, asked once, as a full card over the person asking it. */
const QuestionCard: React.FC<{ question: string }> = ({ question }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.42, stiffness: 170 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right,
        background:
          "linear-gradient(to bottom, rgba(6,18,41,0.30) 0%, rgba(6,18,41,0.74) 45%, rgba(6,18,41,0.30) 100%)",
        opacity: enter,
      }}
    >
      <h1
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.06,
          letterSpacing: "-0.025em",
          color: muncas.white,
          textAlign: "center",
          whiteSpace: "pre-line",
          margin: 0,
          transform: `scale(${interpolate(enter, [0, 1], [0.82, 1])})`,
          textShadow: "0 10px 30px rgba(6, 18, 41, 0.6)",
        }}
      >
        {question}
      </h1>
      <div
        style={{
          width: 120,
          height: 6,
          backgroundColor: muncas.red,
          borderRadius: 4,
          marginTop: 30,
          transform: `scaleX(${enter})`,
        }}
      />
    </AbsoluteFill>
  );
};

const IntroCard: React.FC<{ line1: string; line2: string }> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const one = spring({ frame: frame - 0.08 * fps, fps, config: { damping: 15, mass: 0.42 } });
  const two = spring({ frame: frame - 0.26 * fps, fps, config: { damping: 15, mass: 0.42 } });
  const out = interpolate(frame, [3.2 * fps, 3.6 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const line: React.CSSProperties = {
    fontFamily: captionFont,
    fontWeight: 900,
    fontSize: 104,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    color: muncas.white,
    margin: 0,
    backgroundColor: muncas.navy,
    padding: "14px 30px",
    borderRadius: 18,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: `${SAFE.top * 100}%`,
        left: SAFE.left,
        right: SAFE.right,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 14,
        opacity: out,
      }}
    >
      <h1 style={{ ...line, opacity: one, transform: `translateX(${interpolate(one, [0, 1], [-260, 0])}px)` }}>
        {line1}
      </h1>
      <h1
        style={{
          ...line,
          borderLeft: `10px solid ${muncas.red}`,
          opacity: two,
          transform: `translateX(${interpolate(two, [0, 1], [-260, 0])}px)`,
        }}
      >
        {line2}
      </h1>
    </div>
  );
};

const SegmentView: React.FC<{
  segment: SponsorSegment;
  source: string;
  title: SponsorsProps["title"];
  sfxVolume: number;
}> = ({ segment, source, title, sfxVolume }) => {
  const { fps } = useVideoConfig();
  const frames = Math.round(segment.durationInSeconds * fps);
  const zoom = useCamera(segment, frames);
  const trimBefore = Math.round(segment.srcIn * fps);

  const chipVolume = sfxVolume * 0.7;
  const cardVolume = sfxVolume * 0.8;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile(source)}
          trimBefore={trimBefore}
          trimAfter={trimBefore + frames}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
            transformOrigin: "50% 38%",
            filter: "contrast(1.04) saturate(1.06)",
          }}
        />
      </AbsoluteFill>

      {segment.kind === "intro" ? <IntroCard {...title} /> : null}
      {segment.kind === "name" && segment.name ? (
        <NameChip name={segment.name} role={segment.role ?? ""} />
      ) : null}
      {segment.kind === "question" && segment.question ? (
        <QuestionCard question={segment.question} />
      ) : null}

      {segment.kind === "name" ? (
        <Sequence from={Math.round(0.1 * fps)}>
          <Audio src={staticFile("sfx/pop.wav")} volume={chipVolume} />
        </Sequence>
      ) : null}
      {segment.kind === "question" ? (
        <Audio src={staticFile("sfx/impact.wav")} volume={cardVolume} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * The sponsor interviews, re-cut by question instead of by person: the
 * introduction once, then every name, then each question once followed by
 * everyone who answered it.
 */
export const Sponsors: React.FC<SponsorsProps> = ({
  fps,
  source,
  title,
  segments,
  musicVolume,
  sfxVolume,
}) => {
  let cursor = 0;
  const totalFrames = sponsorsDurationInFrames({ fps, segments } as SponsorsProps);
  const fadeFrames = Math.round(fps * 1.2);

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
              title={title}
              sfxVolume={sfxVolume}
            />
          </Sequence>
        );
      })}

      {musicVolume > 0 ? (
        <Audio
          src={staticFile("sfx/music-bed.ogg")}
          loop
          volume={(f) =>
            interpolate(f, [totalFrames - fadeFrames, totalFrames], [musicVolume, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const sponsorsDurationInFrames = ({ fps, segments }: SponsorsProps) =>
  segments.reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);
