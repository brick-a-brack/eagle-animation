import React, { Component } from 'react';
import AssetButtonHome from './assets/button-home.svg'
import AssetButtonParameters from './assets/button-parameters.svg'
import AssetButtonSave from './assets/button-save.svg'
import styles from './SideMenu.css';

class SideMenu extends Component {

    constructor(props) {
        super(props);

        const { eventHandler } = this.props;

        this.actionLoadProject = () => {
            return eventHandler({
                type: 'LOAD_PROJECT',
                data: {}
            });
        }

        this.actionNewProject = () => {
            return eventHandler({
                type: 'NEW_PROJECT',
                data: {}
            });
        }
    }

    render() {
        return <nav className={styles.container}>
            <div onClick={this.actionNewProject}>New</div>
            <div onClick={this.actionLoadProject}>Load</div>
            <div className={styles.icon} style={{ backgroundImage: 'url(' + AssetButtonHome + ')' }} />
            <div className={styles.icon} style={{ backgroundImage: 'url(' + AssetButtonParameters + ')' }} />
            <div className={styles.icon} style={{ backgroundImage: 'url(' + AssetButtonSave + ')' }} />
        </nav>
    }
}

export default SideMenu;