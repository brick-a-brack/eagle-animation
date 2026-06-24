import Button from '@components/Button';

import * as style from './style.module.css';

const RenderActions = ({ actions = [], tooltipPosition = 'NONE' }) => {
  return actions.map((action) => <Button label={action.title || null} onClick={action.onClick} icon={action.icon || null} tooltipPosition={tooltipPosition} />);
};

const DesktopNavigation = ({ onAction = null, leftActions = [], rightActions = [], children = null, leftChildren = null, rightChildren = null, title = '', withBorder = false }) => {
  return (
    <div className={`${style.headerBar} ${withBorder && style.withBorder}`}>
      <div className={style.left}>
        {leftActions.length > 0 && <RenderActions actions={leftActions} tooltipPosition="NONE" />}
        {leftChildren}
      </div>
      {(children || title) && (
        <div className={style.center}>
          {children && children}
          {!children && title && <div className={style.title}>{title}</div>}
        </div>
      )}
      <div className={style.right}>
        {rightChildren}
        {rightActions.length > 0 && <RenderActions actions={rightActions} tooltipPosition="NONE" />}
      </div>
    </div>
  );
};

export default DesktopNavigation;
