import { formatRelativeTime, formatTimecode } from '@core/format';
import { getPictureLink } from '@core/resize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faClock from '@icons/faClock';
import faImages from '@icons/faImages';
import faPen from '@icons/faPen';
import faRectangleHistory from '@icons/faRectangleHistory';
import faStar from '@icons/faStar';
import faStarRegular from '@icons/faStarRegular';
import { useRef } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import * as style from './style.module.css';

let renameEvents = {};

const ProjectCard = ({
  id = '',
  title = '',
  picture = '',
  onClick = null,
  onTitleChange = null,
  onFavoriteToggle = null,
  nbFrames = null,
  nbScenes = null,
  duration = null,
  creation = null,
  updated = null,
  favorite = false,
  t,
}) => {
  const ref = useRef(null);
  const { i18n } = useTranslation();
  const locale = i18n?.language || 'en';

  const handleClick = () => {
    if (onClick) {
      onClick(id, ref?.current?.value || '');
    }
  };

  const handleKeyDown = (evt) => {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      handleClick();
    }
  };

  const handleRename = (evt) => {
    if (!onTitleChange || !id) {
      return;
    }

    if (renameEvents[id]) {
      clearTimeout(renameEvents[id]);
    }
    renameEvents[id] = setTimeout(() => {
      onTitleChange(id, evt.target.value);
    }, 250);
  };

  const handleFavorite = (evt) => {
    evt.stopPropagation();
    if (onFavoriteToggle && id) {
      onFavoriteToggle(id, !favorite);
    }
  };

  const thumbnail = picture ? <img alt="" src={getPictureLink(picture, { w: 320, h: 200, m: 'cover', f: 'jpg' })} loading="lazy" /> : <div className={style.placeholderThumb} />;

  const badges = (
    <div className={style.badges}>
      {nbFrames !== null && (
        <span className={style.badge}>
          <FontAwesomeIcon icon={faImages} />
          {nbFrames || 0}
        </span>
      )}
      {nbScenes > 1 ? (
        <span className={style.badge}>
          <FontAwesomeIcon icon={faRectangleHistory} />
          {nbScenes}
        </span>
      ) : null}
    </div>
  );

  const star = onFavoriteToggle && (
    <button type="button" className={`${style.star} ${favorite ? style.starActive : ''}`} onClick={handleFavorite} title={favorite ? t('Remove from favorites') : t('Add to favorites')}>
      <FontAwesomeIcon icon={favorite ? faStar : faStarRegular} />
    </button>
  );

  const dates = (creation || updated) && (
    <div className={style.dates}>
      {creation ? (
        <span>
          <FontAwesomeIcon icon={faClock} />
          <span>{formatRelativeTime(creation, locale)}</span>
        </span>
      ) : null}
      {updated ? (
        <span>
          <FontAwesomeIcon icon={faPen} />
          <span>{formatRelativeTime(updated, locale)}</span>
        </span>
      ) : null}
    </div>
  );

  return (
    <div className={style.box} role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
      <div className={style.banner}>
        {thumbnail}
        {badges}
        {star}
        {duration ? <span className={style.duration}>{formatTimecode(duration)}</span> : null}
      </div>
      <div className={style.footer}>
        <div className={style.title}>
          <input
            maxLength={25}
            placeholder={t('Untitled')}
            ref={ref}
            defaultValue={title || ''}
            onChange={handleRename}
            onClick={(evt) => evt.stopPropagation()}
            onKeyDown={(evt) => evt.stopPropagation()}
          />
        </div>
        {dates}
      </div>
    </div>
  );
};

export default withTranslation()(ProjectCard);
