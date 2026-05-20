import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import styles from './style.module.css';

const PX_PER_STOP = 10;

function formatValue(v) {
  if (v >= 10000) return v.toLocaleString('fr-FR').replace(/ /g, ' '); // eslint-disable-line no-irregular-whitespace
  return String(v);
}

function normalizeStops(stops) {
  return [...new Set(stops)].filter((v) => Number.isFinite(v) && v >= 0).sort((a, b) => a - b);
}

function findIndex(v, stops) {
  const exact = stops.indexOf(v);
  if (exact !== -1) return exact;
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < stops.length; i++) {
    const d = Math.abs(stops[i] - v);
    if (d < bestDiff) {
      bestDiff = d;
      best = i;
    }
  }
  return best;
}

function evenLabelIndices(count, labelCount) {
  if (count === 0) return [];
  if (labelCount <= 1) return [0];
  const n = Math.min(labelCount, count);
  return Array.from({ length: n }, (_, i) => Math.round((i * (count - 1)) / (n - 1)));
}

export default function RulerPicker({ value, onChange, stops = [], labelCount = Math.round(stops.length / 5), className }) {
  const sliderRef = useRef(null);
  const rulerRef = useRef(null);
  const onWheelRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const majorStops = useMemo(() => normalizeStops(stops), [stops]);
  const totalWidth = (majorStops.length - 1) * PX_PER_STOP;

  const currentIndex = useMemo(() => findIndex(value, majorStops), [value, majorStops]);

  const stateRef = useRef(null);
  if (!stateRef.current) {
    stateRef.current = {
      offset: 0,
      viewportCenter: 0,
      dragging: false,
      startX: 0,
      startOffset: 0,
      lastX: 0,
      lastT: 0,
      velocity: 0,
      rafId: null,
      snapId: null,
      wheelTimer: null,
      currentIndex,
      pendingValue: null,
    };
  }

  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const labelIndices = useMemo(() => new Set(evenLabelIndices(majorStops.length, labelCount)), [majorStops.length, labelCount]);

  const ticks = useMemo(
    () =>
      majorStops.map((_, i) => ({
        x: i * PX_PER_STOP,
        cls: labelIndices.has(i) ? styles.major : styles.medium,
      })),
    [majorStops, labelIndices]
  );

  const labels = useMemo(() => majorStops.filter((_, i) => labelIndices.has(i)).map((v, j) => ({ v, x: [...labelIndices][j] * PX_PER_STOP })), [majorStops, labelIndices]);

  const indexToOffset = (idx, center) => center - idx * PX_PER_STOP;
  const offsetToIndex = (o, center) => {
    const raw = (center - o) / PX_PER_STOP;
    return Math.max(0, Math.min(majorStops.length - 1, Math.round(raw)));
  };

  const applyTransform = () => {
    if (rulerRef.current) {
      rulerRef.current.style.transform = `translate3d(${stateRef.current.offset}px,0,0)`;
    }
  };

  const setOffset = (o) => {
    const s = stateRef.current;
    const maxOffset = s.viewportCenter;
    const minOffset = s.viewportCenter - totalWidth;
    s.offset = Math.min(maxOffset, Math.max(minOffset, o));
    applyTransform();
    const idx = offsetToIndex(s.offset, s.viewportCenter);
    if (idx !== s.currentIndex) {
      s.currentIndex = idx;
      s.pendingValue = majorStops[idx];
    }
  };

  const cancelMomentum = () => {
    const s = stateRef.current;
    if (s.rafId) {
      cancelAnimationFrame(s.rafId);
      s.rafId = null;
    }
  };

  const cancelSnap = () => {
    const s = stateRef.current;
    if (s.snapId) {
      cancelAnimationFrame(s.snapId);
      s.snapId = null;
    }
  };

  const animateOffset = (from, to, duration = 200) => {
    cancelSnap();
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      setOffset(from + (to - from) * ease(t));
      stateRef.current.snapId = t < 1 ? requestAnimationFrame(step) : null;
    };
    stateRef.current.snapId = requestAnimationFrame(step);
  };

  const snapToNearest = () => {
    const s = stateRef.current;
    const idx = offsetToIndex(s.offset, s.viewportCenter);
    animateOffset(s.offset, indexToOffset(idx, s.viewportCenter));
  };

  const runMomentum = () => {
    const s = stateRef.current;
    const friction = 0.94;
    const minVel = 0.02;
    let prev = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(now - prev, 32);
      prev = now;
      s.velocity *= Math.pow(friction, dt / 16);
      if (Math.abs(s.velocity) < minVel) {
        snapToNearest();
        s.rafId = null;
        return;
      }
      const maxOffset = s.viewportCenter;
      const minOffset = s.viewportCenter - totalWidth;
      const next = s.offset + s.velocity * dt;
      if (next >= maxOffset || next <= minOffset) {
        setOffset(next);
        s.velocity = 0;
        snapToNearest();
        s.rafId = null;
        return;
      }
      setOffset(next);
      s.rafId = requestAnimationFrame(tick);
    };
    s.rafId = requestAnimationFrame(tick);
  };

  useLayoutEffect(() => {
    const recompute = () => {
      const el = sliderRef.current;
      if (!el) return;
      const s = stateRef.current;
      s.viewportCenter = el.clientWidth / 2;
      s.offset = indexToOffset(s.currentIndex, s.viewportCenter);
      applyTransform();
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [totalWidth]);

  useEffect(() => {
    const s = stateRef.current;
    if (s.dragging || currentIndex === s.currentIndex) return;
    s.currentIndex = currentIndex;
    cancelMomentum();
    animateOffset(s.offset, indexToOffset(currentIndex, s.viewportCenter));
  }, [currentIndex]);

  // Commit la valeur en attente à intervalle fixe — évite de déclencher onChange
  // pour chaque stop intermédiaire lors d'un slide rapide
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      if (s.pendingValue !== null) {
        onChangeRef.current?.(s.pendingValue);
        s.pendingValue = null;
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const onPointerDown = (e) => {
    cancelMomentum();
    cancelSnap();
    const s = stateRef.current;
    s.dragging = true;
    s.startX = e.clientX;
    s.startOffset = s.offset;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    s.velocity = 0;
    sliderRef.current?.setPointerCapture(e.pointerId);
    rerender();
  };

  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    setOffset(s.startOffset + e.clientX - s.startX);
    const now = performance.now();
    const dt = now - s.lastT;
    if (dt > 0) s.velocity = s.velocity * 0.5 + ((e.clientX - s.lastX) / dt) * 0.5;
    s.lastX = e.clientX;
    s.lastT = now;
  };

  const onPointerUp = (e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    try {
      sliderRef.current?.releasePointerCapture(e.pointerId);
    } catch (_) {} // eslint-disable-line no-empty
    if (performance.now() - s.lastT > 80) s.velocity = 0;
    if (Math.abs(s.velocity) < 0.05) snapToNearest();
    else runMomentum();
    rerender();
  };

  onWheelRef.current = (e) => {
    e.preventDefault();
    cancelMomentum();
    cancelSnap();
    const s = stateRef.current;
    setOffset(s.offset - (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY));
    clearTimeout(s.wheelTimer);
    s.wheelTimer = setTimeout(snapToNearest, 140);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const handler = (e) => onWheelRef.current(e);
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const dragging = stateRef.current.dragging;

  return (
    <div
      ref={sliderRef}
      className={[styles.slider, dragging ? styles.dragging : '', className || ''].join(' ').trim()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={rulerRef} className={styles.ruler} style={{ width: totalWidth }}>
        {ticks.map((t, i) => (
          <div key={i} className={`${styles.tick} ${t.cls}`} style={{ left: t.x }} />
        ))}
        {labels.map((l) => (
          <div key={l.v} className={styles.label} style={{ left: l.x }}>
            {formatValue(l.v)}
          </div>
        ))}
      </div>
      <div className={styles.indicator} />
    </div>
  );
}
