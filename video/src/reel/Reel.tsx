import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence,
  interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import type { ReelProps } from "./schema";

const font = '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const NAVY = "#0B1528";
const RED = "#A92141";
const BLUE = "#72C5E5";
const WHITE = "#FAFCFF";
const SAFE = { top: 200, right: 250, bottom: 400, left: 100 } as const;

/** Captions: two lines at most, under the faces, above TikTok's chrome. */
const Captions: React.FC<{ captions: ReelProps["captions"] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const c = captions.find((x) => frame >= x.from && frame < x.to + 6);
  if (!c) return null;
  return (
    <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, bottom: 470, textAlign: "center", pointerEvents: "none" }}>
      {c.text.split("|").map((l, i) => (
        <div key={i}>
          <span
            style={{
              // One base size for every caption in the piece.
              fontFamily: font, fontWeight: 700, fontSize: 48, lineHeight: 1.24,
              color: WHITE, backgroundColor: "rgba(11, 21, 40, 0.84)",
              borderRadius: 12, padding: "6px 16px", display: "inline-block",
            }}
          >
            {l.split("*").map((p, k) =>
              k % 2 ? <span key={k} style={{ color: BLUE }}>{p}</span> : <span key={k}>{p}</span>,
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

const Hook: React.FC<{ top: string; bottom: string; tag: string; frames: number }> = ({ top, bottom, tag, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 11, mass: 0.32, stiffness: 250 } });
  const b = spring({ frame: frame - 6, fps, config: { damping: 12, mass: 0.32, stiffness: 230 } });
  const c = spring({ frame: frame - 12, fps, config: { damping: 14, mass: 0.34 } });
  const out = interpolate(frame, [frames - 5, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const base: React.CSSProperties = {
    fontFamily: font, fontWeight: 900, letterSpacing: "-0.03em", color: WHITE,
    textShadow: "0 12px 40px rgba(6,13,26,0.85)", whiteSpace: "nowrap",
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(11,21,40,0.34), rgba(11,21,40,0.60))", opacity: a }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ ...base, fontSize: 112, opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.55, 1])})` }}>{top}</span>
        <span style={{ ...base, fontSize: 76, color: BLUE, opacity: b, transform: `scale(${interpolate(b, [0, 1], [0.6, 1])})` }}>{bottom}</span>
        {tag ? (
          <span style={{ fontFamily: font, fontWeight: 700, fontSize: 40, letterSpacing: "0.26em", color: WHITE, opacity: c, marginTop: 14 }}>{tag}</span>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** "03 / 10" plus the question, held briefly then out of the way. */
/**
 * The question lands big, then settles into a smaller bar at the top and stays
 * there for the whole answer — it only leaves when the next question arrives.
 */
const Chapter: React.FC<{ index: number; total: number; text: string; frames: number }> = ({ index, total, text, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 13, mass: 0.34, stiffness: 220 } });
  const settle = spring({ frame: frame - 54, fps, config: { damping: 200, mass: 0.6, stiffness: 110 } });
  const scale = interpolate(settle, [0, 1], [1, 0.74]);
  const out = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div
      style={{
        position: "absolute", top: SAFE.top + 20, left: SAFE.left, right: SAFE.right,
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12,
        opacity: inn * out,
        transform: `translateY(${interpolate(inn, [0, 1], [-24, 0])}px) scale(${scale})`,
        transformOrigin: "0% 0%",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, backgroundColor: RED, borderRadius: 12, padding: "8px 20px" }}>
        <span style={{ fontFamily: font, fontWeight: 900, fontSize: 56, color: WHITE }}>{pad(index)}</span>
        <span style={{ fontFamily: font, fontWeight: 700, fontSize: 32, color: WHITE, opacity: 0.85 }}>/ {pad(total)}</span>
      </div>
      {text ? (
      <span
        style={{
          fontFamily: font, fontWeight: 800, fontSize: 64, lineHeight: 1.14,
          color: WHITE, backgroundColor: "rgba(11, 21, 40, 0.88)", borderLeft: `6px solid ${BLUE}`,
          borderRadius: 10, padding: "14px 22px", textAlign: "left", maxWidth: 740,
        }}
      >
        {text}
      </span>
      ) : null}
    </div>
  );
};

const Plate: React.FC<{ name: string; role: string; frames: number }> = ({ name, role, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 18, mass: 0.5, stiffness: 130 } });
  const out = interpolate(frame, [frames - 10, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        // Above the caption block: the name plate and a two-line caption both
        // live in the lower third, and the caption was covering the name.
        position: "absolute", left: SAFE.left, bottom: 620,
        backgroundColor: "rgba(11, 21, 40, 0.90)", borderLeft: `6px solid ${RED}`,
        borderRadius: 10, padding: "12px 22px 12px 18px",
        opacity: inn * out, transform: `translateX(${interpolate(inn, [0, 1], [-24, 0])}px)`,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontFamily: font, fontWeight: 800, fontSize: 40, color: WHITE, whiteSpace: "nowrap" }}>{name}</div>
      <div style={{ fontFamily: font, fontWeight: 600, fontSize: 26, letterSpacing: "0.12em", color: BLUE, whiteSpace: "nowrap" }}>{role}</div>
    </div>
  );
};

const Tag: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, mass: 0.3, stiffness: 240 } });
  const out = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute", top: SAFE.top + 30, right: SAFE.right, backgroundColor: RED,
        borderRadius: 12, padding: "10px 24px", opacity: out,
        transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])}) rotate(-3deg)`, pointerEvents: "none",
      }}
    >
      <span style={{ fontFamily: font, fontWeight: 900, fontSize: 44, color: WHITE, whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
};

const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 200, mass: 0.5 } });
  const b = spring({ frame: frame - 8, fps, config: { damping: 200, mass: 0.45 } });
  return (
    <AbsoluteFill style={{ backgroundColor: WHITE, alignItems: "center", justifyContent: "center", gap: 26 }}>
      <Img src={staticFile("brand/muncas-logo.png")} style={{ width: 430, height: "auto", opacity: a, transform: `scale(${interpolate(a, [0, 1], [0.92, 1])})` }} />
      <span style={{ fontFamily: font, fontWeight: 900, fontSize: 64, letterSpacing: "0.03em", color: NAVY, opacity: b }}>MUNCAS XX</span>
      <div style={{ width: interpolate(b, [0, 1], [0, 130]), height: 6, borderRadius: 3, backgroundColor: RED }} />
      <span style={{ fontFamily: font, fontWeight: 700, fontSize: 50, color: NAVY, opacity: b }}>#ShapingTheFuture</span>
    </AbsoluteFill>
  );
};

const Body: React.FC<{ source: string; srcIn: number; frames: number; from: number; zooms: ReelProps["zooms"] }> = ({ source, srcIn, frames, from, zooms }) => {
  const frame = useCurrentFrame();
  const abs = frame + from;
  const z = zooms.find((w) => abs >= w.from && abs < w.to);
  const rise = z ? Math.min(8, Math.max(1, Math.floor((z.to - z.from) / 3))) : 0;
  const punch = z
    ? interpolate(abs, [z.from, z.from + rise, z.to - rise, z.to], [1, 1.09, 1.09, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  const trimBefore = Math.round(srcIn * 30);
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(source)} trimBefore={trimBefore} trimAfter={trimBefore + frames}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${punch})`, transformOrigin: "50% 42%", filter: "contrast(1.04) saturate(1.04)" }}
      />
    </AbsoluteFill>
  );
};

const Shot: React.FC<{ name: string; at: number; volume: number }> = ({ name, at, volume }) => (
  <Sequence from={at} durationInFrames={30}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const Reel: React.FC<ReelProps> = ({
  source, music, titleTop, titleBottom, titleTag, introAt, introFrames, captionsFrom, segments, captions,
  chapters, lowerThird, tags, zooms, beats, bodyFrames, closingFrames, musicVolume, sfxVolume,
}) => {
  const vPop = sfxVolume * 0.45;
  const vSnap = sfxVolume * 0.5;
  const vImpact = sfxVolume * 0.55;
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      {segments.map((s) => (
        <Sequence key={s.from} from={s.from} durationInFrames={s.frames}>
          <Body source={source} srcIn={s.srcIn} frames={s.frames} from={s.from} zooms={zooms} />
        </Sequence>
      ))}

      <Sequence from={introAt} durationInFrames={introFrames}>
        <Hook top={titleTop} bottom={titleBottom} tag={titleTag} frames={introFrames} />
      </Sequence>

      {chapters.map((c) => (
        <Sequence key={`c${c.index}`} from={c.at} durationInFrames={c.frames}>
          <Chapter index={c.index} total={c.total} text={c.text} frames={c.frames} />
        </Sequence>
      ))}

      {lowerThird ? (
        <Sequence from={lowerThird.at} durationInFrames={lowerThird.frames}>
          <Plate name={lowerThird.name} role={lowerThird.role} frames={lowerThird.frames} />
        </Sequence>
      ) : null}

      {tags.map((t, i) => (
        <Sequence key={`t${i}`} from={t.at} durationInFrames={t.frames}>
          <Tag text={t.text} frames={t.frames} />
        </Sequence>
      ))}

      <Sequence from={captionsFrom} durationInFrames={bodyFrames - captionsFrom}>
        <CaptionsShifted captions={captions} offset={captionsFrom} />
      </Sequence>

      <Sequence from={bodyFrames} durationInFrames={closingFrames}>
        <Closing />
      </Sequence>

      <Shot name="impact" at={0} volume={vImpact} />
      {beats.map((b, i) => (
        <React.Fragment key={`b${i}`}>
          <Shot name="pop" at={b} volume={vPop} />
          <Shot name="snap" at={b + 3} volume={vSnap} />
        </React.Fragment>
      ))}
      <Shot name="shine" at={bodyFrames} volume={vSnap} />
      <Audio src={staticFile(music)} volume={musicVolume} />
    </AbsoluteFill>
  );
};

const CaptionsShifted: React.FC<{ captions: ReelProps["captions"]; offset: number }> = ({ captions, offset }) => (
  <Captions captions={captions.map((c) => ({ ...c, from: c.from - offset, to: c.to - offset }))} />
);

export const reelDurationInFrames = ({ totalFrames }: ReelProps) => totalFrames;
