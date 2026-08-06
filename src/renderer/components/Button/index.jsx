import Tooltip from '@components/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { uniqueId } from 'lodash';
import { useMemo } from 'react';

import * as style from './style.module.css';

const SIZE_CLASS = { small: style.sizeSmall, normal: style.sizeNormal, large: style.sizeLarge };
const COLOR_CLASS = { primary: style.colorPrimary, ghost: style.colorGhost, link: style.colorLink };

const Button = ({
  icon = null,
  label = '',
  className = '',
  onClick,
  title = '',
  tag = '',
  size = 'normal',
  disabled = false,
  selected = false,
  color = 'normal',
  selectedColor = 'normal',
  tooltipPosition = 'TOP',
  warning = '',
  dataTour = undefined,
  ...rest
}) => {
  const uid = useMemo(() => uniqueId(), []);
  const hasLabel = Boolean(label);

  const classNames = [
    style.button,
    SIZE_CLASS[size] || SIZE_CLASS.normal,
    hasLabel ? style.hasLabel : '',
    COLOR_CLASS[color] || '',
    selected && selectedColor === 'normal' ? style.selected : '',
    selected && selectedColor === 'warning' ? style.selectedWarning : '',
    disabled ? style.disabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...{ ...rest, children: null }} className={`${style.mainContainer} ${className || ''}`}>
      <div id={`button-${uid}`} data-tooltip-id={`button-${uid}`} data-tour={dataTour} role="button" tabIndex={0} onClick={() => onClick && !disabled && onClick()} className={classNames}>
        {icon && (typeof icon === 'string' ? <img src={icon} /> : <FontAwesomeIcon icon={icon} />)}
        {hasLabel && <span className={style.label}>{label}</span>}
        {(warning || tag) && (
          <span className={`${style.tag} ${warning ? style.warning : ''}`} title={warning || ''}>
            {warning ? '!' : tag}
          </span>
        )}
      </div>
      {title && tooltipPosition.toLowerCase() !== 'none' && <Tooltip content={title} place={tooltipPosition.toLowerCase()} id={`button-${uid}`} />}
    </div>
  );
};

export default Button;
