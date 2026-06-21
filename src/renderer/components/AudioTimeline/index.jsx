import { getChunkStartSeconds } from '@common/timeline';
import { getPeaks, loadAudioBuffer } from '@core/audio';
import { getPictureLink } from '@core/resize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faClock from '@icons/faClock';
import faFilm from '@icons/faFilm';
import faPlus from '@icons/faPlus';
import faTrash from '@icons/faTrash';
import faXmark from '@icons/faXmark';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as style from './style.module.css';

// Geometry constants
const FRAME_CELL_PX = 80; // "Frames" mode: equal-width thumbnails (matches filmstrip)
const PX_PER_FRAME = 18; // "Temps" mode: pixels per output frame (time-proportional)
const COMPACT_CLIP_PX = 130; // "Frames" mode: fixed clip block width
const MIN_DURATION = 0.05; // shortest trimmable clip (s)

// Convert an absolute position (in output frames) into a frame anchor.
// The chunk is anchored to the picture that holds that frame, and frameDelay
// carries the leftover offset (in seconds) — so the sound stays glued to a real
// picture and survives FPS changes. Negative `frames` yields a negative delay.
const anchorFromFrames = (pictures, fps, frames) => {
  if (!pictures.length) {
    return { frameID: null, frameDelay: frames / fps };
  }
  let offset = 0;
  let chosen = pictures[0];
  let chosenOffset = 0;
  for (const p of pictures) {
    chosen = p;
    chosenOffset = offset;
    const len = p.length || 1;
    if (frames < offset + len) {
      break;
    }
    offset += len;
  }
  return { frameID: chosen.id, frameDelay: (frames - chosenOffset) / fps };
};

const formatDuration = (seconds) => {
  const s = Math.max(0, seconds || 0);
  if (s < 1) {
    return `${Math.round(s * 1000)} ms`;
  }
  return `${s.toFixed(s < 10 ? 1 : 0)} s`;
};

const drawPeaks = (canvas, peaks, width, height) => {
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const mid = height / 2;
  const step = peaks.length > 0 ? width / peaks.length : width;
  const barWidth = Math.max(1, step - 1);
  for (let i = 0; i < peaks.length; i++) {
    const barHeight = Math.max(1, peaks[i] * (height - 2));
    ctx.fillRect(i * step, mid - barHeight / 2, barWidth, barHeight);
  }
};

// Decodes the source once (cached) and paints the [startAt, startAt+duration] window.
const Waveform = memo(({ projectId, src, startAt, duration, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const w = Math.max(1, Math.round(width));
    const buckets = Math.max(1, Math.floor(w / 2));
    loadAudioBuffer(projectId, src).then((buffer) => {
      if (cancelled || !buffer || !canvasRef.current) {
        return;
      }
      const peaks = getPeaks(buffer, startAt, duration, buckets);
      drawPeaks(canvasRef.current, peaks, w, height);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, src, startAt, duration, width, height]);

  return <canvas ref={canvasRef} className={style.waveform} />;
});
Waveform.displayName = 'Waveform';

const AudioTimeline = ({ projectId, scene, trackId, fps = 12, onAddTrack, onRemoveTrack, onUpdateTrack, onAddClip, onUpdateClip, onRemoveClip }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState('temps'); // 'temps' | 'frames'
  const [drag, setDrag] = useState(null); // { chunkId, op, preview } during a move/trim

  const pictures = (scene?.pictures || []).filter((p) => !p.deleted);
  const audioTracks = scene?.audioTracks || [];

  // Picture cells with their cumulative frame offset
  let acc = 0;
  const cells = pictures.map((p, i) => {
    const offsetFrames = acc;
    const len = p.length || 1;
    acc += len;
    return { p, i, offsetFrames, len };
  });
  const sceneFrames = acc;

  const cellIndexById = (id) => {
    const idx = pictures.findIndex((p) => `${p.id}` === `${id}`);
    return idx < 0 ? 0 : idx;
  };

  // Clip geometry (left / width in px) for the current mode
  const clipGeometry = (chunk) => {
    if (mode === 'temps') {
      const startFrames = getChunkStartSeconds(chunk, scene, fps) * fps;
      return {
        left: Math.max(0, startFrames * PX_PER_FRAME),
        width: Math.max(2, (chunk.duration || 0) * fps * PX_PER_FRAME),
      };
    }
    const left = (chunk.frameID === null || chunk.frameID === undefined ? 0 : cellIndexById(chunk.frameID)) * FRAME_CELL_PX;
    return { left, width: COMPACT_CLIP_PX };
  };

  // Total content width (fits both pictures and any overflowing audio clips)
  let contentWidth = mode === 'temps' ? sceneFrames * PX_PER_FRAME : pictures.length * FRAME_CELL_PX;
  for (const audioTrack of audioTracks) {
    for (const chunk of audioTrack.chunks || []) {
      const { left, width } = clipGeometry(chunk);
      contentWidth = Math.max(contentWidth, left + width);
    }
  }
  contentWidth = Math.max(contentWidth, FRAME_CELL_PX);

  // Move (drag body) / trim (drag edge). Live preview is local; the change is
  // committed to the project once on pointer-up. Never touches `pictures`.
  const beginDrag = (e, audioTrackId, chunk, op) => {
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX;
    const base = {
      frameID: chunk.frameID ?? null,
      frameDelay: chunk.frameDelay || 0,
      startAt: chunk.startAt || 0,
      duration: chunk.duration || 0,
      sourceDuration: chunk.sourceDuration || chunk.duration || 0,
    };
    const baseStartSeconds = getChunkStartSeconds(base, scene, fps);
    const baseCellIndex = base.frameID === null || base.frameID === undefined ? 0 : cellIndexById(base.frameID);
    const currentMode = mode;

    setDrag({ chunkId: chunk.id, op, preview: base });
    let moved = false;

    const onMove = (ev) => {
      const deltaPx = ev.clientX - startClientX;
      if (deltaPx !== 0) {
        moved = true;
      }
      let preview;
      if (op === 'move') {
        if (currentMode === 'temps') {
          const frames = Math.max(0, Math.round(baseStartSeconds * fps + deltaPx / PX_PER_FRAME));
          preview = { ...base, ...anchorFromFrames(pictures, fps, frames) };
        } else {
          const idx = Math.min(pictures.length - 1, Math.max(0, baseCellIndex + Math.round(deltaPx / FRAME_CELL_PX)));
          preview = { ...base, frameID: pictures[idx]?.id ?? null, frameDelay: 0 };
        }
      } else if (op === 'left') {
        const deltaSec = deltaPx / PX_PER_FRAME / fps;
        const newStartAt = Math.max(0, Math.min(base.startAt + deltaSec, base.startAt + base.duration - MIN_DURATION));
        const applied = newStartAt - base.startAt;
        preview = { ...base, ...anchorFromFrames(pictures, fps, (baseStartSeconds + applied) * fps), startAt: newStartAt, duration: base.duration - applied };
      } else {
        const deltaSec = deltaPx / PX_PER_FRAME / fps;
        const newDuration = Math.max(MIN_DURATION, Math.min(base.duration + deltaSec, base.sourceDuration - base.startAt));
        preview = { ...base, duration: newDuration };
      }
      setDrag((dr) => (dr ? { ...dr, preview } : dr));
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDrag((dr) => {
        if (dr && moved) {
          onUpdateClip(trackId, audioTrackId, chunk.id, dr.preview);
        }
        return null;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <section className={style.panel}>
      <div className={style.toolbar}>
        <div className={style.modeToggle}>
          <button type="button" className={`${style.modeBtn} ${mode === 'temps' ? style.modeBtnActive : ''}`} onClick={() => setMode('temps')} title={t('Time view')}>
            <FontAwesomeIcon icon={faClock} />
          </button>
          <button type="button" className={`${style.modeBtn} ${mode === 'frames' ? style.modeBtnActive : ''}`} onClick={() => setMode('frames')} title={t('Frames view')}>
            <FontAwesomeIcon icon={faFilm} />
          </button>
        </div>
        <button type="button" className={style.addTrackBtn} onClick={() => onAddTrack(trackId, t('Audio track {{n}}', { n: audioTracks.length + 1 }))}>
          <FontAwesomeIcon icon={faPlus} /> {t('Add audio track')}
        </button>
      </div>

      {audioTracks.length === 0 ? (
        <div className={style.empty}>{t('No audio yet — add a track to drop sounds onto your animation.')}</div>
      ) : (
        <div className={style.body}>
          <div className={style.gutters}>
            <div className={style.rulerGutter} />
            {audioTracks.map((audioTrack) => (
              <TrackGutter key={audioTrack.id} audioTrack={audioTrack} trackId={trackId} onRemoveTrack={onRemoveTrack} onUpdateTrack={onUpdateTrack} onAddClip={onAddClip} />
            ))}
          </div>

          <div className={style.scroll}>
            <div className={style.content} style={{ width: `${contentWidth}px` }}>
              <div className={style.ruler}>
                {cells.map(({ p, i, offsetFrames, len }) => {
                  const left = mode === 'temps' ? offsetFrames * PX_PER_FRAME : i * FRAME_CELL_PX;
                  const width = mode === 'temps' ? len * PX_PER_FRAME : FRAME_CELL_PX;
                  return (
                    <span key={p.id} className={style.cell} style={{ left: `${left}px`, width: `${width}px` }}>
                      {p.link && <img alt="" className={style.cellImg} src={getPictureLink(p.link, { w: 80, h: 80, m: 'cover', f: 'jpg' })} loading="lazy" />}
                      {len > 1 && <span className={style.cellBadge}>{`x${len}`}</span>}
                    </span>
                  );
                })}
              </div>

              {audioTracks.map((audioTrack) => (
                <div key={audioTrack.id} className={`${style.lane} ${audioTrack.muted ? style.laneMuted : ''}`}>
                  {(audioTrack.chunks || []).map((chunk) => {
                    const isDragging = drag && drag.chunkId === chunk.id;
                    const eff = isDragging ? { ...chunk, ...drag.preview } : chunk;
                    const { left, width } = clipGeometry(eff);
                    return (
                      <div
                        key={chunk.id}
                        className={`${style.clip} ${isDragging ? style.clipDragging : ''}`}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        onPointerDown={(e) => beginDrag(e, audioTrack.id, chunk, 'move')}
                      >
                        <Waveform projectId={projectId} src={chunk.src} startAt={eff.startAt || 0} duration={eff.duration || 0} width={width} height={40} />
                        <span className={style.clipLabel}>{formatDuration(eff.duration)}</span>
                        {mode === 'temps' && <span className={`${style.handle} ${style.handleLeft}`} onPointerDown={(e) => beginDrag(e, audioTrack.id, chunk, 'left')} />}
                        {mode === 'temps' && <span className={`${style.handle} ${style.handleRight}`} onPointerDown={(e) => beginDrag(e, audioTrack.id, chunk, 'right')} />}
                        <button
                          type="button"
                          className={style.clipDelete}
                          title={t('Delete')}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => onRemoveClip(trackId, audioTrack.id, chunk.id)}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const TrackGutter = ({ audioTrack, trackId, onRemoveTrack, onUpdateTrack, onAddClip }) => {
  const { t } = useTranslation();
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      onAddClip(trackId, audioTrack.id, file);
    }
  };

  return (
    <div className={style.trackGutter}>
      <input className={style.trackTitle} defaultValue={audioTrack.title || ''} placeholder={t('Audio track')} onBlur={(e) => onUpdateTrack(trackId, audioTrack.id, { title: e.target.value })} />
      <div className={style.trackControls}>
        <button
          type="button"
          className={`${style.iconBtn} ${audioTrack.muted ? style.iconBtnActive : ''}`}
          title={t('Mute')}
          onClick={() => onUpdateTrack(trackId, audioTrack.id, { muted: !audioTrack.muted })}
        >
          M
        </button>
        <input
          type="range"
          className={style.volume}
          min={0}
          max={1}
          step={0.01}
          defaultValue={audioTrack.volume ?? 1}
          title={t('Volume')}
          onChange={(e) => onUpdateTrack(trackId, audioTrack.id, { volume: Number(e.target.value) })}
        />
        <button type="button" className={style.iconBtn} title={t('Add sound')} onClick={() => fileRef.current?.click()}>
          <FontAwesomeIcon icon={faPlus} />
        </button>
        <button type="button" className={style.iconBtn} title={t('Delete track')} onClick={() => onRemoveTrack(trackId, audioTrack.id)}>
          <FontAwesomeIcon icon={faTrash} />
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className={style.fileInput} onChange={handleFile} />
      </div>
    </div>
  );
};

export default memo(AudioTimeline);
