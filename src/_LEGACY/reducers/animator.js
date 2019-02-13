import {
    ANIMATOR_CHANGE_PARAMETER
} from '../actions/animator';

const defaultState = {
    parameters: {
        play: false,
        loop: false,
        takePicture: false,
        shortPlay: false,
        diff: false,
        export: false,
        FPS: '12',
        onion: '1',
        grid: false
    },
};

const initialState = defaultState;

export default (state = initialState, action) => {
    switch (action.type) {
        case ANIMATOR_CHANGE_PARAMETER:
            return {
                ...state,
                parameters: {
                    ...state.parameters,
                    [action.data.name]: action.data.value
                }
            }

        default:
            return state;
    }
};
