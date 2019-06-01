import { observable } from 'mobx';
import { exportProjectScene, exportPrompt } from '../core/export';

const defaultData = {
};

export default class ObservableExportStore {
    @observable data = defaultData

    // eslint-disable-next-line
    exportVideo(projectPath, scene) {
        exportPrompt().then((path) => {
            if (path)
                exportProjectScene(projectPath, scene, path);
        });
    }
}
