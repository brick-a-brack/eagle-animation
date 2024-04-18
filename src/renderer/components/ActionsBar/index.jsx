import { withTranslation } from 'react-i18next';

import faArrowLeft from '../../icons/faArrowLeft';
import faFileExport from '../../icons/faFileExport';
import faGear from '../../icons/faGear';
import faKeyboard from '../../icons/faKeyboard';
import faTrash from '../../icons/faTrash';
import Button from '../Button';

import * as style from './style.module.css';

const ActionsBar = ({ onAction = null, actions = [], position = 'LEFT', t }) => {
  const handleAction = (action) => () => {
    if (onAction) {
      onAction(action);
    }
  };

  const tooltipPosition = position === 'LEFT' ? 'RIGHT' : 'LEFT';
  return (
    <div className={`${style.container} ${position === 'LEFT' ? style.left : position === 'RIGHT' ? style.right : ''}`}>
      {actions.includes('BACK') && <Button title={t('Back')} onClick={handleAction('BACK')} size="mini" icon={faArrowLeft} tooltipPosition={tooltipPosition} />}
      {actions.includes('SETTINGS') && <Button title={t('Settings')} onClick={handleAction('SETTINGS')} size="mini" icon={faGear} tooltipPosition={tooltipPosition} />}
      {actions.includes('SHORTCUTS') && <Button title={t('Shortcuts')} onClick={handleAction('SHORTCUTS')} size="mini" icon={faKeyboard} tooltipPosition={tooltipPosition} />}
      {actions.includes('EXPORT') && <Button title={t('Export')} onClick={handleAction('EXPORT')} size="mini" icon={faFileExport} tooltipPosition={tooltipPosition} />}
      {actions.includes('DELETE_PROJECT') && <Button title={t('Delete project')} onClick={handleAction('DELETE_PROJECT')} size="mini" icon={faTrash} tooltipPosition={tooltipPosition} />}
    </div>
  );
};

export default withTranslation()(ActionsBar);
