import * as style from './style.module.css';

const Divider = ({ className = '', transparent = true }) => <hr className={`${style.divider} ${transparent ? style.transparent : ''} ${className}`} />;

export default Divider;
