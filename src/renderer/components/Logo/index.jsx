import LogoSVG from './assets/logo.svg?jsx';

import * as style from './style.module.css';

const Logo = () => {
  return (
    <div className={style.logo}>
      <LogoSVG />
    </div>
  );
};

export default Logo;
