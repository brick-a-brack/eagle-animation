import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './ControlBar.css';

import { ReactComponent as Camera} from './assets/camera.svg'
import { ReactComponent as  IconPlay} from './assets/play.svg'
import { ReactComponent as IconPause} from './assets/pause.svg'


class ControlBar extends Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { onPlay, onLoop, onTakePicture, onShortPlay, onDiff, onExport, onFPS, onOnion, onGrid } = this.props;

        const { playStatus, loopStatus, takePictureStatus, shortPlayStatus, diffStatus, exportStatus, FPSStatus, onionStatus, gridStatus } = this.props;

        return <div className={styles.container}>
            <span onClick={() => { onTakePicture(!takePictureStatus) }} className={styles.button}><Camera/></span>


            <span onClick={() => { onPlay(!playStatus) }} className={styles.button_mini}>{(this.props.playStatus) ? <IconPause/> : <IconPlay/>}</span>

            
            <span onClick={() => { onLoop(!loopStatus) }} className={"button"}>LOOP</span>
            <span onClick={() => { onShortPlay(!shortPlayStatus) }} className={"button"}>SHORT PLAY</span>
            <span onClick={() => { onDiff(!diffStatus) }} className={"button"}>DIFF</span>
            <span onClick={() => { onGrid(!gridStatus) }} className={"button"}>GRID</span>
            <span onClick={() => { onExport(!exportStatus) }} className="button">EXPORT</span>
            <input type="number" value={FPSStatus} onChange={(e) => { onFPS(e.target.value) }} onKeyDown={(e) => { onFPS(e.target.value) }} />
            <input type="range" min="0" step="0.001" max="1" value={onionStatus} onChange={(e) => { onOnion(e.target.value) }} onKeyDown={(e) => { onOnion(e.target.value) }} />
        </div>
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
}

export default ControlBar;