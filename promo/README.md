# Eagle Animation — promo assets

Generates the Google Play screenshots and the event business card for Eagle Animation. Everything is drawn on a canvas, so texts, colors and screenshots are data — not a Photoshop file.

Everything runs from the repo root; there is nothing to install beyond the root `package.json`.

The build drives a headless Chromium through `playwright-core`. It uses, in order: the browser installed by `npx playwright install chromium`, then Microsoft Edge, then Chrome. Any one of them is
enough.

## Commands

| Command                    | What it does                                             |
| -------------------------- | -------------------------------------------------------- |
| `npm run promo:assets`     | Renders every asset to `out/promo/<lang>/<format>/*.png` |
| `npm run promo:assets:zip` | Same, plus one upload-ready `.zip` per language          |

### Build options

```bash
npm run promo:assets                                  # everything: all languages, all formats
npm run promo:assets -- --lang fr                     # one language
npm run promo:assets -- --format mobile,tablet        # selected formats
npm run promo:assets -- --format card                 # just the business card
npm run promo:assets -- --zip                         # one .zip per language, ready to upload
npm run promo:assets -- --out release/store-assets    # somewhere else (relative to the repo root)
```

A full run takes a few seconds, so rendering a single format is the quickest way to check a change.

## What to edit

| I want to change…     | File                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| A text                | `i18n/<lang>.json`                                                    |
| Add a language        | Copy `i18n/en.json` to `i18n/de.json` — it is picked up automatically |
| Slides, sizes, colors | `content.js`                                                          |
| A screenshot          | `../docs/screenshots/<format>_<n>.png`                                |
| The logo              | `../logo/icon.svg`                                                    |
| Where a piece sits    | `render/layouts/<format>.js`                                          |
| How a piece is drawn  | `render/components/<name>.js`                                         |

### Texts

Each language is one flat JSON file keyed by `<slideId>_tag`, `<slideId>_title`, `<slideId>_sub`, plus the `chip*` labels. Two bits of markup:

- `*word*` — highlights the word in brand blue with a hand-drawn underline.
- `\n` — forces a line break.

Titles shrink automatically when a translation is longer than the English one, so a long sentence never overflows. Missing keys fall back to English.

### Logo

The eagle is read from the repo's own `logo/icon.svg` — path data for the canvas, so the app icon and the background watermark follow the real icon with no copy to keep in sync.

### Screenshots

The app captures come from the repo's own `docs/screenshots/`, so the store and the documentation always show the same app. Files are named `<format>_<n>.png`: the same number is the same scene,
captured once per format (`mobile_2.png`, `tablet_2.png`, `desktop_2.png`). `content.js` gives those numbers a name in `SCENE`, and each slide picks one — so replacing a capture is just dropping a new
file in `docs/screenshots/`.

## The business card

`--format card` renders the two faces of the card handed out at events, so a visitor can collect the film they shot on the booth.

|         | What is on it                                                         |
| ------- | --------------------------------------------------------------------- |
| `front` | Where to go, and the blank white field the code is written in by hand |
| `back`  | The thank-you, then Eagle Animation and `eagle-animation.com`         |

Both faces are text on the Eagle Animation background — the eagle is already in the background, so nothing is drawn on top of it.

It is a 85 × 55 mm card with 1.5 mm of bleed on every side, rendered at 900 dpi — 3118 × 2055 px, the size a printer expects. One `ref` unit is exactly 0.1 mm, so every number in
`render/layouts/card.js` is a real print size: `115` is 11.5 mm. `PRINT` in `content.js` holds the bleed and the safe margin; nothing but the background is ever drawn outside the safe box, because a
press drifts by a millimeter.

The card carries no crop marks: the bleed is already in the file, which is what online printers ask for.

## How it is wired

```
promo/
├── content.js    brand colors · output sizes · print geometry · assets → the data
├── i18n/         <lang>.json                               → the texts
└── render/       the canvas renderer
    ├── index.js      renderSlideToCanvas(format, index, lang)
    ├── layouts/      where each piece goes, one module per format
    ├── components/   how each piece is drawn
    │   ├── background.js gradient, eagle watermark, film strip
    │   ├── device.js     phone / tablet / laptop mockups
    │   ├── tag.js        section pill with the red dot
    │   ├── chips.js      small feature tags
    │   ├── checklist.js  vertical feature list (desktop)
    │   ├── app-icon.js   the rounded app icon
    │   └── fan.js        the three fanned screenshots
    ├── text.js       rich text: wrapping, auto-shrink, highlights
    ├── primitives.js rounded rects, fonts, colors
    ├── logo.js       the eagle, read from logo/icon.svg
    ├── screenshots.js
    └── fonts.js      Open Sans, the same faces the app loads

../logo/icon.svg                      the eagle, for the icon and the watermark
../docs/screenshots/<format>_<n>.png   the app captures drawn on the devices
../scripts/build-promo-assets.mjs      Vite dev server + headless Chromium → PNG files
```

`scripts/build-promo-assets.mjs`, in the repo's own `scripts/` folder, serves the repo with Vite — `promo/` for the renderer, `docs/screenshots/` and `logo/` for the artwork — and opens a page it
generates itself: no UI, just the renderer on `window`. It then saves what the canvas produces. So this folder holds no HTML and needs no build step of its own.

Open Sans is self-hosted through `@fontsource/open-sans`, the same package the app loads in `src/renderer/styles/global.css`, so a build is reproducible offline and in CI.
