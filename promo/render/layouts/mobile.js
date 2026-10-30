import { BRAND } from '../../content.js';
import { drawAppIcon } from '../components/app-icon.js';
import { drawBackground } from '../components/background.js';
import { chipsHeight, drawChips } from '../components/chips.js';
import { deviceGeometry, drawDevice } from '../components/device.js';
import { drawFan } from '../components/fan.js';
import { drawTag } from '../components/tag.js';
import { font, setLetterSpacing } from '../primitives.js';
import { drawText, fitText, textHeight } from '../text.js';

const LAYOUT = 'mobile';

export function slide(ctx, { W, H, index, t, chips, slide: s, image, aspect }) {
  const pad = 78;
  const tagY = 140;
  const tagSize = 30;
  const title = fitText(ctx, t(`${s.id}_title`), { size: 112, min: 70, weight: 800, maxW: W - pad * 2, maxLines: 3 });
  const sub = fitText(ctx, t(`${s.id}_sub`), { size: 44, min: 32, weight: 400, maxW: W - pad * 2 - 20, maxLines: 3 });
  const textBottom = tagY + tagSize * 2.1 + 40 + textHeight(title, 1.06) + 34 + textHeight(sub, 1.35);
  const chipsTop = H - 110 - chipsHeight(ctx, chips, W - 120, 30);

  // Device centered in whatever space is left between the texts and the chips.
  const top = textBottom + 70;
  const bottom = chipsTop - 70;
  const box = { cx: W / 2, cy: (top + bottom) / 2, w: W - 40, h: bottom - top };
  const geo = deviceGeometry('phone', aspect, box);

  drawBackground(ctx, LAYOUT, W, H, index, { x: W / 2, y: box.cy, r: 760 });
  let y = drawTag(ctx, t(`${s.id}_tag`), pad, tagY, tagSize);
  y = drawText(ctx, title, { x: pad, y: y + 40, weight: 800, lh: 1.06, color: BRAND.white, hlColor: BRAND.blueLight });
  drawText(ctx, sub, {
    x: pad,
    y: y + 34,
    weight: 400,
    lh: 1.35,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawDevice(ctx, geo, image, s.tilt);
  drawChips(ctx, chips, { x: W / 2, y: chipsTop, maxW: W - 120, size: 30 });
}

export function final(ctx, { W, H, index, t, chips, fanImages }) {
  drawBackground(ctx, LAYOUT, W, H, index, { x: W / 2, y: 1500, r: 800 });
  drawAppIcon(ctx, W / 2 - 120, 190, 240);

  ctx.font = font(800, 44);
  setLetterSpacing(ctx, -0.5);
  ctx.fillStyle = BRAND.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t('appName'), W / 2, 520);
  ctx.textAlign = 'left';

  let y = drawTag(ctx, t('final_tag'), W / 2, 580, 28, 'center');
  const title = fitText(ctx, t('final_title'), { size: 104, min: 66, weight: 800, maxW: W - 150, maxLines: 3 });
  y = drawText(ctx, title, {
    x: W / 2,
    y: y + 36,
    align: 'center',
    weight: 800,
    lh: 1.06,
    color: BRAND.white,
    hlColor: BRAND.blueLight,
  });
  const sub = fitText(ctx, t('final_sub'), { size: 40, min: 30, weight: 400, maxW: W - 180, maxLines: 3 });
  y = drawText(ctx, sub, {
    x: W / 2,
    y: y + 30,
    align: 'center',
    weight: 400,
    lh: 1.35,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawChips(ctx, chips, { x: W / 2, y: y + 50, maxW: W - 140, size: 30 });
  drawFan(ctx, W / 2, 1560, 560, fanImages);
}
