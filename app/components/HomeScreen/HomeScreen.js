import React from 'react';

import Project from '../../engine/Project';

import css from './HomeScreen.css';

class HomeScreen extends React.Component {
  render() {
    return <div className="comp-HomeScreen">
				<h1>Brick à Brack Animator</h1>
				<button onClick={() => {window.state.project = new Project(); window.state.project.createPrompt().then(() => {window.goTo('Animation')}).catch(err => console.log.bind)}}>Create a project</button>
				<button onClick={() => {window.state.project = new Project(); window.state.project.loadPrompt().then(() => {window.goTo('Animation')}).catch(err => console.log.bind)}}>Open a project</button>
			</div>;
  }
}

export default HomeScreen;