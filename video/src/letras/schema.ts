import { z } from "zod";
import { captionSchema } from "../muncas/schema";

const pointSchema = z.object({
  side: z.enum(["left", "right"]),
  /** Seconds into the segment when the point lands. */
  at: z.number(),
});

const bannerSchema = z.object({ text: z.string(), at: z.number() });

export const letrasSegmentSchema = z.object({
  id: z.string(),
  srcIn: z.number(),
  srcOut: z.number(),
  durationInSeconds: z.number(),
  timelineStart: z.number(),
  /** How the camera behaves: a slow push, a creeping zoom, or a punch-in. */
  kind: z.enum(["hold", "push", "creep", "punch"]),
  /** Score at the start of this segment. */
  score: z.tuple([z.number(), z.number()]),
  captions: z.array(captionSchema),
  letter: z.string().optional(),
  letterAt: z.number().optional(),
  point: pointSchema.optional(),
  banner: bannerSchema.optional(),
  tension: z.boolean().optional(),
  winner: z.boolean().optional(),
  /** Reserved for the few beats that earn a whoosh. */
  whoosh: z.boolean().optional(),
  /** A held still instead of the video — used for the closing frame. */
  still: z.string().optional(),
  /** Suppresses the ticking, where the room tone is doing the work. */
  quiet: z.boolean().optional(),
  /** Seconds of audio fade at the head, to hide a join mid-sentence. */
  audioFadeIn: z.number().optional(),
});

export const letrasSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  title: z.object({ line1: z.string(), line2: z.string(), kicker: z.string() }),
  players: z.object({ left: z.string(), right: z.string() }),
  totalInSeconds: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.15),
  sfxVolume: z.number().min(0).max(1).default(0.34),
  segments: z.array(letrasSegmentSchema),
});

export type LetrasProps = z.infer<typeof letrasSchema>;
export type LetrasSegment = z.infer<typeof letrasSegmentSchema>;
