import { observable } from 'mobx';
import {
    getProjectData, createProject, projectSelector, projectSave
} from '../core/projects';

const defaultData = {
    path: false,
    data: false,
    isLoading: false,
    errors: false
};

export default class ObservableProjectStore {
    @observable data = defaultData

    load(path) {
        this.data = {
            ...this.data,
            path: false,
            data: false,
            isLoading: true,
            errors: false
        };
        getProjectData(path).then((data) => {
            this.data = {
                ...this.data,
                path: data._path,
                data,
                isLoading: false,
                errors: false
            };
        }).catch((err) => {
            this.data = {
                ...this.data,
                path: false,
                data: false,
                isLoading: false,
                errors: [err.message]
            };
        });
    }

    create(path, name) {
        this.data = {
            ...this.data,
            path: false,
            data: false,
            isLoading: true,
            errors: false
        };
        createProject(path, name).then((data) => {
            this.data = {
                ...this.data,
                path: data._path,
                data,
                isLoading: false,
                errors: false
            };
        }).catch((err) => {
            this.data = {
                ...this.data,
                path: false,
                data: false,
                isLoading: false,
                errors: [err.message]
            };
        });
    }

    save() {
        projectSave(this.data.data._path, this.data.data.project, true);
    }

    savePicture(buffData) {
        this.data = {
            ...this.data,
            isLoading: true,
            errors: false
        };
        console.log(buffData);
    }

    static prompt() {
        return projectSelector();
    }
}
