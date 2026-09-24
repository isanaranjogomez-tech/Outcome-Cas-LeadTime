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
import { SAFE, font, pal } from "./theme";
import type { PalabraCaption, PalabraSegment, PalabrasProps } from "./schema";

const BOX = { left: SAFE.left, right: SAFE.right } as const;
const CONTENT_WIDTH = 1080 - SAFE.left - SAFE.right;

/* ---------------------------------------------------------------- counter */

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * The attempts counter and the seven-word rail. Both read the same event
 * lists the builder wrote, so the number on screen is the number of answers
 * actually proposed out loud — it never advances on a clue or on a pause.
 */
const Counter: React.FC<{
  attempts: PalabrasProps["attempts"];
  solved: PalabrasProps["solved"];
  words: string[];
  limit: number;
}> = ({ attempts, solved, words, limit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const used = attempts.filter((a) => a.at <= t);
  const last = used[used.length - 1];
  const age = last ? t - last.at : 99;
  const bump = age < 0.34 ? interpolate(age, [0, 0.34], [1.16, 1]) : 1;
  const missed = last && !last.correct && age < 0.7;

  const done = new Set(solved.filter((s) => s.at <= t).map((s) => s.word));
  const exhausted = used.length >= limit;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 10,
          left: BOX.left,
          display: "flex",
          alignItems: "center",
          gap: 14,
          backgroundColor: missed ? pal.red : "rgba(11, 21, 40, 0.88)",
          border: `3px solid ${missed ? pal.red : "rgba(114, 197, 229, 0.55)"}`,
          borderRadius: 999,
          padding: "12px 26px",
          transform: `scale(${bump})`,
          transformOrigin: "0% 50%",
          boxShadow: "0 12px 30px rgba(6, 12, 26, 0.45)",
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: "0.16em",
            color: pal.blue,
          }}
        >
          INTENTOS
        </span>
        <span
          style={{
            fontFamily: font,
            fontWeight: 800,
            fontSize: 42,
            color: pal.white,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pad2(used.length)}/{limit}
        </span>
      </div>

      {/* seven pills: one per word, filled as it falls */}
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 96,
          left: BOX.left,
          width: CONTENT_WIDTH,
          display: "flex",
          gap: 10,
        }}
      >
        {words.map((w) => (
          <div
            key={w}
            style={{
              flex: 1,
              height: 13,
              borderRadius: 999,
              backgroundColor: done.has(w) ? pal.blue : "rgba(250, 252, 255, 0.28)",
              boxShadow: done.has(w) ? `0 0 14px ${pal.blue}` : "none",
            }}
          />
        ))}
      </div>

      {exhausted ? (
        <div
          style={{
            position: "absolute",
            top: SAFE.top + 140,
            left: BOX.left,
            backgroundColor: pal.red,
            borderRadius: 14,
            padding: "10px 22px",
            fontFamily: font,
            fontWeight: 800,
            fontSize: 34,
            color: pal.white,
          }}
        >
          ¡SE ACABARON LOS INTENTOS! 🚨
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- captions */

const captionColor = (role: PalabraCaption["role"]) =>
  role === "hint" ? pal.blue : role === "no" ? pal.red : pal.white;

/** Long lines step down a size rather than breaking into ragged plates. */
const captionSize = (text: string) =>
  text.length > 15 ? 58 : text.length > 10 ? 68 : 78;

const Caption: React.FC<{ caption: PalabraCaption }> = ({ caption }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const age = frame - caption.start * fps;
  const enter = spring({ frame: age, fps, config: { damping: 15, mass: 0.3, stiffness: 190 } });

  return (
    <div
      style={{
        position: "absolute",
        left: BOX.left,
        right: BOX.right,
        bottom: SAFE.bottom + 36,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: interpolate(age, [0, fps * 0.07], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        transform: `translateY(${interpolate(enter, [0, 1], [18, 0])}px)`,
        pointerEvents: "none",
      }}
    >
      {caption.role === "hint" ? (
        <span
          style={{
            fontFamily: font,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "0.22em",
            color: pal.blue,
            backgroundColor: "rgba(11, 21, 40, 0.85)",
            borderRadius: 999,
            padding: "6px 18px",
          }}
        >
          PISTA
        </span>
      ) : null}
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: captionSize(caption.text),
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          textAlign: "center",
          whiteSpace: "nowrap",
          color: captionColor(caption.role),
          backgroundColor: "rgba(11, 21, 40, 0.86)",
          borderRadius: 18,
          padding: "12px 28px",
          transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        }}
      >
        {caption.text}
      </span>
    </div>
  );
};

const Captions: React.FC<{ captions: PalabraCaption[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = captions.find(
    (c) => frame >= c.start * fps && frame < c.end * fps,
  );
  return active ? <Caption caption={active} /> : null;
};

/* ------------------------------------------------------------ solved badge */

/** The checkmark: it lands on the word, not on a timer. */
const SolvedBadge: React.FC<{ word: string }> = ({ word }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, mass: 0.32, stiffness: 240 } });
  const out = interpolate(frame, [fps * 1.1, fps * 1.35], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        // Low enough to clear every face in the shot, high enough to sit
        // above the caption line rather than on it.
        justifyContent: "flex-end",
        paddingLeft: BOX.left,
        paddingRight: BOX.right,
        paddingBottom: 640,
        pointerEvents: "none",
        opacity: out,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          backgroundColor: pal.navy,
          border: `4px solid ${pal.blue}`,
          borderRadius: 24,
          padding: "18px 34px",
          transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])}) rotate(${interpolate(
            pop,
            [0, 1],
            [-5, 0],
          )}deg)`,
          boxShadow: "0 22px 50px rgba(6, 12, 26, 0.55)",
        }}
      >
        <span style={{ fontSize: 74, lineHeight: 1 }}>✅</span>
        <span
          style={{
            fontFamily: font,
            fontWeight: 800,
            fontSize: 82,
            letterSpacing: "-0.02em",
            color: pal.white,
          }}
        >
          {word}
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ title */

/** Opening title, over the two presenters and clear of both their faces. */
const TitleIn: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const one = spring({ frame, fps, config: { damping: 14, mass: 0.42, stiffness: 170 } });
  const two = spring({ frame: frame - 0.22 * fps, fps, config: { damping: 14, mass: 0.42 } });
  const rule = spring({ frame: frame - 0.44 * fps, fps, config: { damping: 18, mass: 0.4 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 46%, rgba(11, 21, 40, 0.62) 78%," +
            " rgba(11, 21, 40, 0.72) 100%)",
          opacity: one,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingLeft: BOX.left,
          paddingRight: BOX.right,
          paddingBottom: SAFE.bottom + 120,
        }}
      >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontFamily: font,
            fontWeight: 800,
            fontSize: 104,
            letterSpacing: "-0.035em",
            whiteSpace: "nowrap",
            color: pal.white,
            textShadow: "0 14px 40px rgba(6, 12, 26, 0.75)",
            opacity: one,
            transform: `translateY(${interpolate(one, [0, 1], [46, 0])}px) scale(${interpolate(
              one,
              [0, 1],
              [0.86, 1],
            )})`,
          }}
        >
          7 PALABRAS
        </span>
        <div
          style={{
            width: interpolate(rule, [0, 1], [0, CONTENT_WIDTH * 0.62]),
            height: 8,
            borderRadius: 4,
            backgroundColor: pal.red,
          }}
        />
        <span
          style={{
            fontFamily: font,
            fontWeight: 800,
            fontSize: 86,
            letterSpacing: "-0.03em",
            whiteSpace: "nowrap",
            color: pal.blue,
            textShadow: "0 12px 34px rgba(6, 12, 26, 0.75)",
            opacity: two,
            transform: `translateY(${interpolate(two, [0, 1], [34, 0])}px)`,
          }}
        >
          20 INTENTOS
        </span>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ cards */

const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: pal.navy,
      alignItems: "center",
      justifyContent: "center",
      paddingLeft: BOX.left,
      paddingRight: BOX.right,
    }}
  >
    {/* a soft red/blue wash so the card is never a flat rectangle */}
    <AbsoluteFill
      style={{
        background:
          `radial-gradient(60% 40% at 18% 16%, ${pal.red}33 0%, transparent 70%),` +
          `radial-gradient(70% 45% at 86% 88%, ${pal.blue}33 0%, transparent 72%)`,
      }}
    />
    {children}
  </AbsoluteFill>
);

const WordRow: React.FC<{ word: string; index: number; checked: boolean; stagger: number }> = ({
  word,
  index,
  checked,
  stagger,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - index * stagger * fps,
    fps,
    config: { damping: 15, mass: 0.34, stiffness: 200 },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-40, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: font,
          fontWeight: 600,
          fontSize: 34,
          color: pal.blue,
          width: 52,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {index + 1}.
      </span>
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: 76,
          letterSpacing: "-0.02em",
          color: pal.white,
        }}
      >
        {word}
      </span>
      {checked ? <span style={{ fontSize: 56, lineHeight: 1 }}>✅</span> : null}
    </div>
  );
};

const ListCard: React.FC<{ words: string[] }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame, fps, config: { damping: 16, mass: 0.4 } });

  return (
    <CardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <span
          style={{
            fontFamily: font,
            fontWeight: 600,
            fontSize: 34,
            letterSpacing: "0.24em",
            color: pal.blue,
            opacity: head,
            marginBottom: 12,
          }}
        >
          LAS 7 PALABRAS
        </span>
        {words.map((w, i) => (
          <WordRow key={w} word={w} index={i} checked={false} stagger={0.14} />
        ))}
      </div>
    </CardShell>
  );
};

const RecapCard: React.FC<{
  words: string[];
  attempts: number;
  limit: number;
}> = ({ words, attempts, limit }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const foot = spring({ frame: frame - 0.6 * fps, fps, config: { damping: 17, mass: 0.42 } });

  return (
    <CardShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
          <span
            style={{
              fontFamily: font,
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: "0.24em",
              color: pal.blue,
            }}
          >
            ADIVINADAS
          </span>
          <span
            style={{
              fontFamily: font,
              fontWeight: 800,
              fontSize: 104,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: pal.white,
            }}
          >
            {words.length}
            <span style={{ color: pal.blue }}>/{words.length}</span>
          </span>
        </div>
        {words.map((w, i) => (
          <WordRow key={w} word={w} index={i} checked stagger={0.09} />
        ))}
        <div
          style={{
            marginTop: 24,
            alignSelf: "flex-start",
            backgroundColor: pal.red,
            borderRadius: 999,
            padding: "12px 30px",
            fontFamily: font,
            fontWeight: 800,
            fontSize: 44,
            color: pal.white,
            opacity: foot,
            transform: `translateY(${interpolate(foot, [0, 1], [18, 0])}px)`,
          }}
        >
          {attempts} intentos de {limit}
        </div>
      </div>
    </CardShell>
  );
};

const ClosingCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 18, mass: 0.5 } });
  const second = spring({ frame: frame - 0.24 * fps, fps, config: { damping: 18, mass: 0.45 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: pal.white,
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        paddingLeft: BOX.left,
        paddingRight: BOX.right,
      }}
    >
      <Img
        src={staticFile("brand/muncas-logo.png")}
        style={{
          width: 500,
          height: "auto",
          opacity: rise,
          transform: `scale(${interpolate(rise, [0, 1], [0.9, 1])})`,
        }}
      />
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: 66,
          letterSpacing: "0.04em",
          color: pal.navy,
          opacity: second,
        }}
      >
        MUNCAS XX
      </span>
      <div style={{ width: 120, height: 7, backgroundColor: pal.red, borderRadius: 4, opacity: second }} />
      <span
        style={{
          fontFamily: font,
          fontWeight: 800,
          fontSize: 60,
          color: pal.navy,
          opacity: second,
          transform: `translateY(${interpolate(second, [0, 1], [16, 0])}px)`,
        }}
      >
        #ShapingTheFuture
      </span>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- segments */

const VideoSegment: React.FC<{ segment: PalabraSegment; source: string }> = ({
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
          filter: "contrast(1.04) saturate(1.06)",
        }}
      />
      <Captions captions={segment.captions} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------- main */

const V = {
  impact: 0.7,
  whoosh: 0.5,
  pop: 0.45,
  click: 0.9,
  buzzer: 0.45,
  ding: 0.8,
  shine: 0.35,
  tick: 0.3,
  clap: 0.6,
  cash: 0.5,
  /** The location's own ambience, at the level it has under the shots. */
  room: 1,
} as const;

export const Palabras: React.FC<PalabrasProps> = ({
  fps,
  source,
  words,
  attemptLimit,
  segments,
  attempts,
  solved,
  ticks,
  sfxVolume,
}) => {
  const videoSegments = segments.filter((s) => s.kind === "video");
  // The counter belongs to the game: it appears with the first round, after
  // the title and the list, and leaves with the last one.
  const firstVideo = videoSegments.find((s) => s.id.startsWith("r-")) ?? videoSegments[0];
  const lastVideo = videoSegments[videoSegments.length - 1];
  const hudFrom = Math.round(firstVideo.timelineStart * fps);
  const hudTo =
    Math.round((lastVideo.timelineStart + lastVideo.durationInSeconds) * fps) - hudFrom;

  const listCard = segments.find((s) => s.kind === "list");
  const recapCard = segments.find((s) => s.kind === "recap");
  const closingCard = segments.find((s) => s.kind === "closing");
  const cards = segments.filter((s) => s.kind !== "video");

  // Hoisted: the volume lint rule wants a plain value, not an expression.
  const vImpact = sfxVolume * V.impact;
  const vWhoosh = sfxVolume * V.whoosh;
  const vPop = sfxVolume * V.pop;
  const vClick = sfxVolume * V.click;
  const vBuzzer = sfxVolume * V.buzzer;
  const vDing = sfxVolume * V.ding;
  const vShine = sfxVolume * V.shine;
  const vTick = sfxVolume * V.tick;
  const vClap = sfxVolume * V.clap;
  const vCash = sfxVolume * V.cash;
  const vRoom = V.room;

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navy }}>
      {segments.map((segment) => {
        const from = Math.round(segment.timelineStart * fps);
        const frames = Math.round(segment.durationInSeconds * fps);
        return (
          <Sequence key={segment.id} from={from} durationInFrames={frames}>
            {segment.kind === "video" ? (
              <VideoSegment segment={segment} source={source} />
            ) : segment.kind === "list" ? (
              <ListCard words={words} />
            ) : segment.kind === "recap" ? (
              <RecapCard words={words} attempts={attempts.length} limit={attemptLimit} />
            ) : (
              <ClosingCard />
            )}
          </Sequence>
        );
      })}

      {/* the opening title rides the first shot only */}
      <Sequence durationInFrames={Math.round(segments[0].durationInSeconds * fps)}>
        <TitleIn />
        <Audio src={staticFile("sfx/impact.wav")} volume={vImpact} />
      </Sequence>

      {/* HUD: counter + rail, across the game only */}
      <Sequence from={hudFrom} durationInFrames={hudTo}>
        <Counter
          attempts={attempts.map((a) => ({ ...a, at: a.at - firstVideo.timelineStart }))}
          solved={solved.map((s) => ({ ...s, at: s.at - firstVideo.timelineStart }))}
          words={words}
          limit={attemptLimit}
        />
      </Sequence>

      {/* a checkmark on every word that falls */}
      {solved.map((s) => (
        <Sequence
          key={`ok-${s.word}`}
          from={Math.round(s.at * fps)}
          durationInFrames={Math.round(1.45 * fps)}
        >
          <SolvedBadge word={s.word} />
          <Audio src={staticFile("sfx/ding.wav")} volume={vDing} />
          <Audio src={staticFile("sfx/shine.wav")} volume={vShine} />
        </Sequence>
      ))}

      {/* one click per attempt, a discreet buzzer on the two that miss */}
      {attempts.map((a, i) => (
        <Sequence
          key={`try-${i}`}
          from={Math.round(a.at * fps)}
          durationInFrames={Math.round(0.9 * fps)}
        >
          <Audio src={staticFile("sfx/click.wav")} volume={vClick} />
          {a.correct ? null : (
            <Sequence from={Math.round(0.14 * fps)}>
              <Audio src={staticFile("sfx/buzzer.wav")} volume={vBuzzer} />
            </Sequence>
          )}
        </Sequence>
      ))}

      {/* a soft clock under the long thinking beats */}
      {ticks.map((t, i) => (
        <Sequence key={`tick-${i}`} from={Math.round(t * fps)} durationInFrames={4}>
          <Audio src={staticFile("sfx/tick.wav")} volume={vTick} />
        </Sequence>
      ))}

      {/* the only two whooshes in the piece: in and out of the graphic cards */}
      {/* The graphic cards keep the location's own ambience under them, so
          the track never drops to digital silence between shots. */}
      {cards.map((card) => {
        const from = Math.round(card.timelineStart * fps);
        const frames = Math.round(card.durationInSeconds * fps);
        const last = card.id === "closing";
        return (
          <Sequence key={`room-${card.id}`} from={from} durationInFrames={frames}>
            <Audio
              src={staticFile("sfx/roomtone.wav")}
              loop
              volume={(f) =>
                last
                  ? interpolate(f, [frames - Math.round(fps * 1.2), frames], [vRoom, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })
                  : vRoom
              }
            />
          </Sequence>
        );
      })}

      {listCard ? (
        <Sequence
          from={Math.round(listCard.timelineStart * fps)}
          durationInFrames={Math.round(listCard.durationInSeconds * fps)}
        >
          <Audio src={staticFile("sfx/whoosh.wav")} volume={vWhoosh} />
          {words.map((w, i) => (
            <Sequence key={w} from={Math.round(i * 0.14 * fps)} durationInFrames={4}>
              <Audio src={staticFile("sfx/pop.wav")} volume={vPop} />
            </Sequence>
          ))}
          <Sequence from={Math.round(1.25 * fps)} durationInFrames={Math.round(fps)}>
            <Audio src={staticFile("sfx/shine.wav")} volume={vShine} />
          </Sequence>
        </Sequence>
      ) : null}

      {recapCard ? (
        <Sequence
          from={Math.round(recapCard.timelineStart * fps)}
          durationInFrames={Math.round(recapCard.durationInSeconds * fps)}
        >
          <Audio src={staticFile("sfx/whoosh.wav")} volume={vWhoosh} />
          {words.map((w, i) => (
            <Sequence key={`r-${w}`} from={Math.round(i * 0.09 * fps)} durationInFrames={4}>
              <Audio src={staticFile("sfx/pop.wav")} volume={vPop} />
            </Sequence>
          ))}
          <Sequence from={Math.round(0.72 * fps)} durationInFrames={10}>
            <Audio src={staticFile("sfx/clap.wav")} volume={vClap} />
          </Sequence>
          <Sequence from={Math.round(0.9 * fps)} durationInFrames={Math.round(fps * 0.6)}>
            <Audio src={staticFile("sfx/cash.wav")} volume={vCash} />
          </Sequence>
        </Sequence>
      ) : null}

      {closingCard ? (
        <Sequence
          from={Math.round(closingCard.timelineStart * fps)}
          durationInFrames={Math.round(fps)}
        >
          <Audio src={staticFile("sfx/shine.wav")} volume={vShine} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const palabrasDurationInFrames = ({ fps, segments }: PalabrasProps) =>
  segments.reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);
