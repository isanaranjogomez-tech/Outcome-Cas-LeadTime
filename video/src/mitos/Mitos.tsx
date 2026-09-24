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
import { captionFont, muncas } from "../muncas/theme";
import { MitoCaptions } from "./Captions";
import { MITOS_BLUE, MITOS_RED, SAFE } from "./theme";
import type { MitosProps, MitoSegment } from "./schema";

/**
 * The title never leaves, and never touches TikTok's chrome. It reads as a
 * badge rather than a caption: navy plate, red rule under it, and the name
 * itself in the light blue so the lockup carries at thumbnail size.
 */
const Title: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14, mass: 0.45, stiffness: 160 } });

  const [lead, ...rest] = text.split(" MUNCAS ");
  const tail = rest.length ? `MUNCAS ${rest.join(" MUNCAS ")}` : "";

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 4,
        left: SAFE.left,
        right: SAFE.right,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        transform: `translateY(${interpolate(enter, [0, 1], [-46, 0])}px) scale(${interpolate(
          enter,
          [0, 1],
          [0.88, 1],
        )})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          backgroundColor: muncas.navy,
          borderBottom: `7px solid ${MITOS_RED}`,
          borderRadius: 18,
          padding: "16px 34px 12px",
          boxShadow: "0 18px 46px rgba(6, 18, 41, 0.6)",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 900,
            fontSize: 62,
            letterSpacing: "-0.02em",
            color: muncas.white,
          }}
        >
          {lead}
        </span>
        {tail ? (
          <span
            style={{
              fontFamily: captionFont,
              fontWeight: 900,
              fontSize: 62,
              letterSpacing: "-0.02em",
              color: MITOS_BLUE,
            }}
          >
            {tail}
          </span>
        ) : null}
      </div>
    </div>
  );
};

/** The punchline: it lands on the frozen last frame, with a buzzer. */
const FalsoStamp: React.FC<{ reason: string | null }> = ({ reason }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, mass: 0.34, stiffness: 240 } });
  const shake = frame < 6 ? Math.sin(frame * 2.1) * (6 - frame) : 0;
  const reasonIn = spring({
    frame: frame - 0.18 * fps,
    fps,
    config: { damping: 18, mass: 0.4 },
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 40,
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right,
        paddingBottom: SAFE.bottom * 0.6,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 168,
          letterSpacing: "-0.03em",
          color: muncas.white,
          backgroundColor: MITOS_RED,
          padding: "18px 46px",
          borderRadius: 18,
          transform: `scale(${interpolate(pop, [0, 1], [0.35, 1])}) rotate(${-7 + shake}deg)`,
          boxShadow: "0 24px 60px rgba(6,18,41,0.6)",
        }}
      >
        ¡FALSO!
      </span>

      {reason ? (
        <span
          style={{
            fontFamily: captionFont,
            fontWeight: 700,
            fontSize: 50,
            lineHeight: 1.26,
            textAlign: "center",
            color: muncas.white,
            backgroundColor: "rgba(6, 18, 41, 0.86)",
            borderRadius: 16,
            padding: "22px 30px",
            maxWidth: 760,
            opacity: reasonIn,
            transform: `translateY(${interpolate(reasonIn, [0, 1], [26, 0])}px)`,
          }}
        >
          {reason}
        </span>
      ) : null}
    </AbsoluteFill>
  );
};

const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.5 } });
  const second = spring({ frame: frame - 0.2 * fps, fps, config: { damping: 18, mass: 0.45 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: muncas.white,
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right,
        paddingBottom: SAFE.bottom * 0.4,
      }}
    >
      <Img
        src={staticFile("brand/muncas-logo.png")}
        style={{
          width: 470,
          height: "auto",
          opacity: rise,
          transform: `scale(${interpolate(rise, [0, 1], [0.9, 1])})`,
        }}
      />
      <div
        style={{
          width: 110,
          height: 6,
          backgroundColor: MITOS_RED,
          borderRadius: 4,
          opacity: second,
        }}
      />
      <span
        style={{
          fontFamily: captionFont,
          fontWeight: 900,
          fontSize: 58,
          color: muncas.navy,
          opacity: second,
          transform: `translateY(${interpolate(second, [0, 1], [16, 0])}px)`,
        }}
      >
        #ShapingTheFuture
      </span>
    </AbsoluteFill>
  );
};

const SegmentView: React.FC<{
  segment: MitoSegment;
  source: string;
  sfxVolume: number;
}> = ({ segment, source, sfxVolume }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const videoFrames = Math.round(segment.durationInSeconds * fps);
  const holdFrames = Math.round(segment.holdInSeconds * fps);
  const trimBefore = Math.round(segment.srcIn * fps);

  // The transition: five frames of blur and scale out of the cut. Short
  // enough to read as energy rather than as an effect.
  const wipe = interpolate(frame, [0, 5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // A slow push, plus a little more as the stamp approaches.
  const push = interpolate(frame, [0, videoFrames], [1.0, 1.06], {
    extrapolateRight: "clamp",
  });
  const inHold = frame >= videoFrames;
  const stampPush = inHold ? 0.04 : 0;

  const plate: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${push + wipe * 0.14 + stampPush})`,
    transformOrigin: "50% 40%",
    filter: `contrast(1.04) saturate(1.06) blur(${wipe * 13}px)`,
  };

  const buzzVolume = sfxVolume * 0.75;
  const clickVolume = sfxVolume * 0.4;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Sequence durationInFrames={videoFrames}>
          <OffthreadVideo
            src={staticFile(source)}
            trimBefore={trimBefore}
            trimAfter={trimBefore + videoFrames}
            style={plate}
          />
        </Sequence>
        {holdFrames > 0 && segment.still ? (
          <Sequence from={videoFrames} durationInFrames={holdFrames}>
            <Img src={staticFile(segment.still)} style={plate} />
          </Sequence>
        ) : null}
      </AbsoluteFill>

      <Sequence durationInFrames={videoFrames}>
        <MitoCaptions captions={segment.captions} />
      </Sequence>

      {holdFrames > 0 ? (
        <Sequence from={videoFrames} durationInFrames={holdFrames}>
          <FalsoStamp reason={segment.reason} />
          <Audio src={staticFile("sfx/buzzer.wav")} volume={buzzVolume} />
        </Sequence>
      ) : null}

      {segment.kind === "myth" ? (
        <Audio src={staticFile("sfx/click.wav")} volume={clickVolume} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * "Mitos de MUNCAS XX": eight claims, each one stamped false on a frozen
 * beat of the person who just made it.
 */
export const Mitos: React.FC<MitosProps> = ({
  fps,
  source,
  title,
  segments,
  closingInSeconds,
  musicVolume,
  sfxVolume,
}) => {
  let cursor = 0;
  const totalFrames = mitosDurationInFrames({ fps, segments, closingInSeconds } as MitosProps);
  const fadeFrames = Math.round(fps * 1.0);
  const closingShine = sfxVolume * 0.55;

  return (
    <AbsoluteFill style={{ backgroundColor: muncas.navyDeep }}>
      {segments.map((segment) => {
        const frames =
          Math.round(segment.durationInSeconds * fps) +
          Math.round(segment.holdInSeconds * fps);
        const from = cursor;
        cursor += frames;
        return (
          <Sequence key={segment.id} from={from} durationInFrames={frames}>
            <SegmentView segment={segment} source={source} sfxVolume={sfxVolume} />
          </Sequence>
        );
      })}

      <Sequence from={cursor} durationInFrames={Math.round(closingInSeconds * fps)}>
        <Closing />
        <Audio src={staticFile("sfx/shine.wav")} volume={closingShine} />
      </Sequence>

      <Sequence durationInFrames={cursor}>
        <Title text={title} />
      </Sequence>

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

export const mitosDurationInFrames = ({ fps, segments, closingInSeconds }: MitosProps) =>
  segments.reduce(
    (acc, s) =>
      acc + Math.round(s.durationInSeconds * fps) + Math.round(s.holdInSeconds * fps),
    0,
  ) + Math.round(closingInSeconds * fps);
