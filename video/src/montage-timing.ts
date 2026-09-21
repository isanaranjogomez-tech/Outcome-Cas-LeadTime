import { getVideoMetadata } from "@remotion/media-utils";
import { staticFile } from "remotion";
import type { MontageProps, Scene } from "./schemas";

/** Used when a clip's length can't be read from the file. */
export const DEFAULT_CLIP_SECONDS = 6;

/** Paths are relative to public/ unless they are already absolute URLs. */
export const resolveSrc = (src: string) =>
  /^(https?:)?\/\//.test(src) || src.startsWith("data:") ? src : staticFile(src);

export const sceneDurationInFrames = (scene: Scene, fps: number) =>
  Math.max(1, Math.round((scene.durationInSeconds ?? DEFAULT_CLIP_SECONDS) * fps));

/**
 * Fills in the length of every clip that didn't declare one, by reading the
 * file's own duration. This is what makes an edit list as short as
 * `{"type": "clip", "src": "media/video/testimonial.mp4"}` work.
 */
export const resolveScenes = async (
  scenes: Scene[],
  fps: number,
): Promise<Scene[]> =>
  Promise.all(
    scenes.map(async (scene) => {
      if (scene.type !== "clip" || scene.durationInSeconds !== undefined) {
        return scene;
      }

      try {
        const { durationInSeconds } = await getVideoMetadata(resolveSrc(scene.src));
        const remaining = durationInSeconds - scene.startAtSeconds;
        return {
          ...scene,
          durationInSeconds: Math.max(1 / fps, remaining),
        };
      } catch (err) {
        // A clip that can't be probed still gets a sane slot rather than
        // failing the whole render. `npm run render` measures clips in
        // Node before rendering, so this fallback mainly affects the Studio.
         
        console.warn(
          `Could not read the length of ${scene.src}, using ${DEFAULT_CLIP_SECONDS}s:`,
          err,
        );
        return { ...scene, durationInSeconds: DEFAULT_CLIP_SECONDS };
      }
    }),
  );

/**
 * Scenes overlap during a transition, so every transition after the first
 * scene shortens the timeline by its own length.
 */
export const totalDurationInFrames = (
  { scenes, transition, transitionInSeconds }: MontageProps,
  fps: number,
) => {
  const transitionFrames =
    transition === "none" ? 0 : Math.round(transitionInSeconds * fps);

  const sum = scenes.reduce(
    (acc, scene) => acc + sceneDurationInFrames(scene, fps),
    0,
  );

  return Math.max(1, sum - transitionFrames * Math.max(0, scenes.length - 1));
};
