import React from 'react';
import * as style from './style.module.css';

const Input = ({ register = {}, className = '', ...rest }) => {
  return <input className={`${style.input} ${className}`} {...register} {...rest} />;
};

export default React.memo(Input);
