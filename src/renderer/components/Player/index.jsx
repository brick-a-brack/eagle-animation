import { getChunkStartSeconds } from '@common/timeline';
import PreviewStream from '@components/PreviewStream';
import { getAudioContext, loadAudioBuffer } from '@core/audio';
import { getPictureLink } from '@core/resize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faEyeSlash from '@icons/faEyeSlash';
import resizeToFit from 'intrinsic-scale';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as style from './style.module.css';

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
      previewStream: React.createRef(),
      picture: React.createRef(),
      grid: React.createRef(),
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
    this.audioSources = [];
    this.audioPlaying = false;
    this.lastAudioIndex = null;

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

        // Keep timeline audio in sync, restarting it whenever the loop wraps back.
        if (this.audioPlaying && typeof newFrameIndex === 'number') {
          if (this.lastAudioIndex != null && newFrameIndex < this.lastAudioIndex) {
            this.startAudio(newFrameIndex);
          } else {
            this.lastAudioIndex = newFrameIndex;
          }
        }
        return true;
      };

      this.props.onPlayingStatusChange(true);
      if (playFromBegining || startOnLiveView) {
        exec(true);
      }

      // Start timeline audio from the output-frame index where playback begins.
      const len = this.frames.length;
      const beginIndex = this.props.shortPlayStatus && this.props.shortPlayFrames > 0 && len > this.props.shortPlayFrames ? len - this.props.shortPlayFrames : 0;
      const startIndex = playFromBegining || startOnLiveView ? beginIndex : this.state.frameIndex === false ? beginIndex : this.state.frameIndex;
      this.startAudio(startIndex);

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
      this.drawFrame(frame.link || false);
      this.setState({ frameIndex: false });
      this.props.onFrameChange(false);
      this.props.onPlayingStatusChange(false);
      this.stopAudio();
    };

    this.showFrame = (id) => {
      if (this.clock) {
        clearInterval(this.clock);
      }
      this.stopAudio(); // audio is muted while scrubbing frame by frame
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

    // --- Timeline audio (Web Audio), synced to the frame clock ---

    // Decode all chunks ahead of time so playback starts without latency.
    this.preloadAudio = () => {
      const scene = this.props.audioScene;
      const projectId = this.props.projectId;
      if (!scene || !projectId) {
        return;
      }
      for (const track of scene.audioTracks || []) {
        for (const chunk of track.chunks || []) {
          loadAudioBuffer(projectId, chunk.src);
        }
      }
    };

    // Schedule every chunk relative to the output-frame index where playback begins.
    this.startAudio = (startFrameIndex) => {
      this.stopAudio();
      const scene = this.props.audioScene;
      const projectId = this.props.projectId;
      if (!scene || !projectId) {
        return;
      }
      const fps = this.props.fps || 12;
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const t0 = ctx.currentTime;
      const playStartSec = startFrameIndex / fps;
      this.audioPlaying = true;
      this.lastAudioIndex = startFrameIndex;

      for (const track of scene.audioTracks || []) {
        if (track.muted) {
          continue;
        }
        const volume = track.volume ?? 1;
        for (const chunk of track.chunks || []) {
          const rel = getChunkStartSeconds(chunk, scene, fps) - playStartSec;
          const dur = chunk.duration || 0;
          let when = t0;
          let offset = chunk.startAt || 0;
          let playDur = dur;
          if (rel >= 0) {
            when = t0 + rel;
          } else {
            const into = -rel; // playback already started mid-clip
            if (into >= dur) {
              continue;
            }
            offset += into;
            playDur = dur - into;
          }
          if (playDur > 0) {
            this.scheduleChunk(ctx, projectId, chunk.src, when, offset, playDur, volume);
          }
        }
      }
    };

    this.scheduleChunk = async (ctx, projectId, src, when, offset, playDur, volume) => {
      const buffer = await loadAudioBuffer(projectId, src);
      if (!buffer || !this.audioPlaying) {
        return;
      }
      // Compensate for any decode latency that pushed us past the scheduled time.
      const now = ctx.currentTime;
      if (when < now) {
        const late = now - when;
        offset += late;
        playDur -= late;
        when = now;
        if (playDur <= 0) {
          return;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain).connect(ctx.destination);
      try {
        source.start(when, offset, playDur);
        this.audioSources.push(source);
      } catch (err) {} // eslint-disable-line no-empty
    };

    this.stopAudio = () => {
      this.audioPlaying = false;
      this.lastAudioIndex = null;
      for (const source of this.audioSources) {
        try {
          source.stop();
        } catch (err) {} // eslint-disable-line no-empty
      }
      this.audioSources = [];
    };
  }

  componentDidMount() {
    const { onInit } = this.props;

    onInit((type, data) => this.dom.previewStream.current?.setStream(type, data));

    this.resize();
    window.addEventListener('resize', this.resize);
    this.showFrame(false);
    this.preloadAudio();
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

    // Preload audio when the scene's audio changes
    if (!isEqual(prevProps.audioScene, this.props.audioScene)) {
      this.preloadAudio();
    }

    // Redraw grid if ratio changed
    if (!isEqual(prevProps.videoRatio, this.props.videoRatio)) {
      this.drawGrid();
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

  drawGrid() {
    const color = `rgba(255,255,255, ${this.props.gridOpacity}`;

    const { width, height } = this.getSize();
    const ctx = this.dom.grid.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;

    const videoRatio = this.getVideoRatio();
    let widthRatio = width;
    let heightRatio = height;
    let marginX = 0;
    let marginY = 0;

    if (videoRatio) {
      if (videoRatio > width / height) {
        heightRatio = width / videoRatio;
      } else {
        widthRatio = height * videoRatio;
      }
      marginX = (width - widthRatio) / 2;
      marginY = (height - heightRatio) / 2;
    }

    if (this.props.gridModes?.includes('GRID')) {
      for (let i = 0; i < this.props.gridColumns - 1; i++) {
        ctx.fillRect(Math.round(marginX + (widthRatio * (i + 1)) / this.props.gridColumns), 0, 1, height);
      }
      for (let i = 0; i < this.props.gridLines - 1; i++) {
        ctx.fillRect(0, Math.round(marginY + (heightRatio * (i + 1)) / this.props.gridLines), width, 1);
      }
    }

    if (this.props.gridModes?.includes('CENTER')) {
      const size = Math.round((20 / 1080) * height);
      ctx.fillRect((width - size) / 2, (height - 2) / 2, size, 2);
      ctx.fillRect((width - 2) / 2, (height - size) / 2, 2, size);
    }

    if (this.props.gridModes?.includes('MARGINS')) {
      // 90% and 80%
      drawArea(ctx, Math.round(marginX + 0.05 * widthRatio), Math.round(marginY + 0.05 * heightRatio), Math.round(0.9 * widthRatio), Math.round(0.9 * heightRatio));
      drawArea(ctx, Math.round(marginX + 0.1 * widthRatio), Math.round(marginY + 0.1 * heightRatio), Math.round(0.8 * widthRatio), Math.round(0.8 * heightRatio));
      // drawArea(ctx, 0.035 * width, 0.035 * height, 0.93 * width, 0.93 * height);
    }
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

    const borders = resizeToFit('contain', { width: this.getVideoRatio(), height: 1 }, { width: this.getSize().width, height: this.getSize().height });
    const borderLeftRight = (this.getSize().width - borders.width) / 2 / this.getSize().width;
    const borderTopBottom = (this.getSize().height - borders.height) / 2 / this.getSize().height;
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
          {this.getVideoRatio() !== null && borderLeftRight > 0 && <div className={style.borderLeft} style={{ width: `${borderLeftRight * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderLeftRight > 0 && <div className={style.borderRight} style={{ width: `${borderLeftRight * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderTopBottom > 0 && <div className={style.borderTop} style={{ height: `${borderTopBottom * 100}%`, opacity: ratioLayerOpacity || 1 }} />}
          {this.getVideoRatio() !== null && borderTopBottom > 0 && <div className={style.borderBottom} style={{ height: `${borderTopBottom * 100}%`, opacity: ratioLayerOpacity || 1 }} />}

          {frames[frameIndex]?.hidden && !this.props.isPlaying && (
            <div className={style.hiddenLayer}>
              <FontAwesomeIcon className={style.hiddenIcon} icon={faEyeSlash} />
            </div>
          )}

          <canvas ref={this.dom.grid} className={style.layout} style={{ opacity: isCameraReady && showGrid && frameIndex === false ? 1 : 0 }} />

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
