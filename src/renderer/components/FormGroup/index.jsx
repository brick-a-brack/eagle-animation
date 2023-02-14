import React from 'react';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';

const FormGroup = ({ label = '', id = null, required = false, description = '', children, t }) => {
  return (
    <div className={style.formGroup}>
      <div>
        {label && (
          <>
            <label htmlFor={id} className={style.label}>
              {required ? t('{{label}}*', { label }) : label}
            </label>
            {description && <span className={style.description}>{description}</span>}
          </>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default React.memo(withTranslation()(FormGroup));
