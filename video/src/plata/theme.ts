/**
 * "Adivina la plata" — MUNCAS XX palette, plus the one accent the brief
 * allows for money and nothing else.
 */
export const pal = {
  navy: "#0B1528",
  red: "#A92141",
  blue: "#72C5E5",
  white: "#FAFCFF",
  /** Only for amounts. Never a dominant colour. */
  money: "#F5C542",
} as const;

/** TikTok's chrome, as pixels to stay clear of. */
export const SAFE = { top: 200, right: 250, bottom: 400, left: 100 } as const;

export const font =
  '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
