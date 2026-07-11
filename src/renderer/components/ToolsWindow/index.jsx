import CustomSlider from '@components/CustomSlider';
import Heading from '@components/Heading';
import NumberInput from '@components/NumberInput';
import Switch from '@components/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faArrowsRepeat from '@icons/faArrowsRepeat';
import faDiamondHalfStroke from '@icons/faDiamondHalfStroke';
import faForwardFast from '@icons/faForwardFast';
import faFrame from '@icons/faFrame';
import faLayer from '@icons/faLayer';
import faSignal from '@icons/faSignal';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const ToolsWindow = ({ t, gridStatus = false, differenceStatus = false, onionValue = 1, loopStatus = false, shortPlayStatus = false, fps = 12, framePosition = false, onAction = null }) => {
  const form = useForm({
    mode: 'all',
    defaultValues: {
      fps,
    },
  });
  const { watch, register, getValues, setValue } = form;
  const formValues = watch();

  const handleAction = (action, args) => () => {
    if (onAction) {
      onAction(action, args);
    }
  };

  // Keep the FPS field in sync with the project value and propagate user changes
  useEffect(() => {
    const values = getValues();
    if (onAction) {
      onAction('FPS_CHANGE', Number(values.fps) || 1);
    }
  }, [JSON.stringify(formValues)]);

  useEffect(() => {
    if (Number(getValues().fps) !== fps) {
      setValue('fps', fps);
    }
  }, [fps]);

  const isFrameSelected = framePosition !== false;
  const onionDisabled = differenceStatus || isFrameSelected;

  return (
    <div className={style.actions}>
      <Heading h={1} className={style.title}>
        {t('Tools & playback')}
      </Heading>

      <div className={`${style.row} ${isFrameSelected ? style.disabled : ''}`}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faFrame} className={style.icon} />
          {t('Grid')}
        </span>
        <Switch checked={gridStatus} disabled={isFrameSelected} onChange={isFrameSelected ? () => {} : handleAction('GRID')} />
      </div>

      <div className={`${style.row} ${isFrameSelected ? style.disabled : ''}`}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faDiamondHalfStroke} className={style.icon} />
          {t('Difference')}
        </span>
        <Switch checked={differenceStatus} disabled={isFrameSelected} onChange={isFrameSelected ? () => {} : handleAction('DIFFERENCE')} />
      </div>

      <div className={`${style.row} ${onionDisabled ? style.disabled : ''}`}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faLayer} className={style.icon} />
          {t('Onion skin')}
        </span>
        <CustomSlider step={0.01} min={0} max={1} value={onionValue} disabled={onionDisabled} maxWidth="160px" onChange={onionDisabled ? () => {} : (value) => handleAction('ONION_CHANGE', value)()} />
      </div>

      <div className={style.row}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faArrowsRepeat} className={style.icon} />
          {t('Loop')}
        </span>
        <Switch checked={loopStatus} onChange={handleAction('LOOP')} />
      </div>

      <div className={style.row}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faForwardFast} className={style.icon} />
          {t('Short play')}
        </span>
        <Switch checked={shortPlayStatus} onChange={handleAction('SHORT_PLAY')} />
      </div>

      <div className={style.row}>
        <span className={style.label}>
          <FontAwesomeIcon icon={faSignal} className={style.icon} />
          {t('Speed')}
        </span>
        <NumberInput min={1} max={60} tag={t('FPS')} register={register('fps')} />
      </div>
    </div>
  );
};

export default withTranslation()(ToolsWindow);
