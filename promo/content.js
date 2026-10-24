// Everything you will want to change lives here, except the texts (src/i18n/<lang>.json)
// and the images (src/assets/).

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

// Output sizes (Google Play accepts 320–3840 px per side). Slides are laid out in
// `ref` units then scaled to `w`/`h`, so changing a size never shifts a layout.
export const FORMATS = {
  mobile: { label: 'Phone · 9:16', w: 1080, h: 1920, ref: { w: 1080, h: 1920 }, layout: 'mobile' },
  tablet: { label: 'Tablet · 1:1', w: 2048, h: 2048, ref: { w: 1080, h: 1080 }, layout: 'tablet' },
  desktop: { label: 'Desktop · 16:9', w: 1920, h: 1080, ref: { w: 1920, h: 1080 }, layout: 'desktop' },
};

// App captures, shared with the repo's own docs: docs/screenshots/<format>_<scene>.png.
// The same number is the same scene, captured once per format.
const SCENE = { pig: 1, sofa: 2, space: 3, music: 4, guitar: 5 };

// Order = order in the Play Store carousel.
//   id      prefix of the <id>_tag / <id>_title / <id>_sub keys in src/i18n/
//   screen  which capture goes on the device
//   tilt    rotation of the device in degrees, looks more dynamic on the hero
//   chips   keys in src/i18n/ used as small feature tags
//   final   closing slide: app icon, fanned `screens`, no device
export const SLIDES = [
  { id: 'hero', screen: SCENE.sofa, tilt: -4, chips: ['chipFree', 'chipOpen', 'chipNoAds'] },
  { id: 'tools', screen: SCENE.guitar, chips: ['chipOnion', 'chipGrid', 'chipDiff'] },
  { id: 'timeline', screen: SCENE.pig, chips: ['chipPreview', 'chipDuplicate', 'chipReorder'] },
  { id: 'camera', screen: SCENE.space, chips: ['chipFocus', 'chipBrightness', 'chipQuality'] },
  { id: 'quality', screen: SCENE.music, chips: ['chipAveraging', 'chipMasking', 'chipFullRes'] },
  { id: 'export', screen: SCENE.guitar, chips: ['chipVideo', 'chipFrames', 'chipEditors'] },
  { id: 'final', final: true, screens: [SCENE.music, SCENE.sofa, SCENE.pig], chips: ['chipFree', 'chipOpen', 'chipNoAds', 'chipLangs'] },
];

// Every src/i18n/<code>.json becomes a language, no registration needed.
const modules = import.meta.glob('./i18n/*.json', { eager: true });
const strings = Object.fromEntries(Object.entries(modules).map(([path, mod]) => [path.match(/([^/]+)\.json$/)[1], mod.default]));

export const FORMAT_KEYS = Object.keys(FORMATS);
export const LANGUAGES = Object.keys(strings).sort((a, b) => (a === 'en' ? -1 : b === 'en' ? 1 : a.localeCompare(b)));

// Falls back to English so a half-translated language still renders.
export const translator = (lang) => (key) => strings[lang]?.[key] ?? strings.en?.[key] ?? '';
