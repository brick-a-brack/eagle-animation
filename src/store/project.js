import { observable } from 'mobx';
import {
    getProjectData, createProject, projectSelector, projectSave, createImageFile
} from '../core/projects';
import { DEFAULT_FPS } from '../config';

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
        return projectSave(this.data.data._path, this.data.data.project, true);
    }

    deletePicture(scene = 0, idx) {
        this.data.data.project.scenes[scene].pictures[idx].deleted = true;
        this.save();
    }

    applyDuplicateOffset(scene = 0, idx, offset) {
        this.data.data.project.scenes[scene].pictures[idx].length += offset;
        if (this.data.data.project.scenes[scene].pictures[idx].length <= 1)
            this.data.data.project.scenes[scene].pictures[idx].length = 1;
        this.save();
    }

    savePicture(scene = 0, buffData) {
        return new Promise((resolve, reject) => {
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
                    framerate: `${DEFAULT_FPS}`
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
                this.save().then(() => {
                    resolve(true);
                }).catch((err) => { reject(err); });
            }).catch((err) => { reject(err); });
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
                title: `Shot #${scene + 1}`,
                framerate: `${DEFAULT_FPS}`
            };
        }

        // Update framerate
        this.data.data.project.scenes[scene].framerate = value;

        // Save project on disk
        this.save();
    }

    delete() {
        // Update data
        this.data.data.project.deleted = true;

        // Save project on disk
        return this.save();
    }

    // eslint-disable-next-line
    prompt() {
        return projectSelector();
    }
}
