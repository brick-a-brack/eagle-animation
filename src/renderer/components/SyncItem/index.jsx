import { formatFileSize } from '@core/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faCheckCircle from '@icons/faCheckCircle';
import faFileVideo from '@icons/faFileVideo';
import faSpinner from '@icons/faSpinner';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SyncItem = ({ fileSize, isUploaded, publicCode, email, t }) => {
  const displayTarget = email || publicCode || t('Unknown');

  return (
    <div className={`${style.item}`}>
      <div className={style.icon}>
        <FontAwesomeIcon icon={faFileVideo} />
      </div>

      <div className={style.content}>
        <div className={style.mainInfo}>
          <div className={style.target}>
            <span className={style.targetValue}>{displayTarget}</span>
          </div>

          <div className={style.fileInfo}>
            <span className={style.fileSize}>{formatFileSize(fileSize || 0)}</span>
          </div>
        </div>
      </div>

      <div className={style.status}>
        {isUploaded ? (
          <div className={style.statusUploaded}>
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>{t('Uploaded')}</span>
          </div>
        ) : (
          <div className={style.statusPending}>
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>{t('Pending')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default withTranslation()(SyncItem);
