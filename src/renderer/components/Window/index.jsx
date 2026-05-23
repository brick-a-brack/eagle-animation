import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import faXmark from '@icons/faXmark';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef } from 'react';

import * as style from './style.module.css';

const Window = ({ children, onClose = () => { }, isOpened = false, isFullScreen = false, zIndex = 0 }) => {
  const ref = useRef();
  const mouseDownTarget = useRef();

  const getWindowRootFromEventTarget = (target) => {
    if (!(target instanceof Element)) return null;
    return target.closest('[data-window-root="true"]');
  };

  useLayoutEffect(() => {
    document.body.style.overflow = isOpened ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpened]);

  return createPortal(
    <div
      style={{ zIndex: 999999 + zIndex }}
      className={`${style.bgd} ${isOpened ? style.opened : ''}`}
      onMouseUp={(event) => {
        const clickedWindowRoot = getWindowRootFromEventTarget(event.target);
        if (clickedWindowRoot && clickedWindowRoot !== ref.current) return;

        if (mouseDownTarget.current && !ref.current.contains(mouseDownTarget.current) && !ref.current.contains(event.target)) {
          onClose(event);
          event.stopPropagation();
        }
      }}
      onMouseDown={(event) => {
        mouseDownTarget.current = event.target;
      }}
    >
      <div
        className={`${style.window} ${isFullScreen ? style.fullscreen : ''}`}
        ref={ref}
        data-window-root="true"
      >
        <div>
          <div
            className={style.close}
            onClick={(event) => {
              event.stopPropagation();
              onClose(event);
            }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </div>
        </div>
        <div className={style.content}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Window;
