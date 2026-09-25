import { z } from "zod";

export const reelSchema = z.object({
  fps: z.number(), width: z.number(), height: z.number(),
  source: z.string(), music: z.string(),
  titleTop: z.string(), titleBottom: z.string(), titleTag: z.string().default(""),
  introAt: z.number().default(0),
  introFrames: z.number(),
  captionsFrom: z.number().default(0),
  segments: z.array(z.object({ srcIn: z.number(), frames: z.number(), from: z.number() })),
  captions: z.array(z.object({ text: z.string(), from: z.number(), to: z.number() })),
  /** Numbered chapter cards: "01 / 10" plus a short line. */
  chapters: z.array(z.object({ index: z.number(), total: z.number(), text: z.string(), at: z.number(), frames: z.number() })).default([]),
  /** A name plate that shows once, early. */
  lowerThird: z.object({ name: z.string(), role: z.string(), at: z.number(), frames: z.number() }).nullable().default(null),
  tags: z.array(z.object({ text: z.string(), at: z.number(), frames: z.number() })).default([]),
  zooms: z.array(z.object({ from: z.number(), to: z.number() })).default([]),
  beats: z.array(z.number()).default([]),
  bodyFrames: z.number(), closingFrames: z.number(), totalFrames: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.12),
  sfxVolume: z.number().min(0).max(1).default(0.5),
});
export type ReelProps = z.infer<typeof reelSchema>;
