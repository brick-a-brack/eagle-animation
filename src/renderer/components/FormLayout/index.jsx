import Heading from '../Heading';

import * as style from './style.module.css';

const FormLayout = ({ children, title = '' }) => (
  <div className={style.form}>
    {title && (
      <Heading h={1} className={style.title}>
        {title}
      </Heading>
    )}
    {children}
  </div>
);

export default FormLayout;
