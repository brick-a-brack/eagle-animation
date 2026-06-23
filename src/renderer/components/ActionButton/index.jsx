import Button from '@components/Button';
import faArrowLeft from '@icons/faArrowLeft';
import faDownLeftAndUpRightToCenter from '@icons/faDownLeftAndUpRightToCenter';
import faFileExport from '@icons/faFileExport';
import faFilmGear from '@icons/faFilmGear';
import faGear from '@icons/faGear';
import faKeyboard from '@icons/faKeyboard';
import faListCheck from '@icons/faListCheck';
import faUpRightAndDownLeftFromCenter from '@icons/faUpRightAndDownLeftFromCenter';
import { withTranslation } from 'react-i18next';

const ActionButton = withTranslation()(({ type, tooltipPosition = 'LEFT', onClick = () => {}, t }) => {
  const titles = {
    BACK: t('Back'),
    SETTINGS: t('Settings'),
    SHORTCUTS: t('Shortcuts'),
    PROJECT_SETTINGS: t('Edit project'),
    EXPORT: t('Export'),
    ENTER_FULLSCREEN: t('Fullscreen'),
    EXIT_FULLSCREEN: t('Exit fullscreen'),
    SYNC_LIST: t('Sync list'),
  };

  const icons = {
    BACK: faArrowLeft,
    SETTINGS: faGear,
    SHORTCUTS: faKeyboard,
    PROJECT_SETTINGS: faFilmGear,
    EXPORT: faFileExport,
    ENTER_FULLSCREEN: faUpRightAndDownLeftFromCenter,
    EXIT_FULLSCREEN: faDownLeftAndUpRightToCenter,
    SYNC_LIST: faListCheck,
  };

  return <Button label={titles?.[type] || null} onClick={onClick} icon={icons?.[type] || null} tooltipPosition={tooltipPosition} />;
});

export default ActionButton;