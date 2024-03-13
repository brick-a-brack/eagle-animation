import { Tooltip } from 'react-tooltip';

import * as style from './style.module.css';

const CustomTooltip = ({ ...rest }) => <Tooltip className={style.tooltip} effect="solid" delayShow={0} delayHide={0} offset={15} {...rest} />;

export default CustomTooltip;
