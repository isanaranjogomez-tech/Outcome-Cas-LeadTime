import { z } from "zod";

export const captionSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  accent: z.enum(["white", "red", "blue"]),
});

export const emojiBeatSchema = z.object({
  char: z.string(),
  at: z.number(),
  anim: z.enum([
    "pop", "bounce", "impact", "roll", "scale", "cash", "wave", "grow",
    "spin", "waves", "glitch", "float", "sail", "clap", "splash", "shine",
    "siren",
  ]),
});

export const segmentSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  srcIn: z.number(),
  srcOut: z.number(),
  durationInSeconds: z.number(),
  freezeInSeconds: z.number(),
  timelineStart: z.number(),
  captions: z.array(captionSchema),
  emojis: z.array(emojiBeatSchema),
  row: z.array(z.string()),
  rowShake: z.boolean(),
  rowPunch: z.boolean(),
  colour: z.object({
    exposure: z.number(),
    gain: z.tuple([z.number(), z.number(), z.number()]),
    measuredRgb: z.tuple([z.number(), z.number(), z.number()]).optional(),
  }),
});

export const muncasSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  title: z.object({
    line1: z.string(),
    line2: z.string(),
    count: z.string(),
    line3: z.string(),
  }),
  totalInSeconds: z.number(),
  segments: z.array(segmentSchema),
  /** Bed level, 0–1. Set to 0 to mute the generated music. */
  musicVolume: z.number().min(0).max(1).default(0.055),
  /** Master level for the generated sound effects. */
  sfxVolume: z.number().min(0).max(1).default(0.42),
});

export type MuncasProps = z.infer<typeof muncasSchema>;
export type Segment = z.infer<typeof segmentSchema>;
export type EmojiBeat = z.infer<typeof emojiBeatSchema>;
export type Caption = z.infer<typeof captionSchema>;
