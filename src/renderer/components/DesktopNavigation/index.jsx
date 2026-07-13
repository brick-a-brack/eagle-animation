import ButtonsGroup from '@components/ButtonsGroup';
import Logo from '@components/Logo';

import * as style from './style.module.css';

const DesktopNavigation = ({ leftActions = [], rightActions = [], children = null, title = '', showLogo = false, withBorder = true }) => {
  return (
    <div className={`${style.headerBar} ${withBorder && style.withBorder}`}>
      <div className={style.left}>
        {showLogo && <Logo type="LOGO" className={style.logoDesktop} />}
        {showLogo && <Logo type="ICON" className={style.logoMobile} />}
        {leftActions.length > 0 && <ButtonsGroup actions={leftActions} tooltipPosition="NONE" />}
      </div>
      {(children || title) && (
        <div className={style.center}>
          {children && children}
          {!children && title && <div className={style.title}>{title}</div>}
        </div>
      )}
      <div className={style.right}>{rightActions.length > 0 && <ButtonsGroup actions={rightActions} tooltipPosition="NONE" />}</div>
    </div>
  );
};

export default DesktopNavigation;
