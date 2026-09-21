import { continueRender, delayRender, staticFile } from "remotion";

/**
 * The same two self-hosted typefaces the website uses. Loading them from
 * public/fonts keeps renders byte-identical offline — nothing is fetched
 * from a third party at render time.
 */
const faces = [
  { family: "Fraunces", file: "fonts/fraunces-latin.woff2" },
  { family: "Fraunces", file: "fonts/fraunces-latin-ext.woff2" },
  { family: "Inter", file: "fonts/inter-latin.woff2" },
  { family: "Inter", file: "fonts/inter-latin-ext.woff2" },
];

const handle = delayRender("Loading Fraunces and Inter");

Promise.all(
  faces.map(({ family, file }) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
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
