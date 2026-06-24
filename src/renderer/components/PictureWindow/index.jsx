import Heading from '@components/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faImageCircleMinus from '@icons/faImageCircleMinus';
import faImageCirclePlus from '@icons/faImageCirclePlus';
import faImageEye from '@icons/faImageEye';
import faImageEyeSlash from '@icons/faImageEyeSlash';
import faImageSlash from '@icons/faImageSlash';
import faPen from '@icons/faPen';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const PictureWindow = ({ t, isHidden = false, canDeduplicate = false, canUseMaskingEditor = false, onAction = null }) => {
  const handleAction = (action) => () => {
    if (onAction) {
      onAction(action);
    }
  };

  const rows = [
    {
      key: 'HIDE_FRAME',
      label: isHidden ? t('Unhide frame') : t('Hide frame'),
      icon: isHidden ? faImageEye : faImageEyeSlash,
    },
    {
      key: 'DUPLICATE',
      label: t('Duplicate frame'),
      icon: faImageCirclePlus,
    },
    canDeduplicate && {
      key: 'DEDUPLICATE',
      label: t('Deduplicate frame'),
      icon: faImageCircleMinus,
    },
    canUseMaskingEditor && {
      key: 'MASKING_EDITOR',
      label: t('Open masking editor'),
      icon: faPen,
    },
    {
      key: 'DELETE_FRAME',
      label: t('Remove frame'),
      icon: faImageSlash,
      variant: 'alert',
    },
  ].filter(Boolean);

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Frame actions')}
      </Heading>

      {rows.map((row) => (
        <button key={row.key} type="button" className={`${style.row} ${row.variant === 'alert' ? style.alert : ''}`} onClick={handleAction(row.key)}>
          <span className={style.label}>
            <FontAwesomeIcon icon={row.icon} className={style.icon} />
            {row.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default withTranslation()(PictureWindow);
