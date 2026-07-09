import resizeToFit from 'intrinsic-scale';

import * as style from './style.module.css';

const RatioBorders = ({ width, height, ratio = null, opacity = 0 }) => {
    const borders = resizeToFit('contain', { width: ratio, height: 1 }, { width: width, height: height });
    const borderLeftRight = (width - borders.width) / 2 / width;
    const borderTopBottom = (height - borders.height) / 2 / height;

    if (ratio === null) {
        return null;
    }

    return <>
        {borderLeftRight > 0 && <>
            <div className={style.borderLeft} style={{ width: `${borderLeftRight * 100}%`, opacity: Math.max(0, Math.min(1, opacity))  }} />
            <div className={style.borderRight} style={{ width: `${borderLeftRight * 100}%`, opacity: Math.max(0, Math.min(1, opacity))  }} />
        </>}
        {borderTopBottom > 0 && <>
            <div className={style.borderTop} style={{ height: `${borderTopBottom * 100}%`, opacity: Math.max(0, Math.min(1, opacity))  }} />
            <div className={style.borderBottom} style={{ height: `${borderTopBottom * 100}%`, opacity: Math.max(0, Math.min(1, opacity))  }} />
        </>}
    </>
}

export default RatioBorders;
