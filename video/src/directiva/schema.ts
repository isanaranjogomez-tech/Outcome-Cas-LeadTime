import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  roleLine1: z.string(),
  roleLine2: z.string(),
  names: z.array(z.string()),
  side: z.enum(["left", "right"]),
  textX: z.number().default(0),
  textY: z.number().default(246),
  from: z.number(),
  moveFrames: z.number(),
  holdFrames: z.number(),
  video: z.string(),
  plate: z.string(),
  cutout: z.string(),
});

export const directivaSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  bar: z.number(),
  introFrames: z.number(),
  outroFrames: z.number(),
  members: z.array(memberSchema),
  music: z.string(),
  musicVolume: z.number().min(0).max(2).default(0.82),
  sfxVolume: z.number().min(0).max(2).default(0.55),
  totalFrames: z.number(),
});

export type DirectivaProps = z.infer<typeof directivaSchema>;
export type Member = z.infer<typeof memberSchema>;
