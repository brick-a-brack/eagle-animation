import { uniqueId } from 'lodash';
import { useMemo } from 'react';
import CustomTooltip from '../Tooltip';
import * as style from './style.module.css';

const Button = ({ icon, onClick, title = '', size = 'mini', disabled = false, selected = false, selectedColor = 'normal', tooltipPosition = 'TOP', ...rest }) => {
  const uid = useMemo(() => uniqueId(), []);
  return (
    <div {...{ ...rest, children: null }} className={style.mainContainer}>
      <div
        {...(title ? { 'data-tooltip-content': title, id: `button-${uid}` } : {})}
        id={`button-${uid}`}
        role="button"
        tabIndex={0}
        onClick={() => onClick && onClick()}
        className={`${size === 'mini' ? style.buttonMini : style.button} ${selected && selectedColor === 'normal' ? style.selected : ''} ${selected && selectedColor === 'warning' ? style.selectedWarning : ''}  ${disabled ? style.disabled : ''}`}
      >
        {icon}
      </div>
      {title && <CustomTooltip place={tooltipPosition.toLowerCase()} anchorId={`button-${uid}`} />}
    </div>
  );
};

export default Button;
