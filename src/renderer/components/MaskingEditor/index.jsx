/*
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

class MaskingEditor extends Component {
  constructor(props) {
    super(props);

    this.dom = {
        preview: React.createRef(),
        alpha: React.createRef(),
    };

    this.stop = () => {
      
        
    };

  }

  componentDidMount() {
   
    
  }

  componentDidUpdate(prevProps) {
    
    
  }

  componentWillUnmount() {
   
    
  }

  const computeFrame = (canvasDom, background, foreground, alpha) => {

let backgroundLayer = background;
    if (!(background instanceof HTMLCanvasElement)) {

    }


    

    const ctx = this.dom.picture.current.getContext('2d', { alpha: false });
    if (src === false) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
      return;
    }


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
    const { showGrid, onionValue, blendMode, isCameraReady, t, batteryStatus, ratioLayerOpacity, reverseX, reverseY } = this.props;

    return (
      <div className={`${style.playerContainer}`}>
          <canvas
            ref={this.dom.preview}
            className={style.layout}
          />
          <canvas
            ref={this.dom.alpha}
            className={style.layout}
          />
          <button>GOMME</button>
          <button>ANTI-GOMME</button>
      </div>
    );
  }
}

Player.propTypes = {
  backgroundLayer: PropTypes.any.isRequired,
  foregroundLayer: PropTypes.any.isRequired,
  alphaLayer: PropTypes.any.isRequired,
};

export default Player;
*/
