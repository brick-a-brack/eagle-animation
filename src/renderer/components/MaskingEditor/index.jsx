import resizeToFit from 'intrinsic-scale';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import * as style from './style.module.css';
import { output } from 'i18next-scanner.config';

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
      alpha: React.createRef(),
      output: React.createRef(),
    };

    this.images = {
      foreground: null,
      background: null,
    };
  }

  componentDidMount(props) {


  }

  componentDidUpdate(prevProps) {

  }

  componentWillUnmount() {

  }

  _computeFrame(canvasDom, background, foreground, alpha) {

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
    const {t } = this.props;
    
    return (
      <div className={`${style.playerContainer}`}>
        <canvas
          ref={this.dom.alpha}
          className={style.layout}
        />
        <canvas
          ref={this.dom.output}
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
