import Heading from '@components/Heading';
import NumberInput from '@components/NumberInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faImageEye from '@icons/faImageEye';
import faImageEyeSlash from '@icons/faImageEyeSlash';
import faImages from '@icons/faImages';
import faImageSlash from '@icons/faImageSlash';
import faPen from '@icons/faPen';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const PictureWindow = ({ t, isHidden = false, canUseMaskingEditor = false, duplicateCount = 1, onAction = null }) => {
  const handleAction = (action) => () => {
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Frame actions')}
      </Heading>

      <button type="button" className={style.row} onClick={handleAction('HIDE_FRAME')}>
        <span className={style.label}>
          <FontAwesomeIcon icon={isHidden ? faImageEye : faImageEyeSlash} className={style.icon} />
          {isHidden ? t('Unhide frame') : t('Hide frame')}
        </span>
      </button>

      <div className={`${style.row} ${style.rowStatic}`}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faImages} className={style.icon} />
          {t('Duplicate frame')}
        </span>
        <NumberInput key={duplicateCount} min={1} defaultValue={duplicateCount} onValueChange={(value) => onAction && onAction('SET_DUPLICATE_COUNT', value)} />
      </div>

      {canUseMaskingEditor && (
        <button type="button" className={style.row} onClick={handleAction('MASKING_EDITOR')}>
          <span className={style.label}>
            <FontAwesomeIcon icon={faPen} className={style.icon} />
            {t('Open masking editor')}
          </span>
        </button>
      )}

      <button type="button" className={`${style.row} ${style.alert}`} onClick={handleAction('DELETE_FRAME')}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faImageSlash} className={style.icon} />
          {t('Remove frame')}
        </span>
      </button>
    </div>
  );
};

export default withTranslation()(PictureWindow);
