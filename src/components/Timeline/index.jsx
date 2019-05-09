import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ANIMATOR_LIVE } from '../../languages';
import styles from './styles.module.css';

class Timeline extends Component {
    constructor(props) {
        super(props);
        this.actionSelectFrame = (frame = false) => (props.onSelect(frame));
    }

    shouldComponentUpdate(nextProps) {
        const { pictures, select } = this.props;
        return (
            JSON.stringify(nextProps.pictures) !== JSON.stringify(pictures) || nextProps.select !== select
        );
    }

    render() {
        const { pictures, select } = this.props;
        console.log('s', select)
        return (
            <aside className={styles.container}>
                {pictures.map((img, idx) => (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            this.actionSelectFrame(img);
                        }}
                        onKeyPress={() => {
                            this.actionSelectFrame(img);
                        }}
                        className={`${styles.img} ${((select === idx) ? styles.selected : '')}`}
                        key={img.id}
                    >
                        <img alt="" className={styles.imgcontent} src={img.path} />
                        <span className={styles.title}>{idx + 1}</span>
                    </span>
                ))}
                <span
                    className={`${styles.img} ${styles.camera} ${((select === false) ? styles.selected : '')}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        this.actionSelectFrame();
                    }}
                    onKeyPress={() => {
                        this.actionSelectFrame();
                    }}
                >
                    <span className={styles.title}>{ANIMATOR_LIVE}</span>
                </span>
            </aside>
        );
    }
}

Timeline.propTypes = {
    pictures: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    select: PropTypes.any.isRequired
};

export default Timeline;
