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
    FRAME_LIVE: ['3'],
    ONION_MORE: ['+'],
    ONION_LESS: ['-']
};

class KeyboardHandler extends Component {
    render() {
        const { onAction } = this.props;

        return (
            <div>
                {Object.keys(keyboardMap).map(action => (
                    <KeyboardEventHandler
                        handleKeys={keyboardMap[action]}
                        onKeyEvent={() => { onAction(action); }}
                    />
                ))}
            </div>
        );
    }
}

KeyboardHandler.propTypes = {
    onAction: PropTypes.func.isRequired
};

export default KeyboardHandler;
