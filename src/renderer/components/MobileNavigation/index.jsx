import ButtonsGroup from '@components/ButtonsGroup';

import iconUrl from './assets/icon.svg';

import * as style from './style.module.css';

const MobileNavigation = ({
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
            {topLeftActions.length > 0 && <ButtonsGroup actions={topLeftActions} tooltipPosition="NONE" />}
          </div>
          <div className={style.center}>{middleLeftActions.length > 0 && <ButtonsGroup actions={middleLeftActions} tooltipPosition="NONE" />}</div>
          <div className={style.bottom}>{bottomLeftActions.length > 0 && <ButtonsGroup actions={bottomLeftActions} tooltipPosition="NONE" />}</div>
        </div>
      )}
      {showRightActions && (
        <div className={`${style.headerBar} ${style.headerBarRight} ${withBorder ? style.withBorder : ''}`}>
          <div className={style.top}>{topRightActions.length > 0 && <ButtonsGroup actions={topRightActions} tooltipPosition="NONE" />}</div>
          <div className={style.center}>{middleRightActions.length > 0 && <ButtonsGroup actions={middleRightActions} tooltipPosition="NONE" />}</div>
          <div className={style.bottom}>{bottomRightActions.length > 0 && <ButtonsGroup actions={bottomRightActions} tooltipPosition="NONE" />}</div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
