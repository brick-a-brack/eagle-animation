import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import Player from '../components/Player';
import Timeline from '../components/Timeline';
import ControlBar from '../components/ControlBar';

@observer
class Animator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentFrame: false,
            timeClock: false
        };
    }

    _onPlayerInit(dom) {
        const { StoreDevice } = this.props;
        StoreDevice.load(dom);
    }

    _getPictures(sceneId = 0) {
        const { StoreProject } = this.props;
        if (!StoreProject.data.data.project)
            return [];
        const { project, _path } = StoreProject.data.data;
        if (
            !project
            || !project.scenes
            || !project.scenes.length
            || !project.scenes[sceneId].pictures
        )
            return [];
        if (Array.isArray(project.scenes[sceneId].pictures)) {
            return project.scenes[sceneId].pictures.map((e, idx) => ({
                ...e,
                idx,
                path: `${_path}/${sceneId}/${e.filename}`
            }));
        }
        return [];
    }

    _play() {
        const { StoreAnimator } = this.props;
        const { currentFrame } = this.state;
        const exec = () => {
            if (
                !currentFrame
                && !StoreAnimator.data.parameters.loop
            )
                return false;
            if (currentFrame === false)
                this.setState({ currentFrame: 0 });
            else if (currentFrame >= this._getPictures().length - 1)
                this.setState({ currentFrame: false });
            else
                this.setState({ currentFrame: currentFrame + 1 });

            return true;
        };
        this.setState(
            {
                timeClock: setTimeout(() => {
                    if (!exec())
                        return this._stop();
                    this._play();
                }, 1000 / StoreAnimator.data.parameters.FPS)
            },
            () => {
                if (!StoreAnimator.data.parameters.play)
                    StoreAnimator.setParameter('play', true);
            }
        );
    }

    _stop() {
        const { StoreAnimator } = this.props;
        const { timeClock } = this.state;
        if (timeClock)
            clearTimeout(timeClock);
        this.setState({ timeClock: false, currentFrame: false }, () => {
            if (StoreAnimator.data.parameters.play)
                StoreAnimator.setParameter('play', false);
        });
    }

    _selectFrame(frame) {
        if (frame === false)
            this.setState({ currentFrame: false });
        else
            this.setState({ currentFrame: frame.idx });
    }

    _takePicture(e) {
        const { StoreAnimator } = this.props;
        StoreAnimator.setParameter('takePicture', true);
        console.log('TAKE PICTURE', e);
    }

    render() {
        const { StoreAnimator } = this.props;
        const { currentFrame } = this.state;
        const pictures = this._getPictures().map(e => e.path);
        return (
            <div>
                <Player
                    onInit={(dom) => {
                        this._onPlayerInit(dom);
                    }}
                    onReady={() => { }}
                    mode={currentFrame === false ? 'video' : 'picture'}
                    picture={
                        currentFrame === false
                            ? pictures[pictures.length - 1]
                            : pictures[currentFrame]
                    }
                    opacity={
                        currentFrame === false
                            ? StoreAnimator.data.parameters.onion
                            : 1
                    }
                    showGrid={false}
                />
                <ControlBar
                    onPlay={() => {
                        this.setState({ currentFrame: 0 });
                        if (StoreAnimator.data.parameters.play)
                            this._stop();
                        else
                            this._play();
                    }}
                    onLoop={(e) => {
                        StoreAnimator.setParameter('loop', e);
                    }}
                    onTakePicture={() => {
                        this._takePicture();
                    }}
                    onShortPlay={(e) => {
                        StoreAnimator.setParameter('shortPlay', e);
                    }}
                    onDiff={(e) => {
                        StoreAnimator.setParameter('diff', e);
                    }}
                    onExport={(e) => {
                        StoreAnimator.setParameter('export', e);
                    }}
                    onFPS={(e) => {
                        StoreAnimator.setParameter('FPS', e);
                    }}
                    onOnion={(e) => {
                        StoreAnimator.setParameter('onion', e);
                    }}
                    onGrid={(e) => {
                        StoreAnimator.setParameter('grid', e);
                    }}
                    playStatus={StoreAnimator.data.parameters.play}
                    loopStatus={StoreAnimator.data.parameters.loop}
                    takePictureStatus={StoreAnimator.data.parameters.takePicture}
                    shortPlayStatus={StoreAnimator.data.parameters.shortPlay}
                    diffStatus={StoreAnimator.data.parameters.diff}
                    exportStatus={StoreAnimator.data.parameters.export}
                    FPSStatus={StoreAnimator.data.parameters.FPS}
                    onionStatus={StoreAnimator.data.parameters.onion}
                    gridStatus={StoreAnimator.data.parameters.grid}
                />
                <Timeline
                    pictures={this._getPictures()}
                    onSelect={(frame) => {
                        this._selectFrame(frame);
                    }}
                />
            </div>
        );
    }
}

Animator.propTypes = {
    StoreProject: PropTypes.object.isRequired,
    StoreDevice: PropTypes.object.isRequired,
    StoreAnimator: PropTypes.object.isRequired
};

export default Animator;
