import { BRAND } from '../../content.js';
import { EAGLE_BOX, eaglePath } from '../logo.js';
import { rgba, rr } from '../primitives.js';

// Film strip position per layout — alternating per slide so the strip appears
// to continue from one screenshot to the next in the store carousel.
const STRIP = {
  mobile: { a: 820, b: 1300, thickness: 250 },
  tablet: { a: 520, b: 780, thickness: 190 },
  desktop: { a: 300, b: 820, thickness: 210 },
};

const eagle = eaglePath();

// The dark base every asset sits on: vertical gradient, eagle watermark, film strip.
export function drawBackground(ctx, layout, W, H, index, glow) {
  drawGradient(ctx, W, H);
  const size = Math.max(W, H) * 0.55;
  drawEagle(ctx, { x: W - size * 0.62, y: -size * (EAGLE_BOX.h / EAGLE_BOX.w) * 0.2, size, alpha: 0.07 });
  drawFilmStrip(ctx, STRIP[layout], W, index);
  if (glow) drawGlow(ctx, W, H, glow);
}

// The card is small and printed: no film strip, and the eagle sits whole on the
// right instead of bleeding off a corner.
export function drawCardBackground(ctx, W, H, { mark, glow }) {
  drawGradient(ctx, W, H);
  drawGlow(ctx, W, H, glow);
  drawEagle(ctx, mark);
}

function drawGradient(ctx, W, H) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#14233f');
  gradient.addColorStop(0.55, BRAND.navy);
  gradient.addColorStop(1, '#080e19');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

function drawGlow(ctx, W, H, glow) {
  const radial = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.r);
  radial.addColorStop(0, rgba(BRAND.blue, glow.alpha ?? 0.42));
  radial.addColorStop(1, rgba(BRAND.blue, 0));
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, W, H);
}

// The icon artwork keeps its own coordinates, so `x`/`y` place its bounding box.
function drawEagle(ctx, { x, y, size, alpha }) {
  ctx.save();
  const scale = size / EAGLE_BOX.w;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(-EAGLE_BOX.x, -EAGLE_BOX.y);
  ctx.fillStyle = rgba(BRAND.blue, alpha);
  ctx.fill(eagle);
  ctx.restore();
}

function drawFilmStrip(ctx, strip, W, index) {
  const left = index % 2 ? strip.b : strip.a;
  const right = index % 2 ? strip.a : strip.b;
  const angle = Math.atan2(right - left, W);
  const len = Math.hypot(W, right - left) + 400;
  const t = strip.thickness;

  ctx.save();
  ctx.translate(W / 2, (left + right) / 2);
  ctx.rotate(angle);
  ctx.fillStyle = 'rgba(6,10,18,0.75)';
  ctx.fillRect(-len / 2, -t / 2, len, t);

  const holeH = t * 0.09;
  const holeW = t * 0.13;
  const step = t * 0.24;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  for (let x = -len / 2; x < len / 2; x += step) {
    rr(ctx, x, -t / 2 + holeH * 0.6, holeW, holeH, holeH * 0.3);
    ctx.fill();
    rr(ctx, x, t / 2 - holeH * 1.6, holeW, holeH, holeH * 0.3);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  for (let x = -len / 2; x < len / 2; x += t * 1.6) {
    ctx.beginPath();
    ctx.moveTo(x, -t / 2 + holeH * 2.4);
    ctx.lineTo(x, t / 2 - holeH * 2.4);
    ctx.stroke();
  }
  ctx.restore();
}
