import React, { Component } from 'react';
import styles from './Container.css';

class Container extends Component {

    render() {
        return <div className={styles.container}>
            {this.props.children}
        </div>
    }
}

export default Container;