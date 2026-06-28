import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faChevronDown from '@icons/faChevronDown';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faStar from '@icons/faStar';
import faXmark from '@icons/faXmark';
import { useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const HomeToolbar = ({ search = '', onSearchChange = () => {}, sort = 'UPDATED', onSortChange = () => {}, favoritesOnly = false, onToggleFavorites = () => {}, t }) => {
  const [sortOpen, setSortOpen] = useState(false);

  const sortOptions = [
    { key: 'UPDATED', label: t('Modification date') },
    { key: 'CREATED', label: t('Date created') },
    { key: 'NAME', label: t('Name') },
    { key: 'FRAMES', label: t('Number of frames') },
  ];
  const currentSort = sortOptions.find((o) => o.key === sort) || sortOptions[0];

  const handleSortSelect = (key) => {
    onSortChange(key);
    setSortOpen(false);
  };

  return (
    <div className={style.toolbar}>
      <div className={style.search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={style.searchIcon} />
        <input type="text" value={search} placeholder={t('Search projects...')} onChange={(evt) => onSearchChange(evt.target.value)} onKeyDown={(evt) => evt.stopPropagation()} />
        {search ? (
          <button type="button" className={style.clear} onClick={() => onSearchChange('')} title={t('Clear')}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        ) : null}
      </div>

      <div className={style.filters}>
        <div className={style.sort}>
          <button type="button" className={style.sortButton} onClick={() => setSortOpen((v) => !v)}>
            <span className={style.sortLabel}>{currentSort.label}</span>
            <FontAwesomeIcon icon={faChevronDown} className={`${style.chevron} ${sortOpen ? style.chevronOpen : ''}`} />
          </button>
          {sortOpen ? (
            <>
              <div className={style.backdrop} onClick={() => setSortOpen(false)} />
              <div className={style.menu}>
                {sortOptions.map((option) => (
                  <button type="button" key={option.key} className={`${style.menuItem} ${option.key === sort ? style.menuItemActive : ''}`} onClick={() => handleSortSelect(option.key)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <button type="button" className={`${style.toggle} ${favoritesOnly ? style.toggleActive : ''}`} onClick={() => onToggleFavorites(!favoritesOnly)}>
          <FontAwesomeIcon icon={faStar} />
          <span>{t('Starred')}</span>
        </button>
      </div>
    </div>
  );
};

export default withTranslation()(HomeToolbar);
