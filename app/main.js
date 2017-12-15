// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

import ReactDOM from 'react-dom';
import React from 'react';

import App from './components/App/App.js';
import Webcam from './cameras/Webcam';
import Player from './engine/Player';

window.state = {
	project: false,
	player: false,
	camera: new Webcam(),
	page: 'Home',
};

window.refresh = () => {
	ReactDOM.render(
		<App config={window.state}/>,
		document.getElementById('root')
	);
};

window.goTo = (page) => {
	window.state.page = page;
	window.refresh();
};

window.goTo('Home');