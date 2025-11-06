import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faCheckCircle from '@icons/faCheckCircle';
import faFileVideo from '@icons/faFileVideo';
import faSpinner from '@icons/faSpinner';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

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
