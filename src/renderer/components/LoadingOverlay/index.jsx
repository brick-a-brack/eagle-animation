import * as style from './style.module.css';
import IconQuit from 'jsx:./assets/quit.svg';

const LoadingOverlay = ({ message = '', onCancel = null }) => {
    return (<div className={style.background}>
        {onCancel && <div onClick={onCancel} className={style.quit}>
            <IconQuit />
        </div>}
        <span className={style.loader} />
        {message && <div className={style.info}>{message}</div>}
    </div>);
}

export default LoadingOverlay;
