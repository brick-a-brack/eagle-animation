import { formatFileSize } from '@core/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faCheckCircle from '@icons/faCheckCircle';
import faClock from '@icons/faClock';
import faFileVideo from '@icons/faFileVideo';
import faRotate from '@icons/faRotate';
import faSpinner from '@icons/faSpinner';
import faTriangleExclamation from '@icons/faTriangleExclamation';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

// Older backends only send isUploaded
export const getSyncStatus = ({ status, isUploaded }) => (isUploaded ? 'uploaded' : status || 'pending');

const SyncItem = ({ fileSize, isUploaded, publicCode, email, status, queuePosition, attempt, maxAttempts, uploadedBytes, totalBytes, retries = 0, lastError, error, t }) => {
  const displayTarget = email || publicCode || t('Unknown');
  const currentStatus = getSyncStatus({ status, isUploaded });
  const isActive = currentStatus === 'uploading' || currentStatus === 'retrying';
  const percent = totalBytes > 0 ? Math.min(100, Math.floor(((uploadedBytes || 0) / totalBytes) * 100)) : 0;
  const errorMessage = error || lastError;

  const renderStatus = () => {
    switch (currentStatus) {
      case 'uploaded':
        return (
          <div className={style.statusUploaded}>
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>{t('Uploaded')}</span>
          </div>
        );
      case 'uploading':
        return (
          <div className={style.statusUploading}>
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>{t('Uploading {{percent}}%', { percent })}</span>
          </div>
        );
      case 'retrying':
        return (
          <div className={style.statusRetrying}>
            <FontAwesomeIcon icon={faRotate} spin />
            <span>{t('Retrying')}</span>
          </div>
        );
      case 'error':
        return (
          <div className={style.statusError}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>{t('Failed')}</span>
          </div>
        );
      case 'queued':
        return (
          <div className={style.statusQueued}>
            <FontAwesomeIcon icon={faClock} />
            <span>{queuePosition ? t('In queue (#{{position}})', { position: queuePosition }) : t('In queue')}</span>
          </div>
        );
      default:
        return (
          <div className={style.statusPending}>
            <FontAwesomeIcon icon={faClock} />
            <span>{t('Waiting for next sync')}</span>
          </div>
        );
    }
  };

  return (
    <div className={`${style.item} ${isActive ? style.active : ''} ${currentStatus === 'uploaded' ? style.done : ''}`}>
      <div className={style.icon}>
        <FontAwesomeIcon icon={faFileVideo} />
      </div>

      <div className={style.content}>
        <div className={style.mainInfo}>
          <div className={style.target}>
            <span className={style.targetValue}>{displayTarget}</span>
          </div>

          <div className={style.fileInfo}>
            <span className={style.fileSize}>{isActive && totalBytes > 0 ? `${formatFileSize(uploadedBytes || 0)} / ${formatFileSize(totalBytes)}` : formatFileSize(fileSize || 0)}</span>
            {isActive && attempt > 1 && <span>{t('Attempt {{attempt}}/{{max}}', { attempt, max: maxAttempts })}</span>}
            {retries > 0 && <span className={style.retries}>{t('Retries: {{retries}}', { retries })}</span>}
          </div>

          {currentStatus !== 'uploaded' && currentStatus !== 'uploading' && errorMessage && (
            <div className={style.error} title={errorMessage}>
              {errorMessage}
            </div>
          )}
        </div>

        {isActive && (
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
