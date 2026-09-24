import { z } from "zod";

/** A caption is a single line, split into coloured runs. */
export const runSchema = z.object({
  text: z.string(),
  color: z.enum(["white", "red", "blue", "money"]).default("white"),
});

export const plataCaptionSchema = z.object({
  runs: z.array(runSchema),
  start: z.number(),
  end: z.number(),
});

/** Everything that pops on top of a shot, in seconds from the segment start. */
export const markSchema = z.object({
  kind: z.enum(["si", "no", "amount", "amount-win", "thinking", "winner"]),
  /** Shown inside the mark, when it carries text of its own. */
  text: z.string().default(""),
  start: z.number(),
  end: z.number(),
});

export const plataSegmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["video", "closing"]),
  srcIn: z.number().nullable(),
  durationInSeconds: z.number(),
  timelineStart: z.number(),
  zoomFrom: z.number(),
  zoomTo: z.number(),
  originX: z.number(),
  originY: z.number(),
  /** The two money chips ride this shot. */
  chips: z.boolean().default(false),
  captions: z.array(plataCaptionSchema).default([]),
  marks: z.array(markSchema).default([]),
});

export const plataSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  title: z.string(),
  lowerThird: z.string().default(""),
  leftAmount: z.string(),
  rightAmount: z.string(),
  segments: z.array(plataSegmentSchema),
  /** Absolute timeline seconds for each effect. */
  sfx: z.array(z.object({ at: z.number(), name: z.string(), gain: z.number().default(1) })).default([]),
  sfxVolume: z.number().min(0).max(1).default(0.5),
  musicVolume: z.number().min(0).max(1).default(0),
  totalInSeconds: z.number(),
});

export type PlataProps = z.infer<typeof plataSchema>;
export type PlataSegment = z.infer<typeof plataSegmentSchema>;
export type PlataCaption = z.infer<typeof plataCaptionSchema>;
export type Mark = z.infer<typeof markSchema>;
