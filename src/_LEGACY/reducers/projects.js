import {
    PROJECTS_LIST_REQUEST,
    PROJECTS_LIST_SUCCESS,
    PROJECTS_LIST_FAILURE
  } from '../actions/projects';
  
  const defaultState = {
    list: [],
    isLoading: false,
    errors: false,
  };
  
  const initialState = defaultState;
  
  export default (state = initialState, action) => {
    switch (action.type) {
      case PROJECTS_LIST_REQUEST:
        return {
          ...state,
          errors: false,
          isLoading: true,
        };
      case PROJECTS_LIST_SUCCESS:
        return {
          ...state,
          errors: false,
          list: action.data,
          isLoading: false,
        };
      case PROJECTS_LIST_FAILURE:
        return {
          ...state,
          errors: [action.data],
          isLoading: false,
        };
      default:
        return state;
    }
  };