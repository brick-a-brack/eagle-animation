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

    // Background and foreground stay decoded images: a canvas copy would double the
    // memory and can come back blank after a GPU context loss, exporting a black frame
    this.images = {
      foreground: null,
      background: null,
      transparent: null,
      temporary: null,
    };

    // Small canvases holding one blurred brush segment, see _drawLine
    this.brush = {
      stroke: document.createElement('canvas'),
      blurred: document.createElement('canvas'),
    };

    // Pending redraw, the canvas is only repainted when something changed
    this.animId = null;

    // Nothing to save when the mask was never touched
    this.hasChanges = false;

    // Last pointer position, to draw the brush preview on hover
    this.pointerLastPosition = null;
  }

  componentDidMount() {
    this._loadImages();
    this._setupEventListeners();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.backgroundLayer !== this.props.backgroundLayer || prevProps.foregroundLayer !== this.props.foregroundLayer || prevProps.transparentLayer !== this.props.transparentLayer) {
      this._loadImages();
    }
    if (prevProps.mode !== this.props.mode || prevProps.brushSize !== this.props.brushSize) {
      this._requestRedraw();
    }
  }

  componentWillUnmount() {
    this._removeEventListeners();
    if (this.animId) {
      window.cancelAnimationFrame(this.animId);
    }

    // Hand the full-resolution buffers back now instead of waiting for the GC
    for (const canvas of [this.images.transparent, this.images.temporary, this.brush.stroke, this.brush.blurred]) {
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
    }
  }

  _requestRedraw() {
    if (this.animId) {
      return;
    }
    this.animId = requestAnimationFrame(() => {
      this.animId = null;
      try {
        this._redraw();
      } catch (err) {
        console.error('Failed to draw the masking editor', err);
      }
    });
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.addEventListener('error', reject);
      img.addEventListener('load', () => resolve(img));
      img.src = src;
    });
  }

  async _loadCanvas(src, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    if (src) {
      const img = await this._loadImage(src);
      canvas.width = img.width || width;
      canvas.height = img.height || height;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    return canvas;
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

    // Load transparent layer if provided, it is the only layer the user paints on
    this.images.transparent = await this._loadCanvas(this.props.transparentLayer, background.width, background.height);
    this.hasChanges = false;

    // Prepare temporary canvas
    this.images.temporary = document.createElement('canvas');
    this.images.temporary.width = background.width;
    this.images.temporary.height = background.height;

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
    this._requestRedraw();
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
    this._requestRedraw();
    this.lastX = x;
    this.lastY = y;
    this.setState({ isDrawing: true });
  };

  // A blur filter on the full-size mask makes Chrome filter a layer as big as the whole
  // picture for every segment (~150 ms in 4K), so the segment is blurred on a canvas
  // only as big as itself and then copied onto the mask
  _drawLine(ctx, x1, y1, x2, y2) {
    const brushSize = this._getBrushSize();
    const blur = Math.round((this.props.brushBlurSize / 10000) * this.images.background.width);

    // Room for the round caps plus the blur spread (3 sigma)
    const padding = Math.ceil(brushSize / 2 + blur * 3);
    const left = Math.floor(Math.min(x1, x2)) - padding;
    const top = Math.floor(Math.min(y1, y2)) - padding;
    const width = Math.ceil(Math.abs(x2 - x1)) + 2 * padding + 1;
    const height = Math.ceil(Math.abs(y2 - y1)) + 2 * padding + 1;

    // Only grow the brush canvases, resizing them on every segment would reallocate them
    for (const canvas of [this.brush.stroke, this.brush.blurred]) {
      if (canvas.width < width || canvas.height < height) {
        canvas.width = Math.max(canvas.width, width);
        canvas.height = Math.max(canvas.height, height);
      }
    }

    const strokeCtx = this.brush.stroke.getContext('2d');
    strokeCtx.clearRect(0, 0, width, height);
    strokeCtx.fillStyle = 'rgb(255, 255, 255)';
    strokeCtx.strokeStyle = 'rgb(255, 255, 255)';
    strokeCtx.lineWidth = brushSize;
    strokeCtx.lineCap = 'round';
    strokeCtx.lineJoin = 'round';
    strokeCtx.beginPath();

    // A zero-length stroke paints nothing whatever the line cap, so a click or a tap
    // that never moves has to be filled as a disc to leave its dot
    if (x1 === x2 && y1 === y2) {
      strokeCtx.arc(x1 - left, y1 - top, brushSize / 2, 0, 2 * Math.PI);
      strokeCtx.fill();
    } else {
      strokeCtx.moveTo(x1 - left, y1 - top);
      strokeCtx.lineTo(x2 - left, y2 - top);
      strokeCtx.stroke();
    }

    let source = this.brush.stroke;
    if (blur > 0) {
      const blurredCtx = this.brush.blurred.getContext('2d');
      blurredCtx.clearRect(0, 0, width, height);
      blurredCtx.filter = `blur(${blur}px)`;
      blurredCtx.drawImage(this.brush.stroke, 0, 0, width, height, 0, 0, width, height);
      blurredCtx.filter = 'none';
      source = this.brush.blurred;
    }

    ctx.globalCompositeOperation = this.props.mode === 'RESTORE' ? 'destination-out' : 'source-over';
    ctx.drawImage(source, 0, 0, width, height, left, top, width, height);
    ctx.globalCompositeOperation = 'source-over';
    this.hasChanges = true;
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

    // The brush preview follows the pointer, but only over an editable canvas
    if (['REMOVE', 'RESTORE'].includes(this.props.mode)) {
      this._requestRedraw();
    }

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
    this._requestRedraw();
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
    this.hasChanges = true;
    this._requestRedraw();
  }

  _redraw() {
    this._drawToCanvas(this.dom.output.current, this.props.mode);
  }

  // Resolves null when there is nothing worth saving, so the frame is left untouched
  async exportLayers() {
    if (!this.hasChanges || !this.images.background || !this.images.transparent || !this._isSameDimensions()) {
      return null;
    }

    // Only allocated for the export, keeping it around would pin one more full-size buffer
    const render = document.createElement('canvas');
    render.width = this.images.background.width;
    render.height = this.images.background.height;

    try {
      this._drawToCanvas(render, 'PREVIEW');

      // A lost context reads back as a blank canvas, which would replace the frame with a black one
      if (render.getContext('2d').isContextLost?.() || this.images.transparent.getContext('2d').isContextLost?.()) {
        console.error('Masking export skipped, the canvas context was lost');
        return null;
      }

      // Both encodings run in parallel, the PNG of a full-size mask is the slow one
      const [transparent, frame] = await Promise.all([
        new Promise((resolve) => this.images.transparent.toBlob(resolve, 'image/png')),
        new Promise((resolve) => render.toBlob(resolve, 'image/jpeg', FRAME_JPEG_QUALITY)),
      ]);
      if (!transparent || !frame) {
        return null;
      }

      return { layers: { transparent }, frame };
    } finally {
      render.width = 0;
      render.height = 0;
    }
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
