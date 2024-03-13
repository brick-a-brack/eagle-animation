import * as style from './style.module.css';
import IconQuit from './assets/quit.svg?jsx';
import IconDone from './assets/done.svg?jsx';
import { withTranslation } from 'react-i18next';
import { useEffect } from 'react';

const LoadingOverlay = ({ t, publicCode = null, onCancel = null, isExporting = false }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  });

  return (
    <div className={style.background}>
      {onCancel && (
        <div onClick={onCancel} className={style.quit}>
          <IconQuit />
        </div>
      )}
      {isExporting && <span className={style.loader} />}
      {!isExporting && (
        <div className={style.done}>
          <IconDone />
        </div>
      )}
      {publicCode && (
        <div className={style.code}>
          {t("You'll be able to get your film using this code:")}
          <div className={style.codeValue}>{publicCode}</div>
        </div>
      )}
      {isExporting && <div className={style.info}>{t('Export will take a while, please be patient')}</div>}
      {!isExporting && <div className={style.info}>{t('The export is finished, you can close this page')}</div>}
    </div>
  );
};

export default withTranslation()(LoadingOverlay);
