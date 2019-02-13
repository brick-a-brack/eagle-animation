import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './Player.css';

class Player extends Component {

    constructor(props) {
        super(props);

        this.dom = {
            video: React.createRef(),
            picture: React.createRef(),
            grid: React.createRef()
        }

        this.state = {
            grid: false,
        };
    }

    getRatio() {
        return ('16:9');
    }

    getSize() {
        return {
            width: 1280,
            height: 720
        }
    }

    componentDidMount() {
        this.props.onInit(this.dom.video.current);
        this.dom.picture.current.width = this.getSize().width;
        this.dom.picture.current.height = this.getSize().height;
        this.dom.picture.current.style.width = this.getSize().width;
        this.dom.picture.current.style.height = this.getSize().height;
    }

    componentDidUpdate(prevProps) {
        if ((prevProps.mode !== this.props.mode && this.props.mode === 'picture') || prevProps.picture !== this.props.picture) {
            this.drawFrame(this.props.picture)
        }
    }

    drawFrame(src) {
        let ctx = this.dom.picture.current.getContext('2d');
        var img = new Image();
        img.addEventListener('load', () => {
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
            let ratioX = this.getSize().width / img.width;
            let ratioY = this.getSize().height / img.height;
            let minRatio = Math.min(ratioX, ratioY);
            let width = Math.round(img.width * minRatio);
            let height = Math.round(img.height * minRatio);
            ctx.drawImage(img, 0, 0, img.width, img.height, Math.round((this.getSize().width - width) / 2), Math.round((this.getSize().height - height) / 2), width, height);
        }, false);
        img.src = src;
    }

    render() {
        const { video, mode, showGrid } = this.props;
        return <div className={styles.container}>
            <video ref={this.dom.video} className={styles.layout} style={{ opacity: ((mode === 'video') ? 1 : 0) }} />
            <canvas ref={this.dom.picture} className={styles.layout} style={{ opacity: ((mode === 'picture') ? 1 : 1 - this.props.opacity) }} />
            <canvas ref={this.dom.grid} className={styles.layout} style={{ opacity: ((showGrid) ? 1 : 0) }} />
        </div>
    }
}

Player.propTypes = {
    mode: PropTypes.string.isRequired,
    picture: PropTypes.any.isRequired,
    opacity: PropTypes.any.isRequired,
    showGrid: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired
}

export default Player;
