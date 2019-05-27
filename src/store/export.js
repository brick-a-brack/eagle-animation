import { observable } from 'mobx';
import { exportProjectScene } from '../core/export';

const defaultData = {
};

export default class ObservableExportStore {
    @observable data = defaultData

    // eslint-disable-next-line
    exportVideo(projectPath, scene) {
        exportProjectScene(projectPath, scene);
    }
}
