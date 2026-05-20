import { useState } from 'react';
import { withTranslation } from 'react-i18next';

import Tooltip from '@components/Tooltip';

import * as style from './style.module.css';


const PreviewIndicator = ({ framePosition = false, frameQuantity = 0, animationFrameQuantity = 0, fps = 12, t }) => {
  const [mode, setMode] = useState(0);

  const handleModeChange = () => {
    setMode((old) => (old + 1) % 3);
  };

  let label = null;
  let childrenComponent = null;

  // Current frame / Number of frames
  if (mode === 0) {
    label = t('Current / Number of frames');
    childrenComponent = (<>
      {framePosition === false && <span className={style.live}>{t('Live')}</span>}
      {framePosition !== false && <span>{framePosition}</span>}
      <span className={style.separator}>{' / '}</span>
      <span>{frameQuantity}</span>
    </>);
  }

  // Total of capture frames -> Outputed frames
  if (mode === 1) {
    label = t('Captured → Exportable frames');
    childrenComponent = (<>
      <span>{frameQuantity}</span>
      {animationFrameQuantity !== frameQuantity && (
        <>
          <span className={style.separator}>{' → '}</span>
          <span>{animationFrameQuantity}</span>
        </>
      )}
    </>);
  }

  // Duration
  if (mode === 2) {
    const duration = Math.floor(animationFrameQuantity / fps);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    label = t('Animation duration');
    childrenComponent = (<>
      {hours > 0 && <span>{hours.toString().padStart(2, '0')}</span>}
      {hours > 0 && <span className={style.separator}>{':'}</span>}
      <span>{minutes.toString().padStart(2, '0')}</span>
      <span className={style.separator}>{':'}</span>
      <span>{seconds.toString().padStart(2, '0')}</span>
    </>
    );
  }

  if (!childrenComponent) {
    return null;
  }

  return <>
    <div onClick={handleModeChange} className={style.progress} data-tooltip-id="preview-indicator">
      {childrenComponent}
    </div>
    {label && <Tooltip id="preview-indicator" content={label} />}
  </>;
};



export default withTranslation()(PreviewIndicator);
