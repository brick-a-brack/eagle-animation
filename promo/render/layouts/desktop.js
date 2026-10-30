import { BRAND } from '../../content.js';
import { drawAppIcon } from '../components/app-icon.js';
import { drawBackground } from '../components/background.js';
import { drawChecklist } from '../components/checklist.js';
import { drawChips } from '../components/chips.js';
import { deviceGeometry, drawDevice } from '../components/device.js';
import { drawFan } from '../components/fan.js';
import { drawTag } from '../components/tag.js';
import { font, setLetterSpacing } from '../primitives.js';
import { drawText, fitText, textHeight } from '../text.js';

const LAYOUT = 'desktop';

export function slide(ctx, { W, H, index, t, chips, slide: s, image, aspect }) {
  const box = { cx: 1335, cy: 540, w: 1070, h: 860 };
  const geo = deviceGeometry('laptop', aspect, box);
  drawBackground(ctx, LAYOUT, W, H, index, { x: box.cx, y: box.cy, r: 700 });

  const x = 110;
  const maxW = 640;
  const title = fitText(ctx, t(`${s.id}_title`), { size: 90, min: 58, weight: 800, maxW, maxLines: 3 });
  const sub = fitText(ctx, t(`${s.id}_sub`), { size: 32, min: 24, weight: 400, maxW: maxW - 20, maxLines: 3 });
  const listGap = 24;
  const listSize = 30;
  const blockH = 42 + 34 + textHeight(title, 1.06) + 28 + textHeight(sub, 1.4) + 52 + chips.length * (listSize + listGap) - listGap;

  let y = (H - blockH) / 2;
  y = drawTag(ctx, t(`${s.id}_tag`), x, y, 20);
  y = drawText(ctx, title, { x, y: y + 34, weight: 800, lh: 1.06, color: BRAND.white, hlColor: BRAND.blueLight });
  y = drawText(ctx, sub, {
    x,
    y: y + 28,
    weight: 400,
    lh: 1.4,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawChecklist(ctx, chips, x, y + 52, listSize, listGap);
  drawDevice(ctx, geo, image, s.tilt);
}

export function final(ctx, { W, H, index, t, chips, fanImages }) {
  drawBackground(ctx, LAYOUT, W, H, index, { x: 1360, y: 560, r: 700 });
  const x = 120;
  drawAppIcon(ctx, x, 170, 150);

  ctx.font = font(800, 40);
  setLetterSpacing(ctx, -0.5);
  ctx.fillStyle = BRAND.white;
  ctx.textBaseline = 'middle';
  ctx.fillText(t('appName'), x + 186, 245);

  let y = drawTag(ctx, t('final_tag'), x, 380, 20);
  const title = fitText(ctx, t('final_title'), { size: 88, min: 56, weight: 800, maxW: 640, maxLines: 3 });
  y = drawText(ctx, title, { x, y: y + 30, weight: 800, lh: 1.06, color: BRAND.white, hlColor: BRAND.blueLight });
  const sub = fitText(ctx, t('final_sub'), { size: 30, min: 24, weight: 400, maxW: 640, maxLines: 2 });
  y = drawText(ctx, sub, {
    x,
    y: y + 24,
    weight: 400,
    lh: 1.4,
    color: BRAND.muted,
    hlColor: BRAND.blueLight,
    underline: false,
  });
  drawChips(ctx, chips, { x, y: y + 44, maxW: 720, size: 22, align: 'left' });
  drawFan(ctx, 1440, 560, 480, fanImages);
}
