import { drawGrid } from '@core/grid';
import { useEffect, useRef } from 'react';

import * as style from './style.module.css';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 180;

const GridPreview = ({ gridModes = [], gridOpacity = 0, gridColumns = 1, gridLines = 1 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    drawGrid(ctx, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      gridModes,
      gridOpacity,
      gridColumns,
      gridLines,
    });
  }, [gridModes?.join(','), gridOpacity, gridColumns, gridLines]);

  return (
    <div className={style.preview}>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className={style.canvas} />
    </div>
  );
};

export default GridPreview;
