import LogoSVG from './assets/logo.svg?jsx';
import IconSVG from './assets/icon.svg?jsx';

import * as style from './style.module.css';

const Logo = ({ type = 'logo', className = '' }) => {
  const classNames = `${style.logo} ${className}`.trim();

  if (type === 'LOGO') {
    return (
      <div className={classNames}>
        <LogoSVG />
      </div>
    );
  }

  if (type === 'ICON') {
    return (
      <div className={classNames}>
        <IconSVG />
      </div>
    );
  }

  return null;
};

export default Logo;
