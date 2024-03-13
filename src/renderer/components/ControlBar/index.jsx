import { withTranslation } from 'react-i18next';

import Button from '../Button';
import IconCamera from './assets/camera.svg?jsx';
import IconCameraSettings from './assets/camera-settings.svg?jsx';
import IconPlay from './assets/play.svg?jsx';
import IconStop from './assets/stop.svg?jsx';
import IconShortPlay from './assets/short-play.svg?jsx';
import IconLoop from './assets/loop.svg?jsx';
import IconCompare from './assets/compare.svg?jsx';
import IconRemove from './assets/remove.svg?jsx';
import IconGrid from './assets/grid.svg?jsx';
import IconDuplicate from './assets/duplicate.svg?jsx';
import IconDeduplicate from './assets/deduplicate.svg?jsx';
import CustomTooltip from '../Tooltip';
import CustomSlider from '../CustomSlider';
import NumberInput from '../NumberInput';
import * as style from './style.module.css';

const ControlBar = ({
    gridStatus = false,
    differenceStatus = false,
    onionValue = 1,
    isPlaying = false,
    isTakingPicture = false,
    isCameraReady = false,
    shortPlayStatus = false,
    loopStatus = false,
    fps = 12,
    framePosition = false,
    frameQuantity = 0,
    canDeduplicate = false,
    showCameraSettings = false,
    cameraSettingsAvailable = true,
    gridModes = [],
    onAction = null,
    t,
}) => {
    const handleAction = (action, args) => () => {
        if (onAction) {
            onAction(action, args);
        }
    }

    return <div className={style.container}>
        <div className={`${style.subcontainer} ${style.left}`}>

            {!isPlaying && framePosition !== false && canDeduplicate && <Button title={t('Deduplicate frame')} onClick={handleAction('DEDUPLICATE')} size="mini" icon={<IconDeduplicate />} />}
            {!isPlaying && framePosition !== false && <Button title={t('Duplicate frame')} onClick={handleAction('DUPLICATE')} size="mini" icon={<IconDuplicate />} />}
            {!isPlaying && framePosition !== false && <Button title={t('Remove frame')} onClick={handleAction('DELETE_FRAME')} size="mini" icon={<IconRemove />} />}

            <Button style={{ marginLeft: 'var(--space-big)' }} title={t('Difference')} selected={differenceStatus} onClick={handleAction('DIFFERENCE')} size="mini" icon={<IconCompare />} />
            {(gridModes.includes('GRID') || gridModes.includes('CENTER') || gridModes.includes('MARGINS')) && <Button title={gridStatus ? t('Disable grid') : t('Enable grid')} selected={gridStatus} onClick={handleAction('GRID')} size="mini" icon={<IconGrid />} />}

            <div className={style.slider} id="onion" data-tooltip-content={t('Onion blending')}>
                <CustomSlider
                    step={0.01}
                    min={0}
                    max={1}
                    value={onionValue}
                    onChange={value => handleAction('ONION_CHANGE', value)()}
                />
            </div>

            {cameraSettingsAvailable && <Button style={{ marginLeft: 'var(--space-big)' }} title={t('Camera settings')} selected={showCameraSettings} onClick={handleAction('CAMERA_SETTINGS')} size="mini" icon={<IconCameraSettings />} />}
        </div>
        <Button disabled={isTakingPicture || !isCameraReady} onClick={handleAction('TAKE_PICTURE')} size="normal" icon={<IconCamera />} />
        <div className={`${style.subcontainer} ${style.right}`}>
            <div className={style.progress}>
                {framePosition === false && <span className={style.live}>{t('Live')}</span>}
                <span>{framePosition !== false && framePosition}</span>
                <span className={style.separator}>{' / '}</span>
                <span>{frameQuantity}</span>
            </div>

            <Button selectedColor="warning" title={!isPlaying ? t('Play') : t('Stop')} selected={isPlaying} onClick={handleAction('PLAY')} size="mini" icon={isPlaying ? <IconStop /> : <IconPlay />} />
            <Button title={t('Loop')} onClick={handleAction('LOOP')} selected={loopStatus} size="mini" icon={<IconLoop />} />
            <Button title={t('Short play')} onClick={handleAction('SHORT_PLAY')} selected={shortPlayStatus} size="mini" icon={<IconShortPlay />} />
            <NumberInput onBlur={() => handleAction('FPS_BLUR')()} onFocus={() => handleAction('FPS_FOCUS')()} style={{ marginLeft: 'var(--space-big)' }} min={1} max={60} tag={t('FPS')} defaultValue={fps} onValueChange={v => handleAction('FPS_CHANGE', v)()} />
            <CustomTooltip anchorId="onion" />
        </div>
    </div>
}

export default withTranslation()(ControlBar);
