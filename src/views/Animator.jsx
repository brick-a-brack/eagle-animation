import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import Player from '../components/Player';
import Timeline from '../components/Timeline';
import ControlBar from '../components/ControlBar';

// Todo: support deleted and duplicated frames

@observer
class Animator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            currentFrame: false,
            scene: 0
        };

        this.timer = false;
    }

    _onMove({ oldIndex, newIndex }) {
        const { StoreProject } = this.props;
        const { scene } = this.state;
        if (StoreProject.data.data.project) {
            StoreProject.data.data.project.scenes[scene].pictures = arrayMove(
                StoreProject.data.data.project.scenes[scene].pictures,
                oldIndex,
                newIndex
            );
            StoreProject.save();
        }
    }

    _onPlayerInit(dom) {
        const { StoreDevice } = this.props;
        StoreDevice.load(dom);
    }

    _getPictures() {
        const { StoreProject } = this.props;
        const { scene } = this.state;
        if (!StoreProject.data.data.project)
            return [];
        const { project, _path } = StoreProject.data.data;
        if (
            !project
            || !project.scenes
            || !project.scenes.length
            || !project.scenes[scene].pictures
        )
            return [];
        if (Array.isArray(project.scenes[scene].pictures)) {
            return project.scenes[scene].pictures.map((e, idx) => ({
                ...e,
                idx,
                path: `${_path}/${scene}/${e.filename}`
            }));
        }
        return [];
    }

    _play() {
        const { StoreAnimator } = this.props;
        const exec = () => {
            const { currentFrame } = this.state;
            if (currentFrame === false)
                this.setState({ currentFrame: 0 });

            else if (currentFrame >= this._getPictures().length - 1) {
                this.setState({ currentFrame: false });
                return (StoreAnimator.data.parameters.loop);
            } else
                this.setState({ currentFrame: currentFrame + 1 });

            return true;
        };

        this.timer = setInterval(() => {
            if (!exec())
                return this._stop();
        }, 1000 / StoreAnimator.data.parameters.FPS);

        if (!StoreAnimator.data.parameters.play)
            StoreAnimator.setParameter('play', true);
    }

    _stop() {
        const { StoreAnimator } = this.props;
        if (this.timer)
            clearInterval(this.timer);
        this.timer = false;
        this.setState({ currentFrame: false }, () => {
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

    _takePicture() {
        const { scene } = this.state;
        const { StoreAnimator, StoreDevice, StoreProject } = this.props;
        StoreAnimator.setParameter('takePicture', true);

        // Take picture
        StoreDevice.takePicture().then((data) => {
            // Save picture
            StoreProject.savePicture(scene, data);
            StoreAnimator.setParameter('takePicture', false);
        }).catch(() => {
            StoreAnimator.setParameter('takePicture', false);
        });
    }

    render() {
        const { StoreAnimator } = this.props;
        const { currentFrame } = this.state;
        const picturesArray = this._getPictures();
        const pictures = picturesArray.map(e => e.path);
        const realFrameIndex = (picturesArray.reduce((acc, e, idx) => (acc + ((!e.deleted && idx <= currentFrame) ? 1 : 0)), 0));
        const picturesQuantity = picturesArray.filter(e => !e.deleted).length;
        const selectedFramePath = ((currentFrame === false) ? pictures[pictures.length - 1] : pictures[currentFrame]);
        return (
            <div>
                <div style={{ width: '70%', margin: 'auto' }}>
                    <Player
                        onInit={(dom) => {
                            this._onPlayerInit(dom);
                        }}
                        onReady={() => { }}
                        mode={currentFrame === false ? 'video' : 'picture'}
                        picture={(pictures.length === 0) ? false : selectedFramePath}
                        opacity={
                            currentFrame === false
                                ? StoreAnimator.data.parameters.onion
                                : 1
                        }
                        showGrid={StoreAnimator.data.parameters.grid}
                        blendMode={StoreAnimator.data.parameters.diff}
                    />
                </div>
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
                    frameQuantity={picturesQuantity}
                    frameIndex={(currentFrame === false) ? false : realFrameIndex}
                />
                <Timeline
                    pictures={this._getPictures()}
                    onSelect={(selectedFrame) => {
                        this._selectFrame(selectedFrame);
                    }}
                    onMove={(e) => { this._onMove(e); }}
                    select={currentFrame}
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
