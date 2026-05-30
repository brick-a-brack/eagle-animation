import { Component, createRef } from 'react';

class PreviewStream extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = createRef();
    this._videoEl = null;
    this._imgEl = null;
    this._frameEl = null;
    this._frameSeq = 0;
    this._frameShownSeq = -1;
    this._streamType = null;
    this._currentRatio = null;
    this._rafId = null;
  }

  // type:
  //  - 'image': a self-refreshing image stream (e.g. an MJPEG URL set once)
  //  - 'frame': a single live-view frame pushed repeatedly (e.g. gphoto2 blobs)
  //  - 'video': a MediaStream
  setStream(type, data) {
    this.props.onStreamChange?.(type, data);

    if (type === 'image') {
      this._flushCanvas();
      this._destroyImgEl();
      this._imgEl = new Image();
      this._imgEl.onerror = () => this._flushCanvas();
      this._imgEl.src = data;
      this._streamType = 'image';
    } else if (type === 'frame') {
      this._pushFrame(data);
    } else if (type === 'video') {
      this._flushCanvas();
      this._destroyVideoEl();
      this._videoEl = document.createElement('video');
      this._videoEl.muted = true;
      this._videoEl.playsInline = true;
      this._videoEl.onerror = () => this._flushCanvas();
      this._videoEl.srcObject = data;
      this._videoEl.play();
      this._streamType = 'video';
    } else {
      // Clear stream (e.g. setStream(null) on disconnect): fully release the
      // backing elements so no <video> keeps holding the MediaStream. This is
      // what frees the webcam device on Linux (see Webcam.disconnect).
      this._destroyImgEl();
      this._destroyVideoEl();
      this._flushCanvas();
    }
  }

  // Push a single live-view frame. Unlike 'image', we never clear the canvas
  // between frames: the previously decoded frame keeps being drawn until the
  // new one has finished loading, then we swap. This avoids the blank flicker
  // that comes from flushing the canvas while the next frame decodes.
  _pushFrame(data) {
    if (this._streamType !== 'frame') {
      // Switching into frame mode from another stream: clean leftover state.
      this._destroyImgEl();
      this._destroyVideoEl();
      this._streamType = 'frame';
    }

    const seq = ++this._frameSeq;
    const img = new Image();
    img.onload = () => {
      // Drop frames decoded after we left frame mode, or out of order
      // (a newer frame already won the race).
      if (this._streamType !== 'frame' || seq <= this._frameShownSeq) return;
      this._frameShownSeq = seq;
      this._frameEl = img;
    };
    // Ignore a failed frame and keep showing the last good one.
    img.onerror = () => {};
    img.src = data;
  }

  getStreamRatio() {
    return this._currentRatio;
  }

  // Returns true if the ratio changed (parent needs to resize before drawing).
  _notifyRatioChange(newRatio) {
    if (this._currentRatio === newRatio) return false;
    this._currentRatio = newRatio;
    this.props.onRatioChange?.(newRatio);
    return true;
  }

  _tick() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (this._streamType === 'image' && this._imgEl?.complete && this._imgEl?.naturalWidth) {
        if (canvas.width !== this._imgEl.naturalWidth) canvas.width = this._imgEl.naturalWidth;
        if (canvas.height !== this._imgEl.naturalHeight) canvas.height = this._imgEl.naturalHeight;
        // Notify ratio change before drawing: if the ratio changed this frame, skip the draw
        // so the parent container resizes first and we avoid a one-frame size mismatch.
        if (!this._notifyRatioChange(this._imgEl.naturalWidth / this._imgEl.naturalHeight)) {
          ctx.drawImage(this._imgEl, 0, 0);
        }
      } else if (this._streamType === 'frame' && this._frameEl?.complete && this._frameEl?.naturalWidth) {
        if (canvas.width !== this._frameEl.naturalWidth) canvas.width = this._frameEl.naturalWidth;
        if (canvas.height !== this._frameEl.naturalHeight) canvas.height = this._frameEl.naturalHeight;
        if (!this._notifyRatioChange(this._frameEl.naturalWidth / this._frameEl.naturalHeight)) {
          ctx.drawImage(this._frameEl, 0, 0);
        }
      } else if (this._streamType === 'video' && this._videoEl?.readyState >= this._videoEl?.HAVE_CURRENT_DATA) {
        if (canvas.width !== this._videoEl.videoWidth) canvas.width = this._videoEl.videoWidth;
        if (canvas.height !== this._videoEl.videoHeight) canvas.height = this._videoEl.videoHeight;
        if (this._videoEl.videoWidth && this._videoEl.videoHeight) {
          if (!this._notifyRatioChange(this._videoEl.videoWidth / this._videoEl.videoHeight)) {
            ctx.drawImage(this._videoEl, 0, 0);
          }
        } else {
          ctx.drawImage(this._videoEl, 0, 0);
        }
      } else {
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    this._rafId = requestAnimationFrame(() => this._tick());
  }

  _destroyImgEl() {
    if (!this._imgEl) return;
    this._imgEl.onerror = null;
    this._imgEl.src = '';
    this._imgEl = null;
  }

  _destroyVideoEl() {
    if (!this._videoEl) return;
    this._videoEl.pause();
    this._videoEl.srcObject = null;
    this._videoEl.onerror = null;
    this._videoEl = null;
  }

  _destroyFrameEl() {
    if (!this._frameEl) return;
    this._frameEl.onload = null;
    this._frameEl.onerror = null;
    this._frameEl = null;
    this._frameShownSeq = -1;
  }

  _flushCanvas() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    this._destroyFrameEl();
    this._streamType = null;
    this._currentRatio = null;
  }

  componentDidMount() {
    this._rafId = requestAnimationFrame(() => this._tick());
  }

  componentWillUnmount() {
    cancelAnimationFrame(this._rafId);
    this._destroyImgEl();
    this._destroyVideoEl();
    this._destroyFrameEl();
  }

  render() {
    const { className, style } = this.props;
    return <canvas ref={this.canvasRef} className={className} style={style} />;
  }
}

export default PreviewStream;
