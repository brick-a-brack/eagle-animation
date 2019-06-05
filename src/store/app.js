import { observable } from 'mobx';
import { playSound } from '../core/utils';

const defaultData = {
    view: 'home'
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
}
