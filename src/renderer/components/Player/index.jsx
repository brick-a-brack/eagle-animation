import resizeToFit from 'intrinsic-scale';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import BatteryIndicator from '../BatteryIndicator';

import * as style from './style.module.css';

const PLAYER_USABLE_FRAME_PROPERTY = 'preview'; // 'link' for original, 'preview' for 720p preview, 'thumbnail' for 80p preview

const drawArea = (ctx, x, y, width, height) => {
  ctx.fillRect(x, y, width, 1);
  ctx.fillRect(x, y + height, width, 1);
  ctx.fillRect(x, y, 1, height);
  ctx.fillRect(x + width, y, 1, height);
};

class Player extends Component {
  constructor(props) {
    super(props);

    this.dom = {
      container: React.createRef(),
      video: React.createRef(),
      videoFrame: React.createRef(),
      picture: React.createRef(),
      grid: React.createRef(),
    };

    this.state = {
      width: 0,
      height: 0,
      ready: false,
      frameIndex: false, // Frame index contains the position in the animation (including duplicated frames)
    };

    // Used to detect size change on canvas based preview
    this.videoFrameObserver = null;

    this.resize = () => {
      this.initCanvas();
      const parentSize = this?.dom?.container?.current?.parentNode?.getBoundingClientRect();
      if (!parentSize) {
        return;
      }
      const parentRatio = parentSize.width / parentSize.height;

      let widthElem = 0;
      let heightElem = 0;

      if (this.getRatio() >= parentRatio) {
        widthElem = parentSize.width - 8;
        heightElem = (1 / this.getRatio()) * (parentSize.width - 8);
      } else {
        heightElem = parentSize.height - 8;
        widthElem = this.getRatio() * (parentSize.height - 8);
      }
      this.setState({ width: widthElem, height: heightElem, ready: true });
    };

    this.clock = null;
    this.frames = [];

    this.computeFrames = () => {
      this.frames = this.props.pictures.filter((e) => !e.deleted).reduce((acc, e) => [...acc, ...new Array(e.length || 1).fill(e)], []);
    };

    this.computeFrames();

    this.play = () => {
      const exec = (force = false) => {
        const filteredFrames = this.frames.filter((e) => !e.hidden);

        let newFrameIndex = false;

        if ((this.state.frameIndex === false || !filteredFrames.length) && !force && !this.props.loopStatus) {
          return false;
        } else if (filteredFrames.length && (force || (this.state.frameIndex === false && this.props.loopStatus))) {
          newFrameIndex = this.props.shortPlayStatus && filteredFrames.length > this.props.shortPlayFrames ? filteredFrames.length - this.props.shortPlayFrames - 1 : 0;
        } else if (this.state.frameIndex >= filteredFrames.length - 1) {
          newFrameIndex = false;
        } else {
          newFrameIndex = this.state.frameIndex + 1;
        }

        const frame = (newFrameIndex === false ? filteredFrames[filteredFrames.length - 1] : filteredFrames[newFrameIndex]) || false;
        this.drawFrame(frame[PLAYER_USABLE_FRAME_PROPERTY] || false);
        this.setState({ frameIndex: newFrameIndex });
        this.props.onFrameChange(newFrameIndex !== false && frame ? frame.id : false);
        return true;
      };

      this.props.onPlayingStatusChange(true);
      exec(true); // Reset frame position at the launch

      this.clock = setInterval(() => {
        if (!exec()) {
          this.stop();
        }
      }, 1000 / this.props.fps);
    };

    this.initCanvas = () => {
      if (this.dom.picture.current) {
        if (this.dom.picture.current.width !== this.getSize().width) {
          this.dom.picture.current.width = this.getSize().width;
        }
        if (this.dom.picture.current.height !== this.getSize().height) {
          this.dom.picture.current.height = this.getSize().height;
        }
        if (this.dom.picture.current.style.width !== this.getSize().width) {
          this.dom.picture.current.style.width = this.getSize().width;
        }
        if (this.dom.picture.current.style.height != this.getSize().height) {
          this.dom.picture.current.style.height = this.getSize().height;
        }
      }
      if (this.dom.grid.current) {
        let shouldRedraw = false;
        if (this.dom.grid.current.width !== this.getSize().width) {
          this.dom.grid.current.width = this.getSize().width;
          shouldRedraw = true;
        }
        if (this.dom.grid.current.height !== this.getSize().height) {
          this.dom.grid.current.height = this.getSize().height;
          shouldRedraw = true;
        }
        if (this.dom.grid.current.style.width !== this.getSize().width) {
          this.dom.grid.current.style.width = this.getSize().width;
          shouldRedraw = true;
        }
        if (this.dom.grid.current.style.height !== this.getSize().height) {
          this.dom.grid.current.style.height = this.getSize().height;
          shouldRedraw = true;
        }
        if (shouldRedraw) {
          this.drawGrid();
        }
      }
    };

    this.stop = () => {
      if (this.clock) {
        clearInterval(this.clock);
      }
      const frame = this.frames[this.frames.length - 1] || false; // Draw last frame for onion feature
      this.drawFrame(frame[PLAYER_USABLE_FRAME_PROPERTY] || false);
      this.setState({ frameIndex: false });
      this.props.onFrameChange(false);
      this.props.onPlayingStatusChange(false);
    };

    this.showFrame = (id) => {
      if (this.clock) {
        clearInterval(this.clock);
      }
      if (id === false) {
        const frame = this.frames[this.frames.length - 1] || false; // Draw last frame for onion feature
        this.drawFrame(frame[PLAYER_USABLE_FRAME_PROPERTY] || false);
        this.setState({ frameIndex: false });
        this.props.onFrameChange(false);
        return;
      }
      const frame = this.frames.find((e) => e.id === id) || false;
      const frameIndex = this.frames.findIndex((e) => e.id === id);
      this.setState({ frameIndex: frameIndex === -1 ? false : frameIndex });
      this.drawFrame(frame[PLAYER_USABLE_FRAME_PROPERTY] || false);
      this.props.onFrameChange(frame.id);
      this.props.onPlayingStatusChange(false);
    };
  }

  componentDidMount() {
    const { onInit } = this.props;
    onInit(this.dom.video.current, this.dom.videoFrame.current);

    this.dom.video.current.onloadedmetadata = () => {
      this.resize();
    };
    this.dom.video.current.onresize = () => {
      this.resize();
    };

    this.resize();
    window.addEventListener('resize', this.resize);

    this.videoFrameObserver = new MutationObserver(() => {
      this.resize();
    });
    this.videoFrameObserver.observe(this.dom.videoFrame.current, {
      attributeFilter: ['height', 'width'],
    });

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

    // Force to display live view if capabilities changed
    if (!isEqual(prevProps.cameraCapabilities, this.props.cameraCapabilities)) {
      this.showFrame(false);
    }

    if (!isEqual(prevProps.cameraId, this.props.cameraId)) {
      this.initCanvas();
    }
  }

  componentWillUnmount() {
    if (this.videoFrameObserver) {
      this.videoFrameObserver.disconnect();
    }
    window.removeEventListener('resize', this.resize);
    this.stop();
  }

  getVideoRatio() {
    return this.props.videoRatio || null;
  }

  getRatio() {
    let ratio = null;
    if (!ratio && this.dom.video.current && (this.dom.video.current.src || this.dom.video.current.srcObject)) {
      const tmpRatio = this.dom.video.current.videoWidth / this.dom.video.current.videoHeight;
      if (tmpRatio > 0) {
        ratio = tmpRatio;
      }
    }
    if (!ratio && this.dom.videoFrame.current) {
      const tmpRatio = this.dom.videoFrame.current.width / this.dom.videoFrame.current.height;
      if (tmpRatio > 0) {
        ratio = tmpRatio;
      }
    }
    return ratio > 0 ? ratio : 16 / 9;
  }

  getSize() {
    return {
      width: 720 * this.getRatio(),
      height: 720,
    };
  }

  drawGrid() {
    const color = `rgba(255,255,255, ${this.props.gridOpacity}`;

    const { width, height } = this.getSize();
    const ctx = this.dom.grid.current.getContext('2d');
    ctx.fillStyle = color;

    if (this.props.gridModes?.includes('GRID')) {
      for (let i = 0; i < this.props.gridColumns; i++) {
        ctx.fillRect(Math.round((width * (i + 1)) / this.props.gridColumns), 0, 1, height);
      }
      for (let i = 0; i < this.props.gridLines; i++) {
        ctx.fillRect(0, Math.round((height * (i + 1)) / this.props.gridLines), width, 1);
      }
    }

    if (this.props.gridModes?.includes('CENTER')) {
      const size = Math.round((20 / 1080) * height);
      ctx.fillRect((width - size) / 2, (height - 2) / 2, size, 2);
      ctx.fillRect((width - 2) / 2, (height - size) / 2, 2, size);
    }

    if (this.props.gridModes?.includes('MARGINS')) {
      // 90% and 80%
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
    img.addEventListener('error', () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
    });
    img.addEventListener(
      'load',
      () => {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);

        let ratioPosition = null;
        if (this.getVideoRatio()) {
          ratioPosition = resizeToFit('contain', { width: this.getVideoRatio(), height: 1 }, { width: this.getSize().width, height: this.getSize().height });
        } else {
          ratioPosition = { width: this.getSize().width, height: this.getSize().height };
        }

        const imagePosition = resizeToFit('cover', { width: img.width, height: img.height }, { width: ratioPosition.width, height: ratioPosition.height });

        ctx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          Math.round(this.getSize().width / 2) - imagePosition.width / 2,
          Math.round(this.getSize().height / 2) - imagePosition.height / 2,
          imagePosition.width,
          imagePosition.height
        );
      },
      false
    );
    img.src = src;
  }

  render() {
    const { showGrid, onionValue, blendMode, isCameraReady, t, batteryStatus, ratioLayerOpacity } = this.props;
    const { width, height, ready, frameIndex } = this.state;

    const borders = resizeToFit('contain', { width: this.getVideoRatio(), height: 1 }, { width: this.getSize().width, height: this.getSize().height });
    const borderLeftRight = (this.getSize().width - borders.width) / 2 / this.getSize().width;
    const borderTopBottom = (this.getSize().height - borders.height) / 2 / this.getSize().height;

    return (
      <div className={`${style.playerContainer} ${frameIndex === false ? style.live : ''}`}>
        <div className={style.container} ref={this.dom.container} style={{ width: `${width}px`, height: `${height}px`, opacity: ready ? 1 : 0 }}>
          <video ref={this.dom.video} className={style.layout} style={{ opacity: isCameraReady && frameIndex === false ? 1 : 0 }} />
          <div style={{ opacity: frameIndex === false ? 1 : 0 }} className={style.layout}>
            <canvas ref={this.dom.videoFrame} className={style.layoutVideoFrame} />
          </div>
          <canvas
            ref={this.dom.picture}
            className={style.layout}
            style={{
              opacity: !isCameraReady && frameIndex === false ? 0 : frameIndex !== false || blendMode ? 1 : 1 - onionValue,
              mixBlendMode: !blendMode ? 'normal' : 'difference',
            }}
          />
          {this.getVideoRatio() !== null && borderLeftRight > 0 && <div className={style.borderLeft} style={{ width: `${borderLeftRight * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderLeftRight > 0 && <div className={style.borderRight} style={{ width: `${borderLeftRight * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderTopBottom > 0 && <div className={style.borderTop} style={{ height: `${borderTopBottom * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderTopBottom > 0 && <div className={style.borderBottom} style={{ height: `${borderTopBottom * 100}%`, opacity: ratioLayerOpacity || 1 }} />}

          <canvas ref={this.dom.grid} className={style.layout} style={{ opacity: isCameraReady && showGrid && frameIndex === false ? 1 : 0 }} />

          {isCameraReady && frameIndex === false && batteryStatus !== null && <BatteryIndicator value={batteryStatus} />}

          {!isCameraReady && frameIndex === false && <span className={style.loader} />}
          {!isCameraReady && frameIndex === false && <div className={style.info}>{t('If your camera does not load, try changing it in the camera settings')}</div>}
        </div>
      </div>
    );
  }
}

Player.propTypes = {
  blendMode: PropTypes.any.isRequired,
  onionValue: PropTypes.any.isRequired,
  ratioLayerOpacity: PropTypes.number.isRequired,
  showGrid: PropTypes.bool.isRequired,
  isCameraReady: PropTypes.bool.isRequired,
  onInit: PropTypes.func.isRequired,
  onFrameChange: PropTypes.func.isRequired,
};

export default Player;
