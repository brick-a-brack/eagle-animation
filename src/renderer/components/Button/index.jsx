import Tooltip from '@components/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { uniqueId } from 'lodash';
import { useMemo } from 'react';

import * as style from './style.module.css';

const Button = ({ icon, onClick, title = '', disabled = false, selected = false, color = 'normal', selectedColor = 'normal', tooltipPosition = 'TOP', ...rest }) => {
  const uid = useMemo(() => uniqueId(), []);
  return (
    <div {...{ ...rest, children: null }} className={style.mainContainer}>
      <div
        {...(title ? { 'data-tooltip-content': title, id: `button-${uid}` } : {})}
        id={`button-${uid}`}
        role="button"
        tabIndex={0}
        onClick={() => onClick && onClick()}
        className={`${style.button} ${color === 'primary' && style.colorPrimary} ${selected && selectedColor === 'normal' ? style.selected : ''} ${selected && selectedColor === 'warning' ? style.selectedWarning : ''}  ${disabled ? style.disabled : ''}`}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
      {title && <Tooltip place={tooltipPosition.toLowerCase()} anchorId={`button-${uid}`} />}
    </div>
  );
};

export default Button;
