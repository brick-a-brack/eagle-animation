import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import ReactTooltip from 'react-tooltip';
import Button from '../Button';
import { ReactComponent as Camera } from './assets/camera.svg';
import { ReactComponent as IconPlay } from './assets/play.svg';
import { ReactComponent as IconDots } from './assets/dots.svg';
import { ReactComponent as IconPause } from './assets/pause.svg';
import { ReactComponent as IconShortPlay } from './assets/short-play.svg';
import { ReactComponent as IconLoop } from './assets/loop.svg';
import { ReactComponent as IconCompare } from './assets/compare.svg';
import {
    ANIMATOR_LIVE,
    ANIMATOR_BUTTON_PLAY,
    ANIMATOR_BUTTON_PAUSE,
    ANIMATOR_BUTTON_DIFFERENCE,
    ANIMATOR_BUTTON_LOOP,
    ANIMATOR_BUTTON_SHORT_PLAY,
    ANIMATOR_BUTTON_ONION,
    ANIMATOR_BUTTON_MORE,
    ANIMATOR_FPS,
    SOON
} from '../../languages';
import 'rc-slider/assets/index.css';
import styles from './styles.module.css';

class ControlBar extends Component {
    render() {
        const {
            onPlay,
            onLoop,
            onTakePicture,
            onDiff,
            onFPS,
            onOnion,
            // onGrid,
            onShortPlay
        } = this.props;

        const {
            playStatus,
            loopStatus,
            takePictureStatus,
            diffStatus,
            FPSStatus,
            onionStatus,
            // gridStatus,
            shortPlayStatus,
            frameIndex,
            frameQuantity

        } = this.props;

        return (
            <div className={styles.container}>

                <Button title={ANIMATOR_BUTTON_MORE} onClick={() => { window.alert(SOON); }} size="mini" icon={<IconDots />} />
                <Button title={ANIMATOR_BUTTON_DIFFERENCE} onClick={() => { onDiff(!diffStatus); }} size="mini" icon={<IconCompare />} />

                <div
                    style={{
                        width: '100px', display: 'inline-block', marginLeft: '22px', marginRight: '22px'
                    }}
                    data-tip={ANIMATOR_BUTTON_ONION}
                >
                    <Slider
                        step={0.01}
                        min={0}
                        max={1}
                        defaultValue={onionStatus}
                        trackStyle={{ backgroundColor: '#7f8186', height: '10px' }}
                        railStyle={{ backgroundColor: '#7f8186', height: '10px' }}
                        handleStyle={{
                            backgroundColor: '#486ee5', height: '24px', width: '24px', marginLeft: '-12px', marginTop: '-7px', boxShadow: 'none', borderColor: 'rgba(0,0,0,0)'
                        }}
                        onChange={(e) => {
                            onOnion(e);
                        }}
                    />
                </div>

                <div className={styles.progress}>
                    {frameIndex === false && <span className={styles.live}>{ANIMATOR_LIVE}</span>}
                    {frameIndex !== false && frameIndex}
                    {' / '}
                    {frameQuantity}

                </div>

                <Button onClick={() => { onTakePicture(!takePictureStatus); }} size="normal" icon={<Camera />} />
                <Button title={(!playStatus) ? ANIMATOR_BUTTON_PLAY : ANIMATOR_BUTTON_PAUSE} onClick={() => { onPlay(!playStatus); }} size="mini" icon={playStatus ? <IconPause /> : <IconPlay />} />
                <Button title={ANIMATOR_BUTTON_LOOP} onClick={() => { onLoop(!loopStatus); }} size="mini" icon={<IconLoop />} />
                <Button title={ANIMATOR_BUTTON_SHORT_PLAY} onClick={() => { onShortPlay(!shortPlayStatus); }} size="mini" icon={<IconShortPlay />} />

                <span className={styles.fpsZone}>
                    <input
                        className={styles.input}
                        min="1"
                        max="60"
                        type="number"
                        value={FPSStatus}
                        maxLength="2"
                        onChange={(e) => {
                            onFPS(e.target.value);
                        }}
                        onKeyDown={(e) => { onFPS(e.target.value); }}
                    />
                    {ANIMATOR_FPS}
                </span>
                <ReactTooltip
                    effect="solid"
                    getContent={value => (
                        <div className={styles.tooltip}>
                            {' '}
                            {value}
                        </div>
                    )}
                    delayShow={0}
                    delayHide={0}
                />
            </div>
        );
    }
}

ControlBar.propTypes = {
    onPlay: PropTypes.func.isRequired,
    onLoop: PropTypes.func.isRequired,
    onTakePicture: PropTypes.func.isRequired,
    onDiff: PropTypes.func.isRequired,
    onFPS: PropTypes.func.isRequired,
    onOnion: PropTypes.func.isRequired,
    // onGrid: PropTypes.func.isRequired,
    onShortPlay: PropTypes.func.isRequired,

    playStatus: PropTypes.bool.isRequired,
    loopStatus: PropTypes.bool.isRequired,
    takePictureStatus: PropTypes.bool.isRequired,
    diffStatus: PropTypes.bool.isRequired,
    FPSStatus: PropTypes.string.isRequired,
    onionStatus: PropTypes.number.isRequired,
    // gridStatus: PropTypes.bool.isRequired,
    shortPlayStatus: PropTypes.bool.isRequired,

    frameIndex: PropTypes.any.isRequired,
    frameQuantity: PropTypes.number.isRequired
};

export default ControlBar;
