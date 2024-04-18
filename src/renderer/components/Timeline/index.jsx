import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DNDCSS } from '@dnd-kit/utilities';
import animateScrollTo from 'animated-scroll-to';
import { useEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SortableItem = ({ img, selected, onSelect, index }) => {
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
        minWidth: `${img.length * 80}px`,
        transform: active ? DNDCSS.Transform.toString({ ...transform, y: 0 }) : undefined,
        transition: active ? transition : undefined,
      }}
      onClick={() => onSelect(img)}
      className={`${style.containerImg} ${selected ? style.selected : ''}`}
    >
      <span className={style.img}>
        <img alt="" className={style.imgcontent} src={img.link} />
      </span>
      <span className={style.title}>{`#${index + 1}${img.length > 1 ? ` (${img.length})` : ''}`}</span>
    </span>
  );
};

const Timeline = ({ onSelect, onMove, select = false, pictures = [], playing = false, t }) => {
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

  useEffect(() => {
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
  }, [select, JSON.stringify(pictures), playing]);

  const getIndex = (id) => pictures.findIndex((e) => `${e.id}` === `${id}`);

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
      <aside className={style.container} ref={ref}>
        <SortableContext items={pictures} strategy={horizontalListSortingStrategy}>
          {pictures
            .filter((e) => !e.deleted)
            .map((img, index) => (
              <SortableItem key={`timeline-item-${img.id}`} index={index} img={img} selected={select === img.id} onSelect={onSelect} />
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
