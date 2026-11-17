import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as style from './style.module.css';

// Vertical tab list on desktop, horizontal scrollable bar on small screens
const SectionTabs = ({ tabs = [], selected = null, onChange = () => {}, className = '' }) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <nav className={`${style.tabs} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const isSelected = tab.id === selected;
        return (
          <button key={tab.id} type="button" role="tab" aria-selected={isSelected} className={`${style.tab} ${isSelected ? style.selected : ''}`} onClick={() => onChange(tab.id)}>
            {tab.icon && <FontAwesomeIcon icon={tab.icon} className={style.icon} fixedWidth />}
            <span className={style.label}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default SectionTabs;
