import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import ReactTooltip from 'react-tooltip';
import Button from '../Button';
import { ReactComponent as Camera } from './assets/camera.svg';
import { ReactComponent as IconPlay } from './assets/play.svg';
import { ReactComponent as IconDots } from './assets/dots.svg';
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
    ANIMATOR_FPS
} from '../../languages';
import 'rc-slider/assets/index.css';
import styles from './styles.module.css';

class ControlBar extends Component {
    render() {
        const {
            status,
            frameIndex,
            frameQuantity,
            onAction
        } = this.props;

        return (
            <div className={styles.container}>

                <Button title={ANIMATOR_BUTTON_MORE} onClick={() => { onAction('MORE'); }} size="mini" icon={<IconDots />} />
                <Button title={ANIMATOR_BUTTON_DIFFERENCE} selected={status.diff} onClick={() => { onAction('DIFFERENCE'); }} size="mini" icon={<IconCompare />} />

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
                        value={status.onion}
                        trackStyle={{ backgroundColor: '#7f8186', height: '10px' }}
                        railStyle={{ backgroundColor: '#7f8186', height: '10px' }}
                        handleStyle={{
                            backgroundColor: '#486ee5', height: '24px', width: '24px', marginLeft: '-12px', marginTop: '-7px', boxShadow: 'none', borderColor: 'rgba(0,0,0,0)'
                        }}
                        onChange={(e) => {
                            onAction('ONION_CHANGE', e);
                        }}
                    />
                </div>

                <div className={styles.progress}>
                    {frameIndex === false && <span className={styles.live}>{ANIMATOR_LIVE}</span>}
                    {frameIndex !== false && frameIndex}
                    {' / '}
                    {frameQuantity}
                </div>

                <Button onClick={() => { onAction('TAKE_PICTURE'); }} size="normal" icon={<Camera />} />
                <Button title={(!status.play) ? ANIMATOR_BUTTON_PLAY : ANIMATOR_BUTTON_PAUSE} selected={status.play} onClick={() => { onAction('PLAY'); }} size="mini" icon={<IconPlay />} />
                <Button title={ANIMATOR_BUTTON_LOOP} onClick={() => { onAction('LOOP'); }} selected={status.loop} size="mini" icon={<IconLoop />} />
                <Button title={ANIMATOR_BUTTON_SHORT_PLAY} onClick={() => { onAction('SHORT_PLAY'); }} selected={status.shortPlay} size="mini" icon={<IconShortPlay />} />

                <span className={styles.fpsZone}>
                    <input
                        className={styles.input}
                        min="1"
                        max="60"
                        type="number"
                        value={status.FPS}
                        maxLength="2"
                        onChange={(e) => {
                            onAction('FPS_CHANGE', e.target.value);
                        }}
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
    onAction: PropTypes.func.isRequired,

    status: PropTypes.any.isRequired,

    frameIndex: PropTypes.any.isRequired,
    frameQuantity: PropTypes.number.isRequired
};

export default ControlBar;
