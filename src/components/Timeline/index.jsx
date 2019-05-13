import React, { Component } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import PropTypes from 'prop-types';
import { ANIMATOR_LIVE } from '../../languages';
import styles from './styles.module.css';

const SortableItem = SortableElement(({
    img, selected, onSelect, index
}) => (
    <span
        role="button"
        tabIndex={0}
        style={{ minWidth: `${(img.length) * 80}px` }}
        className={`${styles.containerImg} ${((selected) ? styles.selected : '')}`}
        onClick={() => {
            onSelect(img);
        }}
        onKeyPress={() => {
            onSelect(img);
        }}
    >
        <span className={styles.img}>
            <img alt="" className={styles.imgcontent} src={img.path} />
        </span>
        <span className={styles.title}>{`#${index + 1}${((img.length > 1) ? ` x ${img.length}` : '')}`}</span>
    </span>
));

const SortableList = SortableContainer(({ items, selected, onSelect }) => (
    <span>
        {items.map((img, index) => (
            <SortableItem key={`timeline-item-${img.id}`} index={index} img={img} selected={(selected === index)} onSelect={onSelect} />
        ))}
    </span>
));

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
        const { pictures, select, onMove } = this.props;
        return (
            <aside className={styles.container}>
                <SortableList
                    axis="x"
                    lockAxis="x"
                    distance={1}
                    items={pictures}
                    selected={select}
                    onSelect={(img) => {
                        this.actionSelectFrame(img);
                    }}
                    onSortEnd={(evt) => {
                        if (evt.newIndex === evt.oldIndex)
                            return this.actionSelectFrame(pictures[evt.oldIndex]);
                        return onMove(evt);
                    }}
                />
                <span className={`${styles.containerImg} ${styles.camera} ${((select === false) ? styles.selected : '')}`}>
                    <span
                        className={styles.img}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            this.actionSelectFrame();
                        }}
                        onKeyPress={() => {
                            this.actionSelectFrame();
                        }}
                    />
                    <span className={styles.title}>{ANIMATOR_LIVE}</span>
                </span>
            </aside>
        );
    }
}

Timeline.propTypes = {
    pictures: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    select: PropTypes.any.isRequired
};

export default Timeline;
