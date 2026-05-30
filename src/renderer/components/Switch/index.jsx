import React from 'react';

import * as style from './style.module.css';

const Switch = ({ register = {}, className = '', required = false, disabled = false, ...props }) => {
  return (
    <label className={`${style.swtch} ${disabled && style.disabled} ${className}`}>
      <input type="checkbox" required={required} {...register} {...props} />
      <span className={style.slider}></span>
    </label>
  );
};

export default React.memo(Switch);
