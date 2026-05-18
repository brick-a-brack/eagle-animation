import React, { Fragment } from 'react';

import * as style from './style.module.css';

const Select = ({ register = {}, options = [], disabled = false, ...rest }) => {
  return (
    <select className={`${style.select} ${disabled && style.disabled}`} {...rest} {...register}>
      {options.map((o, i) => (
        <Fragment key={o.id || o.value || i}>
          {o.values && (
            <optgroup label={o.label} id={o.id}>
              {o.values.map((v) => (
                <option key={v.value} value={v.value} disabled={v.disabled || false}>
                  {v.label}
                </option>
              ))}
            </optgroup>
          )}
          {!o.values && (
            <option key={o.value} value={o.value} disabled={o.disabled || false}>
              {o.label}
            </option>
          )}
        </Fragment>
      ))}
    </select>
  );
};

export default React.memo(Select);
