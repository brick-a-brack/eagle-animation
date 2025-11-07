import Action from '@components/Action';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faFileVideo from '@icons/faFileVideo';
import faFolderImage from '@icons/faFolderImage';
import faPaperPlane from '@icons/faPaperPlane';

import * as style from './style.module.css';

const icons = {
  FRAMES: faFolderImage,
  SEND: faPaperPlane,
  VIDEO: faFileVideo,
};

const ActionCard = ({ icon, onClick, className = '', disabled = false, selected = false, title = '', sizeAuto = false, secondary = false }) => {
  const faIcon = icons[icon] || null;

  return (
    <Action
      onClick={onClick}
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
