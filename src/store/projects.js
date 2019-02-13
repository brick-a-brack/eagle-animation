import { observable } from 'mobx'
import { getProjectsList } from '../core/projects'

const defaultData = {
    path: false,
    data: [],
    isLoading: false,
    errors: false
}

export default class ObservableProjectsStore {

    @observable data = defaultData

    loadProjectsList(path) {
        this.data = {
            ...this.data,
            path,
            data: [],
            isLoading: true,
            errors: false
        }
        getProjectsList(path).then(data => {
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
                data: [],
                isLoading: false,
                errors: [err.message]
            }
        })
    }
}
