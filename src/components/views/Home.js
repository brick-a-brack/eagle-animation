import React, { Component } from 'react';
import { join } from 'path';
import PropTypes from 'prop-types';

import './test.css';

import { ReactComponent as IconEdit } from './edit.svg'
import { ReactComponent as IconAdd } from './add.svg'
import { ReactComponent as IconOpen } from './open.svg'

class Home extends Component {

    componentDidMount() {
        this.props.onInit();
    }

    render() {
        return <div className="wrapper">
            <div className="box">
                <div className="banner">
                    <img />
                </div>
                <div className="bannerhover" onClick={() => {this.props.onCreate()}}>
                        <IconAdd />
                    </div>
                <div className="title"><input defaultValue={'New Project'} /></div>
            </div>
            <div className="box">
                <div className="banner">
                    <img />
                </div>
                <div className="bannerhover" onClick={() => {this.props.onOpen()}}>
                        <IconOpen />
                    </div>
                <div className="title"><input readOnly value={'Load Project'} /></div>
            </div>

            {this.props.projects.map((e =>
                <div className="box">
                    <div className="banner">
                        <img src={join(e._path, '/0/', e.project.scenes[0].pictures[0].filename)} />
                    </div>
                    <div className="bannerhover" onClick={() => {this.props.onLoad(e._path)}}>
                        <IconEdit />
                    </div>
                    <div className="title"><input value={e.title} /></div>
                </div>))}
            {Array.apply(null, {length: 40}).map(Number.call, Number).map((empty, key) => <div key={`empty-${key}`} className="box empty" />)}
        </div>
    }
}

Home.propTypes = {
    onInit: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    projects: PropTypes.array.isRequired,
}

export default Home;