import KeyboardEventHandler from 'react-keyboard-event-handler';

import SHORTCUTS from '../../core/shortcuts';

const KeyboardHandler = ({ onAction = null, disabled = false }) => {
  const handleAction = (action) => () => {
    if (onAction) {
      onAction(action);
    }
  };

  return (
    <>
      {Object.keys(SHORTCUTS).map((action) => (
        <KeyboardEventHandler key={`KEY-${action}`} handleKeys={SHORTCUTS[action]} onKeyEvent={handleAction(action)} handleFocusableElements isDisabled={disabled} />
      ))}
    </>
  );
};

export default KeyboardHandler;
