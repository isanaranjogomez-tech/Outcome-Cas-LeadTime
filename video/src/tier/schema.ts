import { z } from "zod";

export const tierSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  music: z.string(),
  introFrames: z.number(),
  segments: z.array(z.object({ srcIn: z.number(), frames: z.number(), from: z.number() })),
  tiers: z.array(z.string()),
  items: z.array(z.object({
    label: z.string(), tier: z.string(), showAt: z.number(), placeAt: z.number(),
  })),
  captions: z.array(z.object({ text: z.string(), from: z.number(), to: z.number() })),
  zooms: z.array(z.object({ from: z.number(), to: z.number() })),
  bodyFrames: z.number(),
  finalCardFrames: z.number(),
  closingFrames: z.number(),
  totalFrames: z.number(),
  musicVolume: z.number().min(0).max(1).default(0.12),
  sfxVolume: z.number().min(0).max(1).default(0.5),
});

export type TierProps = z.infer<typeof tierSchema>;
export type TierItem = TierProps["items"][number];
