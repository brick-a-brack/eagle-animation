import { Component, createRef } from 'react';

class PreviewStream extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = createRef();
    this._videoEl = null;
    this._imgEl = null;
    this._streamType = null;
    this._currentRatio = null;
    this._rafId = null;
  }

  setStream(type, data) {
    this.props.onStreamChange?.(type, data);

    this._flushCanvas();

    if (type === 'image') {
      this._destroyImgEl();
      this._imgEl = new Image();
      this._imgEl.onerror = () => this._flushCanvas();
      this._imgEl.src = data;
      this._streamType = 'image';
    } else if (type === 'video') {
      this._destroyVideoEl();
      this._videoEl = document.createElement('video');
      this._videoEl.muted = true;
      this._videoEl.playsInline = true;
      this._videoEl.onerror = () => this._flushCanvas();
      this._videoEl.srcObject = data;
      this._videoEl.play();
      this._streamType = 'video';
    } else {
      this._streamType = null;
    }
  }

  getStreamRatio() {
    return this._currentRatio;
  }

  _notifyRatioChange(newRatio) {
    if (this._currentRatio === newRatio) return;
    this._currentRatio = newRatio;
    this.props.onRatioChange?.(newRatio);
  }

  _tick() {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');

      if (this._streamType === 'image' && this._imgEl?.complete && this._imgEl?.naturalWidth) {
        if (canvas.width !== this._imgEl.naturalWidth) canvas.width = this._imgEl.naturalWidth;
        if (canvas.height !== this._imgEl.naturalHeight) canvas.height = this._imgEl.naturalHeight;
        ctx.drawImage(this._imgEl, 0, 0);
        this._notifyRatioChange(this._imgEl.naturalWidth / this._imgEl.naturalHeight);
      } else if (this._streamType === 'video' && this._videoEl?.readyState >= this._videoEl?.HAVE_CURRENT_DATA) {
        if (canvas.width !== this._videoEl.videoWidth) canvas.width = this._videoEl.videoWidth;
        if (canvas.height !== this._videoEl.videoHeight) canvas.height = this._videoEl.videoHeight;
        ctx.drawImage(this._videoEl, 0, 0);
        if (this._videoEl.videoWidth && this._videoEl.videoHeight) {
          this._notifyRatioChange(this._videoEl.videoWidth / this._videoEl.videoHeight);
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

  _flushCanvas() {
    const canvas = this.canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
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
  }

  render() {
    const { className, style } = this.props;
    return <canvas ref={this.canvasRef} className={className} style={style} />;
  }
}

export default PreviewStream;
