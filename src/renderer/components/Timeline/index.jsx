import React, { Component } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import PropTypes from 'prop-types';
import animateScrollTo from 'animated-scroll-to';
import { withTranslation } from 'react-i18next';
import { isEqual } from 'lodash';

import * as style from './style.module.css';

const SortableItem = SortableElement(({
    img, selected, onSelect
}) => (
    <span
        role="button"
        tabIndex={0}
        id={`timeline-frame-${img.id}`}
        style={{ minWidth: `${(img.length) * 80}px` }}
        className={`${style.containerImg} ${((selected) ? style.selected : '')}`}
        onClick={() => {
            onSelect(img);
        }}
    >
        <span className={style.img}>
            <img alt="" className={style.imgcontent} src={img.link} />
        </span>
        <span className={style.title}>{`#${img.realIndex + 1}${((img.length > 1) ? ` (${img.length})` : '')}`}</span>
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
                <SortableItem key={`timeline-item-${img.id}`} index={index} img={img} selected={(selected === img.id)} onSelect={onSelect} />
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
        return (!isEqual(nextProps.pictures, pictures) || nextProps.select !== select || nextProps.playing !== playing);
    }

    componentDidUpdate(prevProps) {
        const { select, pictures, playing } = this.props;
        if (prevProps.select !== select || !isEqual(prevProps.pictures, pictures)) {
            const key = (select === false) ? '#timeline-frame-live' : `#timeline-frame-${select}`;
            if (document.querySelector(key)) {
                animateScrollTo(document.querySelector(key), {
                    elementToScroll: document.querySelector('aside'),
                    horizontal: true,
                    speed: (playing) ? 0 : 1000,
                    minDuration: 0,
                    maxDuration: (playing) ? 0 : 1500,
                    cancelOnUserAction: false,
                    horizontalOffset: (-window.innerWidth + document.querySelector(key).getBoundingClientRect().width) / 2
                });
            }
        }
    }

    render() {
        const { pictures, select, onMove, t } = this.props;
        return (
            <aside className={style.container} ref={this.ref}>
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
                        if (evt.newIndex === evt.oldIndex) {
                            return this.actionSelectFrame(pictures[evt.oldIndex]);
                        }
                        return onMove(evt);
                    }}
                />
                <span className={`${style.containerImg} ${style.camera} ${((select === false) ? style.selected : '')}`}>
                    <span
                        id="timeline-frame-live"
                        className={style.img}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            this.actionSelectFrame();
                        }}
                    />
                    <span className={style.title}>{t('Live')}</span>
                </span>
            </aside>
        );
    }
}

Timeline.propTypes = {
    t: PropTypes.func.isRequired,
    pictures: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    select: PropTypes.any.isRequired,
    playing: PropTypes.bool.isRequired
};

export default withTranslation()(Timeline);
