import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SAFE, font, pal } from "./theme";
import type { Mark, PlataCaption, PlataProps, PlataSegment } from "./schema";

const BOX = { left: SAFE.left, right: SAFE.right } as const;
const CONTENT = 1080 - SAFE.left - SAFE.right;

const colorOf = (c: PlataCaption["runs"][number]["color"]) =>
  c === "red" ? pal.red : c === "blue" ? pal.blue : c === "money" ? pal.money : pal.white;

/* ----------------------------------------------------------- money chips */

/**
 * What each player is holding, for the audience only. They sit in the band
 * above both heads: clear of the faces, clear of TikTok's top chrome, and —
 * for the right-hand chip — pulled well inside the button column.
 */
const MoneyChip: React.FC<{ amount: string; centerX: number; delay: number }> = ({
  amount,
  centerX,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay * fps,
    fps,
    config: { damping: 11, mass: 0.32, stiffness: 220 },
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 42,
        left: centerX,
        transform: `translateX(-50%) scale(${interpolate(enter, [0, 1], [0.5, 1])})`,
        opacity: enter,
        display: "flex",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(11, 21, 40, 0.9)",
        border: `3px solid ${pal.blue}`,
        borderRadius: 999,
        padding: "12px 26px",
        boxShadow: "0 14px 34px rgba(6, 12, 26, 0.5)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: 54,
          letterSpacing: "-0.02em",
          color: pal.money,
        }}
      >
        {amount}
      </span>
      <span style={{ fontSize: 40, lineHeight: 1 }}>💵</span>
    </div>
  );
};

/* ------------------------------------------------------------------ title */

const Title: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const one = spring({ frame, fps, config: { damping: 13, mass: 0.4, stiffness: 190 } });
  const rule = spring({ frame: frame - 0.2 * fps, fps, config: { damping: 18, mass: 0.4 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 44%, rgba(11, 21, 40, 0.66) 78%," +
            " rgba(11, 21, 40, 0.78) 100%)",
          opacity: one,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingLeft: BOX.left,
          paddingRight: BOX.right,
          paddingBottom: SAFE.bottom + 110,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: font,
              fontWeight: 800,
              fontSize: 80,
              letterSpacing: "-0.035em",
              whiteSpace: "nowrap",
              color: pal.white,
              textShadow: "0 14px 40px rgba(6, 12, 26, 0.8)",
              opacity: one,
              transform: `translateY(${interpolate(one, [0, 1], [44, 0])}px) scale(${interpolate(
                one,
                [0, 1],
                [0.86, 1],
              )})`,
            }}
          >
            {text}
          </span>
          <div
            style={{
              width: interpolate(rule, [0, 1], [0, CONTENT * 0.6]),
              height: 8,
              borderRadius: 4,
              backgroundColor: pal.red,
            }}
          />
          <span
            style={{
              fontFamily: font,
              fontWeight: 800,
              fontSize: 92,
              lineHeight: 1.1,
              color: pal.money,
              textShadow: "0 12px 34px rgba(6, 12, 26, 0.8)",
              opacity: rule,
              transform: `translateY(${interpolate(rule, [0, 1], [26, 0])}px)`,
            }}
          >
            💸
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- captions */

const captionSize = (len: number) => (len > 24 ? 52 : len > 17 ? 62 : 72);

const Caption: React.FC<{ caption: PlataCaption }> = ({ caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - caption.start * fps;
  const enter = spring({ frame: age, fps, config: { damping: 15, mass: 0.3, stiffness: 200 } });
  const len = caption.runs.reduce((n, r) => n + r.text.length, 0);

  return (
    <div
      style={{
        position: "absolute",
        left: BOX.left,
        right: BOX.right,
        bottom: SAFE.bottom + 130,
        textAlign: "center",
        opacity: interpolate(age, [0, fps * 0.07], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: captionSize(len),
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          backgroundColor: "rgba(11, 21, 40, 0.86)",
          borderRadius: 16,
          padding: "12px 26px",
          display: "inline-block",
        }}
      >
        {caption.runs.map((r, i) => (
          <span key={i} style={{ color: colorOf(r.color) }}>
            {r.text}
          </span>
        ))}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ marks */

const Pill: React.FC<{
  children: React.ReactNode;
  background: string;
  border: string;
  bottom: number;
  left?: number;
}> = ({ children, background, border, bottom, left }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, mass: 0.3, stiffness: 250 } });

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: left ?? (BOX.left + (1080 - BOX.left - BOX.right) / 2),
        transform: `translateX(-50%) scale(${interpolate(pop, [0, 1], [0.55, 1])})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        backgroundColor: background,
        border: `4px solid ${border}`,
        borderRadius: 22,
        padding: "14px 30px",
        whiteSpace: "nowrap",
        boxShadow: "0 20px 46px rgba(6, 12, 26, 0.55)",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
};

const markText = (size: number, color: string): React.CSSProperties => ({
  fontFamily: font,
  fontWeight: 800,
  fontSize: size,
  letterSpacing: "-0.02em",
  color,
});

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [pal.red, pal.blue, pal.money, pal.white];

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {new Array(46).fill(0).map((_, i) => {
        const x = random(`x${i}`) * 1080;
        const delay = random(`d${i}`) * 0.5;
        const t = Math.max(0, frame / fps - delay);
        const y = -120 + t * (620 + random(`v${i}`) * 420);
        const spin = t * (220 + random(`s${i}`) * 420);
        const w = 14 + random(`w${i}`) * 16;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 1.7,
              borderRadius: 3,
              backgroundColor: colors[i % colors.length],
              transform: `rotate(${spin}deg)`,
              opacity: interpolate(t, [0, 0.12, 1.5, 2.1], [0, 1, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const MarkView: React.FC<{ mark: Mark }> = ({ mark }) => {
  switch (mark.kind) {
    case "si":
      return (
        <Pill background="rgba(11, 21, 40, 0.92)" border={pal.blue} bottom={640}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>✅</span>
          <span style={markText(62, pal.white)}>SÍ</span>
        </Pill>
      );
    case "no":
      return (
        <Pill background={pal.red} border={pal.red} bottom={640}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>❌</span>
          <span style={markText(62, pal.white)}>NO</span>
        </Pill>
      );
    case "thinking":
      return (
        <Pill background="rgba(11, 21, 40, 0.88)" border={pal.blue} bottom={640}>
          <span style={markText(46, pal.blue)}>PROCESANDO…</span>
          <span style={{ fontSize: 46, lineHeight: 1 }}>🤔</span>
        </Pill>
      );
    case "amount":
      return (
        <Pill background="rgba(11, 21, 40, 0.92)" border={pal.money} bottom={720}>
          <span style={markText(84, pal.money)}>{mark.text}</span>
        </Pill>
      );
    case "amount-win":
      return (
        <Pill background="rgba(11, 21, 40, 0.94)" border={pal.money} bottom={780}>
          <span style={markText(104, pal.money)}>{mark.text}</span>
          <span style={{ fontSize: 76, lineHeight: 1 }}>✅</span>
        </Pill>
      );
    case "winner":
      // Anchored on the left player: she is the one who guessed right.
      return (
        <>
          <Confetti />
          <Pill background={pal.red} border={pal.white} bottom={560} left={330}>
            <span style={markText(66, pal.white)}>¡GANÓ!</span>
            <span style={{ fontSize: 58, lineHeight: 1 }}>🏆</span>
          </Pill>
        </>
      );
    default:
      return null;
  }
};

/**
 * The institutional label. It enters once, softly, and then holds — it only
 * leaves when a full-screen graphic takes the frame.
 */
const LowerThird: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - 0.45 * fps,
    fps,
    config: { damping: 20, mass: 0.5, stiffness: 120 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        bottom: SAFE.bottom + 15,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(11, 21, 40, 0.88)",
        borderLeft: `7px solid ${pal.red}`,
        borderRadius: 10,
        padding: "12px 24px 12px 20px",
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-26, 0])}px)`,
        boxShadow: "0 10px 26px rgba(6, 12, 26, 0.45)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: 600,
          fontSize: 36,
          letterSpacing: "0.04em",
          color: pal.white,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
};

/**
 * What each player holds, plus the label. Mounted once for the whole game, so
 * the marks never re-animate, never move and never blink on a cut.
 */
const Hud: React.FC<{
  leftAmount: string;
  rightAmount: string;
  lowerThird: string;
}> = ({ leftAmount, rightAmount, lowerThird }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <MoneyChip amount={leftAmount} centerX={250} delay={0} />
    <MoneyChip amount={rightAmount} centerX={700} delay={0.14} />
    {lowerThird ? <LowerThird text={lowerThird} /> : null}
  </AbsoluteFill>
);

/* ------------------------------------------------------------- the shots */

const VideoSegment: React.FC<{ segment: PlataSegment; source: string }> = ({
  segment,
  source,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const videoFrames = Math.round(segment.durationInSeconds * fps);
  const trimBefore = Math.round((segment.srcIn ?? 0) * fps);
  const push = interpolate(frame, [0, videoFrames], [segment.zoomFrom, segment.zoomTo], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navy, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(source)}
        trimBefore={trimBefore}
        trimAfter={trimBefore + videoFrames}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${push})`,
          transformOrigin: `${segment.originX * 100}% ${segment.originY * 100}%`,
          // A light grade: highlights pulled back, skin left alone.
          filter: "contrast(1.05) saturate(1.04) brightness(0.98)",
        }}
      />

      {segment.captions.map((c, i) => (
        <Sequence
          key={`c${i}`}
          from={Math.round(c.start * fps)}
          durationInFrames={Math.max(1, Math.round((c.end - c.start) * fps))}
        >
          <Caption caption={c} />
        </Sequence>
      ))}

      {segment.marks.map((m, i) => (
        <Sequence
          key={`m${i}`}
          from={Math.round(m.start * fps)}
          durationInFrames={Math.max(1, Math.round((m.end - m.start) * fps))}
        >
          <MarkView mark={m} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const ClosingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.46 } });
  const second = spring({ frame: frame - 0.18 * fps, fps, config: { damping: 18, mass: 0.42 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: pal.white,
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        paddingLeft: BOX.left,
        paddingRight: BOX.right,
      }}
    >
      <Img
        src={staticFile("brand/muncas-logo.png")}
        style={{
          width: 430,
          height: "auto",
          opacity: rise,
          transform: `scale(${interpolate(rise, [0, 1], [0.92, 1])})`,
        }}
      />
      <span style={{ ...markText(60, pal.navy), letterSpacing: "0.04em", opacity: second }}>
        MUNCAS XX
      </span>
      <div style={{ width: 110, height: 6, backgroundColor: pal.red, borderRadius: 4, opacity: second }} />
      <span style={{ ...markText(52, pal.navy), opacity: second }}>#ShapingTheFuture</span>
    </AbsoluteFill>
  );
};

/** One effect, at one moment. The volume is resolved before the JSX. */
const OneShot: React.FC<{
  name: string;
  at: number;
  volume: number;
  fps: number;
}> = ({ name, at, volume, fps }) => (
  <Sequence from={Math.round(at * fps)} durationInFrames={Math.round(fps * 1.2)}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

/* ------------------------------------------------------------------- main */

export const Plata: React.FC<PlataProps> = ({
  fps,
  source,
  title,
  leftAmount,
  rightAmount,
  lowerThird,
  segments,
  sfx,
  sfxVolume,
}) => {
  const closing = segments.find((s) => s.kind === "closing");
  // The HUD runs from the first shot of the game to the last one.
  const game = segments.filter((s) => s.chips);
  const hudFrom = Math.round(game[0].timelineStart * fps);
  const hudFrames =
    Math.round(
      (game[game.length - 1].timelineStart + game[game.length - 1].durationInSeconds) * fps,
    ) - hudFrom;
  const closingFrames = closing ? Math.round(closing.durationInSeconds * fps) : 0;
  const roomFade: [number, number, number] = [
    0,
    Math.max(1, closingFrames - Math.round(fps * 0.8)),
    Math.max(2, closingFrames),
  ];
  const roomLevels: [number, number, number] = [1, 1, 0];

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navy }}>
      {segments.map((segment) => (
        <Sequence
          key={segment.id}
          from={Math.round(segment.timelineStart * fps)}
          durationInFrames={Math.round(segment.durationInSeconds * fps)}
        >
          {segment.kind === "video" ? (
            <VideoSegment segment={segment} source={source} />
          ) : (
            <ClosingCard />
          )}
        </Sequence>
      ))}

      <Sequence durationInFrames={Math.round(segments[0].durationInSeconds * fps)}>
        <Title text={title} />
      </Sequence>

      <Sequence from={hudFrom} durationInFrames={hudFrames}>
        <Hud leftAmount={leftAmount} rightAmount={rightAmount} lowerThird={lowerThird} />
      </Sequence>

      {/* The closing card keeps the location's ambience under it, fading out,
          so the track never drops to digital silence. */}
      {closing ? (
        <Sequence
          from={Math.round(closing.timelineStart * fps)}
          durationInFrames={Math.round(closing.durationInSeconds * fps)}
        >
          <Audio
            src={staticFile("sfx/roomtone.wav")}
            loop
            volume={(f) =>
              interpolate(f, roomFade, roomLevels, {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            }
          />
        </Sequence>
      ) : null}

      {sfx.map((s, i) => (
        <OneShot key={`s${i}`} name={s.name} at={s.at} volume={sfxVolume * s.gain} fps={fps} />
      ))}
    </AbsoluteFill>
  );
};

export const plataDurationInFrames = ({ fps, segments }: PlataProps) =>
  segments.reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);
