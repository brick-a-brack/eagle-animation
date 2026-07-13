import Button from '@components/Button';

import * as style from './style.module.css';

const ButtonsGroup = ({ actions = [], tooltipPosition = 'NONE', merge = false, groupClassName = '' }) => {
  return actions.map((action, i) => (
    <Button
      className={`${groupClassName || ''} ${merge ? style.merge : ''} ${merge && i === 0 ? style.mergeStart : ''}  ${merge && i === actions.length - 1 ? style.mergeEnd : ''}`}
      key={action.key || action.title || i}
      title={action.title || null}
      onClick={action.onClick}
      icon={action.icon || null}
      tag={action.tag || undefined}
      color={action.color || undefined}
      selectedColor={action.selectedColor || undefined}
      disabled={action.disabled || undefined}
      selected={action.selected || undefined}
      tooltipPosition={tooltipPosition}
      warning={action.warning || undefined}
      dataTour={action.dataTour || undefined}
    />
  ));
};

export default ButtonsGroup;
