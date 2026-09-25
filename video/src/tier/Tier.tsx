import React from "react";
import {
  AbsoluteFill, Audio, Img, OffthreadVideo, Sequence,
  interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";
import type { TierItem, TierProps } from "./schema";

const font = '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const NAVY = "#0B1528";
const RED = "#A92141";
const BLUE = "#72C5E5";
const WHITE = "#FAFCFF";

/** TikTok's chrome, as pixels to stay clear of. */
const SAFE = { top: 200, right: 250, bottom: 400, left: 100 } as const;

/** The table lives in the clean wall above both heads. */
const TABLE = { top: 215, left: SAFE.left, width: 1080 - SAFE.left - SAFE.right };
const ROW_H = 65;
const ROW_GAP = 6;
const LABEL_W = 66;

/** No TierMaker rainbow: one navy family, stepping down in intensity. */
const TIER_COLOR: Record<string, string> = {
  S: RED, A: "#C8536E", B: BLUE, C: "#4A91B3", D: "#2A4A75", F: "#16294A",
};

const rowTop = (i: number) => TABLE.top + i * (ROW_H + ROW_GAP);

/* ------------------------------------------------------------------ table */

const Chip: React.FC<{ label: string; wide?: boolean }> = ({ label, wide }) => (
  <span
    style={{
      fontFamily: font,
      fontWeight: 700,
      fontSize: wide ? 24 : 20,
      letterSpacing: "0.01em",
      color: WHITE,
      backgroundColor: "rgba(250, 252, 255, 0.14)",
      border: "2px solid rgba(250, 252, 255, 0.34)",
      borderRadius: 9,
      padding: wide ? "10px 18px" : "7px 12px",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </span>
);

/** An item on its way from the prompt to its row. */
const FlyingItem: React.FC<{ item: TierItem; tiers: string[] }> = ({ item, tiers }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - item.showAt, fps, config: { damping: 12, mass: 0.34, stiffness: 220 } });
  const fly = spring({ frame: frame - item.placeAt, fps, config: { damping: 18, mass: 0.6, stiffness: 120 } });
  if (frame < item.showAt - 2) return null;

  const row = tiers.indexOf(item.tier);
  const startY = 1150;
  const endY = rowTop(row) + ROW_H / 2;
  const x = interpolate(fly, [0, 1], [540, TABLE.left + LABEL_W + 210]);
  const y = interpolate(fly, [0, 1], [startY, endY]);
  const scale = interpolate(fly, [0, 1], [1, 0.62]) * interpolate(pop, [0, 1], [0.5, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: fly > 0.92 ? 0 : pop,
        pointerEvents: "none",
      }}
    >
      <Chip label={item.label} wide />
    </div>
  );
};

const TierTable: React.FC<{ tiers: string[]; items: TierItem[] }> = ({ tiers, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.5, stiffness: 150 } });

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: enter }}>
      <div
        style={{
          position: "absolute",
          top: TABLE.top - 12,
          left: TABLE.left - 12,
          width: TABLE.width + 24,
          height: 6 * ROW_H + 5 * ROW_GAP + 24,
          backgroundColor: "rgba(11, 21, 40, 0.80)",
          border: "2px solid rgba(114, 197, 229, 0.3)",
          borderRadius: 18,
        }}
      />
      {tiers.map((t, i) => {
        const placed = items.filter((it) => it.tier === t && frame >= it.placeAt + 8);
        return (
          <div
            key={t}
            style={{
              position: "absolute",
              top: rowTop(i),
              left: TABLE.left,
              width: TABLE.width,
              height: ROW_H,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: LABEL_W,
                height: ROW_H,
                borderRadius: 10,
                backgroundColor: TIER_COLOR[t],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: font,
                fontWeight: 900,
                fontSize: 36,
                color: WHITE,
              }}
            >
              {t}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
              {placed.map((it) => (
                <Chip key={it.label} label={it.label} />
              ))}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------- overlays */

const Captions: React.FC<{ captions: TierProps["captions"] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const active = captions.find((c) => frame >= c.from && frame < c.to + 8);
  if (!active) return null;
  const lines = active.text.split("|");
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        right: SAFE.right,
        bottom: 520,
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>
          <span
            style={{
              fontFamily: font,
              fontWeight: 700,
              fontSize: l.length > 26 ? 44 : 52,
              lineHeight: 1.22,
              color: WHITE,
              backgroundColor: "rgba(11, 21, 40, 0.84)",
              borderRadius: 12,
              padding: "6px 16px",
              display: "inline-block",
              boxDecorationBreak: "clone",
            }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
};

const LowerThird: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 12, fps, config: { damping: 20, mass: 0.5, stiffness: 120 } });
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        bottom: SAFE.bottom + 10,
        display: "flex",
        alignItems: "center",
        backgroundColor: "rgba(11, 21, 40, 0.88)",
        borderLeft: `6px solid ${RED}`,
        borderTop: "1px solid rgba(114, 197, 229, 0.35)",
        borderBottom: "1px solid rgba(114, 197, 229, 0.35)",
        borderRadius: 9,
        padding: "10px 20px 10px 16px",
        opacity: enter,
        transform: `translateX(${interpolate(enter, [0, 1], [-22, 0])}px)`,
        pointerEvents: "none",
      }}
    >
      <span style={{ fontFamily: font, fontWeight: 600, fontSize: 30, letterSpacing: "0.08em", color: WHITE, whiteSpace: "nowrap" }}>
        DIRECTOR ACADÉMICO
      </span>
    </div>
  );
};

const Hook: React.FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const one = spring({ frame, fps, config: { damping: 11, mass: 0.34, stiffness: 240 } });
  const two = spring({ frame: frame - 7, fps, config: { damping: 12, mass: 0.34, stiffness: 220 } });
  const out = interpolate(frame, [frames - 5, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const big: React.CSSProperties = {
    fontFamily: font, fontWeight: 900, letterSpacing: "-0.03em",
    color: WHITE, textShadow: "0 12px 40px rgba(6,13,26,0.8)", whiteSpace: "nowrap",
  };
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out, pointerEvents: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ ...big, fontSize: 120, opacity: one, transform: `scale(${interpolate(one, [0, 1], [0.55, 1])})` }}>
          TIER LIST
        </span>
        <span style={{ ...big, fontSize: 72, color: BLUE, opacity: two, transform: `scale(${interpolate(two, [0, 1], [0.6, 1])})` }}>
          WITH MUNCAS
        </span>
      </div>
    </AbsoluteFill>
  );
};

const FinalCard: React.FC<{ tiers: string[]; items: TierItem[] }> = ({ tiers, items }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const push = interpolate(frame, [0, 45], [1.0, 1.10], { extrapolateRight: "clamp" });
  const t = spring({ frame, fps, config: { damping: 200, mass: 0.5 } });
  const all = items.map((i) => ({ ...i, placeAt: -1 }));
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 40% at 20% 14%, ${RED}33 0%, transparent 70%), radial-gradient(64% 44% at 84% 86%, ${BLUE}2E 0%, transparent 72%)` }} />
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 30%" }}>
        <TierTable tiers={tiers} items={all} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: SAFE.left, right: SAFE.right, bottom: 640, textAlign: "center", opacity: t }}>
        <span style={{ fontFamily: font, fontWeight: 900, fontSize: 72, color: WHITE, letterSpacing: "-0.02em" }}>
          FINAL TIER LIST 👀
        </span>
      </div>
    </AbsoluteFill>
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

/* ------------------------------------------------------------------- main */

const Shot: React.FC<{ name: string; at: number; volume: number }> = ({ name, at, volume }) => (
  <Sequence from={at} durationInFrames={30}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const Tier: React.FC<TierProps> = ({
  source, music, segments, introFrames, tiers, items, captions, zooms,
  bodyFrames, finalCardFrames, closingFrames, musicVolume, sfxVolume,
}) => {
  const vPop = sfxVolume * 0.5;
  const vSnap = sfxVolume * 0.55;
  const vDing = sfxVolume * 0.5;
  const vBuzz = sfxVolume * 0.32;
  const vClick = sfxVolume * 0.45;
  const vImpact = sfxVolume * 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      {/* the take, with its dead air removed */}
      {segments.map((s) => (
        <Sequence key={s.from} from={s.from} durationInFrames={s.frames}>
          <Body source={source} srcIn={s.srcIn} frames={s.frames} from={s.from} zooms={zooms} />
        </Sequence>
      ))}

      <Sequence durationInFrames={introFrames}>
        <Hook frames={introFrames} />
      </Sequence>

      {/* the table is built live, above their heads */}
      <Sequence from={introFrames} durationInFrames={bodyFrames - introFrames}>
        <TierTableLive tiers={tiers} items={items} offset={introFrames} />
        <LowerThird />
      </Sequence>

      <Sequence from={introFrames} durationInFrames={bodyFrames - introFrames}>
        <CaptionsLive captions={captions} offset={introFrames} />
      </Sequence>

      <Sequence from={bodyFrames} durationInFrames={finalCardFrames}>
        <FinalCard tiers={tiers} items={items} />
      </Sequence>
      <Sequence from={bodyFrames + finalCardFrames} durationInFrames={closingFrames}>
        <Closing />
      </Sequence>

      {/* sound design: one small cue per decision, nothing else */}
      <Shot name="impact" at={0} volume={vImpact} />
      {items.map((it) => (
        <React.Fragment key={it.label}>
          <Shot name="pop" at={it.showAt} volume={vPop} />
          <Shot name="swish" at={it.placeAt - 6} volume={vClick} />
          <Shot name="snap" at={it.placeAt} volume={vSnap} />
          {it.tier === "S" ? <Shot name="ding" at={it.placeAt + 2} volume={vDing} /> : null}
          {it.tier === "F" ? <Shot name="buzzer" at={it.placeAt + 2} volume={vBuzz} /> : null}
        </React.Fragment>
      ))}
      <Shot name="shine" at={bodyFrames} volume={vDing} />

      <Audio src={staticFile(music)} volume={musicVolume} />
    </AbsoluteFill>
  );
};

/** The shot: source video with the removed gaps already accounted for. */
const Body: React.FC<{
  source: string; srcIn: number; frames: number; from: number;
  zooms: TierProps["zooms"];
}> = ({ source, srcIn, frames, from, zooms }) => {
  const frame = useCurrentFrame();
  const abs = frame + from;
  const z = zooms.find((w) => abs >= w.from && abs < w.to);
  const punch = z
    ? interpolate(abs, [z.from, z.from + 8, z.to - 6, z.to], [1, 1.09, 1.09, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;
  const trimBefore = Math.round(srcIn * 30);
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(source)}
        trimBefore={trimBefore}
        trimAfter={trimBefore + frames}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: `scale(${punch})`, transformOrigin: "50% 42%",
          filter: "contrast(1.04) saturate(1.04)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Wrappers that shift the absolute frame numbers into the sequence. */
const TierTableLive: React.FC<{ tiers: string[]; items: TierItem[]; offset: number }> = ({ tiers, items, offset }) => {
  const shifted = items.map((i) => ({ ...i, showAt: i.showAt - offset, placeAt: i.placeAt - offset }));
  return (
    <>
      <TierTable tiers={tiers} items={shifted} />
      {shifted.map((it) => (
        <FlyingItem key={it.label} item={it} tiers={tiers} />
      ))}
    </>
  );
};

const CaptionsLive: React.FC<{ captions: TierProps["captions"]; offset: number }> = ({ captions, offset }) => (
  <Captions captions={captions.map((c) => ({ ...c, from: c.from - offset, to: c.to - offset }))} />
);

export const tierDurationInFrames = ({ totalFrames }: TierProps) => totalFrames;
