import { Tooltip as ReactTooltip } from 'react-tooltip';

import * as style from './style.module.css';

const Tooltip = ({ ...rest }) => <ReactTooltip className={style.tooltip} delayShow={0} delayHide={0} offset={15} {...rest} />;

export default Tooltip;
