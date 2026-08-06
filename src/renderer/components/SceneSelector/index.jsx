import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faChevronDown from '@icons/faChevronDown';
import faGear from '@icons/faGear';
import faImages from '@icons/faImages';
import faPlus from '@icons/faPlus';
import faTrash from '@icons/faTrash';
import { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SceneSelector = ({
  t,
  scenes = [],
  currentTrack = 0,
  onSelect = () => {},
  onCreate = () => {},
  onEditScene = () => {},
  projectTitle = '',
  onProjectTitleChange = () => {},
  onProjectDelete = () => {},
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (disabled && isOpen) setIsOpen(false);
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  const currentScene = scenes.find((s) => s.index === Number(currentTrack)) || scenes[0] || null;

  return (
    <div className={style.container} ref={containerRef} data-tour="scenes">
      <button type="button" className={style.button} onClick={() => setIsOpen((v) => !v)} disabled={disabled}>
        <div className={style.buttonContent}>
          <span className={style.projectLabel}>{projectTitle || t('Untitled project')}</span>
          <span className={style.sceneLabel}>{currentScene?.title || t('Untitled scene')}</span>
        </div>
        <FontAwesomeIcon icon={faChevronDown} className={`${style.chevron} ${isOpen ? style.chevronOpen : ''}`} />
      </button>

      <div className={`${style.panel} ${isOpen ? style.panelOpen : ''}`} aria-hidden={!isOpen}>
        <div className={style.sectionHeader}>{t('Project')}</div>
        <div className={style.projectRow}>
          <input
            className={style.projectInput}
            type="text"
            value={projectTitle.slice(0, 25)}
            maxLength={25}
            placeholder={t('Untitled project')}
            spellCheck="false"
            onChange={(e) => onProjectTitleChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className={style.rowDelete}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onProjectDelete();
            }}
            title={t('Delete project')}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>

        <div className={style.separator} />

        <div className={style.sectionHeader}>{t('Scenes')}</div>
        <div className={style.scrollable}>
          {scenes.map((s) => (
            <div key={s.id || s.index} className={`${style.row} ${s.index === Number(currentTrack) ? style.rowActive : ''}`}>
              <button
                title={s.title || t('Untitled scene')}
                type="button"
                className={style.rowSelect}
                onClick={() => {
                  setIsOpen(false);
                  onSelect(s.index);
                }}
              >
                <span className={style.rowTitle}>{s.title || t('Untitled scene')}</span>
                <div className={style.rowMeta}>
                  {s.pictureCount > 0 && (
                    <span className={style.metaTag}>
                      {s.pictureCount} <FontAwesomeIcon icon={faImages} style={{ position: 'relative', top: '-1px' }} />
                    </span>
                  )}
                  {s.framerate && <span className={style.metaTag}>{s.framerate} FPS</span>}
                </div>
              </button>
              <button
                type="button"
                className={style.rowGear}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onEditScene(s.index);
                }}
                title={t('Scene settings')}
              >
                <FontAwesomeIcon icon={faGear} />
              </button>
            </div>
          ))}
        </div>

        <div className={style.separator} />
        <button
          type="button"
          className={style.createButton}
          onClick={() => {
            setIsOpen(false);
            onCreate();
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>{t('New scene')}</span>
        </button>
      </div>
    </div>
  );
};

export default withTranslation()(SceneSelector);
