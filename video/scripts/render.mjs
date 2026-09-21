#!/usr/bin/env node
/**
 * Batch renderer: turns every edit list in data/ into a file in out/.
 *
 *   node scripts/render.mjs                        # render every data/*.json
 *   node scripts/render.mjs data/montage.json      # render one
 *   node scripts/render.mjs data/montage.json --codec=prores
 *
 * Any flag not recognised here is forwarded to `remotion render`.
 *
 * A clip that omits `durationInSeconds` is measured here, before rendering,
 * so an edit list can be as short as:
 *   {"type": "clip", "src": "media/video/testimonial.mp4"}
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { getVideoMetadata } from "@remotion/renderer";

const root = resolve(import.meta.dirname, "..");
const dataDir = join(root, "data");
const publicDir = join(root, "public");
const outDir = join(root, "out");

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("-"));
const files = args.filter((a) => !a.startsWith("-"));

const editLists = files.length
  ? files.map((f) => resolve(f))
  : readdirSync(dataDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(dataDir, f));

if (editLists.length === 0) {
  console.error("No edit lists found in data/.");
  process.exit(1);
}

const isRemote = (src) => /^(https?:)?\/\//.test(src) || src.startsWith("data:");

/** Fills in the length of every clip that didn't declare one. */
const resolveDurations = async (props, file) => {
  const scenes = await Promise.all(
    (props.scenes ?? []).map(async (scene) => {
      if (scene.type !== "clip" || scene.durationInSeconds !== undefined) {
        return scene;
      }

      const startAt = scene.startAtSeconds ?? 0;

      if (isRemote(scene.src)) {
        console.warn(
          `  ! ${basename(file)}: cannot measure remote clip ${scene.src}. ` +
            `Set "durationInSeconds" explicitly.`,
        );
        return scene;
      }

      const path = join(publicDir, scene.src);
      if (!existsSync(path)) {
        throw new Error(
          `${basename(file)} refers to ${scene.src}, which does not exist in public/.`,
        );
      }

      const { durationInSeconds } = await getVideoMetadata(path);
      const remaining = Number((durationInSeconds - startAt).toFixed(3));

      if (remaining <= 0) {
        throw new Error(
          `${basename(file)}: startAtSeconds (${startAt}) is past the end of ${scene.src}.`,
        );
      }

      console.log(`  · ${scene.src} → ${remaining}s`);
      return { ...scene, durationInSeconds: remaining };
    }),
  );

  return { ...props, scenes };
};

/**
 * Remotion downloads its own Chrome Headless Shell on first render. Where
 * that download is blocked, point REMOTION_BROWSER_EXECUTABLE at an existing
 * Chrome/Chromium binary instead.
 */
const browser = process.env.REMOTION_BROWSER_EXECUTABLE;
const browserFlag = browser ? [`--browser-executable=${browser}`] : [];

mkdirSync(outDir, { recursive: true });
const scratch = mkdtempSync(join(tmpdir(), "remotion-props-"));

let failed = 0;

for (const editList of editLists) {
  const name = basename(editList, ".json");
  const output = join(outDir, `${name}.mp4`);

  if (!existsSync(editList)) {
    console.error(`✗ ${editList}: file not found.`);
    failed += 1;
    continue;
  }

  console.log(`\n▶ ${basename(editList)} → out/${name}.mp4`);

  let propsFile;
  try {
    const props = JSON.parse(readFileSync(editList, "utf8"));
    propsFile = join(scratch, `${name}.json`);
    writeFileSync(propsFile, JSON.stringify(await resolveDurations(props, editList)));
  } catch (err) {
    console.error(`✗ ${basename(editList)}: ${err.message}`);
    failed += 1;
    continue;
  }

  const result = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      "Montage",
      output,
      `--props=${propsFile}`,
      ...browserFlag,
      ...flags,
    ],
    { stdio: "inherit", cwd: root },
  );

  if (result.status !== 0) {
    failed += 1;
    console.error(`✗ ${basename(editList)} failed.`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} render(s) failed.`);
  process.exit(1);
}

console.log(`\n✓ Done. Files are in out/.`);
