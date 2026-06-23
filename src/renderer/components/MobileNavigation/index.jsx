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

const RenderActions = ({ actions = [], tooltipPosition = 'NONE' }) => {
  return actions.map((action) => (
    <Button
      label={action.title || null}
      onClick={action.onClick}
      icon={action.icon || null}
      color={action.color || undefined}
      selectedColor={action.selectedColor || undefined}
      disabled={action.disabled || undefined}
      selected={action.selected || undefined}
      tooltipPosition={tooltipPosition}
    />
  ));
};

const MobileNavigation = ({
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
  withBorder = false,
}) => {
  return (
    <>
      {showLeftActions && (
        <div className={`${style.headerBar} ${style.headerBarLeft} ${withBorder ? style.withBorder : ''}`}>
          <div className={style.top}>
            {showLogo && <img src={iconUrl} className={style.logo} alt="Logo" />}
            {topLeftActions.length > 0 && <RenderActions actions={topLeftActions} tooltipPosition="NONE" />}
          </div>
          <div className={style.center}>{middleLeftActions.length > 0 && <RenderActions actions={middleLeftActions} tooltipPosition="NONE" />}</div>
          <div className={style.bottom}>{bottomLeftActions.length > 0 && <RenderActions actions={bottomLeftActions} tooltipPosition="NONE" />}</div>
        </div>
      )}
      {showRightActions && (
        <div className={`${style.headerBar} ${style.headerBarRight} ${withBorder ? style.withBorder : ''}`}>
          <div className={style.top}>{topRightActions.length > 0 && <RenderActions actions={topRightActions} tooltipPosition="NONE" />}</div>
          <div className={style.center}>{middleRightActions.length > 0 && <RenderActions actions={middleRightActions} tooltipPosition="NONE" />}</div>
          <div className={style.bottom}>{bottomRightActions.length > 0 && <RenderActions actions={bottomRightActions} tooltipPosition="NONE" />}</div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
