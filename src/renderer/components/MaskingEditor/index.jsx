import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faTriangleExclamation from '@icons/faTriangleExclamation';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as style from './style.module.css';

// High enough that a re-encode of an already compressed capture stays invisible
const FRAME_JPEG_QUALITY = 0.92;

class MaskingEditor extends Component {
  constructor(props) {
    super(props);

    // DOM elements
    this.dom = {
      output: React.createRef(),
    };

    // Component state
    this.state = {
      error: false,
      isDrawing: false,
      dimensions: {
        width: 0,
        height: 0,
      },
    };

    // Last coorodonates
    this.lastX = null;
    this.lastY = null;

    // To know if the user is drawing or not, we can't use the store value, beaucause it's async
    this.isDrawing = false;

    // Loaded images data
    this.images = {
      foreground: null,
      background: null,
      transparent: null,
      temporary: null,
      render: null,
    };

    // Refresh animation id
    this.animId = null;

    // Last pointer position, to draw the brush preview on hover
    this.pointerLastPosition = null;
  }

  componentDidMount() {
    this._loadImages();
    this._setupEventListeners();

    // Animation loop
    let last = 0;
    const loop = (time) => {
      const delta = time - last;
      if (delta > 1000 / 60) {
        // 30 FPS
        try {
          this._redraw();
        } catch (err) {
          console.error('ISSUE', err);
        }
        last = time;
      }
      this.animId = requestAnimationFrame(loop);
    };

    loop();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.backgroundLayer !== this.props.backgroundLayer || prevProps.foregroundLayer !== this.props.foregroundLayer || prevProps.transparentLayer !== this.props.transparentLayer) {
      this._loadImages();
    }
  }

  componentWillUnmount() {
    this._removeEventListeners();
    if (this.animId) {
      window.cancelAnimationFrame(this.animId);
    }
  }

  _loadImage(src, defaultWidth = null, defaultHeight = null) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.addEventListener('error', reject);
        img.addEventListener('load', () => {
          canvas.width = img.width || defaultWidth || 0;
          canvas.height = img.height || defaultHeight || 0;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas);
        });
        img.src = src;
      } else {
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resolve(canvas);
      }
    });
  }

  async _loadImages() {
    try {
      await this._loadImagesOrThrow();
    } catch (err) {
      console.error('Failed to load the masking layers', err);
      this.setState({ error: true });
    }
  }

  async _loadImagesOrThrow() {
    // Load background and foreground images
    const [background, foreground] = await Promise.all([this._loadImage(this.props.backgroundLayer), this._loadImage(this.props.foregroundLayer)]);
    this.images.background = background;
    this.images.foreground = foreground;

    // Load transparent layer if provided
    this.images.transparent = await this._loadImage(this.props.transparentLayer, background.width, background.height);

    // Prepare temporary canvas
    this.images.temporary = document.createElement('canvas');
    this.images.temporary.width = background.width;
    this.images.temporary.height = background.height;

    // Prepare export render canvas
    this.images.render = document.createElement('canvas');
    this.images.render.width = background.width;
    this.images.render.height = background.height;

    // Check sizes
    if (!this._isSameDimensions()) {
      this.setState({ error: true });
    }

    // Prepare visual output canvas
    this._setupOutputCanvas(background.width, background.height);
  }

  _setupOutputCanvas(width, height) {
    if (this.dom.output.current) {
      this.dom.output.current.width = width;
      this.dom.output.current.height = height;
    }
    this.setState({ dimensions: { width, height } });
  }

  _setupEventListeners() {
    const canvas = this.dom.output.current;

    // Pointer events cover mouse, touch and pen through a single path
    canvas.addEventListener('pointerdown', this._startDrawing);
    window.addEventListener('pointermove', this._draw);
    window.addEventListener('pointerup', this._stopDrawing);
    // A stroke the system takes over (gesture, call, ...) never gets a pointerup
    window.addEventListener('pointercancel', this._stopDrawing);
  }

  _removeEventListeners() {
    const canvas = this.dom.output.current;

    canvas.removeEventListener('pointerdown', this._startDrawing);
    window.removeEventListener('pointermove', this._draw);
    window.removeEventListener('pointerup', this._stopDrawing);
    window.removeEventListener('pointercancel', this._stopDrawing);
  }

  _startDrawing = (e) => {
    // Only the first finger paints: the second one of a pinch would otherwise
    // drag a stray line across the frame
    if (!e.isPrimary) {
      return;
    }

    // No position to paint at yet: the canvas accepts pointers as soon as the mode
    // is editable, which can be before the layers have finished loading
    const position = this._getPointerInCanvasPosition(e, true);
    if (!position) {
      return;
    }

    this.isDrawing = true;
    const ctx = this.images.transparent.getContext('2d');
    const { x, y } = position;
    this._drawLine(ctx, x, y, x, y);
    this.lastX = x;
    this.lastY = y;
    this.setState({ isDrawing: true });
  };

  _drawLine(ctx, x1, y1, x2, y2) {
    const brushSize = this._getBrushSize();
    ctx.globalCompositeOperation = this.props.mode === 'RESTORE' ? 'destination-out' : 'source-over';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255)';
    ctx.shadowColor = 'rgba(255, 255, 255)';
    ctx.filter = `blur(${Math.round((this.props.brushBlurSize / 10000) * this.images.background.width)}px)`;

    // A zero-length stroke paints nothing whatever the line cap, so a click or a tap
    // that never moves has to be filled as a disc to leave its dot
    if (x1 === x2 && y1 === y2) {
      ctx.fillStyle = 'rgba(255, 255, 255)';
      ctx.beginPath();
      ctx.arc(x1, y1, brushSize / 2, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  _getPointerInCanvasPosition = (e, applyLimits = false) => {
    const canvasHitBox = this.dom.output.current.getBoundingClientRect();

    if (!canvasHitBox || !this.images.background) {
      return null;
    }

    // Get position in the picture
    let x = ((e.clientX - canvasHitBox.x) / canvasHitBox.width) * this.images.background.width;
    let y = ((e.clientY - canvasHitBox.y) / canvasHitBox.height) * this.images.background.height;

    // X limit
    if (e.clientX < canvasHitBox.x && applyLimits) {
      x = 0;
    }
    if (e.clientX > canvasHitBox.x + canvasHitBox.width && applyLimits) {
      x = this.images.background.width;
    }

    // Y limit
    if (e.clientY < canvasHitBox.y && applyLimits) {
      y = 0;
    }
    if (e.clientY > canvasHitBox.y + canvasHitBox.height && applyLimits) {
      y = this.images.background.height;
    }

    return { x, y };
  };

  _getBrushSize = () => {
    if (!this.images.background) {
      return 0;
    }

    const imageSize = Math.min(this.images.background.width, this.images.background.height) || 0;
    const value = (imageSize * ((this.props.brushSize * 200) / 100)) / 1000;

    if (value < 1) {
      return 1;
    }
    if (value > imageSize) {
      return imageSize;
    }
    return value;
  };

  _draw = (e) => {
    if (!e.isPrimary) {
      return;
    }

    this.pointerLastPosition = this._getPointerInCanvasPosition(e, false);

    if (!this.isDrawing) {
      return;
    }

    if (!['REMOVE', 'RESTORE'].includes(this.props.mode)) {
      return;
    }

    const ctx = this.images.transparent.getContext('2d');

    // Get pointer position
    const pointerPosition = this._getPointerInCanvasPosition(e, true);
    const { x, y } = pointerPosition || { x: null, y: null };

    // First step
    if (this.lastX === null) {
      this.lastX = x;
    }
    if (this.lastY === null) {
      this.lastY = y;
    }

    if (x !== null && y !== null) {
      this._drawLine(ctx, this.lastX, this.lastY, x, y);
    }

    this.lastX = x;
    this.lastY = y;
  };

  _stopDrawing = (e) => {
    // A finger has no hover: leaving the brush preview where it was lifted would
    // keep a ghost circle on the frame
    if (e?.pointerType && e.pointerType !== 'mouse') {
      this.pointerLastPosition = null;
    }

    this.isDrawing = false;
    this.setState({ isDrawing: false });
    this.lastX = null;
    this.lastY = null;
  };

  _isSameDimensions = () => {
    return (
      this.images.background.width === this.images.foreground.width && // Same width
      this.images.background.height === this.images.foreground.height && // Same height
      (!this.images.transparent ||
        this.images.transparent.width === this.images.background.width || // Same width
        this.images.transparent.height === this.images.background.height) // Same height
    );
  };

  _drawToCanvas(canvas = null, mode = null) {
    if (!canvas) {
      return;
    }

    // Get context
    const outputCtx = canvas.getContext('2d');

    // Is editable by the user?
    const isEditable = mode === 'REMOVE' || mode === 'RESTORE';

    // No images, exit
    if (!this.images.background || !this.images.foreground || !this._isSameDimensions()) {
      return;
    }

    // Clear the output canvas
    outputCtx.clearRect(0, 0, this.images.background.width, this.images.background.height);

    // Draw background
    if (this.images.background) {
      outputCtx.globalCompositeOperation = 'source-over';
      outputCtx.drawImage(this.images.background, 0, 0, this.images.background.width, this.images.background.height);
    }

    // Draw foreground with alpha mask
    if (this.images.foreground && this.images.temporary) {
      const tempCtx = this.images.temporary.getContext('2d');
      tempCtx.clearRect(0, 0, this.images.background.width, this.images.background.height);
      tempCtx.globalCompositeOperation = 'source-over';
      tempCtx.drawImage(this.images.foreground, 0, 0);

      if (isEditable) {
        tempCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        tempCtx.fillRect(0, 0, this.images.background.width, this.images.background.height);
      }

      tempCtx.globalCompositeOperation = 'destination-out';
      tempCtx.drawImage(this.images.transparent, 0, 0);
      outputCtx.globalCompositeOperation = 'source-over';
      outputCtx.drawImage(this.images.temporary, 0, 0);
    }

    if (this.pointerLastPosition && isEditable) {
      outputCtx.beginPath();
      outputCtx.arc(this.pointerLastPosition.x, this.pointerLastPosition.y, this._getBrushSize() / 2, 0, 2 * Math.PI);
      outputCtx.fillStyle = 'rgba(255,255,255,0.2)';
      outputCtx.fill();
    }
  }

  flush() {
    if (!this.images.transparent) {
      return;
    }
    const ctx = this.images.transparent.getContext('2d');
    ctx.clearRect(0, 0, this.images.transparent.width, this.images.transparent.height);
  }

  _redraw() {
    this._drawToCanvas(this.dom.output.current, this.props.mode);
  }

  async exportLayers() {
    if (!this._isSameDimensions()) {
      return null;
    }

    this._drawToCanvas(this.images.render, 'PREVIEW');

    return {
      layers: {
        transparent: await new Promise((resolve) => this.images.transparent.toBlob(resolve, 'image/png')),
      },
      frame: await new Promise((resolve) => this.images.render.toBlob(resolve, 'image/jpeg', FRAME_JPEG_QUALITY)),
    };
  }

  render() {
    const isEditable = this.props.mode === 'REMOVE' || this.props.mode === 'RESTORE';
    return (
      <div className={style.container}>
        <canvas ref={this.dom.output} className={`${style.layout} ${isEditable ? style.isEditable : ''}`} />
        {this.state.error && (
          <div className={style.error}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
        )}
      </div>
    );
  }
}

MaskingEditor.propTypes = {
  backgroundLayer: PropTypes.string.isRequired,
  foregroundLayer: PropTypes.string.isRequired,
  transparentLayer: PropTypes.string,
  brushSize: PropTypes.number,
  mode: PropTypes.oneOf(['REMOVE', 'RESTORE', 'PREVIEW']),
  onModeChange: PropTypes.func,
  onChange: PropTypes.func,
};

MaskingEditor.defaultProps = {
  brushSize: 40,
  mode: 'REMOVE',
  onModeChange: () => {},
  onChange: () => {},
};

export default MaskingEditor;
