import IconSVG from './assets/icon.svg?jsx';
import LogoSVG from './assets/logo.svg?jsx';

import * as style from './style.module.css';

const Logo = ({ type = 'logo', className = '', onClick = null }) => {
  const classNames = `${style.logo} ${className}`.trim();

  if (type === 'LOGO') {
    return (
      <div className={classNames} onClick={onClick}>
        <LogoSVG />
      </div>
    );
  }

  if (type === 'ICON') {
    return (
      <div className={classNames} onClick={onClick}>
        <IconSVG />
      </div>
    );
  }

  return null;
};

export default Logo;
