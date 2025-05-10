import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DNDCSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import animateScrollTo from 'animated-scroll-to';
import { useLayoutEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';

import faEyeSlash from '../../icons/faEyeSlash';
import faForwardFast from '../../icons/faForwardFast';

import * as style from './style.module.css';

const getPicturesKey = (pictures) => {
  const data = structuredClone(pictures);
  for (let i = 0; i < pictures.length; i++) {
    delete data[i].thumbnail;
    delete data[i].preview;
    delete data[i].resolution;
  }
  return JSON.stringify(data);
};

const SortableItem = ({ img, isShortPlayBegining = false, playing = false, selected, onSelect, index }) => {
  const { setNodeRef, isDragging, transform, transition, listeners, attributes, active } = useSortable({ id: img.id });
  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      id={`timeline-frame-${img.id}`}
      style={{
        opacity: isDragging ? 1 : undefined,
        zIndex: isDragging ? 999 : undefined,
        minWidth: `80px`,
        transform: active ? DNDCSS.Transform.toString({ ...transform, y: 0, scaleX: 1, scaleY: 1 }) : undefined,
        transition: active ? transition : undefined,
      }}
      onClick={() => onSelect(img)}
      className={`${style.containerImg} ${selected ? style.selected : ''} ${!playing && style.containerImgHover} ${img.hidden ? style.isHidden : ''}`}
    >
      <span className={style.img}>{img.thumbnail && <img alt="" className={style.imgcontent} src={img.thumbnail} loading="lazy" />}</span>
      {img.hidden && <FontAwesomeIcon className={style.icon} icon={faEyeSlash} />}
      {isShortPlayBegining && <FontAwesomeIcon className={style.shortPlayIcon} icon={faForwardFast} />}
      {img.length > 1 && <span className={style.duplicated}>{`x${img.length}`}</span>}
      <span className={style.title}>{`#${index + 1}`}</span>
    </span>
  );
};

const Timeline = ({ onSelect, onMove, select = false, pictures = [], playing = false, shortPlayStatus = false, shortPlayFrames = 0, t }) => {
  const ref = useRef(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 0,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  useLayoutEffect(() => {
    const key = select === false ? '#timeline-frame-live' : `#timeline-frame-${select}`;
    if (document.querySelector(key)) {
      animateScrollTo(document.querySelector(key), {
        elementToScroll: ref.current,
        horizontal: true,
        speed: playing ? 0 : 1000,
        minDuration: 0,
        maxDuration: playing ? 0 : 1500,
        cancelOnUserAction: false,
        horizontalOffset: (-window.innerWidth + document.querySelector(key).getBoundingClientRect().width) / 2,
      });
    }
  }, [select, getPicturesKey(pictures), playing]);

  const getIndex = (id) => pictures.findIndex((e) => `${e.id}` === `${id}`);

  // Get short play picture id
  const displayedFrames = pictures.filter((e) => !e.deleted && !e.hidden).reduce((acc, e) => [...acc, ...new Array(e.length || 1).fill(e)], []);
  const shortPlayFrameIndex = shortPlayStatus && shortPlayFrames > 0 && displayedFrames.length > shortPlayFrames ? displayedFrames.length - shortPlayFrames : 0;
  const shortPlayFrameId = shortPlayStatus && shortPlayFrames > 0 ? displayedFrames?.[shortPlayFrameIndex]?.id || null : null;

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={({ active, over }) => {
        const evt = {
          oldIndex: getIndex(active.id),
          newIndex: over ? getIndex(over.id) : pictures.length,
        };
        if (active && over && active.id === over.id) {
          onSelect(pictures[evt.oldIndex]);
        } else {
          onMove(evt);
        }
      }}
    >
      <aside className={`${style.container} ${playing && style.isPlaying}`} ref={ref}>
        <SortableContext items={pictures} strategy={horizontalListSortingStrategy}>
          {pictures
            .filter((e) => !e.deleted)
            .map((img, index) => (
              <SortableItem
                key={`timeline-item-${img.id}`}
                index={index}
                playing={playing}
                img={img}
                selected={select === img.id}
                onSelect={onSelect}
                isShortPlayBegining={shortPlayFrameId === img.id}
              />
            ))}
        </SortableContext>
        <span className={`${style.containerImg} ${style.camera} ${select === false ? style.selected : ''}`}>
          <span
            id="timeline-frame-live"
            className={style.img}
            role="button"
            tabIndex={0}
            onClick={() => {
              onSelect(false);
            }}
          />
          <span className={style.title}>{t('Live')}</span>
        </span>
      </aside>
    </DndContext>
  );
};

export default withTranslation()(Timeline);
