import { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const LimitWarning = ({ nbFrames = null, nbFramesLimit = 0, startedAt = null, activityDuration = 0, t }) => {
  const [currentTime, setCurrentTime] = useState(new Date().getTime() / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime() / 1000);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [setCurrentTime]);

  if (nbFrames >= nbFramesLimit && nbFramesLimit > 0) {
    return <div className={style.notch}>{t('Recommended frames exceeded')}</div>;
  }

  if (activityDuration > 0 && startedAt > 0 && currentTime - startedAt > Number(activityDuration) * 60) {
    return <div className={style.notch}>{t('Recommended duration exceeded')}</div>;
  }
};

export default withTranslation()(LimitWarning);
