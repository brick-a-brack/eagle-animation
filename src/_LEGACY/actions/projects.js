import { DEFAULT_PATH } from '../config';
import { getProjectsList } from '../core/projects';

export const PROJECTS_LIST_REQUEST = 'PROJECTS_LIST_REQUEST';
export const PROJECTS_LIST_SUCCESS = 'PROJECTS_LIST_SUCCESS';
export const PROJECTS_LIST_FAILURE = 'PROJECTS_LIST_FAILURE';

export const projectListRequest = () => ({ type: PROJECTS_LIST_REQUEST, data: {} });
export const projectListSuccess = list => ({ type: PROJECTS_LIST_SUCCESS, data: list });
export const projectListFailure = error => ({ type: PROJECTS_LIST_FAILURE, data: error });

export const ActionProjectList = () => ((dispatch) => {
    dispatch(projectListRequest());
    getProjectsList(DEFAULT_PATH).then((list) => {
        return (dispatch(projectListSuccess(list)));
    }).catch((e) => {
        console.log(e);
        return (dispatch(projectListFailure(e.message)));
    });
});