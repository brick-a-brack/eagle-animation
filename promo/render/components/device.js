import { BRAND } from '../../content.js';
import { rr } from '../primitives.js';

// Fits a phone / tablet / laptop mockup inside box {cx,cy,w,h}; the screen keeps
// the screenshot's own aspect ratio so nothing is ever stretched.
export function deviceGeometry(type, aspect, box) {
  const landscape = aspect >= 1;
  const screenW = landscape ? 1 : aspect;
  const screenH = landscape ? 1 / aspect : 1;
  const S = Math.min(screenW, screenH);

  let bl, br, bt, bb;
  let extraW = 0;
  let baseH = 0;
  if (type === 'phone') {
    const long = 0.075 * S;
    const short = 0.05 * S;
    [bl, br, bt, bb] = landscape ? [long, long, short, short] : [short, short, long, long];
  } else if (type === 'tablet') {
    bl = br = bt = bb = 0.06 * S;
  } else {
    bl = br = 0.03 * S;
    bt = 0.045 * S;
    bb = 0.035 * S;
    baseH = 0.055 * S;
    extraW = 0.12;
  }

  const outerW = screenW + bl + br;
  const outerH = screenH + bt + bb;
  const k = Math.min(box.w / (outerW * (1 + extraW)), box.h / (outerH + baseH));
  const w = outerW * k;
  const h = outerH * k;
  const x = box.cx - w / 2;
  const y = box.cy - ((outerH + baseH) * k) / 2;

  return {
    type,
    x,
    y,
    w,
    h,
    k,
    baseH: baseH * k,
    screen: { x: x + bl * k, y: y + bt * k, w: screenW * k, h: screenH * k },
    S: S * k,
  };
}

export function drawDevice(ctx, geo, img, tilt = 0) {
  if (tilt) {
    ctx.save();
    const cx = geo.x + geo.w / 2;
    const cy = geo.y + geo.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((tilt * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    paintDevice(ctx, geo, img);
    ctx.restore();
    return;
  }
  paintDevice(ctx, geo, img);
}

function paintDevice(ctx, geo, img) {
  const { x, y, w, h, screen, type, S } = geo;
  const radius = type === 'phone' ? S * 0.16 : type === 'tablet' ? S * 0.08 : S * 0.04;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = S * 0.18;
  ctx.shadowOffsetY = S * 0.08;
  rr(ctx, x, y, w, h, radius);
  ctx.fillStyle = '#0a0f1a';
  ctx.fill();
  ctx.restore();

  const body = ctx.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#2a3550');
  body.addColorStop(1, '#0c1220');
  rr(ctx, x, y, w, h, radius);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.lineWidth = Math.max(2, S * 0.006);
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.stroke();
  rr(ctx, x + S * 0.012, y + S * 0.012, w - S * 0.024, h - S * 0.024, radius - S * 0.012);
  ctx.fillStyle = '#03060c';
  ctx.fill();

  drawScreen(ctx, screen, img, type === 'laptop' ? S * 0.008 : radius * 0.55);
  drawCamera(ctx, geo, S);
  if (type === 'laptop') drawLaptopBase(ctx, geo);
}

function drawScreen(ctx, screen, img, radius) {
  ctx.save();
  rr(ctx, screen.x, screen.y, screen.w, screen.h, radius);
  ctx.clip();
  if (img) {
    // Cover crop, centered.
    const imgAspect = img.width / img.height;
    const screenAspect = screen.w / screen.h;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;
    if (imgAspect > screenAspect) {
      sw = img.height * screenAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / screenAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, screen.x, screen.y, screen.w, screen.h);
  } else {
    ctx.fillStyle = BRAND.navy2;
    ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
  }
  const glass = ctx.createLinearGradient(screen.x, screen.y, screen.x + screen.w * 0.6, screen.y + screen.h);
  glass.addColorStop(0, 'rgba(255,255,255,0.10)');
  glass.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = glass;
  ctx.fillRect(screen.x, screen.y, screen.w, screen.h);
  ctx.restore();
}

function drawCamera(ctx, { x, y, w, h, screen, type }, S) {
  const r = S * 0.012;
  ctx.beginPath();
  if (type === 'phone' && w > h) ctx.arc(x + (screen.x - x) / 2, y + h / 2, r, 0, Math.PI * 2);
  else if (type === 'phone') ctx.arc(x + w / 2, y + (screen.y - y) / 2, r, 0, Math.PI * 2);
  else ctx.arc(x + w / 2, y + (screen.y - y) / 2, r * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = '#1d2740';
  ctx.fill();
}

function drawLaptopBase(ctx, { x, y, w, h, baseH }) {
  const bw = w * 1.12;
  const bx = x + w / 2 - bw / 2;
  const by = y + h;
  const gradient = ctx.createLinearGradient(0, by, 0, by + baseH);
  gradient.addColorStop(0, '#3a4766');
  gradient.addColorStop(1, '#151d30');
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.015, by);
  ctx.lineTo(bx + bw * 0.985, by);
  ctx.quadraticCurveTo(bx + bw, by + baseH * 0.6, bx + bw * 0.97, by + baseH);
  ctx.lineTo(bx + bw * 0.03, by + baseH);
  ctx.quadraticCurveTo(bx, by + baseH * 0.6, bx + bw * 0.015, by);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  rr(ctx, x + w / 2 - w * 0.08, by, w * 0.16, baseH * 0.28, baseH * 0.14);
  ctx.fillStyle = '#0d1424';
  ctx.fill();
}
