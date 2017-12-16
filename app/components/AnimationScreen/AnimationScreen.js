import React from 'react';

import css from './AnimationScreen.css';

import Player from '../../engine/Player'


class AnimationScreen extends React.Component {
  render() {

	const takePicture = () => {
		if (this.props.config.camera.isInitialized()) {
			this.props.config.project.addPicture(this.props.config.camera.getBufferPicture())
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
		this.props.config.player.setFrame(id);
		this.props.config.player.showFrame(id);
	}

    return <div className="comp-AnimationScreen">
				<div className="playerContainer">
				<div className="player">
					<video id="video" className="content"></video>
					<canvas id="preview" className="content"></canvas>
					<canvas id="grid" className="content"></canvas>
				</div>
				</div>
				<div className="comp-AnimationScreen-buttons">
					<button id="startbutton" onClick={takePicture} className="button">Take</button>
					<button id="startbutton" onClick={play} className="button">Play</button>
					<button id="startbutton" onClick={loop} className="button">Loop</button>
					<button id="startbutton" onClick={shortPlay} className="button">ShortPlay</button>
					<input type="number" value={this.props.config.project.getCurrentScene().framerate} onChange={(e) => {setFPS(e.target.value)}} onKeyDown={(e) => {setFPS(e.target.value)}} />
					<input type="range" min="0" step="0.001" max="1" value={getOnion()} onChange={(e) => {setOnion(e.target.value)}} onKeyDown={(e) => {setOnion(e.target.value)}} />
				</div>
				<div className="comp-AnimationScreen-timeline">
					{this.props.config.project.getCurrentScene().pictures.map((img, idx) => {
						return <img key={idx} src={this.props.config.project.getDirectory() + '/' + this.props.config.project.getSceneId() + '/' + img.filename} onClick={() => {selectFrame(idx);}}/>
					})}
					<span onClick={() => {selectFrame(false);}}></span>
				</div>
			</div>;
  }

  componentDidMount() {

	let initPlayer = () => {
		if (this.props.config.player === false)
			this.props.config.player = new Player();
		if (!this.props.config.player.isInitialized())
		{
			this.props.config.player.init(document.querySelector('#video'), document.querySelector('#preview'), document.querySelector('#grid'));
			this.props.config.player.setResolution(this.props.config.camera.getVideoWidth(), this.props.config.camera.getVideoHeight());
			this.props.config.player.setProject(this.props.config.project);
		}
		document.querySelector('#video').src = this.props.config.camera.getVideoLink();
		document.querySelector('#video').play();
	}

	if (!this.props.config.camera.isInitialized()) {
		this.props.config.camera.init().then(() =>{
			initPlayer();
		}).catch(err => console.log.bind);

	} else {
		initPlayer();
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