import React from 'react';

import AnimationScreen from '../AnimationScreen/AnimationScreen.js';
import HomeScreen from '../HomeScreen/HomeScreen.js';

import css from './App.css';

class App extends React.Component {
  render() {
    console.log(this.props.config);
    return <div className="comp-App">
        <div className="menu">
          <span onClick={((evt) => {window.goTo('Home');})}>HOME</span>
        </div>
        <div className="container">
          {this.props.config.page == 'Home' && <HomeScreen config={this.props.config}/>}
          {this.props.config.page == 'Animation' && <AnimationScreen config={this.props.config}/>}
        </div>
			</div>;
  }
}

export default App;