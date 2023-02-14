import Action from "../Action";
import IconFrames from 'jsx:./assets/frames.svg';
import IconSend from 'jsx:./assets/send.svg';
import IconVideo from 'jsx:./assets/video.svg';
import * as style from './style.module.css';

const icons = {
    FRAMES: IconFrames,
    SEND: IconSend,
    VIDEO: IconVideo,
};

const ActionCard = ({ icon, action, disabled = false, selected = false, title = '', sizeAuto = false, secondary = false }) => {
    const Icon = icons[icon] || null;

    return <Action action={action} className={`${style.block} ${disabled ? style.disabled : ''}  ${selected ? style.selected : ''} ${secondary ? style.secondary : ''}  ${sizeAuto ? style.sizeAuto : ''}`}>
        {Icon && <div className={style.icon}><Icon /></div>}
        <div className={style.title}>{title || ''}</div>
    </Action>
}

export default ActionCard;
