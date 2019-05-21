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
        this.dom.grid.current.width = this.getSize().width;
        this.dom.grid.current.height = this.getSize().height;
        this.dom.grid.current.style.width = this.getSize().width;
        this.dom.grid.current.style.height = this.getSize().height;
        this.drawGrid();
    }

    componentDidUpdate(prevProps) {
        const { mode, picture } = this.props;
        if (
            picture
            && ((prevProps.mode !== mode && mode === 'picture')
                || prevProps.picture !== picture)
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

    drawGrid() {
        const { width, height } = this.getSize();
        const ctx = this.dom.grid.current.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(Math.round(width * 1 / 3), 0, 1, height);
        ctx.fillRect(Math.round(width * 2 / 3), 0, 1, height);
        ctx.fillRect(0, Math.round(height * 1 / 3), width, 1);
        ctx.fillRect(0, Math.round(height * 2 / 3), width, 1);
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
        const {
            mode, showGrid, opacity, blendMode
        } = this.props;
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
                    style={{
                        opacity: (mode === 'picture' || blendMode) ? 1 : 1 - opacity,
                        mixBlendMode: (!blendMode) ? 'normal' : 'difference'
                    }}
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
    blendMode: PropTypes.any.isRequired,
    picture: PropTypes.any.isRequired,
    opacity: PropTypes.any.isRequired,
    showGrid: PropTypes.bool.isRequired,
    onInit: PropTypes.func.isRequired
};

export default Player;
