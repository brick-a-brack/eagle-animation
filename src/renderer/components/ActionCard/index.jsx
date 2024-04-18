import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import faFileVideo from '../../icons/faFileVideo';
import faFolderImage from '../../icons/faFolderImage';
import faPaperPlane from '../../icons/faPaperPlane';
import Action from '../Action';

import * as style from './style.module.css';

const icons = {
  FRAMES: faFolderImage,
  SEND: faPaperPlane,
  VIDEO: faFileVideo,
};

const ActionCard = ({ icon, action, className = '', disabled = false, selected = false, title = '', sizeAuto = false, secondary = false }) => {
  const faIcon = icons[icon] || null;

  return (
    <Action
      action={action}
      className={`${style.block} ${disabled ? style.disabled : ''}  ${selected ? style.selected : ''} ${secondary ? style.secondary : ''}  ${sizeAuto ? style.sizeAuto : ''} ${className || ''}`}
    >
      {faIcon && (
        <div className={style.icon}>
          <FontAwesomeIcon icon={faIcon} />
        </div>
      )}
      <div className={style.title}>{title || ''}</div>
    </Action>
  );
};

export default ActionCard;
