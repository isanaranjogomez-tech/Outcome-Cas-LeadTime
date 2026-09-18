# Academic performance regarding mental health in 9th grade

The digital outcome for a **Cambridge IGCSE Global Perspectives Component 3 Team Project**.

- **Global topic:** Health and Wellbeing
- **Specific issue:** mental health, academic pressure and stress in adolescents
- **Local context:** Grade 9, Colegio Colombo Americano
- **Digital outcome built by the team:** [LeadTime AI](https://cas-leadtime-xkw5.onrender.com/dashboard)

**Team** — Jerónimo López (Group Leader) · Isabella Naranjo (LeadTime AI Web Developer) ·
Sophia Leguizamo (Project Communicator) · Santiago Lugo (Printing Collaborator) ·
Santiago Cortés (Poster Designer)

---

## Opening the site

It is a static site with no build step and no dependencies.

- **Quickest:** double-click `index.html`.
- **Recommended** (so the video streams properly and paths behave exactly as they will
  online), from this folder:
  ```
  python3 -m http.server 8000
  ```
  then open <http://localhost:8000>.
- **Publishing:** upload the whole folder as-is. On GitHub Pages, set the source to the
  branch root — `index.html` is at the top level, so nothing needs configuring.

Everything is bundled, including the two typefaces, so the site renders identically
offline and makes no third-party requests.

## Structure

```
index.html              the whole narrative, in order, as semantic HTML
css/fonts.css           self-hosted Fraunces + Inter @font-face rules
css/tokens.css          design tokens: colour, type scale, spacing, motion
css/base.css            reset, typography, shared primitives, site chrome
css/sections.css        the sections themselves
js/main.js              scroll narrative, reveals, charts, lightbox, player
fonts/                  woff2 files (SIL Open Font License 1.1)
assets/school/          4 photographs — opening sequence
assets/survey/          3 Microsoft Forms result screenshots
assets/platform/        6 LeadTime AI interface screenshots
assets/action/          2 Course of Action photographs
assets/team/            5 team portraits
assets/video/           the student perspective clip + the testimonial recording
ASSET-MANIFEST.md       what every asset is and where it is used
```

## The narrative

| Part | Section | Assessment evidence |
|---|---|---|
| I | Topic and local issue | Global topic, local issue, local context; WHO and UNICEF Colombia |
| II | The team | Team collaboration — pinned scroll sequence |
| III | What we observed | How the issue was identified |
| IV | Survey results | Initial survey, 50 Grade 9 students |
| V | Connection to the course of action | Perspectives, student perspective recording, the decision |
| VI | Evidence of the action | LeadTime AI, course of action photographs, student response |
| VII | Evaluation of the action | Post-action survey, 50 responses |
| VIII | Reflection | Personal learning |
| — | Evidence register | Sources |

The **Index** button in the top bar opens a direct route to any of these, each tagged
with the assessment element it answers.

## Academic integrity rules the page keeps

Nothing on the page is invented. Every figure comes from the team's own survey of
50 Grade 9 students, and each is shown with its raw count alongside its percentage.
Open responses are reproduced exactly as written, spelling included, and labelled as
illustrative extracts rather than a full analysis. The platform is described only in
terms of what the screenshots show, and is never presented as treating or curing any
mental health condition.

Where something has not been measured yet, the page says so. Three areas are
deliberately left as labelled placeholders rather than filled with estimates:

1. **The post-action survey screenshot** is not yet in the repository. Drop the
   original Microsoft Forms screenshot at `assets/survey/04-post-action-survey.png`
   and add a fourth figure to the screenshot row in the evidence register, copying
   the markup of the three already there. An HTML comment marks the spot. Deliberately
   no external link for this survey — the screenshot is the source evidence.
2. **The testimonial recording** (Part VI) carries no quotation, because no transcript
   of it has been verified. The *student perspective* clip in Part V is different: its
   statement is shown on screen, lightly edited for grammatical clarity.

## Before submitting — worth reviewing

- **Reflection (Act XII)** is written in the team's collective voice and should be read
  through and personalised so it sounds like you. Everything in it is grounded in what
  actually happened, but it is your reflection to own.
- **The exterior school photograph** is the lowest-resolution asset (516 × 387). It is
  used full-bleed behind a heavy scrim and film grain, which carries it, but a
  higher-resolution version would sharpen the opening. Replace
  `assets/school/01-exterior-cas.jpg` and nothing else needs changing.
- **Replace Sophia Leguizamo's portrait if you can.** Her source is 120 x 120 and is
  shown at 300px wide in Act VII, which is a 2.5x enlargement and visibly the softest
  image on the page. Drop a larger original in at `assets/team/sophia-leguizamo.jpg`
  and nothing else needs changing. (The other four are 428px wide or more and are
  never enlarged.)
- **Fill the placeholders above** as the data arrives.

## The two videos behave differently, on purpose

The **student perspective** clip (end of Act V) starts by itself when its section is
meaningfully on screen — one play, start to finish. Scroll decides only *when* it
starts; it never drives the timeline, and the section is never pinned. It starts muted
if the browser requires that, and a discreet "Sound on" control appears when it does;
a "Replay" control appears once it ends. If playback is refused, the file cannot load,
or the browser cannot decode it, the section un-arms itself: the transcribed statement
stays visible and normal controls return, so a viewer never faces a blank frame.

The **testimonial** recording (Act X) is unchanged — nothing preloaded, nothing
autoplayed, played only when the viewer asks for it.

Under `prefers-reduced-motion: reduce`, neither video autoplays.

## Accessibility and motion

Semantic headings throughout; a skip link; alt text on every image; keyboard-operable
index, lightbox and player; visible focus styles. Every chart carries its exact counts
in a visible key and again in a `<details>` data table, so no value depends on colour
or on animation.

`prefers-reduced-motion: reduce` is fully supported: the cinematic opening becomes a
static photo essay with all four captions visible, counters show their final values,
and every reveal is rendered immediately. The page is complete and readable with
JavaScript disabled.

## Charts

All five findings use a single validated blue ordinal ramp — magnitude is carried by
length, order by lightness — rather than a categorical palette. The ramp was checked
for monotone lightness, adequate step separation and contrast against the chart
surface. Zero-value responses ("Never", "It doesn't affect me", "Teachers") are shown
explicitly as empty states rather than omitted, because in this survey the zeros are
the point.
