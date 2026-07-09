const drawArea = (ctx, x, y, width, height) => {
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y + height, width, 1);
  ctx.fillRect(x, y, 1, height);
  ctx.fillRect(x + width, y, 1, height);
};

// Draws the grid overlay (classic grid, center marker, margins guides) onto a canvas 2D context.
// Shared between the live camera Player and the settings GridPreview so both stay visually identical.
export const drawGrid = (ctx, { width, height, gridModes, gridOpacity, gridColumns, gridLines: gridRows, videoRatio = null }) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = `rgba(255,255,255, ${gridOpacity}`;

  let widthRatio = width;
  let heightRatio = height;
  let marginX = 0;
  let marginY = 0;

  if (videoRatio) {
    if (videoRatio > width / height) {
      heightRatio = width / videoRatio;
    } else {
      widthRatio = height * videoRatio;
    }
    marginX = (width - widthRatio) / 2;
    marginY = (height - heightRatio) / 2;
  }

  if (gridModes?.includes('GRID')) {
    for (let i = 0; i < gridColumns; i++) {
      ctx.fillRect(Math.round(marginX + (widthRatio * (i + 1)) / (gridColumns + 1)), 0, 1, height);
    }
    for (let i = 0; i < gridRows; i++) {
      ctx.fillRect(0, Math.round(marginY + (heightRatio * (i + 1)) / (gridRows + 1)), width, 1);
    }
  }

  if (gridModes?.includes('CENTER')) {
    const size = Math.round((20 / 1080) * height);
    ctx.fillRect((width - size) / 2, (height - 2) / 2, size, 2);
    ctx.fillRect((width - 2) / 2, (height - size) / 2, 2, size);
  }

  if (gridModes?.includes('MARGINS')) {
    // 90% and 80%
    drawArea(ctx, Math.round(marginX + 0.05 * widthRatio), Math.round(marginY + 0.05 * heightRatio), Math.round(0.9 * widthRatio), Math.round(0.9 * heightRatio));
    drawArea(ctx, Math.round(marginX + 0.1 * widthRatio), Math.round(marginY + 0.1 * heightRatio), Math.round(0.8 * widthRatio), Math.round(0.8 * heightRatio));
  }
};
