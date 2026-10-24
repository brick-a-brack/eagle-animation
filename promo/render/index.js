import { FORMATS, SLIDES, translator } from '../content.js';
import * as desktop from './layouts/desktop.js';
import * as mobile from './layouts/mobile.js';
import * as tablet from './layouts/tablet.js';
import { screenFor } from './screenshots.js';

const LAYOUTS = { mobile, tablet, desktop };

export const slideFileName = (format, index, lang) => `eagle-${format}-${lang}-${String(index + 1).padStart(2, '0')}-${SLIDES[index].id}.png`;

// Draws one slide at full output size. Everything is laid out in the format's
// reference space, then scaled up — so tweaking an output size changes nothing else.
export function renderSlideToCanvas(format, index, lang) {
  const spec = FORMATS[format];
  const slide = SLIDES[index];
  const layout = LAYOUTS[spec.layout];

  const canvas = document.createElement('canvas');
  canvas.width = spec.w;
  canvas.height = spec.h;
  const ctx = canvas.getContext('2d');
  const scale = spec.w / spec.ref.w;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const image = screenFor(format, slide.screen);
  const t = translator(lang);

  const context = {
    W: spec.ref.w,
    H: spec.ref.h,
    index,
    t,
    slide,
    image,
    aspect: image ? image.width / image.height : 16 / 9,
    chips: (slide.chips || []).map(t),
    fanImages: (slide.screens || []).map((scene) => screenFor(format, scene)),
  };

  if (slide.final) layout.final(ctx, context);
  else layout.slide(ctx, context);

  return canvas;
}
