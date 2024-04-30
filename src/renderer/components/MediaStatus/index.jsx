import { withTranslation } from 'react-i18next';

import ActionCard from '../ActionCard';
import FormGroup from '../FormGroup';

import * as style from './style.module.css';

const MediaStatus = ({ type, permission, action, t }) => {
  return (
    <FormGroup
      label={type === 'camera' ? t('Camera access') : t('Microphone access')}
      description={type === 'camera' ? t('Grant access to the camera to capture photos') : t('Grant access to the microphone to record voices and sounds')}
    >
      {permission === 'granted' && <div className={style.granted}>{t('Acces granted')}</div>}
      {permission !== 'granted' && <ActionCard sizeAuto={true} action={action} title={t('Grant permission')} />}
    </FormGroup>
  );
};

export default withTranslation()(MediaStatus);
