import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

class Timeline extends Component {
    constructor(props) {
        super(props);
        this.actionSelectFrame = (frame = false) => (props.onSelect(frame));
    }

    shouldComponentUpdate(nextProps) {
        const { pictures } = this.props;
        return (
            JSON.stringify(nextProps.pictures) !== JSON.stringify(pictures)
        );
    }

    render() {
        const { pictures } = this.props;
        return (
            <aside className={styles.container}>
                {pictures.map(img => (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            this.actionSelectFrame(img);
                        }}
                        onKeyPress={() => {
                            this.actionSelectFrame(img);
                        }}
                        className={styles.img}
                        key={img.id}
                    >
                        <img alt="" className={styles.imgcontent} src={img.path} />
                    </span>
                ))}
                <span
                    className={`${styles.img} ${styles.camera}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        this.actionSelectFrame();
                    }}
                    onKeyPress={() => {
                        this.actionSelectFrame();
                    }}
                />
            </aside>
        );
    }
}

Timeline.propTypes = {
    pictures: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default Timeline;
