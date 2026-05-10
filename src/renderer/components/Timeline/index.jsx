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

const SortableItem = ({ img, isBeforeShortPlayBeginning = false, isShortPlayBeginning = false, playing = false, selected, onSelect, index, fps, animationDelay = 0 }) => {
  const { setNodeRef, isDragging, transform, transition, listeners, attributes, active } = useSortable({ id: img.id });

  const playingAnimationDuration = Math.floor((1000 / fps) * img.length);

  const animationStyle = {
    'animationDuration': `${playingAnimationDuration}ms`,
    'animationDelay': `${-animationDelay}ms`,
  };

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
      <span key={animationDelay} className={`${playing && selected && (playingAnimationDuration > MINIMUM_ANIMATION_DURATION) ? style.playing : ''}`} style={ playingAnimationDuration > MINIMUM_ANIMATION_DURATION ? animationStyle : {} }></span>
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

  let shortPlayFrameId = null;
  let shortPlayFrameIndex = 0;
  let shortPlayFrameIndexInTimeline = null;
  const displayedFrames = pictures.filter((e) => !e.deleted && !e.hidden).flatMap(e => Array.from({ length: e.length || 1 }, (_, i) => ({ ...e, duplicatedIndex: i })));

  if (shortPlayStatus && shortPlayFrames > 0) {
    // Get short play picture id
    shortPlayFrameIndex = displayedFrames.length > shortPlayFrames ? displayedFrames.length - shortPlayFrames : 0;
    shortPlayFrameId = displayedFrames?.[shortPlayFrameIndex]?.id || null;

    shortPlayFrameIndexInTimeline = getIndex(shortPlayFrameId);
  }

  const leledezaq = displayedFrames.reduce((acc, e, i) => acc+(i <= playingFrameIndex && e.id === select ? 1 : 0), 0);

  const getShortPlayDuplicatedFrameAnimationDelay = (img) => {

    if (img.id !== shortPlayFrameId && img.length && img.length <= 1) {
      return 0;
    }
    if (img.length > 1 && playingFrameIndex >= shortPlayFrameIndex) {
      const firstDuplicatedFrameIndex = displayedFrames.findIndex((e) => e.id === img.id);

      const frameOffsetInDuplicatedFrames = shortPlayFrameIndex - firstDuplicatedFrameIndex;

      const animationDelay = (1000/fps) * (frameOffsetInDuplicatedFrames);
      return animationDelay;
    }
    return 0;
  };

  const isBeforeShortPlayBeginning = (index) => {
    if (shortPlayFrameIndexInTimeline !== null && index < shortPlayFrameIndexInTimeline) {
      return true;
    }
    return false;
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
                isBeforeShortPlayBeginning={shortPlayStatus ? isBeforeShortPlayBeginning(index) : false}
                isShortPlayBeginning={shortPlayFrameId === img.id}
                fps={fps}
                animationDelay={shortPlayStatus ? getShortPlayDuplicatedFrameAnimationDelay(img) : 0}
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
