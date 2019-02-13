import { observable } from 'mobx'
import { initDevice, getDeviceResolution } from '../core/devices'

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
    errors: false,
};

export default class ObservableDeviceStore {

    @observable data = defaultData

    load(dom) {
        this.data = {
            ...this.data,
            isLoading: true,
            errors: false
        }
        initDevice(dom).then(async data => {
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
            }
        }).catch(err => {
            this.data = {
                ...this.data,
                isLoading: false,
                errors: [err.message]
            }
        })
    }
}
