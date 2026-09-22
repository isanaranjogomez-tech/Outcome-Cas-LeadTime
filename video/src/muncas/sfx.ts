import type { EmojiBeat } from "./schema";

/** Which generated sound belongs to which emoji move. */
const BY_ANIM: Record<EmojiBeat["anim"], { file: string; gain: number }> = {
  pop: { file: "pop", gain: 0.9 },
  bounce: { file: "pop", gain: 1.0 },
  impact: { file: "impact", gain: 1.0 },
  roll: { file: "whoosh", gain: 0.7 },
  scale: { file: "pop", gain: 0.85 },
  cash: { file: "cash", gain: 0.8 },
  wave: { file: "click", gain: 0.8 },
  grow: { file: "pop", gain: 0.8 },
  spin: { file: "whoosh", gain: 0.6 },
  waves: { file: "pop", gain: 0.8 },
  glitch: { file: "glitch", gain: 0.9 },
  float: { file: "click", gain: 0.7 },
  sail: { file: "whoosh-down", gain: 0.55 },
  clap: { file: "clap", gain: 0.85 },
  splash: { file: "splash", gain: 0.8 },
  shine: { file: "shine", gain: 0.6 },
  siren: { file: "siren", gain: 0.75 },
};

export const sfxForAnim = (anim: EmojiBeat["anim"]) => BY_ANIM[anim];
