import Heading from '@components/Heading';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faCheckCircle from '@icons/faCheckCircle';
import faFilm from '@icons/faFilm';
import faGear from '@icons/faGear';
import faImages from '@icons/faImages';
import faPlus from '@icons/faPlus';
import faSignal from '@icons/faSignal';
import faTrash from '@icons/faTrash';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SceneSelectorWindow = ({
  t,
  scenes = [],
  currentTrack = 0,
  onSelect = () => {},
  onCreate = () => {},
  onEditScene = () => {},
  projectTitle = '',
  onProjectTitleChange = () => {},
  onProjectDelete = () => {},
}) => {
  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Project')}
      </Heading>

      <div className={style.projectRow}>
        <input
          className={style.projectInput}
          type="text"
          value={projectTitle.slice(0, 25)}
          maxLength={25}
          placeholder={t('Untitled project')}
          spellCheck="false"
          onChange={(e) => onProjectTitleChange(e.target.value)}
        />
        <button type="button" className={style.deleteButton} onClick={() => onProjectDelete()} title={t('Delete project')}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>

      <div className={style.sceneHeader}>
        <span className={style.fieldLabel}>{t('Scenes')}</span>
        <span className={style.countBadge}>{scenes.length}</span>
      </div>

      <div className={style.sceneList}>
        {scenes.map((s) => {
          const isActive = s.index === Number(currentTrack);
          return (
            <div key={s.id || s.index} className={`${style.sceneCard} ${isActive ? style.sceneCardActive : ''}`}>
              <button type="button" className={style.sceneMain} title={s.title || t('Untitled scene')} onClick={() => onSelect(s.index)}>
                <FontAwesomeIcon icon={isActive ? faCheckCircle : faFilm} className={style.sceneIcon} />
                <span className={style.sceneInfo}>
                  <span className={style.sceneTitle}>{s.title || t('Untitled scene')}</span>
                  <span className={style.sceneMeta}>
                    <span>
                      <FontAwesomeIcon icon={faImages} /> {s.pictureCount}
                    </span>
                    {s.framerate && (
                      <span>
                        <FontAwesomeIcon icon={faSignal} /> {s.framerate} {t('FPS')}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <button type="button" className={style.sceneGear} onClick={() => onEditScene(s.index)} title={t('Scene settings')}>
                <FontAwesomeIcon icon={faGear} />
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" className={style.createButton} onClick={() => onCreate()}>
        <FontAwesomeIcon icon={faPlus} />
        <span>{t('New scene')}</span>
      </button>
    </div>
  );
};

export default withTranslation()(SceneSelectorWindow);
