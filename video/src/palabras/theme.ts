/**
 * "7 PALABRAS, 20 INTENTOS" — the palette and the safe box, exactly as the
 * brief specifies them. Nothing else in the piece hard-codes a colour.
 */
export const pal = {
  navy: "#0B1528",
  red: "#A92141",
  blue: "#72C5E5",
  white: "#FAFCFF",
} as const;

/** TikTok's chrome, as pixels to stay clear of. */
export const SAFE = { top: 200, right: 250, bottom: 400, left: 100 } as const;

/** Inter, already self-hosted in public/fonts. */
export const font =
  '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
