import { BRAND } from '../../content.js';
import { font, rr, setLetterSpacing } from '../primitives.js';

// Small feature tag: pill + blue check.
function measureChip(ctx, text, size) {
  ctx.font = font(700, size);
  setLetterSpacing(ctx, 0);
  return ctx.measureText(text).width + size * 2.9;
}

function drawChip(ctx, text, x, y, size) {
  const w = measureChip(ctx, text, size);
  const h = size * 2.2;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, size * 0.06);
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();

  const cx = x + size * 1.05;
  const cy = y + h / 2;
  const r = size * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = BRAND.blue;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy + r * 0.02);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.36);
  ctx.lineTo(cx + r * 0.48, cy - r * 0.32);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = size * 0.14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.fillStyle = BRAND.white;
  ctx.font = font(700, size);
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + size * 1.9, cy + size * 0.04);
  return w;
}

function chipRows(ctx, texts, maxW, size, gap) {
  const rows = [[]];
  let rowW = 0;
  texts.forEach((t) => {
    const w = measureChip(ctx, t, size);
    if (rowW + w > maxW && rows[rows.length - 1].length) {
      rows.push([]);
      rowW = 0;
    }
    rows[rows.length - 1].push({ t, w });
    rowW += w + gap;
  });
  return rows;
}

export function drawChips(ctx, texts, { x, y, maxW, size, align = 'center', gap = size * 0.6 }) {
  const rows = chipRows(ctx, texts, maxW, size, gap);
  const h = size * 2.2;
  let rowY = y;
  rows.forEach((row) => {
    const total = row.reduce((a, c) => a + c.w, 0) + gap * (row.length - 1);
    let cursor = align === 'center' ? x - total / 2 : x;
    row.forEach((chip) => {
      drawChip(ctx, chip.t, cursor, rowY, size);
      cursor += chip.w + gap;
    });
    rowY += h + gap;
  });
  return rowY - gap;
}

export function chipsHeight(ctx, texts, maxW, size, gap = size * 0.6) {
  const rows = chipRows(ctx, texts, maxW, size, gap).length;
  return rows * size * 2.2 + (rows - 1) * gap;
}
