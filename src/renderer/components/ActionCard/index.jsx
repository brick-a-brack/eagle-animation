import Action from '../Action';
import IconFrames from './assets/frames.svg?jsx';
import IconSend from './assets/send.svg?jsx';
import IconVideo from './assets/video.svg?jsx';
import * as style from './style.module.css';

const icons = {
  FRAMES: IconFrames,
  SEND: IconSend,
  VIDEO: IconVideo,
};

const ActionCard = ({ icon, action, className = '', disabled = false, selected = false, title = '', sizeAuto = false, secondary = false }) => {
  const Icon = icons[icon] || null;

  return (
    <Action
      action={action}
      className={`${style.block} ${disabled ? style.disabled : ''}  ${selected ? style.selected : ''} ${secondary ? style.secondary : ''}  ${sizeAuto ? style.sizeAuto : ''} ${className || ''}`}
    >
      {Icon && (
        <div className={style.icon}>
          <Icon />
        </div>
      )}
      <div className={style.title}>{title || ''}</div>
    </Action>
  );
};

export default ActionCard;
