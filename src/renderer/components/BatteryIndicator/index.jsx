import * as style from './style.module.css';


import IconBattery0 from './assets/battery-0.svg?jsx';
import IconBattery25 from './assets/battery-25.svg?jsx';
import IconBattery50 from './assets/battery-50.svg?jsx';
import IconBattery75 from './assets/battery-75.svg?jsx';
import IconBattery100 from './assets/battery-100.svg?jsx';
import IconBatteryAC from './assets/battery-ac.svg?jsx';
import { withTranslation } from 'react-i18next';

const getInfos = (value) => {
    if (value > 100) {
        return { icon: IconBatteryAC, value: 100, status: 'high' };
    }
    if (value === 100) {
        return { icon: IconBattery100, value, status: 'high' };
    }
    if (value >= 75) {
        return { icon: IconBattery75, value, status: 'high' };
    }
    if (value >= 50) {
        return { icon: IconBattery50, value, status: 'medium' };
    }
    if (value >= 25) {
        return { icon: IconBattery25, value, status: 'medium' };
    }
    return { icon: IconBattery0, value, status: 'low' };
}

const BatteryIndicator = ({ value = 0, t }) => {
    const { icon: Icon, value: parsedValue, status } = getInfos(value);

    return <div className={`${style.indicator} ${style[status]}`}>
        <Icon />
        <span>{t('{{value}}%', { value: parsedValue })}</span>
    </div>

};

export default withTranslation()(BatteryIndicator);
