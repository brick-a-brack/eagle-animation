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
          {window.state.page == 'Home' && <HomeScreen/>}
          {window.state.page == 'Animation' && <AnimationScreen/>}
        </div>
			</div>;
  }
}

export default App;