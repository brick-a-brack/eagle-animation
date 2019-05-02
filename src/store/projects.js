import { observable } from 'mobx'
import { getProjectsList, renameProject } from '../core/projects'

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

    rename(pathProject, name) {
        this.data = {
            ...this.data,
            errors: false
        }
        renameProject(pathProject, name).then(() => {
            this.loadProjectsList(this.data.path);
        }).catch(err => {
            this.data = {
                ...this.data,
                errors: [err.message]
            }
        })
    }
}
