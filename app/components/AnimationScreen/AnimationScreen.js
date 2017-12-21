import React from 'react';

import css from './AnimationScreen.css';

import Player from '../../engine/Player'


class AnimationScreen extends React.Component {
  render() {

	let project = this.props.config.project;
	let player = this.props.config.player;
	let camera = this.props.config.camera;

	const takePicture = () => {
		if (this.props.config.camera.isInitialized()) {
			this.props.config.project.addPicture(this.props.config.camera.getBufferPicture())
			this.props.config.player.showFrame(false);
		}
	};

	const play = () => {
		if (this.props.config.player.isPlaying())
			this.props.config.player.stop();
		else
			this.props.config.player.play();
	}

	const loop = () => {
		this.props.config.player.setLoop(!this.props.config.player.loop);
	}

	const diff = () => {
		this.props.config.player.setDiff(!this.props.config.player.getDiff());
		//this.props.config.player.applyOpacity();
		window.refresh();
	}

	const shortPlay = () => {
		this.props.config.player.setShortPlay(!this.props.config.player.shortPlay);
	}

	const setFPS = (nb) => {
		this.props.config.project.setFramerate(nb);
		window.refresh();
	};

	const setOnion = (nb) => {
		this.props.config.player.setOnion(nb);
		window.refresh();
	}

	const getOnion = () => {
		if (this.props.config.player === false)
			return (1)
		return (this.props.config.player.getOnion())
	}

	const selectFrame = (id) => {
		this.props.config.player.showFrame(id);
		window.refresh();
	}

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
					<button id="startbutton" onClick={takePicture} className="button">Take</button>
					<button id="startbutton" onClick={play} className="button">Play</button>
					<button id="startbutton" onClick={loop} className="button">Loop</button>
					<button id="startbutton" onClick={shortPlay} className="button">ShortPlay</button>
					<button id="startbutton" onClick={diff} className="button">Diff</button>
					<input type="number" value={project.getCurrentScene().framerate} onChange={(e) => {setFPS(e.target.value)}} onKeyDown={(e) => {setFPS(e.target.value)}} />
					<input type="range" min="0" step="0.001" max="1" value={getOnion()} onChange={(e) => {setOnion(e.target.value)}} onKeyDown={(e) => {setOnion(e.target.value)}} />
				</div>
				<div className="comp-AnimationScreen-timeline">
					{project.getCurrentScene().pictures.map((img, idx) => {
						return <img key={idx} src={this.props.config.project.getDirectory() + '/' + this.props.config.project.getSceneId() + '/' + img.filename} onClick={() => {selectFrame(idx);}}/>
					})}
					<span onClick={() => {selectFrame(false);}}></span>
				</div>
			</div>;
  }

  async componentDidMount() {
	if (this.props.config.player === false) {
		this.props.config.player = new Player();
	}

	if (!this.props.config.player.isInitialized())
	{
		this.props.config.player.init(document.querySelector('#video'), document.querySelector('#preview'), document.querySelector('#grid'));
		this.props.config.player.setViewerResolution(await this.props.config.project.getMaxWidth(), await this.props.config.project.getMaxHeight());
		this.props.config.player.setProject(this.props.config.project);
		this.props.config.player.showFrame(false);
		window.refresh();
	}

	if (!this.props.config.camera.isInitialized()) {
		this.props.config.camera.init().then(() =>{
			this.props.config.player.setCameraResolution(this.props.config.camera.getVideoWidth(), this.props.config.camera.getVideoHeight());
			document.querySelector('#video').src = this.props.config.camera.getVideoLink();
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
	this.props.config.player.stop();
	this.props.config.player = false;
  }
}

export default AnimationScreen;