import React, { Component } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import PropTypes from 'prop-types';
import animateScrollTo from 'animated-scroll-to';
import { ANIMATOR_LIVE } from '../../languages';
import styles from './styles.module.css';

const SortableItem = SortableElement(({
    img, selected, onSelect, index
}) => (
    <span
        role="button"
        tabIndex={0}
        id={`timeline-frame-${index}`}
        style={{ minWidth: `${(img.length) * 80}px`, display: (img.deleted ? 'none' : '') }}
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
        <span className={styles.title}>{`#${img.realIndex + 1}${((img.length > 1) ? ` (${img.length})` : '')}`}</span>
    </span>
));

const SortableList = SortableContainer(({ items, selected, onSelect }) => {
    const imgs = [];
    let realIndex = 0;
    items.forEach((e) => {
        imgs.push({ ...e, realIndex });
        if (!e.deleted)
            realIndex++;
    });
    return (
        <span>
            {imgs.map((img, index) => (
                <SortableItem key={`timeline-item-${img.id}`} index={index} img={img} selected={(selected === index)} onSelect={onSelect} />
            ))}
        </span>
    );
});

class Timeline extends Component {
    constructor(props) {
        super(props);
        this.ref = React.createRef();
        this.actionSelectFrame = (frame = false) => (props.onSelect(frame));
    }

    shouldComponentUpdate(nextProps) {
        const { pictures, select, playing } = this.props;
        return (
            JSON.stringify(nextProps.pictures) !== JSON.stringify(pictures) || nextProps.select !== select || nextProps.playing !== playing
        );
    }

    componentDidUpdate(prevProps) {
        const { select, pictures, playing } = this.props;
        if (prevProps.select !== select || JSON.stringify(prevProps.pictures) !== JSON.stringify(pictures)) {
            const key = (select === false) ? '#timeline-frame-live' : `#timeline-frame-${select}`;
            if (document.querySelector(key)) {
                animateScrollTo(document.querySelector(key), {
                    element: document.querySelector('aside'),
                    horizontal: true,
                    speed: (playing) ? 0 : 1000,
                    minDuration: 0,
                    maxDuration: (playing) ? 0 : 1500,
                    cancelOnUserAction: false,
                    offset: (-window.innerWidth + document.querySelector(key).getBoundingClientRect().width) / 2
                });
            }
        }
    }

    render() {
        const { pictures, select, onMove } = this.props;
        return (
            <aside className={styles.container} ref={this.ref}>
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
                        id="timeline-frame-live"
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
    select: PropTypes.any.isRequired,
    playing: PropTypes.bool.isRequired
};

export default Timeline;
