import { formatFileSize } from '@core/format';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SyncStats = ({ items = [], t }) => {
  const uploaded = items.filter((item) => item.isUploaded);
  const remaining = items.filter((item) => !item.isUploaded);
  const queued = remaining.filter((item) => item.status === 'queued' || item.status === 'uploading' || item.status === 'retrying');
  const remainingSize = remaining.reduce((total, item) => total + (item.fileSize || 0), 0);

  return (
    <div className={style.stats}>
      <div className={style.stat}>
        <span className={`${style.value} ${style.uploaded}`}>{uploaded.length}</span>
        <span className={style.label}>{t('Sent')}</span>
      </div>
      <div className={style.stat}>
        <span className={style.value}>{remaining.length}</span>
        <span className={style.label}>{t('Remaining to send')}</span>
        {remaining.length > 0 && (
          <span className={style.detail}>
            {formatFileSize(remainingSize)}
            {queued.length > 0 && ` · ${t('{{queued}} in queue', { queued: queued.length })}`}
          </span>
        )}
      </div>
    </div>
  );
};

export default withTranslation()(SyncStats);
