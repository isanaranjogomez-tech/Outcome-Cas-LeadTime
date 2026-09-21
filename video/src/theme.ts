/**
 * Design tokens, mirrored from ../css/tokens.css so that rendered video and
 * the website read as one piece of design.
 */

export const colors = {
  paper: "#f7f5f1",
  paperRaised: "#fcfbf9",
  paperWarm: "#f1eee8",
  navyDeep: "#0a1226",
  navyDeeper: "#070d1b",

  ink: "#0e1730",
  ink2: "#38425c",
  ink3: "#6b7386",
  inkOnDark: "#f4f2ee",
  inkOnDark2: "#b6bcca",
  inkOnDark3: "#7c8496",

  rule: "rgba(14, 23, 48, 0.14)",
  ruleDark: "rgba(244, 242, 238, 0.16)",

  accent: "#3e5f94",
  accentDeep: "#1e3355",
  gold: "#b79553",
} as const;

export const fonts = {
  display: '"Fraunces", Georgia, "Times New Roman", serif',
  sans: '"Inter", -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
} as const;

export type ThemeName = "light" | "dark";

export const themes = {
  light: {
    background: colors.paper,
    ink: colors.ink,
    inkSoft: colors.ink2,
    inkMuted: colors.ink3,
    rule: colors.rule,
  },
  dark: {
    background: colors.navyDeep,
    ink: colors.inkOnDark,
    inkSoft: colors.inkOnDark2,
    inkMuted: colors.inkOnDark3,
    rule: colors.ruleDark,
  },
} as const;

/** Matches --ease-out in tokens.css. */
export const easeOut = [0.16, 0.84, 0.28, 1] as const;
/** Matches --ease-soft in tokens.css. */
export const easeSoft = [0.32, 0.72, 0.24, 1] as const;
