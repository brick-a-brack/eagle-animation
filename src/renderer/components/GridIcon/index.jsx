import * as style from './style.module.css';

import gridIcon from './assets/grid.png';
import marginsIcon from './assets/margins.png';
import centerIcon from './assets/center.png';

const GridIcon = ({ title = '', selected = false, value = '', register = {} }) => (
    <label className={`${style.field} ${selected ? style.selected : ''}`} title={title}>
        <input {...register} type="checkbox" className={style.input} value={value} />
        {value === 'GRID' && <img src={gridIcon} alt="grid" />}
        {value === 'MARGINS' && <img src={marginsIcon} alt="margins" />}
        {value === 'CENTER' && <img src={centerIcon} alt="center" />}
    </label>
)

export default GridIcon;
