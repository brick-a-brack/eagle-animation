import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.css';

class Player extends Component {
    constructor(props) {
        super(props);

        this.dom = {
            video: React.createRef(),
            picture: React.createRef(),
            grid: React.createRef()
        };
    }

    componentDidMount() {
        const { onInit } = this.props;
        onInit(this.dom.video.current);
        this.dom.picture.current.width = this.getSize().width;
        this.dom.picture.current.height = this.getSize().height;
        this.dom.picture.current.style.width = this.getSize().width;
        this.dom.picture.current.style.height = this.getSize().height;
    }

    componentDidUpdate(prevProps) {
        const { mode, picture } = this.props;
        if (
            (prevProps.mode !== mode && mode === 'picture')
            || prevProps.picture !== picture
        )
            this.drawFrame(picture);
    }

    getRatio() { // eslint-disable-line class-methods-use-this
        return '16:9';
    }

    getSize() { // eslint-disable-line class-methods-use-this
        return {
            width: 1280,
            height: 720
        };
    }

    drawFrame(src) {
        const ctx = this.dom.picture.current.getContext('2d');
        const img = new Image();
        img.addEventListener(
            'load',
            () => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, this.getSize().width, this.getSize().height);
                const ratioX = this.getSize().width / img.width;
                const ratioY = this.getSize().height / img.height;
                const minRatio = Math.min(ratioX, ratioY);
                const width = Math.round(img.width * minRatio);
                const height = Math.round(img.height * minRatio);
                ctx.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    Math.round((this.getSize().width - width) / 2),
                    Math.round((this.getSize().height - height) / 2),
                    width,
                    height
                );
            },
            false
        );
        img.src = src;
    }

    render() {
        const { mode, showGrid, opacity } = this.props;
        return (
            <div className={styles.container}>
                <video
                    ref={this.dom.video}
                    className={styles.layout}
                    style={{ opacity: mode === 'video' ? 1 : 0 }}
                />
                <canvas
                    ref={this.dom.picture}
                    className={styles.layout}
                    style={{ opacity: mode === 'picture' ? 1 : 1 - opacity }}
                />
                <canvas
                    ref={this.dom.grid}
                    className={styles.layout}
                    style={{ opacity: showGrid ? 1 : 0 }}
                />
            </div>
        );
    }
}

Player.propTypes = {
    mode: PropTypes.string.isRequired,
    picture: PropTypes.any.isRequired,
    opacity: PropTypes.any.isRequired,
    showGrid: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired
};

export default Player;
