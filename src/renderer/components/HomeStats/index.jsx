import { formatDuration } from '@core/format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faFilm from '@icons/faFilm';
import faImages from '@icons/faImages';
import faRectangleHistory from '@icons/faRectangleHistory';
import faStar from '@icons/faStar';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const HomeStats = ({ projectsCount = 0, photosCount = 0, durationSeconds = 0, favoritesCount = 0, t }) => {
  const stats = [
    { icon: faRectangleHistory, value: projectsCount, label: t('projects') },
    { icon: faImages, value: photosCount, label: t('photos') },
    { icon: faFilm, value: formatDuration(durationSeconds), label: t('of animation') },
    { icon: faStar, value: favoritesCount, label: t('starred'), accent: true },
  ];

  return (
    <div className={style.stats}>
      {stats.map((stat, index) => (
        <div key={index} className={`${style.stat} ${stat.accent ? style.accent : ''}`}>
          <FontAwesomeIcon icon={stat.icon} className={style.icon} />
          <span className={style.value}>{stat.value}</span>
          <span className={style.label}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default withTranslation()(HomeStats);
