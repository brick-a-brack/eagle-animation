import { withTranslation } from 'react-i18next';

import Button from '../Button';
import Camera from 'jsx:./assets/camera.svg';
import IconPlay from 'jsx:./assets/play.svg';
import IconStop from 'jsx:./assets/stop.svg';
import IconShortPlay from 'jsx:./assets/short-play.svg';
import IconLoop from 'jsx:./assets/loop.svg';
import IconCompare from 'jsx:./assets/compare.svg';
import IconRemove from 'jsx:./assets/remove.svg';
import IconGrid from 'jsx:./assets/grid.svg';
import IconDuplicate from 'jsx:./assets/duplicate.svg';
import IconDeduplicate from 'jsx:./assets/deduplicate.svg';
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

            {!isPlaying && framePosition !== false && <Button title={t('Remove frame')} onClick={handleAction('DELETE_FRAME')} size="mini" icon={<IconRemove />} />}
            {!isPlaying && framePosition !== false && canDeduplicate && <Button title={t('Deduplicate frame')} onClick={handleAction('DEDUPLICATE')} size="mini" icon={<IconDeduplicate />} />}
            {!isPlaying && framePosition !== false && <Button title={t('Duplicate frame')} onClick={handleAction('DUPLICATE')} size="mini" icon={<IconDuplicate />} />}

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
        </div>
        <Button disabled={isTakingPicture || !isCameraReady} onClick={handleAction('TAKE_PICTURE')} size="normal" icon={<Camera />} />
        <div className={`${style.subcontainer} ${style.right}`}>
            <div className={style.progress}>
                {framePosition === false && <span className={style.live}>{t('Live')}</span>}
                <span>{framePosition !== false && framePosition}</span>
                <span className={style.separator}>{' / '}</span>
                <span>{frameQuantity}</span>
            </div>

            <Button title={!isPlaying ? t('Play') : t('Stop')} selected={isPlaying} onClick={handleAction('PLAY')} size="mini" icon={isPlaying ? <IconStop /> : <IconPlay />} />
            <Button title={t('Loop')} onClick={handleAction('LOOP')} selected={loopStatus} size="mini" icon={<IconLoop />} />
            <Button title={t('Short play')} onClick={handleAction('SHORT_PLAY')} selected={shortPlayStatus} size="mini" icon={<IconShortPlay />} />
            <NumberInput style={{ marginLeft: 'var(--space-big)' }} min={1} max={60} tag={t('FPS')} defaultValue={fps} onValueChange={v => handleAction('FPS_CHANGE', v)()} />
            <CustomTooltip anchorId="onion" />
        </div>
    </div>
}

export default withTranslation()(ControlBar);
