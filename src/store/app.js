import compareVersions from 'compare-versions';
import { observable } from 'mobx';
import { playSound } from '../core/utils';
import { getLatestPublishedRelease } from '../core/updater';
import { EA_VERSION } from '../config';

const defaultData = {
    view: 'home',
    update: {
        available: false,
        version: ''
    }
};

export default class ObservableAppStore {
    @observable data = defaultData

    setAppView(view) {
        this.data = {
            ...this.data,
            view
        };
    }

    // eslint-disable-next-line
    playSound(sound, volume = 1) {
        playSound(sound, volume);
    }

    checkUpdates() {
        getLatestPublishedRelease().then((version) => {
            this.data.update.version = version;
            const cmpVersion = compareVersions(EA_VERSION, version);
            this.data.update.available = (cmpVersion < 0);
        });
    }
}
