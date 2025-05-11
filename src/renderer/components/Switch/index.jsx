import React from 'react';

import * as style from './style.module.css';

const Switch = ({ register = {}, className = '', required = false, isDisabled = false, ...props }) => {
  return (
    <label className={`${style.swtch} ${isDisabled && style.isDisabled} ${className}`}>
      <input type="checkbox" required={required} {...register} {...props} />
      <span className={style.slider}></span>
    </label>
  );
};

export default React.memo(Switch);
