import { getPictureLink } from '@core/resize';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DNDCSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faEyeSlash from '@icons/faEyeSlash';
import faForwardFast from '@icons/faForwardFast';
import faLayer from '@icons/faLayer';
import animateScrollTo from 'animated-scroll-to';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const SortableItem = ({ id, link = '', hidden = false, length = 0, hasMasking = false, maskingLabel = '', isShortPlayBegining = false, playing = false, selected = false, onSelect, index }) => {
  const { setNodeRef, isDragging, transform, transition, listeners, attributes, active } = useSortable({ id });
  return (
    <span
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      id={`timeline-frame-${id}`}
      style={{
        opacity: isDragging ? 1 : undefined,
        zIndex: isDragging ? 999 : undefined,
        minWidth: `80px`,
        transform: active ? DNDCSS.Transform.toString({ ...transform, y: 0, scaleX: 1, scaleY: 1 }) : undefined,
        transition: active ? transition : undefined,
      }}
      onClick={() => onSelect(id)}
      className={`${style.containerImg} ${selected ? style.selected : ''} ${!playing && style.containerImgHover} ${hidden ? style.isHidden : ''}`}
    >
      <span className={style.img}>{link && <img alt="" className={style.imgcontent} src={getPictureLink(link, { w: 80, h: 80, m: 'cover', f: 'jpg' })} loading="lazy" />}</span>
      {hidden && <FontAwesomeIcon className={style.icon} icon={faEyeSlash} />}
      {isShortPlayBegining && <FontAwesomeIcon className={style.shortPlayIcon} icon={faForwardFast} />}
      {length > 1 && <span className={style.duplicated}>{`x${length}`}</span>}
      {hasMasking && <span className={style.masking}>{maskingLabel}</span>}
      <span className={style.title}>{`#${index + 1}`}</span>
    </span>
  );
};

const LiveItem = ({ select, onSelect, frameCaptureMode }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`${style.containerImg} ${style.camera} ${select === false ? style.selected : ''}`}
      onClick={() => {
        onSelect(false);
      }}
    >
      <span id="timeline-frame-live" className={style.img} role="button" tabIndex={0} />
      <span className={style.title}>{t('Live')}</span>
      {['FOREGROUND', 'BACKGROUND'].includes(frameCaptureMode) && select === false && (
        <>
          <span
            className={`${style.liveLayerIcon} ${frameCaptureMode === 'BACKGROUND' ? style.liveLayerIconBackground : ''}  ${frameCaptureMode === 'FOREGROUND' ? style.liveLayerIconForeground : ''}`}
          >
            <FontAwesomeIcon icon={faLayer} />
          </span>
          <span className={style.liveLayerText}>{frameCaptureMode === 'FOREGROUND' ? t('Foreground') : t('Background')}</span>
        </>
      )}
    </span>
  );
};

const Timeline = ({ onSelect, onMove, select = false, pictures = [], playing = false, shortPlayStatus = false, shortPlayFrames = 0, frameCaptureMode = false }) => {
  const ref = useRef(null);
  const { t } = useTranslation();
  const maskingLabel = t('M');

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

  let picturesKey = '';
  for (let i = 0; i < pictures.length; i++) picturesKey += pictures[i].id + '|';

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

  // Get short play picture id: id of the frame at position (totalVisibleSlots - shortPlayFrames)
  // in the expanded sequence (each picture occupies `length || 1` slots). Falls back to first visible.
  let shortPlayFrameId = null;
  if (shortPlayStatus && shortPlayFrames > 0) {
    let total = 0;
    for (let i = 0; i < pictures.length; i++) {
      const p = pictures[i];
      if (!p.deleted && !p.hidden) total += p.length || 1;
    }
    const target = total > shortPlayFrames ? total - shortPlayFrames : 0;
    let position = 0;
    for (let i = 0; i < pictures.length; i++) {
      const p = pictures[i];
      if (p.deleted || p.hidden) continue;
      const len = p.length || 1;
      if (position + len > target) {
        shortPlayFrameId = p.id;
        break;
      }
      position += len;
    }
  }

  return (
    <aside className={`${style.container}`} ref={ref}>
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
        <SortableContext items={pictures} strategy={horizontalListSortingStrategy}>
          {pictures
            .filter((e) => !e.deleted)
            .map((img, index) => (
              <SortableItem
                key={`timeline-item-${img.id}`}
                index={index}
                playing={playing}
                id={img.id}
                link={img.link || ''}
                hidden={!!img.hidden}
                length={img.length || 0}
                hasMasking={!!img.masking}
                maskingLabel={maskingLabel}
                selected={select === img.id}
                onSelect={onSelect}
                isShortPlayBegining={shortPlayFrameId === img.id}
              />
            ))}
        </SortableContext>
      </DndContext>
      <LiveItem select={select} onSelect={onSelect} frameCaptureMode={frameCaptureMode} />
    </aside>
  );
};

export default withTranslation()(Timeline);
