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
            scene: 0,
            focus: false
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
                this._firstFrame();
            else {
                const frameIdx = this._nextFrame();
                if (frameIdx === false)
                    return StoreAnimator.data.parameters.loop;
            }
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

    _nextFrame() {
        const { currentFrame } = this.state;
        if (currentFrame === false)
            return;
        const frames = this._getPictures();
        if (frames.filter(e => (!e.deleted)).length === 0)
            return;
        let currFrame = currentFrame;
        while (currFrame < frames.length && (frames[currFrame].deleted || currFrame === currentFrame))
            currFrame++;
        this.setState({ currentFrame: (currFrame === frames.length) ? false : currFrame });
        return (currFrame === frames.length) ? false : currFrame;
    }

    _previousFrame() {
        const { currentFrame } = this.state;
        const frames = this._getPictures();
        if (frames.filter(e => (!e.deleted)).length === 0)
            return;
        let currFrame = (currentFrame === false) ? frames.length - 1 : currentFrame;
        while (currFrame >= 0 && ((frames[currFrame] && frames[currFrame].deleted) || currFrame === currentFrame))
            currFrame--;
        const firstFrame = Math.min(...frames.map((p, idx) => ((!p.deleted) ? idx : false)).filter(e => (e !== false)));
        this.setState({ currentFrame: (currFrame === -1) ? firstFrame : currFrame });
        return (currFrame === -1) ? firstFrame : currFrame;
    }

    _firstFrame() {
        const frames = this._getPictures();
        if (frames.filter(e => (!e.deleted)).length === 0)
            return;
        const firstFrame = Math.min(...frames.map((p, idx) => ((!p.deleted) ? idx : false)).filter(e => (e !== false)));
        this.setState({ currentFrame: firstFrame });
    }

    _deleteFrame() {
        const { currentFrame, scene } = this.state;
        const { StoreProject } = this.props;
        if (currentFrame === false)
            return;
        this._nextFrame();
        StoreProject.deletePicture(scene, currentFrame);
    }

    _duplicateFrame() {
        const { currentFrame, scene } = this.state;
        const { StoreProject } = this.props;
        if (currentFrame === false)
            return;
        StoreProject.applyDuplicateOffset(scene, currentFrame, 1);
    }

    _deduplicateFrame() {
        const { currentFrame, scene } = this.state;
        const { StoreProject } = this.props;
        if (currentFrame === false)
            return;
        StoreProject.applyDuplicateOffset(scene, currentFrame, -1);
    }

    _takePicture() {
        const { scene } = this.state;
        const {
            StoreAnimator, StoreDevice, StoreProject
        } = this.props;

        // Already taking picture
        if (StoreAnimator.data.parameters.takePicture)
            return;

        // Taking picture...
        StoreAnimator.setParameter('takePicture', true);

        // Take picture
        StoreDevice.takePicture().then(data => StoreProject.savePicture(scene, data).then(() => {
            StoreAnimator.setParameter('takePicture', false);
        })).catch(() => {
            StoreAnimator.setParameter('takePicture', false);
        });
    }

    _eventsHandler(action, param = false) {
        const { scene } = this.state;
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
        else if (action === 'DELETE')
            this._deleteFrame();
        else if (action === 'HOME')
            StoreApp.setAppView('home');
        else if (action === 'FRAME_LEFT')
            this._previousFrame();
        else if (action === 'FRAME_RIGHT')
            this._nextFrame();
        else if (action === 'FRAME_LIVE')
            this._selectFrame(false);
        else if (action === 'FRAME_FIRST')
            this._firstFrame();
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
        else if (action === 'FPS_CHANGE') {
            StoreAnimator.setParameter('FPS', param);
            StoreProject.changeFPS(scene, param);
        } else if (action === 'SETTINGS')
            window.alert('TODO SOON');
        else if (action === 'MORE')
            window.alert('TODO SOON');
        else if (action === 'EXPORT')
            StoreExport.exportVideo(StoreProject.data.data._path, 0);
        else if (action === 'DUPLICATE')
            this._duplicateFrame();
        else if (action === 'DEDUPLICATE')
            this._deduplicateFrame();
        else
            console.log('UNSUPPORTED EVENT', action);
    }

    _setFocus(focus) {
        this.setState({ focus });
    }

    render() {
        const {
            StoreAnimator
        } = this.props;
        const { currentFrame, focus } = this.state;
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
                    onFocus={(v) => { this._setFocus(v); }}
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

                <KeyboardHandler onAction={action => (this._eventsHandler(action))} disabled={focus} />
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
