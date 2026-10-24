import { BRAND } from '../content.js';

// Rounded rect as a path — every panel, chip and device body uses it.
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export const font = (weight, size) => `${weight} ${size}px ${BRAND.font}`;

// Not every engine supports letterSpacing; ignoring it only loses a little polish.
export function setLetterSpacing(ctx, value) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${value}px`;
}

export function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
