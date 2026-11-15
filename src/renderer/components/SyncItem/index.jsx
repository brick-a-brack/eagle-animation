import { formatFileSize } from '@core/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faCheckCircle from '@icons/faCheckCircle';
import faFileVideo from '@icons/faFileVideo';
import faRotate from '@icons/faRotate';
import faSpinner from '@icons/faSpinner';
import faTriangleExclamation from '@icons/faTriangleExclamation';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SyncItem = ({ fileSize, isUploaded, publicCode, email, status, attempt, maxAttempts, uploadedBytes, totalBytes, retries = 0, lastError, error, t }) => {
  const displayTarget = email || publicCode || t('Unknown');
  const isUploading = !isUploaded && status === 'uploading';
  const percent = totalBytes > 0 ? Math.min(100, Math.floor(((uploadedBytes || 0) / totalBytes) * 100)) : 0;
  const errorMessage = error || lastError;

  const renderStatus = () => {
    if (isUploaded) {
      return (
        <div className={style.statusUploaded}>
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>{t('Uploaded')}</span>
        </div>
      );
    }
    if (isUploading) {
      return (
        <div className={style.statusUploading}>
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>{t('Uploading {{percent}}%', { percent })}</span>
        </div>
      );
    }
    if (status === 'retrying') {
      return (
        <div className={style.statusRetrying}>
          <FontAwesomeIcon icon={faRotate} spin />
          <span>{t('Retrying')}</span>
        </div>
      );
    }
    if (status === 'error') {
      return (
        <div className={style.statusError}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <span>{t('Failed')}</span>
        </div>
      );
    }
    return (
      <div className={style.statusPending}>
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>{t('Pending')}</span>
      </div>
    );
  };

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
            {isUploading && attempt > 1 && <span>{t('Attempt {{attempt}}/{{max}}', { attempt, max: maxAttempts })}</span>}
            {retries > 0 && <span className={style.retries}>{t('Retries: {{retries}}', { retries })}</span>}
          </div>

          {!isUploaded && !isUploading && errorMessage && (
            <div className={style.error} title={errorMessage}>
              {errorMessage}
            </div>
          )}
        </div>

        {(isUploading || (!isUploaded && percent > 0)) && (
          <div className={style.progress}>
            <div className={style.progressBar} style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      <div className={style.status}>{renderStatus()}</div>
    </div>
  );
};

export default withTranslation()(SyncItem);
