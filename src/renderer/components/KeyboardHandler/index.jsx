import SHORTCUTS from '@core/shortcuts';
import KeyboardEventHandler from 'react-keyboard-event-handler';

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
