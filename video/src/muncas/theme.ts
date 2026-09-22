/**
 * MUNCAS identity for the vertical edit.
 *
 * Navy carries the piece, red is the accent, light blue is secondary and
 * white is the high-contrast text colour. If MUNCAS has an exact brand red,
 * change it here and nothing else.
 */
export const muncas = {
  navy: "#0B1B3C",
  navyDeep: "#061229",
  navySoft: "#16305F",
  red: "#E1261C",
  redDeep: "#A8130C",
  blue: "#4FA8E8",
  blueDeep: "#1E6FB8",
  white: "#FFFFFF",
} as const;

/** Inter, already self-hosted in public/fonts, at caption weights. */
export const captionFont =
  '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Noto Color Emoji is bundled so emoji render identically on any machine. */
export const emojiFont =
  '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';

export const layout = {
  /** Emoji band — below the faces, above the captions. */
  emojiTop: 0.545,
  /** Caption band. */
  captionTop: 0.775,
  /** Committee chip. */
  chipTop: 0.115,
  safeX: 64,
} as const;
