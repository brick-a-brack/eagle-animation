import { Tooltip as ReactTooltip } from 'react-tooltip';

import * as style from './style.module.css';

const isTouchPrimary = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

const Tooltip = ({ ...rest }) => {
  if (isTouchPrimary) return null;
  return <ReactTooltip className={style.tooltip} delayShow={0} delayHide={0} offset={15} {...rest} />;
};

export default Tooltip;
