/** MUNCAS XX, on a 1920×1080 canvas. */
export const pal = {
  navy: "#0B1528",
  navyDeep: "#060D1A",
  red: "#A92141",
  redBright: "#C42B51",
  blue: "#72C5E5",
  white: "#FAFCFF",
} as const;

export const font =
  '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

/** Room to breathe on a 16:9 frame — nothing important outside this. */
export const SAFE = { x: 96, y: 72 } as const;
