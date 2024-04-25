import React from 'react';

import * as style from './style.module.css';

const Switch = ({ register = {}, className = '', required = false, ...props }) => {
  return (
    <label className={`${style.swtch} ${className}`}>
      <input type="checkbox" required={required} {...register} {...props} />
      <span className={style.slider}></span>
    </label>
  );
};

export default React.memo(Switch);
