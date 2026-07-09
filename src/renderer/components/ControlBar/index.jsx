import Button from '@components/Button';
import ButtonsGroup from '@components/ButtonsGroup';
import CustomSlider from '@components/CustomSlider';
import NumberInput from '@components/NumberInput';
import PreviewIndicator from '@components/PreviewIndicator';
import Tooltip from '@components/Tooltip';
import faArrowsRepeat from '@icons/faArrowsRepeat';
import faCamera from '@icons/faCamera';
import faDiamondHalfStroke from '@icons/faDiamondHalfStroke';
import faEllipsisVertical from '@icons/faEllipsisVertical';
import faEraser from '@icons/faEraser';
import faEye from '@icons/faEye';
import faEyeSlash from '@icons/faEyeSlash';
import faForwardFast from '@icons/faForwardFast';
import faFrame from '@icons/faFrame';
import faImage from '@icons/faImage';
import faImageCircleMinus from '@icons/faImageCircleMinus';
import faImageCirclePlus from '@icons/faImageCirclePlus';
import faPen from '@icons/faPen';
import faPlay from '@icons/faPlay';
import faSliders from '@icons/faSliders';
import faStop from '@icons/faStop';
import faTrash from '@icons/faTrash';
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
  gridModes = [],
  gridColumns = 1,
  gridLines = 1,
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
  canUseMaskingEditor = false,
  isCurrentFrameHidden = false,
  showCameraSettings = false,
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
    handleAction('FPS_CHANGE', Number(values.fps) || 1)();
  }, [JSON.stringify(formValues)]);

  useEffect(() => {
    if (Number(getValues().fps) !== fps) {
      setValue('fps', fps);
    }
  }, [fps]);

  const isFrameSelected = !isPlaying && framePosition !== false;
  const isGridUnavailable = gridModes.length === 1 && gridModes?.includes('GRID') && Number(gridColumns) === 0 && Number(gridLines) === 0;

  return (
    <>
      <div className={`${style.container} ${style.regularLayout}`}>
        <div className={`${style.subcontainer} ${style.left}`}>
          {isFrameSelected && <Button className={style.imageMoreButton} title={t('Frame actions')} icon={faImage} onClick={handleAction('SHOW_PICTURE_OPTIONS')} />}
          <Button
            className={style.moreButton}
            title={isFrameSelected ? t('Frame actions') : t('More')}
            icon={isFrameSelected ? faImage : faEllipsisVertical}
            onClick={handleAction(isFrameSelected ? 'SHOW_PICTURE_OPTIONS' : 'SHOW_TOOLS')}
            disabled={isPlaying}
          />
          {isFrameSelected && (
            <ButtonsGroup
              groupClassName={style.imageGroupActions}
              actions={[
                {
                  title: t('Open masking editor'),
                  onClick: handleAction('MASKING_EDITOR'),
                  icon: faPen,
                  disabled: !canUseMaskingEditor,
                },
                {
                  title: isCurrentFrameHidden ? t('Unhide frame') : t('Hide frame'),
                  onClick: handleAction('HIDE_FRAME'),
                  icon: isCurrentFrameHidden ? faEye : faEyeSlash,
                },
                {
                  title: t('Deduplicate frame'),
                  onClick: handleAction('DEDUPLICATE'),
                  icon: faImageCircleMinus,
                  disabled: !canDeduplicate,
                },
                {
                  title: t('Duplicate frame'),
                  onClick: handleAction('DUPLICATE'),
                  icon: faImageCirclePlus,
                },
                {
                  title: t('Remove frame'),
                  onClick: handleAction('DELETE_FRAME'),
                  icon: faTrash,
                },
              ]}
              merge={true}
              tooltipPosition="TOP"
            />
          )}

          <ButtonsGroup
            groupClassName={style.liveViewActions}
            actions={[
              {
                title: t('Difference'),
                selected: differenceStatus,
                onClick: handleAction('DIFFERENCE'),
                icon: faDiamondHalfStroke,
                disabled: framePosition !== false,
              },
              {
                title: gridStatus ? t('Disable grid') : t('Enable grid'),
                selected: gridStatus,
                onClick: handleAction('GRID'),
                icon: faFrame,
                disabled: framePosition !== false || isGridUnavailable,
                warning: isGridUnavailable
              },
            ]}
            tooltipPosition="TOP"
            merge={true}
          />

          <div className={`${style.slider} ${differenceStatus || framePosition !== false ? style.sliderDisabled : ''}`} id="onion" data-tooltip-id="onion">
            <CustomSlider step={0.01} min={0} max={1} value={onionValue} onChange={differenceStatus || framePosition !== false ? () => { } : (value) => handleAction('ONION_CHANGE', value)()} />
          </div>
        </div>
        <div className={`${style.subcontainer} ${style.center}`}>
          <Button title={t('Camera settings')} selected={showCameraSettings} onClick={isPlaying ? () => { } : handleAction('CAMERA_SETTINGS')} icon={faSliders} disabled={isPlaying} />
          <Button disabled={isTakingPicture || !isCameraReady} onClick={handleAction('TAKE_PICTURE')} color="primary" icon={faCamera} title={t('Take a picture')} />

          <Button
            title={t('Masking mode ({{status}})', { status: (MASKING_MODES[maskingMode] || MASKING_MODES.DISABLED)(t) })}
            tag={maskingMode !== 'DISABLED' ? (MASKING_MODES[maskingMode] || MASKING_MODES.DISABLED)(t).slice(0, 1) : ''}
            selected={maskingMode !== 'DISABLED'}
            onClick={framePosition === false ? handleAction('TOGGLE_MASKING_MODE') : () => { }}
            size="mini"
            icon={faEraser}
            disabled={isPlaying}
          />
        </div>
        <div className={`${style.subcontainer} ${style.right}`}>
          <Button
            className={style.playStandaloneButton}
            selectedColor="warning"
            title={!isPlaying ? t('Play') : t('Stop')}
            selected={isPlaying}
            onClick={handleAction('PLAY')}
            icon={isPlaying ? faStop : faPlay}
          />

          <PreviewIndicator className={style.previewIndicator} framePosition={framePosition} frameQuantity={frameQuantity} animationFrameQuantity={totalAnimationFrames} fps={fps} />

          <ButtonsGroup
            groupClassName={style.playingGroupActions}
            actions={[
              {
                selectedColor: 'warning',
                title: !isPlaying ? t('Play') : t('Stop'),
                selected: isPlaying,
                onClick: handleAction('PLAY'),
                icon: isPlaying ? faStop : faPlay,
              },
              {
                title: t('Loop'),
                onClick: handleAction('LOOP'),
                selected: loopStatus,
                icon: faArrowsRepeat,
              },
              {
                title: t('Short play'),
                onClick: handleAction('SHORT_PLAY'),
                selected: shortPlayStatus,
                icon: faForwardFast,
              },
            ]}
            tooltipPosition="TOP"
            merge={true}
          />

          <NumberInput
            className={style.fpsInput}
            onBlur={() => handleAction('FPS_BLUR')()}
            onFocus={() => handleAction('FPS_FOCUS')()}
            style={{ marginLeft: '5px', height: '42px', borderRadius: '21px' }}
            min={1}
            max={60}
            tag={t('FPS')}
            register={register('fps')}
          />
          <Tooltip id="onion" content={t('Onion skin')} />
        </div>
      </div>
    </>
  );
};

export default withTranslation()(ControlBar);
