import Action from '@components/Action';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as style from './style.module.css';

const IconTabs = ({ tabs = [], onClick = () => {} }) => {
  if (tabs.length === 0) {
    return null;
  }

  let selectedIndex = tabs.findIndex((e) => Boolean(e.selected));
  if (selectedIndex === -1) {
    selectedIndex = 0;
  }

  return (
    <div className={style.container}>
      <div className={style.tabContainer}>
        <div className={style.backgroundTab} style={{ transform: `translateX(${selectedIndex * (45 + 1) + 3}px)` }} />
        {tabs.map((e, i) => (
          <Action key={e.id || e.title || i} title={e.title} onClick={() => onClick(e, i)} className={`${style.tab} ${i === 0 ? style.tabFirst : ''} ${i === tabs.length - 1 ? style.tabLast : ''}`}>
            {e.icon && <FontAwesomeIcon icon={e.icon} />}
          </Action>
        ))}
      </div>
    </div>
  );
};

export default IconTabs;
