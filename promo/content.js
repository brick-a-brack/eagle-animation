// Everything you will want to change lives here, except the texts (i18n/<lang>.json)
// and the images (../docs/screenshots/, ../logo/).

// Brand colors, from eagle-animation.com and the app's own CSS.
export const BRAND = {
  blue: '#486ee5', // primary, the theme color of the site and the app
  blueLight: '#8aa3f5', // highlighted words on dark backgrounds
  navy: '#0b1321', // app background
  navy2: '#162742', // app panels
  red: '#e24949', // frame-number tag in the timeline
  white: '#ffffff',
  muted: '#aeb8d3',
  font: "'Open Sans', system-ui, sans-serif",
};

// Output sizes. Slides are laid out in `ref` units then scaled to `w`/`h`, so
// changing a size never shifts a layout. `set` picks which faces are drawn.
//
// The card is a 85x55 mm business card with 1.5 mm bleed on every side, at
// 900 dpi: one `ref` unit is exactly 0.1 mm, so every size below is in tenths
// of a millimeter.
export const FORMATS = {
  mobile: { label: 'Phone · 9:16', w: 1080, h: 1920, ref: { w: 1080, h: 1920 }, layout: 'mobile', set: 'store' },
  tablet: { label: 'Tablet · 1:1', w: 2048, h: 2048, ref: { w: 1080, h: 1080 }, layout: 'tablet', set: 'store' },
  desktop: { label: 'Desktop · 16:9', w: 1920, h: 1080, ref: { w: 1920, h: 1080 }, layout: 'desktop', set: 'store' },
  card: { label: 'Business card · 88×58 mm', w: 3118, h: 2055, ref: { w: 880, h: 580 }, layout: 'card', set: 'card' },
};

// Print geometry of the card, in `ref` units (0.1 mm). Trim is the cut line,
// safe is where nothing must ever cross — a press drifts by a millimeter.
export const PRINT = { bleed: 15, safe: 45 };

// App captures, shared with the repo's own docs: docs/screenshots/<format>_<scene>.png.
// The same number is the same scene, captured once per format.
const SCENE = { pig: 1, sofa: 2, space: 3, music: 4, guitar: 5 };

// One entry per drawn asset, in output order.
//   id      prefix of the <id>_tag / <id>_title / <id>_sub keys in i18n/
//   face    which function of the layout draws it (default: `slide`)
//   screen  which capture goes on the device
//   tilt    rotation of the device in degrees, looks more dynamic on the hero
//   chips   keys in i18n/ used as small feature tags
export const SETS = {
  // Order = order in the Play Store carousel.
  store: [
    { id: 'hero', screen: SCENE.sofa, tilt: -4, chips: ['chipFree', 'chipOpen', 'chipNoAds'] },
    { id: 'tools', screen: SCENE.guitar, chips: ['chipOnion', 'chipGrid', 'chipDiff'] },
    { id: 'timeline', screen: SCENE.pig, chips: ['chipPreview', 'chipDuplicate', 'chipReorder'] },
    { id: 'camera', screen: SCENE.space, chips: ['chipFocus', 'chipBrightness', 'chipQuality'] },
    { id: 'quality', screen: SCENE.music, chips: ['chipAveraging', 'chipMasking', 'chipFullRes'] },
    { id: 'export', screen: SCENE.guitar, chips: ['chipVideo', 'chipFrames', 'chipEditors'] },
    { id: 'final', face: 'final', screens: [SCENE.music, SCENE.sofa, SCENE.pig], chips: ['chipFree', 'chipOpen', 'chipNoAds', 'chipLangs'] },
  ],
  // The card handed out at events, so visitors can collect the film they shot.
  card: [
    { id: 'front', face: 'front' },
    { id: 'back', face: 'back' },
  ],
};

export const slidesOf = (format) => SETS[FORMATS[format].set];

// Every i18n/<code>.json becomes a language, no registration needed.
const modules = import.meta.glob('./i18n/*.json', { eager: true });
const strings = Object.fromEntries(Object.entries(modules).map(([path, mod]) => [path.match(/([^/]+)\.json$/)[1], mod.default]));

export const FORMAT_KEYS = Object.keys(FORMATS);
export const LANGUAGES = Object.keys(strings).sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));

// Falls back to English so a half-translated language still renders.
export const translator = (lang) => (key) => strings[lang]?.[key] ?? strings.en?.[key] ?? '';
