import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as style from './style.module.css';

const Tag = ({ tag = '', icon, color, className = '', position = 'TOP-LEFT', size = 'NORMAL' }) => (
  <span
    className={`${style.tag} ${className} ${size === 'SMALL' ? style.mini : ''} ${tag === '' ? style.noSvgSpace : ''} ${position.includes('LEFT') ? style.left : style.right} ${position.includes('BOTTOM') ? style.bottom : style.top}`}
    style={{ backgroundColor: color }}
  >
    {icon && <FontAwesomeIcon icon={icon} />}
    {tag}
  </span>
);

export default Tag;
