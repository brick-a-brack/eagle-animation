import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faChevronDown from '@icons/faChevronDown';
import faGear from '@icons/faGear';
import faPlus from '@icons/faPlus';
import { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SceneSelector = ({ t, scenes = [], currentTrack = 0, onSelect = () => {}, onCreate = () => {}, onEditScene = () => {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
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
    <div className={style.container} ref={containerRef}>
      <button type="button" className={style.button} onClick={() => setIsOpen((v) => !v)}>
        <span className={style.label}>{currentScene?.title || t('Scene')}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`${style.chevron} ${isOpen ? style.chevronOpen : ''}`} />
      </button>
      {isOpen && (
        <div className={style.panel}>
          {scenes.map((s) => (
            <div key={s.id || s.index} className={`${style.row} ${s.index === Number(currentTrack) ? style.rowActive : ''}`}>
              <button
                type="button"
                className={style.rowSelect}
                onClick={() => {
                  setIsOpen(false);
                  onSelect(s.index);
                }}
              >
                <span className={style.rowTitle}>{s.title || t('Scene')}</span>
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
      )}
    </div>
  );
};

export default withTranslation()(SceneSelector);
