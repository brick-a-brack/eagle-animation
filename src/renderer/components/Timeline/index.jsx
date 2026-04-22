import { getPictureLink } from '@core/resize';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DNDCSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faEyeSlash from '@icons/faEyeSlash';
import animateScrollTo from 'animated-scroll-to';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const MINIMUM_ANIMATION_DURATION = 200; // Minimum duration to apply animation on timeline item when playing

const getPicturesKey = (pictures) => {
  const data = structuredClone(pictures);
  for (let i = 0; i < pictures.length; i++) {
    delete data[i].thumbnail;
    delete data[i].preview;
    delete data[i].resolution;
  }
  return JSON.stringify(data);
};

const getPlayingAnimationDuration = (img, fps, isShortPlayBeginning, shortPlayDuplicateOffset = 0) => {
  
  const imageLength = img.length;
  
  if (isShortPlayBeginning && img.length > 1 && shortPlayDuplicateOffset) {
    return Math.floor((1000 / fps) * (imageLength - shortPlayDuplicateOffset));
  }
  return Math.floor((1000 / fps) * img.length);
};

const SortableItem = ({ img, isBeforeShortPlayBeginning = false, isShortPlayBeginning = false, playing = false, selected, onSelect, index, fps, shortPlayDuplicateOffset = 0 }) => {
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
      <span className={style.img}>{img.link && <img alt="" className={style.imgcontent} src={getPictureLink(img.link, { w: 80, h: 80, m: 'cover' })} loading="lazy" />}</span>
      {isBeforeShortPlayBeginning && <span className={style.isBeforeShortPlayBeginning} />}
      {img.hidden && <><span className={style.isHiddenOverlay} /><FontAwesomeIcon className={style.icon} icon={faEyeSlash} /></>}
      {isShortPlayBeginning && <><span className={style.shortPlayBar}/><span className={style.shortPlayTriangle} /></>}
      {img.length > 1 && <span className={style.duplicated}>{`x${img.length}`}</span>}
      <span className={style.title}>{`#${index + 1}`}</span>
      <span className={`${playing && selected && (getPlayingAnimationDuration(img, fps, isShortPlayBeginning, shortPlayDuplicateOffset) > MINIMUM_ANIMATION_DURATION) ? style.playing : ''}`} style={ getPlayingAnimationDuration(img, fps, isShortPlayBeginning, shortPlayDuplicateOffset) > MINIMUM_ANIMATION_DURATION ? { animationDuration: getPlayingAnimationDuration(img, fps, isShortPlayBeginning, shortPlayDuplicateOffset) + 'ms' } : {} }></span>
    </span>
  );
};

const Timeline = ({ onSelect, onMove, select = false, pictures = [], playing = false, shortPlayStatus = false, shortPlayFrames = 0, playingFrameIndex = false, fps, t }) => {
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
    const callback = function (e) {
      const activeElement = window.document.activeElement;
      if (ref.current && (ref.current.contains(activeElement) || activeElement === ref.current) && ['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', callback, false);
    return () => window.removeEventListener('keydown', callback, false);
  });

  const picturesKey = getPicturesKey(pictures);

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
  }, [select, picturesKey, playing]);

  const getIndex = (id) => pictures.findIndex((e) => `${e.id}` === `${id}`);

  // Get short play picture id
  const displayedFrames = pictures.filter((e) => !e.deleted && !e.hidden).reduce((acc, e) => [...acc, ...new Array(e.length || 1).fill(e)], []);
  const shortPlayFrameIndex = shortPlayStatus && shortPlayFrames > 0 && displayedFrames.length > shortPlayFrames ? displayedFrames.length - shortPlayFrames : 0;
  const shortPlayFrameId = shortPlayStatus && shortPlayFrames > 0 ? displayedFrames?.[shortPlayFrameIndex]?.id || null : null;

  // If short play first frame is duplicated, get index of the first occurrence of this frame in displayed frames to apply correct animation duration on timeline item when playing
  const getShortPlayDuplicateFirstFrameIndex = (id) => shortPlayStatus && shortPlayFrames > 0 ? displayedFrames.findIndex((e) => `${e.id}` === `${id}`) : null;
  
  // offset between first occurence of frame duplicated and short play beginning frame (in the same duplicated frame)
  const shortPlayDuplicateOffset = getShortPlayDuplicateFirstFrameIndex(shortPlayFrameId) !== null ? shortPlayFrameIndex - getShortPlayDuplicateFirstFrameIndex(shortPlayFrameId) : 0;
  
  const shortPlayFrameIndexInTimeline = getIndex(shortPlayFrameId);

  const isBeforeShortPlayBeginning = (index) => {
    return (!shortPlayStatus || shortPlayFrames === 0) ? false : index < shortPlayFrameIndexInTimeline;
  }

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
      <aside className={`${style.container}`} ref={ref}>
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
                isBeforeShortPlayBeginning={isBeforeShortPlayBeginning(index)}
                isShortPlayBeginning={shortPlayFrameId === img.id}
                shortPlayDuplicateOffset={shortPlayDuplicateOffset}
                fps={fps}
              />
            ))}
        </SortableContext>
        <span
          className={`${style.containerImg} ${style.camera} ${select === false ? style.selected : ''}`}
          onClick={() => {
            onSelect(false);
          }}
        >
          <span id="timeline-frame-live" className={style.img} role="button" tabIndex={0} />
          <span className={style.title}>{t('Live')}</span>
        </span>
      </aside>
    </DndContext>
  );
};

export default withTranslation()(Timeline);
