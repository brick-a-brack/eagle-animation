import GridOverlay from '@components/GridOverlay';
import RatioBorders from '@components/RatioBorders';

import * as style from './style.module.css';

const CANVAS_WIDTH = 260;
const CANVAS_HEIGHT = 130;
const RATIO = 4 / 3;

const GridRatioPreview = ({ gridModes = [], gridOpacity = 0, gridColumns = 1, gridLines = 1, ratioLayerOpacity = 0.5 }) => {
  return (
    <div className={style.preview} style={{ '--preview-width': `${CANVAS_WIDTH}px`, '--preview-height': `${CANVAS_HEIGHT}px` }}>
      <RatioBorders width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ratio={RATIO} opacity={ratioLayerOpacity} />
      <GridOverlay className={style.canvas} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} modes={gridModes} opacity={gridOpacity} columns={gridColumns} lines={gridLines} ratio={RATIO} />
    </div>
  );
};

export default GridRatioPreview;
