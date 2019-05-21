import { observable } from 'mobx';

const defaultData = {
    parameters: {
        play: false,
        loop: false,
        takePicture: false,
        shortPlay: false,
        diff: false,
        export: false,
        FPS: '12',
        onion: 1,
        grid: false
    }
};

export default class ObservableAnimatorStore {
    @observable data = defaultData

    setParameter(name, value) {
        this.data = {
            ...this.data,
            parameters: {
                ...this.data.parameters,
                [name]: value
            }
        };
    }
}
