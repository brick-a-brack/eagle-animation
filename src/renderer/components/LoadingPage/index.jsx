import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"

import * as style from './style.module.css';
import faSpinnerThird from "../../icons/faSpinnerThird";

const LoadingPage = ({show = false}) => {
    return <div className={`${style.loading} ${show ? style.show : ''}`}>
        <FontAwesomeIcon icon={faSpinnerThird} spin />
    </div>
};

export default LoadingPage;