import iconSvg from '../../logo/icon.svg?raw';

// The app's own icon, straight from logo/icon.svg. Its path keeps the absolute
// coordinates of the source artwork and is placed by a translate, so fold that
// translate back into the box the canvas positions the drawing with.
const [vx, vy, w, h] = /viewBox="([^"]+)"/
  .exec(iconSvg)[1]
  .trim()
  .split(/[\s,]+/)
  .map(Number);
const [tx = 0, ty = 0] = (/transform="translate\(([^)]+)\)"/.exec(iconSvg)?.[1] ?? '')
  .trim()
  .split(/[\s,]+/)
  .filter(Boolean)
  .map(Number);
const pathData = /\sd="([^"]+)"/.exec(iconSvg)[1];

export const EAGLE_BOX = { x: vx - tx, y: vy - ty, w, h };
export const eaglePath = () => new Path2D(pathData);
