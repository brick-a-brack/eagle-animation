import React, { Component } from 'react';
import PropTypes from 'prop-types';
import KeyboardEventHandler from 'react-keyboard-event-handler';

const keyboardMap = {
    PLAY: ['0', 'space'],
    TAKE_PICTURE: ['enter'],
    LOOP: ['8'],
    SHORT_PLAY: ['6'],
    DELETE: ['backspace', 'del'],
    HOME: ['esc'],
    FRAME_LEFT: ['left', '1'],
    FRAME_RIGHT: ['right', '2'],
    FRAME_LIVE: ['up', '3'],
    FRAME_FIRST: ['down'],
    ONION_MORE: ['+'],
    ONION_LESS: ['-'],
    MUTE: ['m', '/'],
    DUPLICATE: ['pageup'],
    DEDUPLICATE: ['pagedown'],
    GRID: ['g']
};

class KeyboardHandler extends Component {
    render() {
        const { onAction, disabled } = this.props;

        return (
            <div>
                {Object.keys(keyboardMap).map(action => (
                    <KeyboardEventHandler
                        key={`KEY-${action}`}
                        handleKeys={keyboardMap[action]}
                        onKeyEvent={() => { onAction(action); }}
                        handleFocusableElements
                        isDisabled={disabled}
                    />
                ))}
            </div>
        );
    }
}

KeyboardHandler.propTypes = {
    onAction: PropTypes.func.isRequired,
    disabled: PropTypes.bool
};

KeyboardHandler.defaultProps = {
    disabled: false
};

export default KeyboardHandler;
