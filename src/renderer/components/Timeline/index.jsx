import { getPictureLink } from '@core/resize';
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { horizontalListSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS as DNDCSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faEyeSlash from '@icons/faEyeSlash';
import faForwardFast from '@icons/faForwardFast';
import faLayer from '@icons/faLayer';
import animateScrollTo from 'animated-scroll-to';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation, withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const MOUSE_OPTIONS = { activationConstraint: { distance: 0 } };
const TOUCH_OPTIONS = { activationConstraint: { delay: 250, tolerance: 5 } };

const SortableItem = memo(function SortableItem({ id, link = '', hidden = false, length = 0, hasMasking = false, maskingLabel = '', isShortPlayBegining = false, onSelect, index }) {
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
        transform: active ? DNDCSS.Transform.toString({ ...transform, y: 0, scaleX: 1, scaleY: 1 }) : undefined,
        transition: active ? transition : undefined,
      }}
      onClick={() => onSelect(id)}
      className={`${style.containerImg} ${hidden ? style.isHidden : ''}`}
    >
      <span className={style.img}>{link && <img alt="" className={style.imgcontent} src={getPictureLink(link, { w: 80, h: 80, m: 'cover', f: 'jpg' })} loading="lazy" />}</span>
      {hidden && <FontAwesomeIcon className={style.icon} icon={faEyeSlash} />}
      {isShortPlayBegining && <FontAwesomeIcon className={style.shortPlayIcon} icon={faForwardFast} />}
      {length > 1 && <span className={style.duplicated}>{`x${length}`}</span>}
      {hasMasking && <span className={style.masking}>{maskingLabel}</span>}
      <span className={style.title}>{`#${index + 1}`}</span>
    </span>
  );
});

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

// Memoized inner list: receives ONLY stable props. Never re-renders on play tick
// (no `select`/`playing`), so neither DndContext nor SortableContext re-emit context.
const SortableList = memo(function SortableList({ sortableItemIds, visiblePictures, maskingLabel, shortPlayFrameId, onSelect, onDragEnd, sensors }) {
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={sortableItemIds} strategy={horizontalListSortingStrategy}>
        {visiblePictures.map((img, index) => (
          <SortableItem
            key={`timeline-item-${img.id}`}
            index={index}
            id={img.id}
            link={img.link || ''}
            hidden={!!img.hidden}
            length={img.length || 0}
            hasMasking={!!img.masking}
            maskingLabel={maskingLabel}
            onSelect={onSelect}
            isShortPlayBegining={shortPlayFrameId === img.id}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
});

const Timeline = ({ onSelect, onMove, select = false, pictures = [], playing = false, shortPlayStatus = false, shortPlayFrames = 0, frameCaptureMode = false }) => {
  const ref = useRef(null);
  const shadowLeftRef = useRef(null);
  const shadowRightRef = useRef(null);
  const { t } = useTranslation();
  const maskingLabel = t('M');

  // Imperatively toggle the edge shadows based on scroll position to avoid
  // re-rendering the (memoized) heavy frame list on every scroll/resize tick.
  const updateShadows = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    if (shadowLeftRef.current) shadowLeftRef.current.classList.toggle(style.visible, !atStart);
    if (shadowRightRef.current) shadowRightRef.current.classList.toggle(style.visible, !atEnd);
  }, []);

  // Latest-ref pattern: keep callbacks/data accessible from stable handlers without re-creating them.
  const latestRef = useRef({ pictures, onSelect, onMove });
  latestRef.current = { pictures, onSelect, onMove };

  // Stable handlers — same identity for the entire Timeline lifetime.
  const stableOnSelect = useCallback((id) => latestRef.current.onSelect(id), []);
  const stableOnDragEnd = useCallback(({ active, over }) => {
    const { pictures, onSelect, onMove } = latestRef.current;
    const getIdx = (id) => pictures.findIndex((e) => `${e.id}` === `${id}`);
    const evt = {
      oldIndex: getIdx(active.id),
      newIndex: over ? getIdx(over.id) : pictures.length,
    };
    if (active && over && active.id === over.id) {
      onSelect(pictures[evt.oldIndex]);
    } else {
      onMove(evt);
    }
  }, []);

  const sensors = useSensors(useSensor(MouseSensor, MOUSE_OPTIONS), useSensor(TouchSensor, TOUCH_OPTIONS));

  useEffect(() => {
    const callback = function (e) {
      const activeElement = window.document.activeElement;
      if (ref.current && (ref.current.contains(activeElement) || activeElement === ref.current) && ['ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', callback, false);
    return () => window.removeEventListener('keydown', callback, false);
  }, []);

  // Keep shadows in sync with viewport/content size changes.
  useEffect(() => {
    updateShadows();
    window.addEventListener('resize', updateShadows, false);
    return () => window.removeEventListener('resize', updateShadows, false);
  }, [updateShadows]);

  // Comprehensive signature: any prop displayed by SortableItem is captured here.
  // Re-renders of the memoized inner list happen only when this string actually changes.
  let picturesKey = '';
  for (let i = 0; i < pictures.length; i++) {
    const p = pictures[i];
    picturesKey += p.id + ',' + (p.hidden ? 1 : 0) + ',' + (p.masking ? 1 : 0) + ',' + (p.length || 0) + ',' + (p.link || '') + ';';
  }

  const sortableItemIds = useMemo(() => pictures.map((p) => p.id), [picturesKey]);
  const visiblePictures = useMemo(() => pictures.filter((e) => !e.deleted), [picturesKey]);

  // Imperative .selected class toggling: avoids passing `select` as a prop to SortableItem,
  // which would defeat memoization. Runs after each pictures/select change, before paint.
  const prevSelectedElRef = useRef(null);
  useLayoutEffect(() => {
    if (prevSelectedElRef.current) prevSelectedElRef.current.classList.remove(style.selected);
    const el = select === false ? document.getElementById('timeline-frame-live') : document.getElementById(`timeline-frame-${select}`);
    if (el) el.classList.add(style.selected);
    prevSelectedElRef.current = el;
  }, [select, picturesKey]);

  const prevScrollRef = useRef({ key: null, select: null });
  useLayoutEffect(() => {
    // Content size may have changed (add/delete/load) → refresh shadows.
    updateShadows();
    const target = select === false ? '#timeline-frame-live' : `#timeline-frame-${select}`;
    if (document.querySelector(target)) {
      const isPicturesChange = picturesKey !== prevScrollRef.current.key;
      const isSelectChange = select !== prevScrollRef.current.select;
      // Skip entirely if nothing changed (handles StrictMode double-invocation).
      if (!isPicturesChange && !isSelectChange) return;
      prevScrollRef.current = { key: picturesKey, select };
      // Instant on first mount and content changes (loading, add, delete, reorder);
      // animated only when user navigates (select changed, content stable).
      const instant = playing || isPicturesChange;
      animateScrollTo(document.querySelector(target), {
        elementToScroll: ref.current,
        horizontal: true,
        speed: instant ? 0 : 1000,
        minDuration: 0,
        maxDuration: instant ? 0 : 1500,
        cancelOnUserAction: false,
        horizontalOffset: (-window.innerWidth + document.querySelector(target).getBoundingClientRect().width) / 2,
      }).then(updateShadows);
    }
  }, [select, picturesKey, playing]);

  // Short play id: same O(n) walk as before.
  const shortPlayFrameId = useMemo(() => {
    if (!shortPlayStatus || shortPlayFrames <= 0) return null;
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
      if (position + len > target) return p.id;
      position += len;
    }
    return null;
  }, [picturesKey, shortPlayStatus, shortPlayFrames]);

  return (
    <div className={style.wrapper} data-tour="timeline">
      <aside className={`${style.container} ${playing ? style.playing : ''}`} ref={ref} onScroll={updateShadows}>
        <SortableList
          sortableItemIds={sortableItemIds}
          visiblePictures={visiblePictures}
          maskingLabel={maskingLabel}
          shortPlayFrameId={shortPlayFrameId}
          onSelect={stableOnSelect}
          onDragEnd={stableOnDragEnd}
          sensors={sensors}
        />
        <LiveItem select={select} onSelect={stableOnSelect} frameCaptureMode={frameCaptureMode} />
      </aside>
      <div ref={shadowLeftRef} className={`${style.shadow} ${style.shadowLeft}`} />
      <div ref={shadowRightRef} className={`${style.shadow} ${style.shadowRight}`} />
    </div>
  );
};

export default withTranslation()(Timeline);
