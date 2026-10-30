import { BRAND } from '../content.js';
import { font, setLetterSpacing } from './primitives.js';

// Rich text markup: *word* highlights, \n forces a line break.
function tokenize(str) {
  const out = [];
  let highlighted = false;
  String(str)
    .replace(/\n/g, '\n')
    .split(/(\*)/)
    .forEach((part) => {
      if (part === '*') {
        highlighted = !highlighted;
        return;
      }
      part.split(/(\n| )/).forEach((t) => {
        if (t !== '') out.push({ t, hl: highlighted });
      });
    });
  return out;
}

function wrap(ctx, str, size, weight, maxW) {
  ctx.font = font(weight, size);
  setLetterSpacing(ctx, -size * 0.02);
  const lines = [[]];
  let lineW = 0;
  for (const token of tokenize(str)) {
    if (token.t === '\n') {
      lines.push([]);
      lineW = 0;
      continue;
    }
    const w = ctx.measureText(token.t).width;
    const line = lines[lines.length - 1];
    if (token.t === ' ') {
      if (line.length) {
        line.push({ ...token, w });
        lineW += w;
      }
      continue;
    }
    if (lineW + w > maxW && line.length) {
      while (line.length && line[line.length - 1].t === ' ') line.pop();
      lines.push([{ ...token, w }]);
      lineW = w;
    } else {
      line.push({ ...token, w });
      lineW += w;
    }
  }
  return lines.map((line) => {
    while (line.length && line[line.length - 1].t === ' ') line.pop();
    return { segs: line, w: line.reduce((a, s) => a + s.w, 0) };
  });
}

// Shrinks the type until the text fits maxLines, so a long translation never overflows.
export function fitText(ctx, str, { size, min, weight, maxW, maxLines }) {
  let current = size;
  let lines;
  for (;;) {
    lines = wrap(ctx, str, current, weight, maxW);
    const widest = Math.max(...lines.map((l) => l.w));
    if ((lines.length <= maxLines && widest <= maxW) || current <= min) break;
    current = Math.max(min, current * 0.95);
  }
  return { lines, size: current };
}

export const textHeight = (fit, lineHeight) => fit.lines.length * fit.size * lineHeight - fit.size * (lineHeight - 1);

export function drawText(ctx, fit, { x, y, align = 'left', weight, lh = 1.1, color, hlColor, underline = true }) {
  const { lines, size } = fit;
  ctx.font = font(weight, size);
  setLetterSpacing(ctx, -size * 0.02);
  ctx.textBaseline = 'alphabetic';
  let baseline = y + size * 0.92;
  for (const line of lines) {
    let cursor = align === 'center' ? x - line.w / 2 : x;
    if (underline) drawSwooshes(ctx, line, cursor, baseline, size);
    for (const seg of line.segs) {
      ctx.fillStyle = seg.hl ? hlColor : color;
      ctx.fillText(seg.t, cursor, baseline);
      cursor += seg.w;
    }
    baseline += size * lh;
  }
  return y + lines.length * size * lh - size * (lh - 1);
}

// Hand-drawn underline under each run of highlighted words.
function drawSwooshes(ctx, line, startX, baseline, size) {
  let runStart = null;
  let runEnd = 0;
  let x = startX;
  const flush = () => {
    if (runStart === null) return;
    ctx.save();
    ctx.strokeStyle = BRAND.blue;
    ctx.lineWidth = size * 0.075;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const y = baseline + size * 0.16;
    ctx.moveTo(runStart + size * 0.04, y + size * 0.01);
    ctx.quadraticCurveTo((runStart + runEnd) / 2, y - size * 0.05, runEnd - size * 0.04, y);
    ctx.stroke();
    ctx.restore();
    runStart = null;
  };
  for (const seg of line.segs) {
    if (seg.hl && seg.t !== ' ') {
      if (runStart === null) runStart = x;
      runEnd = x + seg.w;
    } else if (!seg.hl) flush();
    x += seg.w;
  }
  flush();
}
