//import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import { useLayoutEffect, useRef } from 'react';

import faXmark from '../../icons/faXmark';

import * as style from './style.module.css';

const Window = ({ children, onClose = () => {}, isOpened = false }) => {
  const ref = useRef();
  const mouseDownTarget = useRef();

  useLayoutEffect(() => {
    document.body.style.overflow = isOpened ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpened]);

  return (
    <div
      className={`${style.bgd} ${isOpened ? style.opened : ''}`}
      onMouseUp={(event) => {
        if (mouseDownTarget.current && !ref.current.contains(mouseDownTarget.current) && !ref.current.contains(event.target)) {
          onClose(event);
        }
      }}
      onMouseDown={(event) => {
        mouseDownTarget.current = event.target;
      }}
    >
      <div className={style.window} ref={ref}>
        <div>
          <div className={style.close} onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </div>
        </div>
        <div className={style.content}>{children}</div>
      </div>
    </div>
  );
};

Window.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  onClose: PropTypes.func,
};

export default Window;
