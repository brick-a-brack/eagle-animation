import { useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const PreviewIndicator = ({ framePosition = false, frameQuantity = 0, animationFrameQuantity = 0, fps = 12, t }) => {
  const [mode, setMode] = useState(0);

  const handleModeChange = () => {
    setMode((old) => (old + 1) % 3);
  };

  // Current frame / Number of frames
  if (mode === 0) {
    return (
      <div onClick={handleModeChange} className={style.progress} id="preview-indicator" data-tooltip-content={t('Current / Number of frames')}>
        {framePosition === false && <span className={style.live}>{t('Live')}</span>}
        {framePosition !== false && <span>{framePosition}</span>}
        <span className={style.separator}>{' / '}</span>
        <span>{frameQuantity}</span>
      </div>
    );
  }

  // Total of capture frames -> Outputed frames
  if (mode === 1) {
    return (
      <div onClick={handleModeChange} className={style.progress} id="preview-indicator" data-tooltip-content={t('Captured → Exportable frames')}>
        <span>{frameQuantity}</span>
        {animationFrameQuantity !== frameQuantity && (
          <>
            <span className={style.separator}>{' → '}</span>
            <span>{animationFrameQuantity}</span>
          </>
        )}
      </div>
    );
  }

  // Duration
  if (mode === 2) {
    const duration = Math.floor(animationFrameQuantity / fps);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return (
      <div onClick={handleModeChange} className={style.progress} id="preview-indicator" data-tooltip-content={t('Animation duration')}>
        {hours > 0 && <span>{hours.toString().padStart(2, '0')}</span>}
        {hours > 0 && <span className={style.separator}>{':'}</span>}
        <span>{minutes.toString().padStart(2, '0')}</span>
        <span className={style.separator}>{':'}</span>
        <span>{seconds.toString().padStart(2, '0')}</span>
      </div>
    );
  }

  return null;
};

export default withTranslation()(PreviewIndicator);
