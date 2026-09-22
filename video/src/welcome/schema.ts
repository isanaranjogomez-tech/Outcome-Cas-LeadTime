import { z } from "zod";

export const welcomeSegmentSchema = z.object({
  id: z.string(),
  clip: z.string(),
  durationInSeconds: z.number(),
  holdInSeconds: z.number(),
  still: z.string().nullable(),
  isFreeze: z.boolean(),
  timelineStart: z.number(),
  welcomeAt: z.number(),
  muncasAt: z.number(),
  move: z.enum(["punch", "drift"]),
  closing: z.boolean(),
  measuredLufs: z.number().optional(),
  gainDb: z.number().optional(),
});

export const welcomeSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  totalInSeconds: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.085),
  sfxVolume: z.number().min(0).max(1).default(0.26),
  closing: z.object({ line1: z.string(), line2: z.string() }),
  segments: z.array(welcomeSegmentSchema),
});

export type WelcomeProps = z.infer<typeof welcomeSchema>;
export type WelcomeSegment = z.infer<typeof welcomeSegmentSchema>;
