import { continueRender, delayRender, staticFile } from "remotion";

/**
 * Self-hosted type: Fraunces and Inter (the same files the website uses) plus
 * Noto Color Emoji, so emoji look the same on every machine that renders this
 * project rather than picking up whatever the OS ships. Nothing is fetched
 * from a third party at render time.
 */
const faces = [
  { family: "Fraunces", file: "fonts/fraunces-latin.woff2" },
  { family: "Fraunces", file: "fonts/fraunces-latin-ext.woff2" },
  { family: "Inter", file: "fonts/inter-latin.woff2" },
  { family: "Inter", file: "fonts/inter-latin-ext.woff2" },
  { family: "Noto Color Emoji", file: "fonts/NotoColorEmoji.ttf" },
];

const handle = delayRender("Loading fonts");

Promise.all(
  faces.map(({ family, file }) => {
    const face = new FontFace(family, `url(${staticFile(file)})`, {
      weight: "100 900",
      display: "block",
    });
    return face.load().then((loaded) => {
      document.fonts.add(loaded);
    });
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    // A missing font should never fail a render outright.
     
    console.warn("Font loading failed, falling back to system fonts:", err);
    continueRender(handle);
  });
