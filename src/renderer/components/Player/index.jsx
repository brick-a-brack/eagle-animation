import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash';

import * as style from './style.module.css';
import Slider from '../CustomSlider';
import FormGroup from '../FormGroup';
import Heading from '../Heading';
import Switch from '../Switch';
import ActionCard from '../ActionCard';

const drawArea = (ctx, x, y, width, height) => {
    ctx.fillRect(x, y, width, 1);
    ctx.fillRect(x, y + height, width, 1);
    ctx.fillRect(x, y, 1, height);
    ctx.fillRect(x + width, y, 1, height);
}

class Player extends Component {
    constructor(props) {
        super(props);

        this.dom = {
            container: React.createRef(),
            video: React.createRef(),
            videoFrame: React.createRef(),
            picture: React.createRef(),
            grid: React.createRef()
        };

        this.state = {
            width: 0,
            height: 0,
            ready: false,
            frameIndex: false, // Frame index contains the position in the animation (including duplicated frames)
        };

        this.resize = () => {
            const parentSize = this.dom.container.current.parentNode.getBoundingClientRect();
            const parentRatio = parentSize.width / parentSize.height;

            let widthElem = 0;
            let heightElem = 0;

            if (this.getRatio() >= parentRatio) {
                widthElem = parentSize.width - 8;
                heightElem = 1 / this.getRatio() * (parentSize.width - 8);
            } else {
                heightElem = parentSize.height - 8;
                widthElem = this.getRatio() * (parentSize.height - 8);
            }
            this.setState({ width: widthElem, height: heightElem, ready: true });
        };

        this.clock = null;
        this.frames = [];

        this.computeFrames = () => {
            this.frames = this.props.pictures.filter(e => !e.deleted).reduce((acc, e) => [...acc, ...(new Array(e.length || 1)).fill(e)], []);
        }

        this.computeFrames();

        this.play = () => {
            const exec = (force = false) => {
                let newFrameIndex = false;

                if ((this.state.frameIndex === false || !this.frames.length) && !force && !this.props.loopStatus) {
                    return false;
                } else if (this.frames.length && (force || (this.state.frameIndex === false && this.props.loopStatus))) {
                    newFrameIndex = this.props.shortPlayStatus && this.frames.length > this.props.shortPlayFrames ? this.frames.length - this.props.shortPlayFrames - 1 : 0;
                } else if (this.state.frameIndex >= this.frames.length - 1) {
                    newFrameIndex = false;
                } else {
                    newFrameIndex = this.state.frameIndex + 1;
                }

                const frame = (newFrameIndex === false ? this.frames[this.frames.length - 1] : this.frames[newFrameIndex]) || false;
                this.drawFrame(frame.link || false);
                this.setState({ frameIndex: newFrameIndex });
                this.props.onFrameChange(frame ? frame.id : false);
                return true;
            };

            this.props.onPlayingStatusChange(true);
            exec(true); // Reset frame position at the launch

            this.clock = setInterval(() => {
                if (!exec()) {
                    this.stop();
                }
            }, 1000 / this.props.fps);
        }

        this.stop = () => {
            if (this.clock) {
                clearInterval(this.clock);
            }
            const frame = this.frames[this.frames.length - 1] || false; // Draw last frame for onion feature
            this.drawFrame(frame.link || false);
            this.setState({ frameIndex: false });
            this.props.onFrameChange(false);
            this.props.onPlayingStatusChange(false);
        }

        this.showFrame = (id) => {
            if (this.clock) {
                clearInterval(this.clock);
            }
            if (id === false) {
                const frame = this.frames[this.frames.length - 1] || false; // Draw last frame for onion feature
                this.drawFrame(frame.link || false);
                this.setState({ frameIndex: false });
                this.props.onFrameChange(false);
                return;
            }
            const frame = this.frames.find(e => e.id === id) || false;
            const frameIndex = this.frames.findIndex(e => e.id === id);
            this.setState({ frameIndex: frameIndex === -1 ? false : frameIndex });
            this.drawFrame(frame.link || false);
            this.props.onFrameChange(frame.id);
            this.props.onPlayingStatusChange(false);
        }

    }

    componentDidMount() {
        const { onInit } = this.props;
        onInit(this.dom.video.current, this.dom.videoFrame.current);
        this.dom.picture.current.width = this.getSize().width;
        this.dom.picture.current.height = this.getSize().height;
        this.dom.picture.current.style.width = this.getSize().width;
        this.dom.picture.current.style.height = this.getSize().height;
        this.dom.grid.current.width = this.getSize().width;
        this.dom.grid.current.height = this.getSize().height;
        this.dom.grid.current.style.width = this.getSize().width;
        this.dom.grid.current.style.height = this.getSize().height;
        this.drawGrid();
        window.addEventListener('resize', this.resize);
        this.resize();
        this.showFrame(false);
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.pictures, this.props.pictures)) {
            this.computeFrames();

            // Force redraw last frame for onion skin
            if (this.state.frameIndex === false) {
                this.showFrame(false);
            }
        }

        if (!isEqual(prevProps.capabilities, this.props.capabilities)) {
            this.showFrame(false);
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize);
        this.stop();
    }

    getRatio() { // eslint-disable-line class-methods-use-this
        return 16 / 9;
    }

    getSize() { // eslint-disable-line class-methods-use-this
        return {
            width: 1280,
            height: 720
        };
    }

    drawGrid() {
        const color = `rgba(255,255,255, ${this.props.gridOpacity}`;

        const { width, height } = this.getSize();
        const ctx = this.dom.grid.current.getContext('2d');
        ctx.fillStyle = color;

        if (this.props.gridModes?.includes('GRID')) {
            for (let i = 0; i < this.props.gridColumns; i++) {
                ctx.fillRect(Math.round(width * (i + 1) / this.props.gridColumns), 0, 1, height);
            }
            for (let i = 0; i < this.props.gridLines; i++) {
                ctx.fillRect(0, Math.round(height * (i + 1) / this.props.gridLines), width, 1);
            }
        }

        if (this.props.gridModes?.includes('CENTER')) {
            const size = Math.round(20 / 1080 * height);
            ctx.fillRect((width - size) / 2, (height - 2) / 2, size, 2);
            ctx.fillRect((width - 2) / 2, (height - size) / 2, 2, size);
        }

        if (this.props.gridModes?.includes('MARGINS')) { // 90% and 80%
            drawArea(ctx, 0.05 * width, 0.05 * height, 0.9 * width, 0.9 * height);
            drawArea(ctx, 0.1 * width, 0.1 * height, 0.8 * width, 0.8 * height);
            // drawArea(ctx, 0.035 * width, 0.035 * height, 0.93 * width, 0.93 * height);
        }
    }

    drawFrame(src = false) {
        const ctx = this.dom.picture.current.getContext('2d', { alpha: false });
        if (src === false) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
            return;
        }

        const img = new Image();
        img.addEventListener(
            'error',
            () => {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
            }
        );
        img.addEventListener(
            'load',
            () => {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
                const ratioX = this.getSize().width / img.width;
                const ratioY = this.getSize().height / img.height;
                const minRatio = Math.min(ratioX, ratioY);
                const width = Math.round(img.width * minRatio);
                const height = Math.round(img.height * minRatio);
                ctx.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    Math.round((this.getSize().width - width) / 2),
                    Math.round((this.getSize().height - height) / 2),
                    width,
                    height
                );
            },
            false
        );
        img.src = src;
    }

    render() {
        const {
            showGrid, onionValue, blendMode, isCameraReady, t, capabilities, showCameraSettings
        } = this.props;
        const {
            width, height, ready, frameIndex
        } = this.state;


        console.log('CAP', capabilities)

        const capsTranslations = {
            'brightness': t('Brightness'),
            'colorTemperature': t('White balance'),
            'contrast': t('Contrast'),
            'focusDistance': t('Focus'),
            'focusMode': t('Automatic focus'),
            'exposureCompensation': t('Exposure compensation'),
            'exposureMode': t('Automatic exposure'),
            'exposureTime': t('Exposure time'),
            'pan': t('Horizontal position'),
            'saturation': t('Saturation'),
            'sharpness': t('Sharpness'),
            'tilt': t('Vertical position'),
            'whiteBalanceMode': t('Automatic white balance'),
            'zoom': t('Zoom'),
        };

        const caps = capabilities.map(e => {
            // Not supported
            if (!e) {
                return null;
            }

            // Remove focus slider if focus is set as automatic
            if (e.id === 'focusDistance' && capabilities.find(c => c.id === 'focusMode').value === 'continuous') {
                return null;
            }

            // Remove exposition settings if exposition is set as automatic
            if ((e.id === 'exposureTime' || e.id === 'exposureCompensation') && capabilities.find(c => c.id === 'exposureMode').value === 'continuous') {
                return null;
            }

            // Remove colorTemperature if white balance is set as automatic
            if (e.id === 'colorTemperature' && capabilities.find(c => c.id === 'whiteBalanceMode').value === 'continuous') {
                return null;
            }

            // Hide tilt and pan if zoom is set to minimal value
            if ((e.id === 'tilt' || e.id === 'pan') && capabilities.find(c => c.id === 'zoom').value === capabilities.find(c => c.id === 'zoom').min) {
                return null;
            }

            return e;
        }).filter(Boolean);

        return (
            <div className={`${style.playerContainer} ${frameIndex === false ? style.live : ''}`}>
                <div className={style.container} ref={this.dom.container} style={{ width: `${width}px`, height: `${height}px`, opacity: (ready) ? 1 : 0 }}>
                    <video
                        ref={this.dom.video}
                        className={style.layout}
                        style={{ opacity: frameIndex === false ? 1 : 0 }}
                    />
                    <div style={{ opacity: frameIndex === false ? 1 : 0 }} className={style.layout}>
                        <canvas ref={this.dom.videoFrame} className={style.layoutVideoFrame} />
                    </div>
                    <canvas
                        ref={this.dom.picture}
                        className={style.layout}
                        style={{
                            opacity: (frameIndex !== false || blendMode) ? 1 : 1 - onionValue,
                            mixBlendMode: (!blendMode) ? 'normal' : 'difference'
                        }}
                    />
                    <canvas
                        ref={this.dom.grid}
                        className={style.layout}
                        style={{ opacity: showGrid && frameIndex === false ? 1 : 0 }}
                    />
                    {!isCameraReady && frameIndex === false && <span className={style.loader} />}
                    {!isCameraReady && frameIndex === false && <div className={style.info}>{t('If your camera does not load, try changing it in the settings')}</div>}

                    <div className={`${style.settings} ${showCameraSettings ? style.open : ''}`}>
                        <Heading h={2} className={style.settingsTitle}>{t('Camera settings')}</Heading>

                        {caps.map(cap => {
                            if (cap.type === 'RANGE') {
                                return <FormGroup key={cap.id} label={capsTranslations[cap.id]} description={t('[{{min}}, {{max}}] • {{value}}', { min: Math.round(cap.min), max: Math.round(cap.max), value: Math.round(cap.value) })}>
                                    <Slider min={cap.min} max={cap.max} value={cap.value} step={cap.step} onChange={(value) => { this.props.onCapabilityChange(cap.id, value) }} />
                                </FormGroup>
                            }
                            if (cap.type === 'SWITCH') {
                                return <FormGroup key={cap.id} label={capsTranslations[cap.id]}>
                                    <Switch checked={cap.value === 'continuous'} onChange={() => {
                                        if (cap.value === 'continuous') {
                                            this.props.onCapabilityChange(cap.id, 'manual');
                                        } else {
                                            this.props.onCapabilityChange(cap.id, 'continuous');
                                        }
                                    }} />
                                </FormGroup>
                            }
                            return null;
                        })}

                        <ActionCard className={style.settingsReset} title={t('Reset settings')} action={() => this.props.onCapabilitiesReset()} sizeAuto secondary />
                    </div>

                </div>
            </div >
        );
    }
}

Player.propTypes = {
    blendMode: PropTypes.any.isRequired,
    onionValue: PropTypes.any.isRequired,
    showGrid: PropTypes.bool.isRequired,
    isCameraReady: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired,
    onFrameChange: PropTypes.func.isRequired,
};

export default Player;
