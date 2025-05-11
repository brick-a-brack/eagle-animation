import Button from '@components/Button';
import CustomSlider from '@components/CustomSlider';
import NumberInput from '@components/NumberInput';
import PreviewIndicator from '@components/PreviewIndicator';
import Tooltip from '@components/Tooltip';
import faArrowsRepeat from '@icons/faArrowsRepeat';
import faCamera from '@icons/faCamera';
import faDiamondHalfStroke from '@icons/faDiamondHalfStroke';
import faForwardFast from '@icons/faForwardFast';
import faFrame from '@icons/faFrame';
import faImageCircleMinus from '@icons/faImageCircleMinus';
import faImageCirclePlus from '@icons/faImageCirclePlus';
import faImageEye from '@icons/faImageEye';
import faImageEyeSlash from '@icons/faImageEyeSlash';
import faImageSlash from '@icons/faImageSlash';
import faEraser from '@icons/faEraser';
import faPlay from '@icons/faPlay';
import faSliders from '@icons/faSliders';
import faStop from '@icons/faStop';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const MASKING_MODES = {
  DISABLED: (t) => t('Disabled'),
  UNIQUE: (t) => t('Unique'),
  CONTINUOUS: (t) => t('Continuous'),
};

const ControlBar = ({
  gridStatus = false,
  differenceStatus = false,
  onionValue = 1,
  isPlaying = false,
  isTakingPicture = false,
  isCameraReady = false,
  shortPlayStatus = false,
  loopStatus = false,
  maskingMode = 'DISABLED',
  fps = 12,
  framePosition = false,
  frameQuantity = 0,
  canDeduplicate = false,
  isCurrentFrameHidden = false,
  showCameraSettings = false,
  gridModes = [],
  onAction = null,
  totalAnimationFrames = 0,
  t,
}) => {
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

  useEffect(() => {
    const values = getValues();
    handleAction('FPS_CHANGE', values.fps)();
  }, [JSON.stringify(formValues)]);

  useEffect(() => {
    setValue('fps', fps);
  }, [fps]);

  return (
    <div className={style.container}>
      <div className={`${style.subcontainer} ${style.left}`}>
        {!isPlaying && framePosition !== false && (
          <Button title={isCurrentFrameHidden ? t('Unhide frame') : t('Hide frame')} onClick={handleAction('HIDE_FRAME')} icon={isCurrentFrameHidden ? faImageEye : faImageEyeSlash} />
        )}
        {!isPlaying && framePosition !== false && canDeduplicate && <Button title={t('Deduplicate frame')} onClick={handleAction('DEDUPLICATE')} icon={faImageCircleMinus} />}
        {!isPlaying && framePosition !== false && <Button title={t('Duplicate frame')} onClick={handleAction('DUPLICATE')} icon={faImageCirclePlus} />}
        {!isPlaying && framePosition !== false && <Button title={t('Remove frame')} onClick={handleAction('DELETE_FRAME')} icon={faImageSlash} />}

        <Button style={{ marginLeft: 'var(--space-big)' }} title={t('Difference')} selected={differenceStatus} onClick={handleAction('DIFFERENCE')} icon={faDiamondHalfStroke} />
        {(gridModes.includes('GRID') || gridModes.includes('CENTER') || gridModes.includes('MARGINS')) && (
          <Button title={gridStatus ? t('Disable grid') : t('Enable grid')} selected={gridStatus} onClick={handleAction('GRID')} icon={faFrame} />
        )}

        <div className={`${style.slider} ${differenceStatus ? style.sliderDisabled : ''}`} id="onion" data-tooltip-content={t('Onion blending')}>
          <CustomSlider step={0.01} min={0} max={1} value={onionValue} onChange={differenceStatus ? () => { } : (value) => handleAction('ONION_CHANGE', value)()} />
        </div>
        <Button
          title={t('Masking mode ({{status}})', { status: (MASKING_MODES[maskingMode] || MASKING_MODES.DISABLED)(t) })}
          selected={maskingMode !== 'DISABLED'}
          onClick={handleAction('TOOGLE_MASKING_MODE')}
          size="mini"
          icon={faEraser}
        />
        <Button style={{ marginLeft: 'var(--space-big)' }} title={t('Camera settings')} selected={showCameraSettings} onClick={handleAction('CAMERA_SETTINGS')} icon={faSliders} />
      </div>
      <Button disabled={isTakingPicture || !isCameraReady} onClick={handleAction('TAKE_PICTURE')} color="primary" icon={faCamera} title={t('Take a picture')} />
      <div className={`${style.subcontainer} ${style.right}`}>
        <PreviewIndicator framePosition={framePosition} frameQuantity={frameQuantity} animationFrameQuantity={totalAnimationFrames} fps={fps} />
        <Button selectedColor="warning" title={!isPlaying ? t('Play') : t('Stop')} selected={isPlaying} onClick={handleAction('PLAY')} icon={isPlaying ? faStop : faPlay} />
        <Button title={t('Loop')} onClick={handleAction('LOOP')} selected={loopStatus} icon={faArrowsRepeat} />
        <Button title={t('Short play')} onClick={handleAction('SHORT_PLAY')} selected={shortPlayStatus} icon={faForwardFast} />
        <NumberInput
          onBlur={() => handleAction('FPS_BLUR')()}
          onFocus={() => handleAction('FPS_FOCUS')()}
          style={{ marginLeft: 'var(--space-big)' }}
          min={1}
          max={60}
          tag={t('FPS')}
          register={register('fps')}
        />
        <Tooltip anchorId="onion" />
        <Tooltip anchorId={`preview-indicator`} />
      </div>
    </div>
  );
};

export default withTranslation()(ControlBar);
