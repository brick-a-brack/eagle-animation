import React from 'react';

import css from './AnimationScreen.css';

import Player from '../../engine/Player';
import Exporter from '../../engine/Exporter';


import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { faCamera, faPlay, faStop, faDownload, faSyncAlt, faRandom, faLanguage } from '@fortawesome/fontawesome-free-solid';

class AnimationScreen extends React.Component {
  render() {

	let project = window.state.project;
	let player = window.state.player;
	let camera = window.state.camera;

	const takePicture = async () => {
		window.state.player.setViewerResolution(await window.state.project.getMaxWidth(), await window.state.project.getMaxHeight());
		if (window.state.camera.isInitialized()) {
			window.state.project.addPicture(window.state.camera.getBufferPicture()).then(() => {
				window.state.player.showFrame(false);
			}).catch(console.log.bind);
		}
	};

	const play = () => {
		if (window.state.player.isPlaying())
			window.state.player.stop();
		else
			window.state.player.play();
		window.refresh();
	}

	const loop = () => {
		window.state.player.setLoop(!window.state.player.loop);
		window.refresh();
	}

	const getLoop = () => {
		return (!!window.state.player.loop);
	}

	const diff = () => {
		window.state.player.setDiff(!window.state.player.getDiff());
		window.refresh();
	}

	const getDiff = () => {
		if (window.state.player === false) {
			return (false);
		}
		return (!!window.state.player.getDiff());
	}

	const shortPlay = () => {
		window.state.player.setShortPlay(!window.state.player.shortPlay);
		window.refresh();
	}

	const getShortPlay = () => {
		if (window.state.player === false) {
			return (false);
		}
		return (!!window.state.player.shortPlay);
	}

	const setFPS = (nb) => {
		window.state.project.setFramerate(nb);
		window.refresh();
	};

	const setOnion = (nb) => {
		window.state.player.setOnion(nb);
		window.refresh();
	}

	const getOnion = () => {
		if (window.state.player === false)
			return (1)
		return (window.state.player.getOnion())
	}

	const selectFrame = (id) => {
		window.state.player.showFrame(id);
		window.refresh();
	}

	const exportFile = () => {

		window.state.exporter = new Exporter();
		window.state.exporter.setProject(window.state.project);
		window.state.exporter.savePrompt().then(() => {
			window.state.exporter.setProfile('h264');
			window.state.exporter.generate();
		}).catch((e) => {});
	}

	const isPlaying = () => {
		if (window.state.player === false) {
			return (false);
		}
		return (!!window.state.player.isPlaying())
	};

	const playIcon = () => {
		if (window.state.player === false) {
			return (faPlay);
		}
		return (window.state.player.isPlaying() ? faStop : faPlay);
	};

    return <div className="comp-AnimationScreen">
				<div className="playerContainer">
				<div className="player">
					<div>
						<video id="video" className="content" style={{opacity: ((player) ? player.getVideoOpacity() : '0')}}></video>
						<canvas id="preview" className="content" style={{mixBlendMode: ((player) ? player.getCanvasBlendMode() : ''), opacity: ((player) ? player.getCanvasOpacity() : '1')}}></canvas>
						<canvas id="grid" className="content"></canvas>
					</div>
				</div>
				</div>
				<div className="comp-AnimationScreen-buttons">
					<span onClick={takePicture} className="button"><FontAwesomeIcon icon={faCamera} /></span>
					<span onClick={play} className={"button" + ((isPlaying()) ? ' selected' : '')}><FontAwesomeIcon icon={playIcon()} /></span>
					<span onClick={loop} className={"button" + ((getLoop()) ? ' selected' : '')}><FontAwesomeIcon icon={faSyncAlt} /></span>
					<span onClick={shortPlay} className={"button" + ((getShortPlay()) ? ' selected' : '')}><FontAwesomeIcon icon={faRandom} /></span>
					<span onClick={diff} className={"button" + ((getDiff()) ? ' selected' : '')}><FontAwesomeIcon icon={faLanguage} /></span>
					<span onClick={exportFile} className="button"><FontAwesomeIcon icon={faDownload} /></span>
					<input type="number" value={project.getCurrentScene().framerate} onChange={(e) => {setFPS(e.target.value)}} onKeyDown={(e) => {setFPS(e.target.value)}} />
					<input type="range" min="0" step="0.001" max="1" value={getOnion()} onChange={(e) => {setOnion(e.target.value)}} onKeyDown={(e) => {setOnion(e.target.value)}} />
				</div>
				<div className="comp-AnimationScreen-timeline">
					{project.getCurrentScene().pictures.map((img, idx) => {
						return <img key={idx} src={window.state.project.getDirectory() + '/' + window.state.project.getSceneId() + '/' + img.filename} onClick={() => {selectFrame(idx);}}/>
					})}
					<span onClick={() => {selectFrame(false);}}></span>
				</div>
			</div>;
  }

  async componentDidMount() {
	if (window.state.player === false) {
		window.state.player = new Player();
	}

	if (!window.state.player.isInitialized())
	{
		window.state.player.init(document.querySelector('#video'), document.querySelector('#preview'), document.querySelector('#grid'));
		window.state.player.setProject(window.state.project);
		window.state.player.setViewerResolution(await window.state.project.getMaxWidth(), await window.state.project.getMaxHeight());
		window.state.player.showFrame(false);
		window.refresh();
	}

	if (!window.state.camera.isInitialized()) {
		window.state.camera.init().then(() =>{
			window.state.player.setCameraResolution(window.state.camera.getVideoWidth(), window.state.camera.getVideoHeight());
			document.querySelector('#video').src = window.state.camera.getVideoLink();
			document.querySelector('#video').play();
			window.refresh();
		}).catch(err => console.log.bind);

	}
  }

  componentWillUnmount() {
	if (!document.querySelector('#video'))
		return;
	document.querySelector('#video').pause();
	document.querySelector('#video').src = '';
	window.state.player.stop();
	window.state.player = false;
  }
}

export default AnimationScreen;