import { formatDuration, formatRelativeTime } from '@core/format';
import { getPictureLink } from '@core/resize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faClock from '@icons/faClock';
import faFilm from '@icons/faFilm';
import faImages from '@icons/faImages';
import faPen from '@icons/faPen';
import faPlay from '@icons/faPlay';
import faStar from '@icons/faStar';
import faStarRegular from '@icons/faStarRegular';
import { useRef } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import IconAdd from './assets/add.svg?jsx';
import IconEdit from './assets/edit.svg?jsx';
import IconOpen from './assets/open.svg?jsx';

import * as style from './style.module.css';

let renameEvents = {};

const ProjectCard = ({
  id = '',
  placeholder = '',
  title = '',
  picture = '',
  onClick = null,
  onTitleChange = null,
  onFavoriteToggle = null,
  nbFrames = null,
  framerate = null,
  duration = null,
  creation = null,
  updated = null,
  favorite = false,
  icon = 'EDIT',
  layout = 'GRID',
  t,
}) => {
  const ref = useRef(null);
  const { i18n } = useTranslation();
  const isPlaceholder = icon === 'ADD';
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

  const badges = !isPlaceholder && (
    <div className={style.badges}>
      {nbFrames !== null && (
        <span className={style.badge}>
          <FontAwesomeIcon icon={faImages} />
          {nbFrames || 0}
        </span>
      )}
      {framerate ? (
        <span className={style.badge}>
          <FontAwesomeIcon icon={faFilm} />
          {framerate}
          {t('fps')}
        </span>
      ) : null}
    </div>
  );

  const star = !isPlaceholder && onFavoriteToggle && (
    <button type="button" className={`${style.star} ${favorite ? style.starActive : ''}`} onClick={handleFavorite} title={favorite ? t('Remove from favorites') : t('Add to favorites')}>
      <FontAwesomeIcon icon={favorite ? faStar : faStarRegular} />
    </button>
  );

  const dates = !isPlaceholder && (creation || updated) && (
    <div className={style.dates}>
      {creation ? (
        <span title={t('Created')}>
          <FontAwesomeIcon icon={faClock} />
          {formatRelativeTime(creation, locale)}
        </span>
      ) : null}
      {updated ? (
        <span title={t('Last modified')}>
          <FontAwesomeIcon icon={faPen} />
          {formatRelativeTime(updated, locale)}
        </span>
      ) : null}
    </div>
  );

  // List layout
  if (layout === 'LIST') {
    return (
      <div className={`${style.row} ${isPlaceholder ? style.rowPlaceholder : ''}`}>
        <div className={style.rowThumb} role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
          {isPlaceholder ? <IconAdd /> : thumbnail}
          {!isPlaceholder && (
            <div className={style.rowPlay}>
              <FontAwesomeIcon icon={faPlay} />
            </div>
          )}
        </div>
        <div className={style.rowInfo}>
          <div className={style.title}>
            <input maxLength={25} placeholder={placeholder || t('Untitled')} ref={ref} defaultValue={title || ''} onChange={handleRename} />
          </div>
          {dates}
        </div>
        {badges}
        {star}
      </div>
    );
  }

  // Grid layout
  return (
    <div className={style.box}>
      <div className={style.banner}>
        {isPlaceholder ? null : thumbnail}
        {badges}
        {star}
        {!isPlaceholder && (
          <div className={style.play} role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown} title={t('Open')}>
            <FontAwesomeIcon icon={faPlay} />
          </div>
        )}
        {duration ? <span className={style.duration}>{formatDuration(duration)}</span> : null}
        <div role="button" tabIndex={0} className={style.bannerhover} onClick={handleClick} onKeyDown={handleKeyDown}>
          {icon === 'ADD' && <IconAdd />}
          {icon === 'EDIT' && <IconEdit />}
          {icon === 'OPEN' && <IconOpen />}
        </div>
      </div>
      <div className={style.footer}>
        <div className={style.title}>
          <input maxLength={25} placeholder={placeholder || t('Untitled')} ref={ref} defaultValue={title || ''} onChange={handleRename} />
        </div>
        {dates}
      </div>
    </div>
  );
};

export default withTranslation()(ProjectCard);
