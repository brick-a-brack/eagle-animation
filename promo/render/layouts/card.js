import { BRAND, PRINT } from '../../content.js';
import { drawCardBackground } from '../components/background.js';
import { EAGLE_BOX } from '../logo.js';
import { font, rr, setLetterSpacing } from '../primitives.js';

// One `ref` unit is 0.1 mm (see FORMATS.card), so every number here is a real
// print size: 115 is 11.5 mm. Nothing is drawn outside the safe box but the background.
const safe = (W, H) => ({ x: PRINT.safe, y: PRINT.safe, w: W - PRINT.safe * 2, h: H - PRINT.safe * 2 });

// The same eagle on both faces: full card height, same place, same opacity.
// drawCardBackground sizes it by its width, so ask for the width that makes it
// exactly as tall as the card.
const eagle = (W, H) => ({ x: W * 0.52, y: 0, size: (H * EAGLE_BOX.w) / EAGLE_BOX.h, alpha: 0.11 });

// Centered line of text, returns the baseline it used.
function line(ctx, text, cx, y, size, weight, color) {
  ctx.font = font(weight, size);
  setLetterSpacing(ctx, -size * 0.02);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, cx, y + size * 0.82);
  ctx.textAlign = 'left';
  setLetterSpacing(ctx, 0);
  return y + size;
}

// Front: where to go, and a blank white field for the code.
export function front(ctx, { W, H, t }) {
  // Same eagle as the back, just read a little stronger: the text sits left of it.
  drawCardBackground(ctx, W, H, {
    mark: eagle(W, H),
    glow: { x: W * 0.62, y: H * 0.36, r: H * 0.9, alpha: 0.28 },
  });

  // Type sizes, spacing and field taken from the card this replaces.
  const box = safe(W, H);
  const cx = W * 0.31;
  const fieldH = 60;
  const fieldW = 430;
  const blockH = 32 + 8 + 39 + 44 + 18 + 12 + fieldH;
  let y = box.y + (box.h - blockH) / 2;

  y = line(ctx, t('front_intro'), cx, y, 32, 400, BRAND.white) + 8;
  y = line(ctx, t('front_url'), cx, y, 39, 800, BRAND.white) + 44;
  y = line(ctx, t('front_hint'), cx, y, 18, 600, BRAND.white) + 12;

  rr(ctx, cx - fieldW / 2, y, fieldW, fieldH, fieldH / 2);
  ctx.fillStyle = BRAND.white;
  ctx.fill();
}

// Back: the thank-you, and Eagle Animation rather than only Brickfilms.com.
export function back(ctx, { W, H, t }) {
  drawCardBackground(ctx, W, H, {
    mark: eagle(W, H),
    glow: { x: W / 2, y: H * 0.36, r: H * 0.9, alpha: 0.3 },
  });

  const box = safe(W, H);
  // One sentence across two lines, so they stay tight; the address steps away.
  const blockH = 38 + 10 + 57 + 46 + 26;
  let y = box.y + (box.h - blockH) / 2;

  y = line(ctx, t('back_thanks'), W / 2, y, 38, 400, BRAND.white) + 10;
  y = line(ctx, t('appName'), W / 2, y, 57, 800, BRAND.white) + 46;
  line(ctx, t('back_site'), W / 2, y, 26, 700, BRAND.blueLight);
}
