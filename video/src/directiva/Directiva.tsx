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
import type { DirectivaProps, Member } from "./schema";

/* ------------------------------------------------------------------ type */

/**
 * The role, set the way the reference sets it: very large, condensed, in the
 * institutional red, anchored to one edge so it runs off frame — and always
 * drawn *under* the cut-out subject, never over a face.
 */
const Role: React.FC<{ member: Member; hold: number }> = ({ member, hold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.6, stiffness: 190 } });
  // Slow drift the other way from the plate: that is where the depth comes from.
  const drift = interpolate(frame, [0, hold], [0, member.side === "left" ? -26 : 26]);
  const rise = interpolate(enter, [0, 1], [34, 0]);

  const line: React.CSSProperties = {
    fontFamily: font,
    fontWeight: 900,
    fontSize: member.fontSize,
    lineHeight: 0.88,
    letterSpacing: "-0.035em",
    color: pal.redBright,
    whiteSpace: "nowrap",
    transform: "scaleX(0.93)",
    transformOrigin: member.side === "left" ? "0% 50%" : "100% 50%",
    textShadow: "0 12px 34px rgba(6, 13, 26, 0.55), 0 2px 8px rgba(6, 13, 26, 0.45)",
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: member.textY,
          left: member.side === "left" ? member.textX - 34 : undefined,
          right: member.side === "right" ? member.textX - 34 : undefined,
          textAlign: member.side === "left" ? "left" : "right",
          opacity: enter,
          transform: `translate(${drift}px, ${rise}px)`,
        }}
      >
        <div style={line}>{member.roleLine1}</div>
        <div style={{ ...line, opacity: 0.96 }}>{member.roleLine2}</div>
      </div>
    </AbsoluteFill>
  );
};

/** The name: small, clean, on the opposite corner, over everything. */
const Name: React.FC<{ member: Member; hold: number }> = ({ member, hold }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, mass: 0.5, stiffness: 170 } });
  const drift = interpolate(frame, [0, hold], [0, member.side === "left" ? 10 : -10]);
  const right = member.side === "left";

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: SAFE.y + 10,
          left: right ? undefined : SAFE.x,
          right: right ? SAFE.x : undefined,
          display: "flex",
          flexDirection: "column",
          alignItems: right ? "flex-end" : "flex-start",
          gap: 12,
          opacity: enter,
          transform: `translate(${drift}px, ${interpolate(enter, [0, 1], [18, 0])}px)`,
        }}
      >
        <div
          style={{
            width: interpolate(enter, [0, 1], [0, 92]),
            height: 6,
            borderRadius: 3,
            backgroundColor: pal.red,
          }}
        />
        {member.names.map((n) => (
          <span
            key={n}
            style={{
              fontFamily: font,
              fontWeight: 500,
              fontSize: 50,
              letterSpacing: "0.01em",
              lineHeight: 1.18,
              color: pal.white,
              textShadow: "0 8px 30px rgba(6, 13, 26, 0.75)",
              whiteSpace: "nowrap",
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------------- shots */

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(78% 72% at 50% 46%, rgba(6,13,26,0) 46%, rgba(6,13,26,0.40) 100%)",
      pointerEvents: "none",
    }}
  />
);

/**
 * A camera flash, three frames long: white, then gone. Never a dissolve, and
 * never a white screen — the frame underneath is over-exposed for a moment and
 * punched in, the way a shutter firing actually looks.
 */
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 1, 2, 3], [1, 0.85, 0.38, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity, pointerEvents: "none" }} />;
};

/** How long the shot stays over-exposed and punched in after the flash. */
const useFlashResidue = () => {
  const frame = useCurrentFrame();
  return {
    exposure: interpolate(frame, [0, 7], [1.55, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    punch: interpolate(frame, [0, 6], [1.06, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };
};

/** The run-up: the clip itself, speed-ramped in the source, with a slow push. */
const Movement: React.FC<{ member: Member; frames: number }> = ({ member, frames }) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, frames], [1.02, 1.09]);
  const { exposure, punch } = useFlashResidue();

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navyDeep, overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(member.video)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${push * punch})`,
          transformOrigin: "50% 42%",
          filter: `contrast(1.06) saturate(1.02) brightness(${exposure})`,
        }}
      />
      <Vignette />
      <Flash />
    </AbsoluteFill>
  );
};

/**
 * The pose, held. The plate, the role and the subject are three layers moving
 * at three speeds, so the frozen frame still breathes — and the subject sits
 * in front of the type and spills a little past the bottom of the frame.
 */
const Hold: React.FC<{ member: Member; frames: number }> = ({ member, frames }) => {
  const frame = useCurrentFrame();
  // Plate and subject share an origin and differ only slightly in scale: enough
  // parallax to read as depth, never enough to lift the person off their own
  // background — which would put the type in front of a face.
  const plate = interpolate(frame, [0, frames], [1.04, 1.09]);
  const plateX = interpolate(frame, [0, frames], [0, member.side === "left" ? 16 : -16]);
  const subject = interpolate(frame, [0, frames], [1.075, 1.135]);
  const hit = interpolate(frame, [0, 6], [1.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navyDeep, overflow: "hidden" }}>
      {/* Each plate is its own layer: AbsoluteFill is a column flex box, so two
          bare <Img> children would stack instead of overlapping. */}
      <AbsoluteFill>
        <Img
          src={staticFile(member.plate)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translateX(${plateX}px) scale(${plate})`,
            transformOrigin: "50% 62%",
            // The plate steps back so the type reads: desaturated, darker, soft.
            filter: "saturate(0.52) brightness(0.82) contrast(1.08) blur(2px)",
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: pal.navy, opacity: 0.11 }} />

      <Role member={member} hold={frames} />

      <AbsoluteFill>
        <Img
          src={staticFile(member.cutout)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${subject * hit})`,
            transformOrigin: "50% 62%",
            filter: "contrast(1.04) saturate(1.05) drop-shadow(0 26px 46px rgba(6,13,26,0.5))",
          }}
        />
      </AbsoluteFill>

      <Vignette />

      <Sequence from={15}>
        <Name member={member} hold={frames - 15} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ----------------------------------------------------------- open & close */

const Intro: React.FC<{ frames: number; title: string; subtitle: string }> = ({
  frames,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const one = spring({ frame, fps, config: { damping: 200, mass: 0.6, stiffness: 150 } });
  const two = spring({ frame: frame - 30, fps, config: { damping: 200, mass: 0.6, stiffness: 150 } });
  const rule = spring({ frame: frame - 60, fps, config: { damping: 200, mass: 0.5 } });
  const out = interpolate(frame, [frames - 8, frames], [1, 0.82], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: pal.navy,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            `radial-gradient(52% 60% at 22% 18%, ${pal.red}44 0%, transparent 68%),` +
            `radial-gradient(56% 58% at 84% 88%, ${pal.blue}33 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          transform: `scale(${out})`,
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontWeight: 900,
            fontSize: 210,
            letterSpacing: "-0.045em",
            lineHeight: 0.94,
            color: pal.white,
            transform: `scaleX(0.93) translateY(${interpolate(one, [0, 1], [50, 0])}px)`,
            opacity: one,
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: interpolate(rule, [0, 1], [0, 520]),
            height: 8,
            borderRadius: 4,
            backgroundColor: pal.red,
          }}
        />
        <span
          style={{
            fontFamily: font,
            fontWeight: 600,
            fontSize: 66,
            letterSpacing: "0.26em",
            whiteSpace: "nowrap",
            color: pal.blue,
            opacity: two,
            transform: `translateY(${interpolate(two, [0, 1], [26, 0])}px)`,
            paddingLeft: "0.26em",
          }}
        >
          {subtitle}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [0, 1, 2, 3], [1, 0.8, 0.35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const one = spring({ frame, fps, config: { damping: 200, mass: 0.6, stiffness: 140 } });
  const two = spring({ frame: frame - 18, fps, config: { damping: 200, mass: 0.55 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: pal.white,
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
      }}
    >
      <Img
        src={staticFile("brand/muncas-logo.png")}
        style={{
          width: 420,
          height: "auto",
          opacity: one,
          transform: `scale(${interpolate(one, [0, 1], [0.92, 1])})`,
        }}
      />
      <span
        style={{
          fontFamily: font,
          fontWeight: 900,
          fontSize: 72,
          letterSpacing: "0.03em",
          color: pal.navy,
          opacity: two,
        }}
      >
        MUNCAS XX
      </span>
      <div
        style={{ width: interpolate(two, [0, 1], [0, 160]), height: 7, borderRadius: 4, backgroundColor: pal.red }}
      />
      <span
        style={{
          fontFamily: font,
          fontWeight: 700,
          fontSize: 58,
          letterSpacing: "0.04em",
          color: pal.navy,
          opacity: two,
          transform: `translateY(${interpolate(two, [0, 1], [16, 0])}px)`,
        }}
      >
        #ShapingTheFuture
      </span>
      {flash > 0 ? (
        <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flash, pointerEvents: "none" }} />
      ) : null}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ main */

const Shot: React.FC<{ name: string; at: number; volume: number }> = ({ name, at, volume }) => (
  <Sequence from={at} durationInFrames={30}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

export const Directiva: React.FC<DirectivaProps> = ({
  members,
  title,
  subtitle,
  introFrames,
  outroFrames,
  music,
  musicVolume,
  sfxVolume,
  totalFrames,
}) => {
  const vRiser = sfxVolume * 0.5;
  const vSub = sfxVolume * 0.9;
  const vShutter = sfxVolume * 0.78;
  const vClick = sfxVolume * 0.55;
  const vSnap = sfxVolume * 0.5;
  const vPop = sfxVolume * 0.45;
  const vShine = sfxVolume * 0.4;

  return (
    <AbsoluteFill style={{ backgroundColor: pal.navyDeep }}>
      <Sequence durationInFrames={introFrames}>
        <Intro frames={introFrames} title={title} subtitle={subtitle} />
      </Sequence>

      {members.map((m) => (
        <React.Fragment key={m.id}>
          <Sequence from={m.from} durationInFrames={m.moveFrames}>
            <Movement member={m} frames={m.moveFrames} />
          </Sequence>
          <Sequence from={m.from + m.moveFrames} durationInFrames={m.holdFrames}>
            <Hold member={m} frames={m.holdFrames} />
          </Sequence>
        </React.Fragment>
      ))}

      <Sequence from={totalFrames - outroFrames} durationInFrames={outroFrames}>
        <Outro />
      </Sequence>

      {/* --- sound design: the shutter is the transition -------------------- */}

      {/* Every change of member is a flash: shutter and click on the frame the
          white lands, then the pose lifts and drops on its own beat. */}
      {members.map((m) => {
        const freeze = m.from + m.moveFrames;
        return (
          <React.Fragment key={`s-${m.id}`}>
            <Shot name="shutter" at={m.from} volume={vShutter} />
            <Shot name="click" at={m.from} volume={vClick} />
            <Shot name="riser" at={freeze - 16} volume={vRiser} />
            <Shot name="sub" at={freeze} volume={vSub} />
            <Shot name="snap" at={freeze + 12} volume={vSnap} />
            <Shot name="pop" at={freeze + 12} volume={vPop} />
          </React.Fragment>
        );
      })}

      <Shot name="shutter" at={totalFrames - outroFrames} volume={vShutter} />
      <Shot name="shine" at={totalFrames - outroFrames} volume={vShine} />

      <Audio src={staticFile(music)} volume={musicVolume} />
    </AbsoluteFill>
  );
};

export const directivaDurationInFrames = ({ totalFrames }: DirectivaProps) => totalFrames;
