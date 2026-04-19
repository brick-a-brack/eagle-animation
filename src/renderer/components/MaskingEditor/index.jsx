import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as style from './style.module.css';

class MaskingEditor extends Component {
  constructor(props) {
    super(props);

    this.dom = {
      output: React.createRef(),
    };

    this.state = {
      isDrawing: false,
      dimensions: {
        width: 0,
        height: 0
      }
    };

    // Last coorodonates
    this.lastX = 0;
    this.lastY = 0;

    // To know if the user is drawing or not, we can't use the store value, beaucause it's async
    this.isDrawing = false;

    this.images = {
      foreground: null,
      background: null,
      transparent: null,
      temporary: null,
      render: null,
    };

    this.animId = null;
  }

  componentDidMount() {
    this._loadImages();
    this._setupEventListeners();

    // Animation loop
    let last = 0;
    const loop = (time) => {
      const delta = time - last;
      if (delta > 1000 / 30) { // 30 FPS
        this._redraw();
        last = time;
      }
      this.animId = requestAnimationFrame(loop);
    }

    loop();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.backgroundLayer !== this.props.backgroundLayer ||
      prevProps.foregroundLayer !== this.props.foregroundLayer ||
      prevProps.transparentLayer !== this.props.transparentLayer
    ) {
      console.log('RELOADING EDITOR');
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
    // Load background and foreground images
    const [background, foreground] = await Promise.all([
      this._loadImage(this.props.backgroundLayer),
      this._loadImage(this.props.foregroundLayer),
    ])
    this.images.background = background;
    this.images.foreground = foreground;

    // Load transparent layer if provided
    this.images.transparent = await this._loadImage(this.props.transparentLayer, background.width, background.height)

    // Prepare temporary canvas
    this.images.temporary = document.createElement('canvas');
    this.images.temporary.width = background.width;
    this.images.temporary.height = background.height;

    // Prepare export render canvas
    this.images.render = document.createElement('canvas');
    this.images.render.width = background.width;
    this.images.render.height = background.height;

    // Prepare visual output canvas
    this._setupOutputCanvas(background.width, background.height);
  }

  _setupOutputCanvas(width, height) {
    this.dom.output.current.width = width;
    this.dom.output.current.height = height;
    this.setState({ dimensions: { width, height } });
  }

  _setupEventListeners() {
    //console.log('CANVAS', this.dom.output);

    const canvas = this.dom.output.current;

    // Mouse events
    canvas.addEventListener('mousedown', this._startDrawing);
    window.addEventListener('mousemove', this._draw);
    window.addEventListener('mouseup', this._stopDrawing);
    canvas.addEventListener('mouseleave', this._stopDrawing);

    // Touch events
    /* canvas.addEventListener('touchstart', this._handleTouch);
     canvas.addEventListener('touchmove', this._handleTouch);
     canvas.addEventListener('touchend', this._stopDrawing);*/
  }

  _removeEventListeners() {
    const canvas = this.dom.output.current;

    // Mouse events
    canvas.removeEventListener('mousedown', this._startDrawing);
    window.removeEventListener('mousemove', this._draw);
    window.removeEventListener('mouseup', this._stopDrawing);
    canvas.removeEventListener('mouseleave', this._stopDrawing);

    // Touch events
    /* canvas.removeEventListener('touchstart', this._handleTouch);
     canvas.removeEventListener('touchmove', this._handleTouch);
     canvas.removeEventListener('touchend', this._stopDrawing);*/
  }

  _handleTouch = (e) => {
    /* e.preventDefault();
     const touch = e.touches[0];
     const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
       clientX: touch.clientX,
       clientY: touch.clientY
     });
     this.images.transparent.dispatchEvent(mouseEvent);*/
  }

  _startDrawing = (e) => {
    this.isDrawing = true;

    console.log('POS', e.target.getBoundingClientRect())

    const x = e.offsetX / e.target.getBoundingClientRect().width * this.images.background.width;
    const y = e.offsetY / e.target.getBoundingClientRect().height * this.images.background.height;


    console.log('startDrawing', e)
    this.lastX = x;
    this.lastY = y;
    this.setState({ isDrawing: true });
  }

  _draw = (e) => {
    if (!this.isDrawing) {
      return;
    }

    if (!['REMOVE', 'RESTORE'].includes(this.props.mode)) {
      return;
    }

    // Get position in the picture
    const x = e.offsetX / e.target.getBoundingClientRect().width * this.images.background.width;
    const y = e.offsetY / e.target.getBoundingClientRect().height * this.images.background.height;

    // First step
    if (this.lastX === null) {
      this.lastX === x;
    }
    if (this.lastY === null) {
      this.lastY === y;
    }

    const ctx = this.images.transparent.getContext('2d');

    ctx.globalCompositeOperation = this.props.mode === 'RESTORE' ? 'destination-out' : 'source-over';
    ctx.lineWidth = this.props.brushSize * this.images.background.width / 1000; // TODO: Be sure it's consistent with various img size


    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(255, 255, 255)";
    ctx.shadowColor = 'rgba(255, 255, 255)';

    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  _stopDrawing = () => {
    this.isDrawing = false;
    this.setState({ isDrawing: false });
    this.lastX = null;
    this.lastY = null;
    // this._notifyChange();
  }

  _drawToCanvas(canvas = null, mode = null) {
    const outputCtx = canvas.getContext('2d');

    // No background image, exit
    if (!this.images.background) {
      return;
    }

    // Clear the output canvas
    outputCtx.clearRect(0, 0, this.images.background.width, this.images.background.height);

    // Draw background
    if (this.images.background) {
      outputCtx.globalCompositeOperation = 'source-over';
      outputCtx.drawImage(this.images.background, 0, 0, this.images.background.width, this.images.background.height);

      if (mode === 'RESTORE') {
        outputCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        outputCtx.fillRect(0, 0, this.images.background.width, this.images.background.height);
      }
    }

    // Draw foreground with alpha mask
    if (this.images.foreground) {
      const tempCtx = this.images.temporary.getContext('2d');
      tempCtx.clearRect(0, 0, this.images.background.width, this.images.background.height);
      tempCtx.globalCompositeOperation = 'source-over';
      tempCtx.drawImage(this.images.foreground, 0, 0);

      if (mode === 'REMOVE') {
        tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        tempCtx.fillRect(0, 0, this.images.background.width, this.images.background.height);
      }

      tempCtx.globalCompositeOperation = 'destination-out';
      tempCtx.drawImage(this.images.transparent, 0, 0);
      outputCtx.globalCompositeOperation = 'source-over';
      outputCtx.drawImage(this.images.temporary, 0, 0);
    }
  }

  _redraw() {
    this._drawToCanvas(this.dom.output.current, this.props.mode);
  }

  async exportLayers() {
    this._drawToCanvas(this.images.render, 'PREVIEW');

    return {
      layers: {
        //background : await new Promise(resolve => this.images.background.toBlob(resolve, 'image/jpeg')),
        //foreground  :  await new Promise(resolve => this.images.foreground.toBlob(resolve, 'image/jpeg')),
        transparent: await new Promise(resolve => this.images.transparent.toBlob(resolve, 'image/png')),
      },
      frame: await new Promise(resolve => this.images.render.toBlob(resolve, 'image/jpeg')),
    }
  }

  render() {
    return (
      <div className={style.container}>
        <canvas
          ref={this.dom.output}
          className={style.layout}
        />
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
  onModeChange: () => { },
  onChange: () => { },
};

export default MaskingEditor;
