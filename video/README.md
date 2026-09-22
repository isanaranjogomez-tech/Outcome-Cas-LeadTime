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

## The MUNCAS reel

`Muncas` is a second, self-contained piece: the vertical "Describe tu comité
en 3 emojis" edit for TikTok/Reels. 1080×1920, 30 fps, 42.9 s.

```bash
npm run build:sfx        # synthesise the sound effects and the music bed
npm run build:muncas     # re-derive the edit list from the source clip
npm run render:muncas    # render, then master the audio to -14 LUFS / -1 dBTP
```

`npm run dev` opens it in the Studio like any other composition.

### How the cut is derived

`scripts/build-muncas.py` measures the source clip and writes
`data/muncas-emojis.json`. Nothing about the timing is eyeballed:

| What | How |
|---|---|
| shot boundaries | ffmpeg scene detection |
| speech vs. pause | ffmpeg `silencedetect` at −38 dB / 0.14 s |
| the transcript | Whisper (medium), corrected by hand — the one part a human should re-read |
| word timings | each burst's words are spread across it in proportion to the audio energy underneath, so a word after a breath lands late |
| emoji timing | each emoji is pinned to the word that names it |
| colour | mean RGB per shot, matched part-way to the median shot |

Every shot is trimmed to `first word − 0.22 s … last word + 0.30 s`, so the
answers run straight into each other with no dead air.

### Editing it

`data/muncas-emojis.json` is the edit. The useful knobs:

- `musicVolume` (0.15) — the bed sits about 18 dB under the voices. `0` mutes it.
- `sfxVolume` (0.34) — master level for the effects.
- `segments[].captions[].accent` — `white`, `red` or `blue` per word.
- `segments[].emojis[].at` — nudge an emoji a few hundredths if it feels early.
- `segments[].freezeInSeconds` — the held still before each hard cut.

Changing the transcript or the emoji plan means editing the tables at the top
of `scripts/build-muncas.py` and re-running `npm run build:muncas`; the JSON is
generated, so hand-edits to it are lost on the next build.

### Audio

Every sound is synthesised in `scripts/build-sfx.py` — pop, click, whoosh,
impact, cash, glitch, siren, clap, shine, splash, thump — so the project
carries no licensed audio. The music bed is generated too, and is the weakest
part of the piece by design: drop a real track at `public/sfx/music-bed.ogg`
(Ogg/Opus — Chrome Headless Shell, which Remotion renders with, ships no
proprietary codecs and will refuse an `.m4a`) and re-render.

## Compositions

| id | What it is |
|---|---|
| `Montage` | the edit itself — scenes joined by transitions, driven by `data/*.json` |
| `TitleCard` | a standalone opening card |
| `LowerThird` | name-and-role strap on a transparent background |
| `Muncas` | the vertical MUNCAS reel — see above |

Registered in `src/Root.tsx`. Add a `<Composition>` there to add another.

## Layout

```
data/           edit lists — one JSON file per video
public/fonts/   Fraunces + Inter (as on the site) + Noto Color Emoji
public/source/  the MUNCAS source clip
public/sfx/     generated sound effects and music bed
public/freeze/  the held stills used for the freeze frames
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
