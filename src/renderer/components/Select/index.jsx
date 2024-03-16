import React from 'react';

import * as style from './style.module.css';

const Select = ({ register = {}, options = [], ...rest }) => {
  return (
    <select className={style.select} {...rest} {...register}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
};

export default React.memo(Select);
