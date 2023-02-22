import KeyboardEventHandler from 'react-keyboard-event-handler';

const keyboardMap = {
    PLAY: ['0', 'space'],
    TAKE_PICTURE: ['enter', 'ctrl+1'],
    LOOP: ['8'],
    SHORT_PLAY: ['6'],
    DELETE_FRAME: ['backspace', 'del'],
    HOME: ['esc'],
    FRAME_LEFT: ['left', '1'],
    FRAME_RIGHT: ['right', '2'],
    FRAME_LIVE: ['up', '3', 'ctrl+right'],
    FRAME_FIRST: ['down', 'ctrl+left'],
    ONION_MORE: ['+'],
    ONION_LESS: ['-'],
    MUTE: ['m', '/', 'ctrl+m'],
    DUPLICATE: ['pageup'],
    DEDUPLICATE: ['pagedown'],
    GRID: ['g']
};

const KeyboardHandler = ({ onAction = null, disabled = false }) => {
    const handleAction = (action) => () => {
        if (onAction) {
            onAction(action);
        }
    }

    return <>
        {Object.keys(keyboardMap).map(action => (
            <KeyboardEventHandler
                key={`KEY-${action}`}
                handleKeys={keyboardMap[action]}
                onKeyEvent={handleAction(action)}
                handleFocusableElements
                isDisabled={disabled}
            />
        ))}
    </>
}

export default KeyboardHandler;
