import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import { ReactComponent as Camera } from './assets/camera.svg';
import { ReactComponent as IconPlay } from './assets/play.svg';
import { ReactComponent as IconPause } from './assets/pause.svg';

class ControlBar extends Component {
    render() {
        const {
            onPlay,
            onLoop,
            onTakePicture,
            onShortPlay,
            onDiff,
            onExport,
            onFPS,
            onOnion,
            onGrid
        } = this.props;

        const {
            playStatus,
            loopStatus,
            takePictureStatus,
            shortPlayStatus,
            diffStatus,
            exportStatus,
            FPSStatus,
            onionStatus,
            gridStatus
        } = this.props;

        return (
            <div className={styles.container}>
                <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        onTakePicture(!takePictureStatus);
                    }}
                    onKeyPress={() => {
                        onTakePicture(!takePictureStatus);
                    }}
                    className={styles.button}
                >
                    <Camera />
                </span>

                <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        onPlay(!playStatus);
                    }}
                    onKeyPress={() => {
                        onPlay(!playStatus);
                    }}
                    className={styles.button_mini}
                >
                    {playStatus ? <IconPause /> : <IconPlay />}
                </span>

                <span
                    role="button"
                    tabIndex={-1}
                    onClick={() => {
                        onLoop(!loopStatus);
                    }}
                    onKeyPress={() => {
                        onLoop(!loopStatus);
                    }}
                    className="button"
                >
          LOOP
                </span>
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={() => {
                        onShortPlay(!shortPlayStatus);
                    }}
                    onKeyPress={() => {
                        onShortPlay(!shortPlayStatus);
                    }}
                    className="button"
                >
          SHORT PLAY
                </span>
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={() => {
                        onDiff(!diffStatus);
                    }}
                    onKeyPress={() => {
                        onDiff(!diffStatus);
                    }}
                    className="button"
                >
          DIFF
                </span>
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={() => {
                        onGrid(!gridStatus);
                    }}
                    onKeyPress={() => {
                        onGrid(!gridStatus);
                    }}
                    className="button"
                >
          GRID
                </span>
                <span
                    role="button"
                    tabIndex={-1}
                    onClick={() => {
                        onExport(!exportStatus);
                    }}
                    onKeyPress={() => {
                        onExport(!exportStatus);
                    }}
                    className="button"
                >
          EXPORT
                </span>
                <input
                    type="number"
                    value={FPSStatus}
                    onChange={(e) => {
                        onFPS(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        onFPS(e.target.value);
                    }}
                />
                <input
                    type="range"
                    min="0"
                    step="0.001"
                    max="1"
                    value={onionStatus}
                    onChange={(e) => {
                        onOnion(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        onOnion(e.target.value);
                    }}
                />
            </div>
        );
    }
}

ControlBar.propTypes = {
    onPlay: PropTypes.func.isRequired,
    onLoop: PropTypes.func.isRequired,
    onTakePicture: PropTypes.func.isRequired,
    onShortPlay: PropTypes.func.isRequired,
    onDiff: PropTypes.func.isRequired,
    onExport: PropTypes.func.isRequired,
    onFPS: PropTypes.func.isRequired,
    onOnion: PropTypes.func.isRequired,
    onGrid: PropTypes.func.isRequired,

    playStatus: PropTypes.bool.isRequired,
    loopStatus: PropTypes.bool.isRequired,
    takePictureStatus: PropTypes.bool.isRequired,
    shortPlayStatus: PropTypes.bool.isRequired,
    diffStatus: PropTypes.bool.isRequired,
    exportStatus: PropTypes.bool.isRequired,
    FPSStatus: PropTypes.string.isRequired,
    onionStatus: PropTypes.string.isRequired,
    gridStatus: PropTypes.bool.isRequired
};

export default ControlBar;
