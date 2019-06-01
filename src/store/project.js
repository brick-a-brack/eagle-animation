import { observable } from 'mobx';
import {
    getProjectData, createProject, projectSelector, projectSave, createImageFile
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

    deletePicture(scene = 0, idx) {
        this.data.data.project.scenes[scene].pictures[idx].deleted = true;
        this.save();
    }

    savePicture(scene = 0, buffData) {
        this.data = {
            ...this.data,
            isLoading: true,
            errors: false
        };

        // Create scene if needed
        if (!this.data.data.project.scenes[scene]) {
            this.data.data.project.scenes[scene] = {
                pictures: [],
                title: `Shot #${scene + 1}`,
                framerate: 91
            };
        }

        // Save the image on disk
        return createImageFile(this.data.data._path, scene, 'jpg', buffData).then((file) => {
            // Update scene in project
            this.data.data.project.scenes[scene].pictures.push({
                id: file.id,
                filename: file.filename,
                deleted: false,
                length: 1
            });

            // Save project on disk
            this.save();
        });
    }

    changeFPS(scene = 0, value) {
        this.data = {
            ...this.data,
            isLoading: true,
            errors: false
        };

        // Create scene if needed
        if (!this.data.data.project.scenes[scene]) {
            this.data.data.project.scenes[scene] = {
                pictures: [],
                title: `Shot #${scene + 1}`
            };
        }

        // Update framerate
        this.data.data.project.scenes[scene].framerate = value;

        // Save project on disk
        this.save();
    }

    // eslint-disable-next-line
    prompt() {
        return projectSelector();
    }
}
