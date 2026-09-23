import { z } from "zod";

export const mitoCaptionSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
  accent: z.enum(["white", "red", "blue"]),
});

export const mitoSegmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["intro", "myth"]),
  srcIn: z.number(),
  srcOut: z.number(),
  durationInSeconds: z.number(),
  holdInSeconds: z.number(),
  timelineStart: z.number(),
  still: z.string().nullable(),
  captions: z.array(mitoCaptionSchema),
});

export const mitosSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  title: z.string(),
  closingInSeconds: z.number(),
  totalInSeconds: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.3),
  sfxVolume: z.number().min(0).max(1).default(0.3),
  segments: z.array(mitoSegmentSchema),
});

export type MitosProps = z.infer<typeof mitosSchema>;
export type MitoSegment = z.infer<typeof mitoSegmentSchema>;
