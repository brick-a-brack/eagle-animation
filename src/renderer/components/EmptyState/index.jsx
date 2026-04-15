import React from 'react';

import * as style from './style.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const EmptyState = ({ message = '', icon = null, children }) => {
  return (
    <div className={style.container}>
      {icon && <div className={style.icon}><FontAwesomeIcon icon={icon} /></div>}
      <div className={style.message}>{message}</div>
      {children}
    </div>
  );
};

export default EmptyState;
