# video/ — Remotion

Videos for the project, written as React and rendered from the command line.
Same typefaces and colour tokens as the website, so the two read as one piece
of design.

## Requirements

- **Node.js 18 or newer** (this project was set up on Node 22) — <https://nodejs.org>
- Nothing else. Remotion brings its own ffmpeg, and downloads its own
  Chrome Headless Shell the first time you render.

## Setup

```bash
cd video
npm install
```

## The Studio — editing with a preview

```bash
npm run dev
```

Opens <http://localhost:3000>: a timeline, a live preview, and a props editor
on the right. Every field of the props editor is typed, so changing a title or
a clip length there is the fastest way to work. Edits to the code hot-reload.

## Rendering

```bash
npm run render                      # every edit list in data/ → out/
npm run render data/montage.json    # just one
npm run render -- --codec=prores    # flags are passed on to Remotion
npm run render:title                # the standalone title card
npm run render:still                # a PNG of the title card, for slides/posters
```

Output lands in `out/`, which is not committed — re-render instead.

Any composition can also be rendered directly:

```bash
npx remotion render Montage out/my-video.mp4 --props=data/montage.json
npx remotion render LowerThird out/isabella.mov --codec=prores --prores-profile=4444
```

(`--codec=prores` with a `.mov` extension keeps the transparent background of
`LowerThird`, so it can be laid over footage in any other editor.)

## Automating an edit: `data/*.json`

A video is described by a JSON file. Adding a new video means adding a new
file to `data/` — no code change, and `npm run render` picks it up.

```json
{
  "theme": "dark",
  "transition": "fade",
  "transitionInSeconds": 0.5,
  "scenes": [
    { "type": "card", "eyebrow": "Part V", "title": "A heading", "durationInSeconds": 4 },
    { "type": "clip", "src": "media/video/testimonial.mp4", "caption": "Testimonial" }
  ]
}
```

| Field | Notes |
|---|---|
| `theme` | `"light"` or `"dark"` — the paper and navy from `css/tokens.css` |
| `transition` | `"fade"`, `"slide"` or `"none"` |
| `transitionInSeconds` | overlap between scenes; must be shorter than the scenes it joins |
| `scenes[].type` | `"card"` (typographic) or `"clip"` (a video file) |

**Card scenes:** `eyebrow`, `title`, `subtitle`, `durationInSeconds`.

**Clip scenes:** `src`, and optionally `startAtSeconds`, `durationInSeconds`,
`caption`, `muted`, `volume`. Leave `durationInSeconds` out and the clip's own
length is measured before rendering — the whole clip is used.

`src` is relative to `public/`. `public/media` is a symlink to the repository's
`assets/`, so every photograph and video on the website is already addressable:
`media/video/testimonial.mp4`, `media/school/…`, `media/team/…`.

## Compositions

| id | What it is |
|---|---|
| `Montage` | the edit itself — scenes joined by transitions, driven by `data/*.json` |
| `TitleCard` | a standalone opening card |
| `LowerThird` | name-and-role strap on a transparent background |

Registered in `src/Root.tsx`. Add a `<Composition>` there to add another.

## Layout

```
data/           edit lists — one JSON file per video
public/fonts/   Fraunces + Inter, the same woff2 files the site uses
public/media    → symlink to ../../assets
scripts/render.mjs  batch renderer used by `npm run render`
src/Root.tsx    every composition, and how its duration is calculated
src/schemas.ts  the shape of an edit list (zod — this is what types the Studio's props editor)
src/theme.ts    colours and fonts, mirrored from css/tokens.css
src/compositions/   Montage, TitleCard, LowerThird
src/components/     Eyebrow, Rule, Reveal — the site's reveal animation
out/            rendered files (git-ignored)
```

## Notes

- **Windows:** `public/media` is a symlink. If Git checks it out as a text
  file, either enable symlinks (`git config --global core.symlinks true` and
  re-clone, in a terminal with Developer Mode on) or replace it with a copy of
  `assets/`.
- **If the Chrome download is blocked** on your network, point Remotion at a
  Chrome you already have:
  `REMOTION_BROWSER_EXECUTABLE=/path/to/chrome npm run render`.
- `npm run lint` reports three warnings from Remotion's `non-pure-animation`
  rule, on the `transition` fields of the edit-list schema. They are false
  positives — the rule looks for CSS transitions; these are prop names.
- Remotion is free for individuals and teams of up to three people; a company
  licence is needed above that. See <https://remotion.pro/license>.
