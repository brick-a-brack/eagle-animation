import {
  PROJECT_LOAD_REQUEST,
  PROJECT_LOAD_SUCCESS,
  PROJECT_LOAD_FAILURE,
  PROJECT_CREATE_REQUEST
} from '../actions/project';

const defaultState = {
  path: false,
  project: false,
  isLoading: false,
  errors: false,
};

const initialState = defaultState;

export default (state = initialState, action) => {
  switch (action.type) {
    case PROJECT_LOAD_REQUEST:
      return {
        ...state,
        path: action.data.path,
        errors: false,
        project: false,
        isLoading: true,
      };
    case PROJECT_LOAD_SUCCESS:
      return {
        ...state,
        errors: false,
        project: action.data,
        isLoading: false,
      };
    case PROJECT_LOAD_FAILURE:
      return {
        ...state,
        path: false,
        errors: [action.data],
        project: false,
        isLoading: false,
      };

    case PROJECT_CREATE_REQUEST:
      return {
        ...state,
        path: action.data.path,
        errors: false,
        project: action.data.project,
        isLoading: true,
      };

    default:
      return state;
  }
};
