import { BRAND } from '../../content.js';
import { EAGLE_BOX, eaglePath } from '../logo.js';
import { rgba, rr } from '../primitives.js';

const eagle = eaglePath();

// Play Store style app icon: rounded square + the eagle.
export function drawAppIcon(ctx, x, y, size) {
  ctx.save();
  ctx.shadowColor = rgba(BRAND.blue, 0.6);
  ctx.shadowBlur = size * 0.35;
  ctx.shadowOffsetY = size * 0.08;
  rr(ctx, x, y, size, size, size * 0.23);
  const gradient = ctx.createLinearGradient(x, y, x, y + size);
  gradient.addColorStop(0, '#5b80f0');
  gradient.addColorStop(1, '#3d5fd2');
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  rr(ctx, x, y, size, size, size * 0.23);
  ctx.lineWidth = size * 0.012;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();

  const scale = (size * 0.74) / EAGLE_BOX.w;
  ctx.save();
  ctx.translate(x + size / 2 - (EAGLE_BOX.w * scale) / 2 + size * 0.02, y + size / 2 - (EAGLE_BOX.h * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-EAGLE_BOX.x, -EAGLE_BOX.y);
  const wing = ctx.createLinearGradient(0, EAGLE_BOX.y, 0, EAGLE_BOX.y + EAGLE_BOX.h);
  wing.addColorStop(0, '#ffffff');
  wing.addColorStop(1, '#b4c3f4');
  ctx.fillStyle = wing;
  ctx.fill(eagle);
  ctx.restore();
}
