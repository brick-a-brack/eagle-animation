import { BRAND } from '../../content.js';
import { font, rgba, setLetterSpacing } from '../primitives.js';

// Vertical checklist, used instead of chips on the wide desktop layout.
export function drawChecklist(ctx, texts, x, y, size, gap) {
  texts.forEach((text, i) => {
    const cy = y + i * (size + gap) + size / 2;
    const r = size * 0.62;
    ctx.beginPath();
    ctx.arc(x + r, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(BRAND.blue, 0.22);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = BRAND.blue;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + r - r * 0.42, cy + r * 0.02);
    ctx.lineTo(x + r - r * 0.08, cy + r * 0.34);
    ctx.lineTo(x + r + r * 0.45, cy - r * 0.3);
    ctx.strokeStyle = BRAND.blueLight;
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.fillStyle = BRAND.white;
    ctx.font = font(600, size);
    setLetterSpacing(ctx, 0);
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + r * 2 + size * 0.6, cy + size * 0.04);
  });
  return y + texts.length * (size + gap) - gap;
}
