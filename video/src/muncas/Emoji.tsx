import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { emojiFont, muncas } from "./theme";
import type { EmojiBeat } from "./schema";

export const EMOJI_SIZE = 254;

/** Deterministic jitter — no Math.random, so every render is identical. */
const jitter = (seed: number) => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

type Look = {
  transform: string;
  opacity: number;
  origin?: string;
  glow?: string;
  /** Painted behind the emoji. */
  rings?: { r: number; opacity: number; color: string }[];
  /** A light sweep across the glyph. */
  sweep?: number | null;
};

/**
 * Each emoji gets its own short move, keyed to what it stands for: the ball
 * rolls in, the bomb lands, the flag waves. Every move settles inside ~0.6s
 * so it never competes with the next word.
 */
export const useEmojiLook = (anim: EmojiBeat["anim"], ageInFrames: number): Look => {
  const { fps } = useVideoConfig();
  const t = ageInFrames / fps;

  const enter = spring({
    frame: ageInFrames,
    fps,
    config: { damping: 11, mass: 0.42, stiffness: 150 },
  });
  const settle = spring({
    frame: ageInFrames,
    fps,
    config: { damping: 200, mass: 0.6 },
  });

  const base = interpolate(enter, [0, 1], [0.25, 1]);
  const opacity = interpolate(ageInFrames, [0, fps * 0.12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const decay = (rate: number) => Math.exp(-rate * Math.max(t, 0));

  switch (anim) {
    case "bounce": {
      const hop = -Math.abs(Math.sin(t * 11)) * 30 * decay(4.2);
      return { transform: `translateY(${hop}px) scale(${base})`, opacity };
    }
    case "impact": {
      const scale = interpolate(settle, [0, 1], [1.85, 1]);
      const shake = t < 0.22 ? jitter(ageInFrames) * 9 * decay(11) : 0;
      return {
        transform: `translate(${shake}px, ${shake * 0.6}px) scale(${scale})`,
        opacity,
        glow: `drop-shadow(0 0 ${26 * decay(6)}px ${muncas.red})`,
      };
    }
    case "roll": {
      const x = interpolate(settle, [0, 1], [-300, 0]);
      const rot = interpolate(settle, [0, 1], [-400, 0]);
      return { transform: `translateX(${x}px) rotate(${rot}deg) scale(${base})`, opacity };
    }
    case "scale":
      return { transform: `scale(${interpolate(settle, [0, 1], [0.3, 1])})`, opacity };
    case "cash": {
      const lift = interpolate(settle, [0, 1], [26, 0]) - Math.sin(t * 3) * 4 * decay(1.2);
      return { transform: `translateY(${lift}px) scale(${base})`, opacity };
    }
    case "wave": {
      const skew = Math.sin(t * 13) * 11 * decay(2.6);
      return { transform: `skewX(${skew}deg) scale(${base})`, opacity };
    }
    case "grow": {
      const sy = interpolate(settle, [0, 1], [0.12, 1]);
      return {
        transform: `scaleY(${sy}) scaleX(${interpolate(settle, [0, 1], [0.7, 1])})`,
        opacity,
        origin: "bottom center",
      };
    }
    case "spin": {
      const rot = interpolate(settle, [0, 1], [0, 360]);
      return { transform: `rotate(${rot}deg) scale(${base})`, opacity };
    }
    case "waves": {
      const rings = [0, 0.22].map((delay) => {
        const rt = Math.max(0, t - delay);
        return {
          r: 90 + rt * 260,
          opacity: Math.max(0, 0.5 - rt * 1.5),
          color: muncas.blue,
        };
      });
      return { transform: `scale(${base})`, opacity, rings };
    }
    case "glitch": {
      const live = t < 0.3;
      const jx = live ? jitter(ageInFrames * 3.1) * 14 : 0;
      const jy = live ? jitter(ageInFrames * 7.7) * 6 : 0;
      const flick = live && Math.floor(ageInFrames) % 3 === 0 ? 0.55 : 1;
      return {
        transform: `translate(${jx}px, ${jy}px) scale(${base})`,
        opacity: opacity * flick,
        glow: live
          ? `drop-shadow(${jx * 0.4}px 0 0 ${muncas.blue}) drop-shadow(${-jx * 0.4}px 0 0 ${muncas.red})`
          : undefined,
      };
    }
    case "float": {
      const bob = Math.sin(t * 4.4) * 11;
      return { transform: `translateY(${bob}px) scale(${base})`, opacity };
    }
    case "sail": {
      const drift = Math.sin(t * 2.6) * 16;
      const tilt = Math.sin(t * 2.6 + 0.6) * 4;
      return { transform: `translateX(${drift}px) rotate(${tilt}deg) scale(${base})`, opacity };
    }
    case "clap": {
      const hit = 1 + 0.32 * decay(9) * Math.cos(t * 26);
      return { transform: `scale(${base * hit})`, opacity };
    }
    case "splash": {
      const rings = [0, 0.12].map((delay, i) => {
        const rt = Math.max(0, t - delay);
        return {
          r: 80 + rt * 320,
          opacity: Math.max(0, 0.45 - rt * 1.8),
          color: i === 0 ? muncas.red : muncas.blue,
        };
      });
      return { transform: `scale(${base})`, opacity, rings };
    }
    case "shine": {
      const sweep = t < 0.75 ? interpolate(t, [0.1, 0.7], [-1.3, 1.3]) : null;
      return { transform: `scale(${base})`, opacity, sweep };
    }
    case "siren": {
      const pulse = 0.5 + 0.5 * Math.sin(t * 16);
      return {
        transform: `scale(${base})`,
        opacity,
        glow: `drop-shadow(0 0 ${18 + pulse * 26}px rgba(225, 38, 28, ${0.45 + pulse * 0.4}))`,
      };
    }
    case "pop":
    default:
      return { transform: `scale(${base})`, opacity };
  }
};

export const Emoji: React.FC<{ beat: EmojiBeat; ageInFrames: number }> = ({
  beat,
  ageInFrames,
}) => {
  const look = useEmojiLook(beat.anim, ageInFrames);

  return (
    <div
      style={{
        position: "relative",
        width: EMOJI_SIZE,
        height: EMOJI_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {look.rings?.map((ring, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: ring.r,
            height: ring.r,
            borderRadius: "50%",
            border: `4px solid ${ring.color}`,
            opacity: ring.opacity,
          }}
        />
      ))}

      <div
        style={{
          position: "relative",
          fontFamily: emojiFont,
          fontSize: EMOJI_SIZE * 0.86,
          lineHeight: 1,
          transform: look.transform,
          transformOrigin: look.origin ?? "center center",
          opacity: look.opacity,
          filter: [
            "drop-shadow(0 12px 22px rgba(6, 18, 41, 0.38))",
            look.glow,
          ]
            .filter(Boolean)
            .join(" "),
        }}
      >
        {beat.char}
        {look.sweep === null || look.sweep === undefined ? null : (
          <div
            style={{
              position: "absolute",
              inset: -10,
              background:
                "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.85) 50%, transparent 58%)",
              transform: `translateX(${look.sweep * EMOJI_SIZE}px)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
};
