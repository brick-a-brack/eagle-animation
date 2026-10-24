import { BRAND } from '../../content.js';
import { font, rgba, rr, setLetterSpacing } from '../primitives.js';

// Section tag: pill + red dot, echoing the app's frame-number tag.
export function drawTag(ctx, text, x, y, size, align = 'left') {
  ctx.font = font(800, size);
  setLetterSpacing(ctx, size * 0.16);
  const textW = ctx.measureText(text).width;
  const padX = size * 0.9;
  const dot = size * 0.5;
  const h = size * 2.1;
  const w = textW + padX * 2 + dot + size * 0.6;
  const x0 = align === 'center' ? x - w / 2 : x;

  rr(ctx, x0, y, w, h, h / 2);
  ctx.fillStyle = rgba(BRAND.blue, 0.16);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.strokeStyle = rgba(BRAND.blue, 0.55);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x0 + padX + dot / 2, y + h / 2, dot / 2, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.red;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x0 + padX + dot / 2, y + h / 2, dot * 0.95, 0, Math.PI * 2);
  ctx.fillStyle = rgba(BRAND.red, 0.22);
  ctx.fill();

  ctx.fillStyle = BRAND.blueLight;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x0 + padX + dot + size * 0.6, y + h / 2 + size * 0.05);
  setLetterSpacing(ctx, 0);
  return y + h;
}
