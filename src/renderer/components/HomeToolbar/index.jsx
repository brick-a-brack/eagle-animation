import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faChevronDown from '@icons/faChevronDown';
import faMagnifyingGlass from '@icons/faMagnifyingGlass';
import faStar from '@icons/faStar';
import faXmark from '@icons/faXmark';
import { useState } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" rx="1.5" />
    <rect x="13" y="3" width="8" height="8" rx="1.5" />
    <rect x="3" y="13" width="8" height="8" rx="1.5" />
    <rect x="13" y="13" width="8" height="8" rx="1.5" />
  </svg>
);

const IconList = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="3" y="4" width="4" height="4" rx="1" />
    <rect x="9" y="4.5" width="12" height="3" rx="1.5" />
    <rect x="3" y="10" width="4" height="4" rx="1" />
    <rect x="9" y="10.5" width="12" height="3" rx="1.5" />
    <rect x="3" y="16" width="4" height="4" rx="1" />
    <rect x="9" y="16.5" width="12" height="3" rx="1.5" />
  </svg>
);

const HomeToolbar = ({
  search = '',
  onSearchChange = () => {},
  sort = 'UPDATED',
  onSortChange = () => {},
  favoritesOnly = false,
  onToggleFavorites = () => {},
  view = 'GRID',
  onViewChange = () => {},
  t,
}) => {
  const [sortOpen, setSortOpen] = useState(false);

  const sortOptions = [
    { key: 'UPDATED', label: t('Last modified') },
    { key: 'CREATED', label: t('Date created') },
    { key: 'NAME', label: t('Name') },
    { key: 'FRAMES', label: t('Most frames') },
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

      <div className={style.sort}>
        <button type="button" className={style.sortButton} onClick={() => setSortOpen((v) => !v)}>
          <span>{currentSort.label}</span>
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

      <div className={style.viewToggle}>
        <button type="button" className={view === 'GRID' ? style.viewActive : ''} onClick={() => onViewChange('GRID')} title={t('Grid view')}>
          <IconGrid />
        </button>
        <button type="button" className={view === 'LIST' ? style.viewActive : ''} onClick={() => onViewChange('LIST')} title={t('List view')}>
          <IconList />
        </button>
      </div>
    </div>
  );
};

export default withTranslation()(HomeToolbar);
