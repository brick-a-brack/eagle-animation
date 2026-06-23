import Button from '@components/Button';
import faArrowLeft from '@icons/faArrowLeft';
import faDownLeftAndUpRightToCenter from '@icons/faDownLeftAndUpRightToCenter';
import faFileExport from '@icons/faFileExport';
import faFilmGear from '@icons/faFilmGear';
import faGear from '@icons/faGear';
import faKeyboard from '@icons/faKeyboard';
import faListCheck from '@icons/faListCheck';
import faUpRightAndDownLeftFromCenter from '@icons/faUpRightAndDownLeftFromCenter';
import { withTranslation } from 'react-i18next';

import * as style from './style.module.css';
import ActionButton from '../ActionButton';

const RenderActions = ({ actions = [], tooltipPosition = "NONE" }) => {
  return actions.map((action) => <Button
    label={action.title || null}
    onClick={action.onClick}
    icon={action.icon || null}
    tooltipPosition={tooltipPosition}
  />);
}

const HeaderBar = ({ onAction = null, leftActions = [], rightActions = [], children = null, leftChildren = null, rightChildren = null, title = '', withBorder = false }) => {
  return (
    <div className={`${style.headerBar} ${withBorder && style.withBorder}`}>
      <div className={style.left}>
        {leftActions.length > 0 && <RenderActions actions={leftActions} tooltipPosition="RIGHT" />}
        {leftChildren}
      </div>
      {(children || title) && (
        <div className={style.center}>
          {children && children}
          {!children && title && <div className={style.title}>{title}</div>}
        </div>
      )}
      <div className={style.right}>
        {rightChildren}
        {rightActions.length > 0 && <RenderActions actions={rightActions} tooltipPosition="LEFT" />}
      </div>
    </div>
  );
};

export default HeaderBar;
