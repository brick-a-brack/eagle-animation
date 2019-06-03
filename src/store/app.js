import { observable } from 'mobx';

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
}
