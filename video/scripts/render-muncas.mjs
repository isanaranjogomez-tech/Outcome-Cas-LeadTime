#!/usr/bin/env node
/**
 * Renders the MUNCAS reel and masters its audio for social.
 *
 *   node scripts/render-muncas.mjs
 *   node scripts/render-muncas.mjs --quality        # bigger file, crf 16
 *
 * Remotion mixes the voices, the effects and the bed, but it does not
 * normalise. TikTok and Instagram play back around -14 LUFS, so the render is
 * passed through a two-pass loudnorm with a -1 dBTP ceiling — the same level
 * the platforms would otherwise force on it, done once, properly.
 *
 * ffmpeg comes from Remotion, so nothing needs to be installed.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "out");
const raw = join(outDir, "MUNCAS_EMOJIS_FINAL_CORREGIDO.raw.mp4");
const final = join(outDir, "MUNCAS_EMOJIS_FINAL_CORREGIDO.mp4");

const TARGET_LUFS = -14;
const TARGET_TRUE_PEAK = -1;
const TARGET_LRA = 9;

const args = process.argv.slice(2);
// crf 22 keeps the whole reel inside a single encode at a shareable size.
const crf = args.includes("--quality") ? "16" : "22";

const run = (cmd, argv, opts = {}) =>
  spawnSync(cmd, argv, { cwd: root, encoding: "utf8", ...opts });

// `-vn` matters on the measuring pass: the ffmpeg Remotion ships has no
// encoder for the null muxer's video stream, so it must see audio only.
const ffmpeg = (argv, capture = false) =>
  run("npx", ["remotion", "ffmpeg", ...argv], capture ? {} : { stdio: "inherit" });

mkdirSync(outDir, { recursive: true });

// --- 1. render ------------------------------------------------------------
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
const render = run(
  "npx",
  [
    "remotion", "render", "Muncas", raw,
    `--crf=${crf}`,
    ...(browser ? [`--browser-executable=${browser}`] : []),
  ],
  { stdio: "inherit" },
);

if (render.status !== 0) {
  console.error("Render failed.");
  process.exit(1);
}

// --- 2. measure -----------------------------------------------------------
console.log("\n▶ Measuring loudness…");
const measure = ffmpeg(
  ["-hide_banner", "-nostats", "-i", raw, "-vn",
   "-af", `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=${TARGET_LRA}:print_format=json`,
   "-f", "null", "-"],
  true,
);

const json = (measure.stderr ?? "").match(/\{[\s\S]*\}/);
if (!json) {
  console.warn("Could not measure loudness; keeping the unnormalised render.");
  renameSync(raw, final);
  process.exit(0);
}

const m = JSON.parse(json[0]);
console.log(`  measured ${m.input_i} LUFS, true peak ${m.input_tp} dBFS`);

// --- 3. normalise ---------------------------------------------------------
console.log(`▶ Normalising to ${TARGET_LUFS} LUFS / ${TARGET_TRUE_PEAK} dBTP…`);
const norm = ffmpeg([
  "-hide_banner", "-loglevel", "error", "-y", "-i", raw,
  "-af",
  `loudnorm=I=${TARGET_LUFS}:TP=${TARGET_TRUE_PEAK}:LRA=${TARGET_LRA}` +
    `:measured_I=${m.input_i}:measured_TP=${m.input_tp}` +
    `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}` +
    `:offset=${m.target_offset}:linear=true`,
  "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart",
  final,
]);

if (norm.status !== 0 || !existsSync(final)) {
  console.warn("Normalisation failed; keeping the unnormalised render.");
  renameSync(raw, final);
  process.exit(0);
}

unlinkSync(raw);
console.log(`\n✓ out/${final.split("/").pop()}`);
