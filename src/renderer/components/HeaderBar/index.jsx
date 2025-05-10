import Button from '@components/Button';
import faArrowLeft from '@icons/faArrowLeft';
import faDownLeftAndUpRightToCenter from '@icons/faDownLeftAndUpRightToCenter';
import faFileExport from '@icons/faFileExport';
import faFilmGear from '@icons/faFilmGear';
import faGear from '@icons/faGear';
import faKeyboard from '@icons/faKeyboard';
import faUpRightAndDownLeftFromCenter from '@icons/faUpRightAndDownLeftFromCenter';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const ActionButton = withTranslation()(({ type, tooltipPosition = 'LEFT', onClick = () => {}, t }) => {
  const titles = {
    BACK: t('Back'),
    SETTINGS: t('Settings'),
    SHORTCUTS: t('Shortcuts'),
    PROJECT_SETTINGS: t('Edit project'),
    EXPORT: t('Export'),
    ENTER_FULLSCREEN: t('Fullscreen'),
    EXIT_FULLSCREEN: t('Exit fullscreen'),
  };

  const icons = {
    BACK: faArrowLeft,
    SETTINGS: faGear,
    SHORTCUTS: faKeyboard,
    PROJECT_SETTINGS: faFilmGear,
    EXPORT: faFileExport,
    ENTER_FULLSCREEN: faUpRightAndDownLeftFromCenter,
    EXIT_FULLSCREEN: faDownLeftAndUpRightToCenter,
  };

  return <Button label={titles?.[type] || null} onClick={onClick} icon={icons?.[type] || null} tooltipPosition={tooltipPosition} />;
});

const HeaderBar = ({ onAction = null, leftActions = [], rightActions = [], children = null, leftChildren = null, rightChildren = null, title = '', withBorder = false }) => {
  return (
    <div className={`${style.headerBar} ${withBorder && style.withBorder}`}>
      <div>
        {leftActions.map((type) => (
          <ActionButton type={type} key={type} onClick={() => onAction(type)} tooltipPosition="NONE" />
        ))}
        {leftChildren}
      </div>
      {(children || title) && (
        <div className={style.center}>
          {children && children}
          {!children && title && <div className={style.title}>{title}</div>}
        </div>
      )}
      <div>
        {rightChildren}
        {rightActions.map((type) => (
          <ActionButton type={type} key={type} onClick={() => onAction(type)} tooltipPosition="NONE" />
        ))}
      </div>
    </div>
  );
};

export default HeaderBar;
