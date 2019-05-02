import React, { Component } from 'react';
import { join } from 'path';
import PropTypes from 'prop-types';

import './test.css';

import { ReactComponent as IconEdit } from './edit.svg'
import { ReactComponent as IconAdd } from './add.svg'
import { ReactComponent as IconOpen } from './open.svg'

class Home extends Component {

    constructor(props) {
        super(props)
        this.refInputNewName = React.createRef();
        this.renameTimeout = {};
    }

    componentDidMount() {
        this.props.onInit();
    }

    _onRename(project, name) {
        if (this.renameTimeout[project.path])
            clearTimeout(this.renameTimeout[project.path]);
        this.renameTimeout[project.path] = setTimeout(() => {
            this.props.onRename(project._path, name)
        }, 1000)
    }

    render() {
        return <div className="wrapper">
            <div className="box">
                <div className="banner">
                    <img />
                </div>
                <div className="bannerhover" onClick={() => { this.props.onCreate(this.refInputNewName.current.value) }}>
                    <IconAdd />
                </div>
                <div className="title"><input placeholder={'New Project'} ref={this.refInputNewName} /></div>
            </div>
            <div className="box">
                <div className="banner">
                    <img />
                </div>
                <div className="bannerhover" onClick={() => { this.props.onOpen() }}>
                    <IconOpen />
                </div>
                <div className="title"><input readOnly placeholder={'Load Project'} /></div>
            </div>

            {this.props.projects.map((e =>
                <div className="box" key={e._path}>
                    <div className="banner">
                        {e.project.scenes[0].pictures.length && <img src={join(e._path, '/0/', e.project.scenes[0].pictures[0].filename)} />}
                    </div>
                    <div className="bannerhover" onClick={() => { this.props.onLoad(e._path) }}>
                        <IconEdit />
                    </div>
                    <div className="title">
                        <input defaultValue={e.project.title} onChange={((evt) => { this._onRename(e, evt.target.value) })} />
                    </div>
                </div>))}
            {Array.apply(null, { length: 40 }).map(Number.call, Number).map((empty, key) => <div key={`empty-${key}`} className="box empty" />)}
        </div>
    }
}

Home.propTypes = {
    onInit: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
    projects: PropTypes.array.isRequired,
}

export default Home;