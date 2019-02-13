import React, { Component } from 'react';
import {
    BrowserRouter as Router, Route, Redirect, Switch,
} from 'react-router-dom';
import SideMenu from './containers/SideMenu';
import Animator from './containers/Animator';
import Home from './containers/Home';
import Container from '../components/Container/Container';

import toto from '../store/project'
class App extends Component {
    render() {
        return (
            <Router>

                <div>
                    <Route path="/" component={Home} exact />
                    <Route path="/animator" component={Animator} exact />
                </div>
            </Router>
        );
    }
}

/*
                    */

export default App;
