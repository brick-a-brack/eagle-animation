import {
  DEVICE_LOAD_REQUEST,
  DEVICE_LOAD_SUCCESS,
  DEVICE_LOAD_FAILURE
} from '../actions/device';

const defaultState = {
  device: {
    name: '',
    preview: {
      width: false,
      height: false,
      link: ''
    },
    picture: {
      width: false,
      height: false
    }
  },
  isLoading: false,
  errors: false,
};

const initialState = defaultState;

export default (state = initialState, action) => {
  switch (action.type) {
    case DEVICE_LOAD_REQUEST:
      return {
        ...state,
        errors: false,
        isLoading: true,
        preview: {
          width: false,
          height: false
        },
        picture: {
          width: false,
          height: false
        }
      }

    case DEVICE_LOAD_SUCCESS:
      return {
        ...state,
        errors: false,
        isLoading: true,
        device: {
          preview: {
            width: action.data.preview.width,
            height: action.data.preview.height,
            link: action.data.preview.link
          },
          picture: {
            width: action.data.picture.width,
            height: action.data.picture.height
          }
        }
      };


    default:
      return state;
  }
};
