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

import iconUrl from './assets/icon.svg';

import * as style from './style.module.css';

const RenderActions = ({ actions = [], tooltipPosition = "NONE" }) => {
    return actions.map((action) => <Button
        label={action.title || null}
        onClick={action.onClick}
        icon={action.icon || null}
        tooltipPosition={tooltipPosition}
    />);
}

const MobileLayout = ({
    onAction = null,
    topLeftActions = [],
    middleLeftActions = [],
    bottomLeftActions = [],
    topRightActions = [],
    middleRightActions = [],
    bottomRightActions = [],
    showLogo = false,
    showLeftActions = false,
    showRightActions = false,
}) => {
    return (<>
        {showLeftActions && <div className={`${style.headerBar} ${style.headerBarLeft}`}>
            <div className={style.top}>
                {showLogo && <img src={iconUrl} className={style.logo} alt="Logo" />}
                {topLeftActions.length > 0 && <RenderActions actions={topLeftActions} tooltipPosition="RIGHT" />}
            </div>
            <div className={style.center}>
                {middleLeftActions.length > 0 && <RenderActions actions={middleLeftActions} tooltipPosition="RIGHT" />}
            </div>
            <div className={style.bottom}>
                {bottomLeftActions.length > 0 && <RenderActions actions={bottomLeftActions} tooltipPosition="RIGHT" />}
            </div>
        </div>}
        {showRightActions && (<div className={`${style.headerBar} ${style.headerBarRight}`}>
            <div className={style.top}>
                {topRightActions.length > 0 && <RenderActions actions={topRightActions} tooltipPosition="LEFT" />}
            </div>
            <div className={style.center}>
                {middleRightActions.length > 0 && <RenderActions actions={middleRightActions} tooltipPosition="LEFT" />}
            </div>
            <div className={style.bottom}>
                {bottomRightActions.length > 0 && <RenderActions actions={bottomRightActions} tooltipPosition="LEFT" />}
            </div>
        </div>)}
    </>);
};

export default MobileLayout;
