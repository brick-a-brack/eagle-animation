import { observable } from 'mobx'
import { getProjectData } from '../core/projects'

const defaultData = {
    path: false,
    data: false,
    isLoading: false,
    errors: false
}

export default class ObservableProjectStore {

    @observable data = defaultData

    load(path) {
        this.data = {
            ...this.data,
            path,
            data: false,
            isLoading: true,
            errors: false
        }
        getProjectData(path).then(data => {
            this.data = {
                ...this.data,
                path,
                data,
                isLoading: false,
                errors: false
            }
        }).catch(err => {
            this.data = {
                ...this.data,
                path: false,
                data: false,
                isLoading: false,
                errors: [err.message]
            }
        })
    }
}
