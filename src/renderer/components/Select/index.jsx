import React from 'react';

import * as style from './style.module.css';

const Select = ({ register = {}, options = [], ...rest }) => {
  return (
    <select className={style.select} {...rest} {...register}>
      {options.map((o) => (<>
        {o.values && <optgroup label={o.label} id={o.id}>
          {o.values.map((v) => (
            <option key={v.value} value={v.value} disabled={v.disabled || false}>
              {v.label}
            </option>
          ))}
        </optgroup>}
        {!o.values && <option key={o.value} value={o.value} disabled={o.disabled || false}>
          {o.label}
        </option>}
      </>
      ))}
    </select>
  );
};

export default React.memo(Select);
