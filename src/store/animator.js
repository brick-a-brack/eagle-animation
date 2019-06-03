import { observable } from 'mobx';
import {
    DEFAULT_FPS
} from '../config';

const defaultData = {
    parameters: {
        play: false,
        loop: false,
        takePicture: false,
        shortPlay: false,
        diff: false,
        FPS: `${DEFAULT_FPS}`,
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
