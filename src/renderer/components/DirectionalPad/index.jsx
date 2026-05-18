import { useCallback, useRef, useState } from 'react';
import styles from './style.module.css';

const REPEAT_MS = 120;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const ArrowIcon = ({ dir }) => {
  if (dir === 'roll-left') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93zM7.1 18.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zm-1.01-5.32H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.02-5.47L5.7 6.12C4.8 7.28 4.24 8.62 4.07 10h2.02c.14-.87.49-1.72 1.02-2.47z" />
      </svg>
    );
  }
  if (dir === 'roll-right') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M11 4.07V1l4.55 4.55L11 10V6.09C8.16 6.57 6 9.03 6 12s2.16 5.43 5 5.91v2.02c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93zm5.89 4.46-1.41 1.41c.52.75.87 1.59 1.02 2.47h2.02c-.17-1.39-.72-2.73-1.63-3.88zM17.93 13c-.15.87-.5 1.72-1.02 2.47l1.41 1.41c.9-1.16 1.45-2.5 1.62-3.88h-2.01zm-3.61 4.9c-.75.52-1.59.87-2.46 1.02v2.02c1.38-.17 2.72-.72 3.88-1.62l-1.42-1.42z" />
      </svg>
    );
  }

  const rotations = { up: -90, down: 90, left: 180, right: 0 };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ transform: `rotate(${rotations[dir]}deg)` }}>
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  );
};

const CenterIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
  </svg>
);

/**
 * @param {{ pan, tilt, roll }} capabilities - each is { id, min, max, step, value } or undefined
 * @param {function} onCapabilityChange - (id, newValue) => void
 * @param {function} [onCenter] - called when center button is pressed
 */
const DirectionalPad = ({ pan, tilt, roll, onCapabilityChange, onCenter }) => {
  const [pressed, setPressed] = useState(null);
  const intervalRef = useRef(null);

  const move = useCallback(
    (cap, delta) => {
      if (!cap) return;
      onCapabilityChange(cap.id, clamp(cap.value + delta * cap.step, cap.min, cap.max));
    },
    [onCapabilityChange]
  );

  const fire = useCallback(
    (dir) => {
      if (dir === 'up') move(tilt, -1);
      else if (dir === 'down') move(tilt, 1);
      else if (dir === 'left') move(pan, -1);
      else if (dir === 'right') move(pan, 1);
      else if (dir === 'roll-left') move(roll, -1);
      else if (dir === 'roll-right') move(roll, 1);
    },
    [pan, tilt, roll, move]
  );

  const start = useCallback(
    (dir) => {
      setPressed(dir);
      fire(dir);
      intervalRef.current = setInterval(() => fire(dir), REPEAT_MS);
    },
    [fire]
  );

  const stop = useCallback(() => {
    setPressed(null);
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const capForDir = (dir) => {
    if (dir === 'up' || dir === 'down') return tilt;
    if (dir === 'left' || dir === 'right') return pan;
    if (dir === 'roll-left' || dir === 'roll-right') return roll;
    return null;
  };

  const PadBtn = ({ dir }) => {
    const disabled = !capForDir(dir);
    return (
      <button
        type="button"
        aria-label={`Move ${dir}`}
        disabled={disabled}
        className={`${styles.dbtn} ${styles[dir]} ${pressed === dir ? styles.active : ''}`}
        onMouseDown={() => start(dir)}
        onMouseUp={stop}
        onMouseLeave={stop}
        onTouchStart={(e) => {
          e.preventDefault();
          start(dir);
        }}
        onTouchEnd={stop}
        onTouchCancel={stop}
      >
        <ArrowIcon dir={dir} />
      </button>
    );
  };

  return (
    <div className={styles.dpad} role="group" aria-label="Camera position">
      <PadBtn dir="roll-left" />
      <PadBtn dir="up" />
      <PadBtn dir="roll-right" />
      <PadBtn dir="left" />
      <button
        type="button"
        className={`${styles.dbtn} ${styles.center}`}
        onClick={() => onCenter?.()}
        aria-label="Center"
        title="Center"
      >
        <CenterIcon />
      </button>
      <PadBtn dir="right" />
      <PadBtn dir="down" />
    </div>
  );
};

export default DirectionalPad;
