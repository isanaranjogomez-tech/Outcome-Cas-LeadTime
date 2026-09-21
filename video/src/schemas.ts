import { z } from "zod";

export const themeSchema = z.enum(["light", "dark"]);

export const titleCardSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  footnote: z.string(),
  theme: themeSchema,
  durationInSeconds: z.number().min(0.5),
});
export type TitleCardProps = z.infer<typeof titleCardSchema>;

export const lowerThirdSchema = z.object({
  name: z.string(),
  role: z.string(),
  side: z.enum(["left", "right"]),
  theme: themeSchema,
  durationInSeconds: z.number().min(0.5),
});
export type LowerThirdProps = z.infer<typeof lowerThirdSchema>;

/** A full-frame typographic card inside a montage. */
const cardSceneSchema = z.object({
  type: z.literal("card"),
  eyebrow: z.string().default(""),
  title: z.string(),
  subtitle: z.string().default(""),
  durationInSeconds: z.number().min(0.5).default(3),
});

/**
 * A slice of a video file from public/. `durationInSeconds` is optional:
 * leave it out and the clip's own length is read from the file.
 */
const clipSceneSchema = z.object({
  type: z.literal("clip"),
  src: z.string(),
  startAtSeconds: z.number().min(0).default(0),
  durationInSeconds: z.number().min(0.1).optional(),
  caption: z.string().default(""),
  muted: z.boolean().default(false),
  volume: z.number().min(0).max(1).default(1),
});

export const sceneSchema = z.discriminatedUnion("type", [
  cardSceneSchema,
  clipSceneSchema,
]);
export type Scene = z.infer<typeof sceneSchema>;

export const montageSchema = z.object({
  theme: themeSchema,
  transition: z.enum(["fade", "slide", "none"]),
  transitionInSeconds: z.number().min(0).max(3),
  scenes: z.array(sceneSchema).min(1),
});
export type MontageProps = z.infer<typeof montageSchema>;
