import React, { Component } from 'react';
import PropTypes from 'prop-types';

import styles from './Timeline.css';

class Timeline extends Component {

    constructor(props) {
        super(props);
        this.actionSelectFrame = (frame = false) => {
            return this.props.onSelect(frame);
        }
    }

    render() {
        const { pictures } = this.props;
        return <aside className={styles.container}>
            {pictures.map((img) => {
                return <img key={img.id} className={styles.img} src={img.path} onClick={() => { this.actionSelectFrame(img); }} />
            })}
            <span className={styles.camera} onClick={() => { this.actionSelectFrame(); }} />
        </aside>
    }

    shouldComponentUpdate(nextProps, nextState) {
        return JSON.stringify(nextProps.pictures) !== JSON.stringify(this.props.pictures)
    }
}

Timeline.propTypes = {
    pictures: PropTypes.array.isRequired
}

export default Timeline;