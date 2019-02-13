import { combineReducers } from 'redux';
import project from './project';
import projects from './projects';
import device from './device';
import animator from './animator';

export default combineReducers({
  project,
  projects,
  device,
  animator
});
