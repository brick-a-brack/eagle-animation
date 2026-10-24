import { BRAND } from '../../content.js';
import { drawAppIcon } from '../components/app-icon.js';
import { drawBackground } from '../components/background.js';
import { drawChips } from '../components/chips.js';
import { deviceGeometry, drawDevice } from '../components/device.js';
import { drawFan } from '../components/fan.js';
import { drawTag } from '../components/tag.js';
import { drawText, fitText, textHeight } from '../text.js';

const LAYOUT = 'tablet';

export function slide(ctx, { W, H, index, t, chips, slide: s, image, aspect }) {
  const tagY = 60;
  const tagSize = 18;
  const title = fitText(ctx, t(`${s.id}_title`), { size: 66, min: 44, weight: 800, maxW: 900, maxLines: 2 });
  const sub = fitText(ctx, t(`${s.id}_sub`), { size: 26, min: 20, weight: 400, maxW: 820, maxLines: 2 });
  const textBottom = tagY + tagSize * 2.1 + 24 + textHeight(title, 1.08) + 18 + textHeight(sub, 1.35);
  const chipsTop = H - 66 - 18 * 2.2;

  const top = textBottom + 50;
  const bottom = chipsTop - 50;
  const box = { cx: W / 2, cy: (top + bottom) / 2, w: W - 120, h: bottom - top };
  const geo = deviceGeometry('tablet', aspect, box);

  drawBackground(ctx, LAYOUT, W, H, index, { x: box.cx, y: box.cy, r: 560 });
  let y = drawTag(ctx, t(`${s.id}_tag`), W / 2, tagY, tagSize, 'center');
  y = drawText(ctx, title, {
    x: W / 2,
    y: y + 24,
    align: 'center',
    weight: 800,
    lh: 1.08,
    color: BRAND.white,
    hlColor: BRAND.blueLight,
  });
  drawText(ctx, sub, {
    x: W / 2,
    y: y + 18,
    align: 'center',
    weight: 400,
    lh: 1.35,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawDevice(ctx, geo, image, s.tilt);
  drawChips(ctx, chips, { x: W / 2, y: chipsTop, maxW: W - 80, size: 18 });
}

export function final(ctx, { W, H, index, t, chips, fanImages }) {
  drawBackground(ctx, LAYOUT, W, H, index, { x: W / 2, y: 820, r: 560 });
  drawAppIcon(ctx, W / 2 - 70, 64, 140);

  let y = drawTag(ctx, t('final_tag'), W / 2, 236, 18, 'center');
  const title = fitText(ctx, t('final_title'), { size: 70, min: 46, weight: 800, maxW: 920, maxLines: 2 });
  y = drawText(ctx, title, {
    x: W / 2,
    y: y + 22,
    align: 'center',
    weight: 800,
    lh: 1.06,
    color: BRAND.white,
    hlColor: BRAND.blueLight,
  });
  const sub = fitText(ctx, t('final_sub'), { size: 26, min: 20, weight: 400, maxW: 820, maxLines: 2 });
  y = drawText(ctx, sub, {
    x: W / 2,
    y: y + 16,
    align: 'center',
    weight: 400,
    lh: 1.35,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawChips(ctx, chips, { x: W / 2, y: y + 30, maxW: W - 100, size: 19 });
  drawFan(ctx, W / 2, 850, 400, fanImages);
}
