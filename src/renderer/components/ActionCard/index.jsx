import { withTranslation } from "react-i18next";

import  Action  from "../Action";
import IconFrames from 'jsx:./assets/frames.svg';
import IconSend from 'jsx:./assets/send.svg';
import IconVideo from 'jsx:./assets/video.svg';
import * as style from './style.module.css';

const icons = {
    FRAMES: IconFrames,
    SEND: IconSend,
    VIDEO: IconVideo,
};

const titles = t => ({
    FRAMES: t('Export your animation frames'),
    SEND: t('Upload and generate a code to receive the animation'),
    VIDEO: t('Export the animation as video'),
});

const ActionCard = ({ type, t, action }) => {

    const Icon = icons[type] || null;
    const title = titles(t)?.[type] || null;

    return <Action action={action} className={style.block}>
        <div className={style.icon}>{Icon && <Icon />}</div>
        <div className={style.title}>{title}</div>
    </Action>
}

export default withTranslation()(ActionCard);
