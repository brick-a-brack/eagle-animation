import ButtonsGroup from '@components/ButtonsGroup';

import * as style from './style.module.css';

const DesktopNavigation = ({ leftActions = [], rightActions = [], children = null, leftChildren = null, rightChildren = null, title = '', withBorder = false }) => {
  return (
    <div className={`${style.headerBar} ${withBorder && style.withBorder}`}>
      <div className={style.left}>
        {leftActions.length > 0 && <ButtonsGroup actions={leftActions} tooltipPosition="NONE" />}
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
        {rightActions.length > 0 && <ButtonsGroup actions={rightActions} tooltipPosition="NONE" />}
      </div>
    </div>
  );
};

export default DesktopNavigation;
