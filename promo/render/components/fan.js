import { BRAND } from '../../content.js';
import { rr } from '../primitives.js';

// Three screenshots fanned out, closing slide only.
export function drawFan(ctx, cx, cy, cardW, images) {
  const angles = [-10, 0, 10];
  const offsets = [-0.62, 0, 0.62];
  // Center card last so it sits on top.
  [0, 2, 1].forEach((i) => {
    const img = images[i];
    if (!img) return;
    const w = cardW;
    const h = (w * img.height) / img.width;
    ctx.save();
    ctx.translate(cx + offsets[i] * w, cy + (i === 1 ? -h * 0.08 : h * 0.06));
    ctx.rotate((angles[i] * Math.PI) / 180);
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 24;
    rr(ctx, -w / 2, -h / 2, w, h, w * 0.03);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save();
    rr(ctx, -w / 2, -h / 2, w, h, w * 0.03);
    ctx.clip();
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    rr(ctx, -w / 2, -h / 2, w, h, w * 0.03);
    ctx.lineWidth = w * 0.006;
    ctx.strokeStyle = i === 1 ? BRAND.blue : 'rgba(255,255,255,0.25)';
    ctx.stroke();
    ctx.restore();
  });
}
