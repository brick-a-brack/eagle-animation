import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faPlus from '@icons/faPlus';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const NewProjectCard = ({ onClick = null, t }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(null, '');
    }
  };

  const handleKeyDown = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      handleClick();
    }
  };

  return (
    <button type="button" className={`${style.card} ${style.cardGrid}`} onClick={handleClick} onKeyDown={handleKeyDown} title={t('New project')}>
      <span className={style.icon}>
        <FontAwesomeIcon icon={faPlus} />
      </span>
      <span className={style.label}>{t('New project')}</span>
    </button>
  );
};

export default withTranslation()(NewProjectCard);
