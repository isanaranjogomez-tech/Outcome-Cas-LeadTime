import { z } from "zod";

/** A line of speech we can actually hear in the source, typed by its role. */
export const palabraCaptionSchema = z.object({
  text: z.string(),
  /** hint = the clue given, guess = a word proposed, verdict = the reply. */
  role: z.enum(["hint", "guess", "ok", "no"]),
  /** Seconds from the start of the segment. */
  start: z.number(),
  end: z.number(),
});

export const palabraSegmentSchema = z.object({
  id: z.string(),
  kind: z.enum(["video", "list", "recap", "closing"]),
  /** Source in/out, in seconds. Null on the graphic cards. */
  srcIn: z.number().nullable(),
  durationInSeconds: z.number(),
  timelineStart: z.number(),
  /** Slow push across the segment. */
  zoomFrom: z.number(),
  zoomTo: z.number(),
  originX: z.number(),
  originY: z.number(),
  captions: z.array(palabraCaptionSchema),
});

/** One proposed answer, heard in the recording. Nothing else moves the counter. */
export const attemptSchema = z.object({
  at: z.number(),
  word: z.string(),
  correct: z.boolean(),
});

/** The moment a word is solved — where the checkmark lands. */
export const solvedSchema = z.object({
  at: z.number(),
  word: z.string(),
});

export const palabrasSchema = z.object({
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  source: z.string(),
  words: z.array(z.string()),
  /** Institutional identification held through the game. */
  lowerThird: z.string().default(""),
  lowerThirdAccent: z.string().default(""),
  attemptLimit: z.number().default(20),
  segments: z.array(palabraSegmentSchema),
  attempts: z.array(attemptSchema),
  solved: z.array(solvedSchema),
  /** Soft clock ticks under the long thinking beats. */
  ticks: z.array(z.number()).default([]),
  sfxVolume: z.number().min(0).max(1).default(0.5),
  /** 0 keeps the piece on voices and effects only. */
  musicVolume: z.number().min(0).max(1).default(0),
  totalInSeconds: z.number(),
});

export type PalabrasProps = z.infer<typeof palabrasSchema>;
export type PalabraSegment = z.infer<typeof palabraSegmentSchema>;
export type PalabraCaption = z.infer<typeof palabraCaptionSchema>;
