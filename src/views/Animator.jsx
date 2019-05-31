import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import Player from '../components/Player';
import Timeline from '../components/Timeline';
import ControlBar from '../components/ControlBar';
import LeftBar from '../components/LeftBar';
import RightBar from '../components/RightBar';
import styles from './animator.module.css';
import KeyboardHandler from '../components/KeyboardHandler';

// Todo: support deleted and duplicated frames on preview

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
        const {
            StoreAnimator, StoreDevice, StoreProject
        } = this.props;
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

    _onFPSchange(value) {
        const { scene } = this.state;
        const {
            StoreProject
        } = this.props;
        StoreProject.changeFPS(scene, value);
    }

    _eventsHandler(action, param = false) {
        const {
            StoreAnimator, StoreExport, StoreProject, StoreApp
        } = this.props;

        if (action === 'PLAY') {
            this.setState({ currentFrame: 0 });
            if (StoreAnimator.data.parameters.play)
                this._stop();
            else
                this._play();
        } else if (action === 'TAKE_PICTURE')
            this._takePicture();
        else if (action === 'LOOP')
            StoreAnimator.setParameter('loop', !StoreAnimator.data.parameters.loop);
        else if (action === 'SHORT_PLAY')
            StoreAnimator.setParameter('shortPlay', !StoreAnimator.data.parameters.shortPlay);
        else if (action === 'DELETE') {
            // Not supported yet
        } else if (action === 'HOME')
            StoreApp.setAppView('home');
        else if (action === 'FRAME_LEFT') {
            // Not supported yet
        } else if (action === 'FRAME_RIGHT') {
            // Not supported yet
        } else if (action === 'FRAME_LIVE')
            this._selectFrame(false);
        else if (action === 'ONION_LESS') {
            const currOnion = parseFloat(StoreAnimator.data.parameters.onion) - 0.1;
            StoreAnimator.setParameter('onion', `${(currOnion < 0) ? 0 : currOnion}`);
        } else if (action === 'ONION_MORE') {
            const currOnion = parseFloat(StoreAnimator.data.parameters.onion) + 0.1;
            StoreAnimator.setParameter('onion', `${(currOnion > 1) ? 1 : currOnion}`);
        } else if (action === 'ONION_CHANGE')
            StoreAnimator.setParameter('onion', param);
        else if (action === 'GRID')
            StoreAnimator.setParameter('grid', !StoreAnimator.data.parameters.grid);
        else if (action === 'DIFFERENCE')
            StoreAnimator.setParameter('diff', !StoreAnimator.data.parameters.diff);
        else if (action === 'CHANGE_FPS') {
            StoreAnimator.setParameter('FPS', param);
            this._onFPSchange(param);
        } else if (action === 'SETTINGS')
            window.alert('TODO SOON');
        else if (action === 'MORE')
            window.alert('TODO SOON');
        else if (action === 'EXPORT')
            StoreExport.exportVideo(StoreProject.data.data._path, 0);
        else
            console.log('UNSUPPORTED EVENT', action);
    }

    render() {
        const {
            StoreAnimator
        } = this.props;
        const { currentFrame } = this.state;
        const picturesArray = this._getPictures();
        const pictures = picturesArray.map(e => e.path);
        const realFrameIndex = (picturesArray.reduce((acc, e, idx) => (acc + ((!e.deleted && idx <= currentFrame) ? 1 : 0)), 0));
        const picturesQuantity = picturesArray.filter(e => !e.deleted).length;
        const selectedFramePath = ((currentFrame === false) ? pictures[pictures.length - 1] : pictures[currentFrame]);
        return (
            <div>
                <div className={styles.playerContainer}>
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
                <LeftBar onAction={action => (this._eventsHandler(action))} />

                <RightBar onAction={action => (this._eventsHandler(action))} />

                <ControlBar
                    onAction={(action, param) => (this._eventsHandler(action, param))}
                    status={StoreAnimator.data.parameters}
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

                <KeyboardHandler onAction={action => (this._eventsHandler(action))} />
            </div>
        );
    }
}

Animator.propTypes = {
    StoreProject: PropTypes.object.isRequired,
    StoreDevice: PropTypes.object.isRequired,
    StoreAnimator: PropTypes.object.isRequired,
    StoreExport: PropTypes.object.isRequired,
    StoreApp: PropTypes.object.isRequired
};

export default Animator;
