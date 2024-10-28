import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import faSpinnerThird from '../../icons/faSpinnerThird';

import * as style from './style.module.css';

const LoadingPage = ({ show = false }) => {
  return (
    <div className={`${style.loading} ${show ? style.show : ''}`}>
      <FontAwesomeIcon icon={faSpinnerThird} spin />
    </div>
  );
};

export default LoadingPage;
