import Button from '@components/Button';

import iconUrl from './assets/icon.svg';

import * as style from './style.module.css';

const RenderActions = ({ actions = [], tooltipPosition = 'NONE' }) => {
  return actions.map((action, i) => (
    <Button
      key={action.key || action.title || i}
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
