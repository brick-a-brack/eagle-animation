import { observable } from 'mobx';
import { initDevice, getDeviceResolution, takePicture } from '../core/devices';

const defaultData = {
    device: {
        name: '',
        preview: {
            width: false,
            height: false
        },
        picture: {
            width: false,
            height: false
        }
    },
    isLoading: false,
    errors: false
};

export default class ObservableDeviceStore {
    @observable data = defaultData

    load(dom) {
        this.data = {
            ...this.data,
            isLoading: true,
            errors: false
        };
        initDevice(dom).then(async () => {
            const resolution = await getDeviceResolution();
            this.data = {
                ...this.data,
                isLoading: false,
                errors: false,
                device: {
                    name: 'WBCM0',
                    preview: resolution.preview,
                    picture: resolution.picture
                }
            };
        }).catch((err) => {
            this.data = {
                ...this.data,
                isLoading: false,
                errors: [err]
            };
        });
    }

    takePicture() {
        return new Promise((resolve, reject) => {
            this.data = {
                ...this.data,
                isLoading: true,
                errors: false
            };
            takePicture().then((data) => {
                this.data = {
                    ...this.data,
                    isLoading: false,
                    errors: false
                };
                return resolve(data);
            }).catch((err) => {
                this.data = {
                    ...this.data,
                    isLoading: false,
                    errors: [err]
                };
                return reject(err);
            });
        });
    }
}
