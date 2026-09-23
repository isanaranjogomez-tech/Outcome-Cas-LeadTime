import { z } from "zod";

export const sponsorSegmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["intro", "name", "question", "answer"]),
  srcIn: z.number(),
  srcOut: z.number(),
  durationInSeconds: z.number(),
  timelineStart: z.number(),
  name: z.string().optional(),
  role: z.string().optional(),
  question: z.string().optional(),
  who: z.string().optional(),
});

export const sponsorsSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  title: z.object({ line1: z.string(), line2: z.string() }),
  totalInSeconds: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.28),
  sfxVolume: z.number().min(0).max(1).default(0.22),
  segments: z.array(sponsorSegmentSchema),
});

export type SponsorsProps = z.infer<typeof sponsorsSchema>;
export type SponsorSegment = z.infer<typeof sponsorSegmentSchema>;
