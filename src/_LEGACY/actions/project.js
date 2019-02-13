import ProjectTemplate from '../template/project.json'
import Electron from 'electron';
import Path from 'path';
import Fs from 'fs';

const { dialog } = Electron.remote;

/* ---------- PROJECT LOAD ---------- */
export const PROJECT_LOAD_PROMPT = 'PROJECT_LOAD_PROMPT';
export const PROJECT_LOAD_REQUEST = 'PROJECT_LOAD_REQUEST';
export const PROJECT_LOAD_SUCCESS = 'PROJECT_LOAD_SUCCESS';
export const PROJECT_LOAD_FAILURE = 'PROJECT_LOAD_FAILURE';

export const projectLoadPrompt = () => ({ type: PROJECT_LOAD_PROMPT, data: {} });
export const projectLoadRequest = path => ({ type: PROJECT_LOAD_REQUEST, data: { path } });
export const projectLoadSuccess = project => ({ type: PROJECT_LOAD_SUCCESS, data: project });
export const projectLoadFailure = error => ({ type: PROJECT_LOAD_FAILURE, data: error });

export const ActionProjectLoadFromPath = (path) => ((dispatch) => {
  dispatch(projectLoadRequest(path));
  Fs.readFile(Path.format({ dir: path, base: 'project.json' }), (err, data) => {
    if (err)
      return (dispatch(projectLoadFailure(err.message)));
    const project = JSON.parse(data.toString('utf8'));
    return (dispatch(projectLoadSuccess(project)));
  });
});

export const ActionProjectLoadPrompt = () => ((dispatch) => {
  dispatch(projectLoadPrompt());
  const directories = dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (directories && directories.length)
    return (dispatch(ActionProjectLoadFromPath(directories[0])));
});


/* ---------- PROJECT CREATE ---------- */
export const PROJECT_CREATE_PROMPT = 'PROJECT_CREATE_PROMPT';
export const PROJECT_CREATE_REQUEST = 'PROJECT_CREATE_REQUEST';

export const projectCreatePrompt = () => ({ type: PROJECT_CREATE_PROMPT, data: {} });
export const projectCreateRequest = path => ({ type: PROJECT_CREATE_REQUEST, data: { path, project: ProjectTemplate } });

export const ActionProjectCreatePrompt = () => ((dispatch) => {
  dispatch(projectCreatePrompt());
  const directories = dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (directories && directories.length) {
    dispatch(projectCreateRequest(directories[0]));
    dispatch(ActionProjectSave());
  }
});


/* ---------- PROJECT SAVE ---------- */
export const PROJECT_SAVE_REQUEST = 'PROJECT_SAVE_REQUEST';
export const PROJECT_SAVE_SUCCESS = 'PROJECT_SAVE_SUCCESS';
export const PROJECT_SAVE_FAILURE = 'PROJECT_SAVE_FAILURE';

export const projectSaveRequest = (path, project) => ({ type: PROJECT_SAVE_REQUEST, data: { path, project } });
export const projectSaveSuccess = () => ({ type: PROJECT_SAVE_SUCCESS, data: {} });
export const projectSaveFailure = error => ({ type: PROJECT_SAVE_FAILURE, data: error });

export const ActionProjectSave = () => ((dispatch, getState) => {
  const { project } = getState();
  dispatch(projectSaveRequest(project.path, project.project));
  Fs.writeFile(Path.format({ dir: project.path, base: 'project.json' }), JSON.stringify(project.project), (err) => {
    if (err)
      return (dispatch(projectSaveFailure(err.message)));
    return (dispatch(projectSaveSuccess()));
  });
});

export const ActionSavePicture = (buffer) => ((dispatch, getState) => {
  const { project } = getState();
  dispatch(projectSaveRequest(project.path, project.project));
  console.log('test', project.project.scenes[0].pictures)
  Fs.writeFile(Path.format({ dir: Path.join(project.path, '/0/'), base: (Math.max(...project.project.scenes[0].pictures.map(e => (e.id))) + 1 ) + '.jpg' }), buffer, (err) => {
    if (err)
      return (dispatch(projectSaveFailure(err.message)));
    return (dispatch(ActionProjectSave()));
  });
});