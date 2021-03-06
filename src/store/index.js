import ObservableProjectStore from './project';
import ObservableProjectsStore from './projects';
import ObservableAppStore from './app';
import ObservableAnimatorStore from './animator';
import ObservableDeviceStore from './device';
import ObservableExportStore from './export';

export const Project = new ObservableProjectStore();

export const Projects = new ObservableProjectsStore();

export const App = new ObservableAppStore();

export const Animator = new ObservableAnimatorStore();

export const Device = new ObservableDeviceStore();

export const Export = new ObservableExportStore();
