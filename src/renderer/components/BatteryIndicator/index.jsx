import * as style from './style.module.css';


import IconBattery0 from 'jsx:./assets/battery-0.svg';
import IconBattery25 from 'jsx:./assets/battery-25.svg';
import IconBattery50 from 'jsx:./assets/battery-50.svg';
import IconBattery75 from 'jsx:./assets/battery-75.svg';
import IconBattery100 from 'jsx:./assets/battery-100.svg';
import IconBatteryAC from 'jsx:./assets/battery-ac.svg';
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
