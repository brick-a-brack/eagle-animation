import GridOverlay from '@components/GridOverlay';
import PreviewStream from '@components/PreviewStream';
import RatioBorders from '@components/RatioBorders';
import { getPictureLink } from '@core/resize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faEyeSlash from '@icons/faEyeSlash';
import resizeToFit from 'intrinsic-scale';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as style from './style.module.css';

class Player extends Component {
  constructor(props) {
    super(props);

    this.dom = {
      container: React.createRef(),
      previewStream: React.createRef(),
      picture: React.createRef(),
    };

    // Cached images promises
    this.images = {};

    this.state = {
      width: 0,
      height: 0,
      ready: false,
      frameIndex: false, // Frame index contains the position in the animation (including duplicated frames)
    };

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
        widthElem = parentSize.width;
        heightElem = (1 / this.getRatio()) * parentSize.width;
      } else {
        heightElem = parentSize.height - 6;
        widthElem = this.getRatio() * (parentSize.height - 6); // Border should be added here
      }
      this.setState({ width: widthElem, height: heightElem, ready: true });
    };

    this.clock = null;
    this.frames = [];

    this.computeFrames = () => {
      this.frames = this.props.pictures.filter((e) => !e.deleted).reduce((acc, e) => [...acc, ...new Array(e.length || 1).fill(e)], []);
    };

    this.computeFrames();

    this.play = (playFromBegining = false) => {
      const startOnLiveView = this.state.frameIndex === false;

      const exec = (force = false) => {
        const filteredFrames = this.frames;

        let newFrameIndex = false;

        if ((this.state.frameIndex === false || !filteredFrames.length) && !force && !this.props.loopStatus) {
          return false;
        } else if (filteredFrames.length && (force || (this.state.frameIndex === false && this.props.loopStatus))) {
          newFrameIndex = this.props.shortPlayStatus && this.props.shortPlayFrames > 0 && filteredFrames.length > this.props.shortPlayFrames ? filteredFrames.length - this.props.shortPlayFrames : 0;
        } else if (this.state.frameIndex >= filteredFrames.length - 1) {
          newFrameIndex = false;
        } else {
          newFrameIndex = this.state.frameIndex + 1;
          while (this?.frames[newFrameIndex]?.hidden) {
            newFrameIndex++;
          }
        }

        // Set to first frame if the loopShowLive option is enabled
        if (newFrameIndex === false && filteredFrames.length && !this.props.loopShowLive && this.props.loopStatus) {
          newFrameIndex = this.props.shortPlayStatus && this.props.shortPlayFrames > 0 && filteredFrames.length > this.props.shortPlayFrames ? filteredFrames.length - this.props.shortPlayFrames : 0;
        }

        const frame = (newFrameIndex === false ? filteredFrames[filteredFrames.length - 1] : filteredFrames[newFrameIndex]) || false;
        this.drawFrame(frame.link || false);
        this.setState({ frameIndex: newFrameIndex });
        this.props.onFrameChange(newFrameIndex !== false && frame ? frame.id : false, newFrameIndex);
        return true;
      };

      this.props.onPlayingStatusChange(true);
      if (playFromBegining || startOnLiveView) {
        exec(true);
      }

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
    };

    this.stop = () => {
      if (this.clock) {
        clearInterval(this.clock);
      }
      const frame = this.frames[this.frames.length - 1] || false; // Draw last frame for onion feature
      this.drawFrame(frame.link || false);
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
        this.drawFrame(frame.link || false);
        this.setState({ frameIndex: false });
        this.props.onFrameChange(false);
        return;
      }
      const frame = this.frames.find((e) => e.id === id) || false;
      const frameIndex = this.frames.findIndex((e) => e.id === id);
      this.setState({ frameIndex: frameIndex === -1 ? false : frameIndex });
      this.drawFrame(frame.link || false);
      this.props.onFrameChange(frame.id);
      this.props.onPlayingStatusChange(false);
    };
  }

  componentDidMount() {
    const { onInit } = this.props;

    onInit((type, data) => this.dom.previewStream.current?.setStream(type, data));

    this.resize();
    window.addEventListener('resize', this.resize);
    this.showFrame(false);
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.pictures, this.props.pictures)) {
      const previousFrame = this.frames[this.state.frameIndex];

      // Recompute internal player frames
      this.computeFrames();

      // If a frame was selected
      if (previousFrame) {
        // Get new index
        const newFrameIndex = this.frames.findIndex((e) => e.id === previousFrame.id);

        // Frame index changed
        if (this.state.frameIndex !== newFrameIndex) {
          this.setState({ frameIndex: newFrameIndex });
        }
      }

      // Force redraw last frame for onion skin
      if (this.state.frameIndex === false) {
        this.showFrame(false);
      }
    }

    // Force to display live view if capabilities changed (only when not playing)
    if (!isEqual(prevProps.cameraCapabilities, this.props.cameraCapabilities) && !this.clock) {
      this.showFrame(false);
    }

    if (!isEqual(prevProps.cameraId, this.props.cameraId)) {
      this.initCanvas();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
    this.stop();
  }

  getVideoRatio() {
    return this.props.videoRatio || null;
  }

  getRatio() {
    const ratio = this.dom.previewStream.current?.getStreamRatio() || null;
    return ratio > 0 ? ratio : 16 / 9;
  }

  getSize() {
    return {
      width: 720 * this.getRatio(),
      height: 720,
    };
  }

  loadImage(link) {
    if (this.images[link]) {
      return this.images[link];
    }
    this.images[link] = new Promise((resolve, reject) => {
      const img = new Image();
      const resolver = () => {
        img.removeEventListener('error', reject);
        img.removeEventListener('load', resolver);
        resolve(img);
      };
      img.addEventListener('error', reject);
      img.addEventListener('load', resolver);
      img.src = link;
    });

    return this.images[link];
  }

  async drawFrame(src = false) {
    const ctx = this.dom.picture.current.getContext('2d', { alpha: false });
    if (src === false) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
      return;
    }

    // Load image
    const img = await this.loadImage(getPictureLink(src, { h: 720, m: 'contain', f: 'jpg' })).catch(() => null);

    // Draw background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);

    // If image is loaded, draw it
    if (img) {
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
    }
  }

  render() {
    const { showGrid, onionValue, blendMode, isCameraReady, t, ratioLayerOpacity, reverseX, reverseY } = this.props;
    const { width, height, ready, frameIndex } = this.state;

    const reverseClassNames = `${reverseX ? style.reverseX : ''} ${reverseY ? style.reverseY : ''}`;
    const frames = this.props.pictures.filter((e) => !e.deleted).reduce((acc, e) => [...acc, ...new Array(e.length || 1).fill(e)], []);

    return (
      <div className={`${style.playerContainer} ${frameIndex === false ? style.live : ''}`}>
        <div className={style.container} ref={this.dom.container} style={{ width: `${width}px`, height: `${height}px`, opacity: ready ? 1 : 0 }}>
          <PreviewStream
            ref={this.dom.previewStream}
            className={`${style.layout} ${reverseClassNames}`}
            style={{ opacity: isCameraReady && frameIndex === false ? 1 : 0 }}
            onRatioChange={this.resize}
          />
          <canvas
            ref={this.dom.picture}
            className={style.layout}
            style={{
              opacity: !isCameraReady && frameIndex === false ? 0 : frameIndex !== false || blendMode ? 1 : 1 - onionValue,
              mixBlendMode: !blendMode ? 'normal' : 'difference',
            }}
          />
          <RatioBorders width={this.getSize().width} height={this.getSize().height} ratio={this.getVideoRatio()} opacity={ratioLayerOpacity} />
          {isCameraReady && showGrid && frameIndex === false && (
            <GridOverlay
              className={style.layout}
              width={this.getSize().width}
              height={this.getSize().height}
              modes={this.props.gridModes}
              opacity={this.props.gridOpacity}
              columns={this.props.gridColumns}
              lines={this.props.gridLines}
              ratio={this.getVideoRatio()}
            />
          )}
          {frames[frameIndex]?.hidden && !this.props.isPlaying && (
            <div className={style.hiddenLayer}>
              <FontAwesomeIcon className={style.hiddenIcon} icon={faEyeSlash} />
            </div>
          )}
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
