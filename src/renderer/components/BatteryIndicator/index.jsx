import * as style from './style.module.css';

import { withTranslation } from 'react-i18next';

import faBatteryBolt from '../../icons/faBatteryBolt';
import faBatteryFull from '../../icons/faBatteryFull';
import faBatteryThreeQuarters from '../../icons/faBatteryThreeQuarters';
import faBatteryHalf from '../../icons/faBatteryHalf';
import faBatteryQuarter from '../../icons/faBatteryQuarter';
import faBatteryLow from '../../icons/faBatteryLow';
import faBatteryEmpty from '../../icons/faBatteryEmpty';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const getInfos = (value) => {
  if (value > 100 || value === 'AC') {
    return { icon: faBatteryBolt, value: null, status: 'high' };
  }
  if (value === 100) {
    return { icon: faBatteryFull, value, status: 'high' };
  }
  if (value >= 75) {
    return { icon: faBatteryThreeQuarters, value, status: 'high' };
  }
  if (value >= 50) {
    return { icon: faBatteryHalf, value, status: 'medium' };
  }
  if (value >= 25) {
    return { icon: faBatteryQuarter, value, status: 'medium' };
  }
  if (value >= 10) {
    return { icon: faBatteryLow, value, status: 'low' };
  }
  return { icon: faBatteryEmpty, value, status: 'low' };
};

const BatteryIndicator = ({ value = 0, t }) => {
  const { icon, value: parsedValue, status } = getInfos(value);

  return (
    <div className={`${style.indicator} ${style[status]}`}>
      <FontAwesomeIcon icon={icon} />
      {parsedValue !== null && <span>{t('{{value}}%', { value: parsedValue })}</span>}
    </div>
  );
};

export default withTranslation()(BatteryIndicator);
