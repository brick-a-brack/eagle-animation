import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Player from '../Player/Player';
import Timeline from '../Timeline/Timeline';
import ControlBar from '../ControlBar/ControlBar';

class Animator extends Component {

    constructor(props) {
        super(props);

        this.state = {
            currentFrame: false,
            timeClock: false
        }
    }

    _getPictures(sceneId = 0) {
        if (!this.props.project)
            return []
        const { project, _path} = this.props.project;
        if (!project || !project.scenes || !project.scenes.length || !project.scenes[sceneId].pictures)
            return ([]);
        if (Array.isArray(project.scenes[sceneId].pictures))
            return (project.scenes[sceneId].pictures.map((e, idx) => ({ ...e, idx, path: `${_path}/${sceneId}/${e.filename}` })));
        return ([]);
    }

    _play() {
        const exec = () => {
            if (this.state.currentFrame === false && this.props.animator.parameters.loop === false)
                return false;
            if (this.state.currentFrame === false)
                this.setState({ currentFrame: 0 })
            else if (this.state.currentFrame >= this._getPictures().length - 1)
                this.setState({ currentFrame: false })
            else
                this.setState({ currentFrame: this.state.currentFrame + 1 })
            return true;
        }
        this.setState({
            timeClock: setTimeout(() => {
                if (!exec())
                    return this._stop();
                this._play();
            }, 1000 / this.props.animator.parameters.FPS)
        }, () => {
            if (!this.props.animator.parameters.play)
                this.props.onParameterChange('play', true);
        });
    }

    _stop() {
        if (this.state.timeClock)
            clearTimeout(this.state.timeClock);
        this.setState({ timeClock: false, currentFrame: false }, () => {
            if (this.props.animator.parameters.play)
                this.props.onParameterChange('play', false);
        });
    }

    _selectFrame(frame) {
        if (frame === false)
            this.setState({ currentFrame: false });
        else
            this.setState({ currentFrame: frame.idx });
    }

    _takePicture(e) {
        this.props.onParameterChange('takePicture', true);
        this.props.onTakePicture();
    }

    render() {
        console.log('IMG', this.props);
        const { onParameterChange, animator } = this.props;
        const pictures = this._getPictures().map(e => (e.path));
        return <div>
            <Player
                onInit={(dom) => { this.props.onInit(dom); }}
                onReady={() => { }}
                mode={(this.state.currentFrame === false) ? 'video' : 'picture'}
                picture={(this.state.currentFrame === false) ? pictures[pictures.length - 1] : pictures[this.state.currentFrame]}
                opacity={(this.state.currentFrame === false) ? animator.parameters.onion : 1}
                showGrid={false}
            />
            <ControlBar
                onPlay={(e) => { this.setState({ currentFrame: 0 }); ((animator.parameters.play) ? this._stop() : this._play()); }}
                onLoop={(e) => { onParameterChange('loop', e) }}
                onTakePicture={(e) => { this._takePicture(); }}
                onShortPlay={(e) => { onParameterChange('shortPlay', e) }}
                onDiff={(e) => { onParameterChange('diff', e) }}
                onExport={(e) => { onParameterChange('export', e) }}
                onFPS={(e) => { onParameterChange('FPS', e) }}
                onOnion={(e) => { onParameterChange('onion', e) }}
                onGrid={(e) => { onParameterChange('grid', e) }}

                playStatus={animator.parameters.play}
                loopStatus={animator.parameters.loop}
                takePictureStatus={animator.parameters.takePicture}
                shortPlayStatus={animator.parameters.shortPlay}
                diffStatus={animator.parameters.diff}
                exportStatus={animator.parameters.export}
                FPSStatus={animator.parameters.FPS}
                onionStatus={animator.parameters.onion}
                gridStatus={animator.parameters.grid}
            />
            <Timeline pictures={this._getPictures()} onSelect={(frame) => { this._selectFrame(frame); }} />
        </div>
    }
}

Animator.propTypes = {
    project: PropTypes.object.isRequired,
    animator: PropTypes.object.isRequired,
    device: PropTypes.object.isRequired,
    onInit: PropTypes.func.isRequired,
    onParameterChange: PropTypes.func.isRequired,
    onTakePicture: PropTypes.func.isRequired
}

export default Animator;