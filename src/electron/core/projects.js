import {
    readdirSync, statSync, readFile, writeFile, existsSync
} from 'fs';
import { join,  format } from 'path';


import {
    PROJECT_FILE,
    VERSION,
    DEFAULT_FPS,
} from '../../config';
import { time, createDirectory } from './utils';
import { randomUUID } from 'crypto';

// Generate empty project
export const generateProjectObject = name => ({
    title: name,
    version: VERSION,
    creation: time(),
    updated: time(),
    deleted: false,
    scenes: [{
        title: 'SHOT #1',
        framerate: DEFAULT_FPS,
        pictures: []
    }]
});

// Read the project.json file in a specified directory
export const getProjectData = path => new Promise((resolve, reject) => {
    const file = format({ dir: path, base: PROJECT_FILE });
    readFile(file, (err, data) => {
        if (err)
            return reject(err);
        try {
            const project = JSON.parse(data.toString('utf8'));
            return resolve({ project, _path: path, _file: file });
        } catch (e) {
            return reject(e);
        }
    });
});

// List all projects in a directory
export const getProjectsList = path => new Promise(async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
    try {
        const dirs = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
        const projects = [];
        for (let i = 0; i < dirs.length; i++) {
            projects.push(getProjectData(join(path, dirs[i])).catch(() => null));
        }
        Promise.all(projects).then((data) => {
            resolve(data.filter(p => p && p.project.deleted !== true));
        }).catch(e => reject(e));
    } catch (err) {
        if (err.code === 'ENOENT')
            return resolve([]);
        return reject(err);
    }
});

// Rename a project
export const renameProject = (path, name) => new Promise((resolve, reject) => {
    getProjectData(path).then(data => projectSave(path, { ...data.project, title: name }, false).then((dataProject) => {
        resolve(dataProject);
    })).catch((err) => {
        reject(err);
    });
});

// Update scene FPS value
export const updateSceneFPSvalue = async (path, track, fps) => {
    let data = await getProjectData(path);
    const trackId = parseInt(track, 10);
    if (data.project.scenes[trackId]) {
        data.project.scenes[trackId].framerate = fps
    }
    await projectSave(path, data.project, true);
    return data;
};

// Delete a project
export const deleteProject = (path) => new Promise((resolve, reject) => {
    getProjectData(path).then(data => projectSave(path, { ...data.project, deleted: true }, false).then((dataProject) => {
        resolve(dataProject);
    })).catch((err) => {
        reject(err);
    });
});

// Delete a project
export const deleteProjectFrame = async (path, track, pictureId) => {
    let data = await getProjectData(path);
    const trackId = parseInt(track, 10);
    if (data.project.scenes[trackId]) {
        data.project.scenes[trackId].pictures = data.project.scenes[trackId].pictures.map(p => `${p.id}` !== `${pictureId}` ? p : { ...p, deleted: true })
    }
    await projectSave(path, data.project, true);
    return data;
};

// Apply length offset to a specific frame
export const applyProjectFrameLengthOffset = async (path, track, pictureId, offset) => {
    let data = await getProjectData(path);
    const trackId = parseInt(track, 10);
    if (data.project.scenes[trackId]) {
        data.project.scenes[trackId].pictures = data.project.scenes[trackId].pictures.map(p => `${p.id}` !== `${pictureId}` ? p : { ...p, length: ((p.length || 1) + offset) || 1 })
    }
    await projectSave(path, data.project, true);
    return data;
};

// Project save
export const projectSave = (path, data, updateTime = true) => new Promise((resolve, reject) => {
    const newData = { ...data, updated: time() };
    const file = format({ dir: path, base: PROJECT_FILE });
    writeFile(file, JSON.stringify({
        ...data,
        ...(updateTime ? { updated: time() } : {})
    }), (err) => {
        if (err)
            return reject(err);
        return resolve({ project: newData, _path: path, _file: file });
    });
});

// Project create
export const createProject = (path, name) => new Promise((resolve, reject) => {
    const directoryName = randomUUID();
    const projectPath = join(path, directoryName);
    createDirectory(projectPath).then(() => projectSave(projectPath, generateProjectObject(name)).then(() => {
        resolve(getProjectData(projectPath));
    })).catch((err) => {
        reject(err);
    });
});

// Choose picture id
const choosePictureId = async (projectPath, scene, ext = 'jpg') => {
    const dataOriginal = await getProjectData(projectPath);
    const data = { ...dataOriginal };
    if (!data.project.scenes[scene]) {
        data.project.scenes[scene] = {
            pictures: []
        };
    }
    let newId = Math.max(0, ...data.project.scenes[scene].pictures.map(e => (e.id)));
    let filePath = false;
    while (filePath === false || existsSync(filePath)) {
        newId++;
        filePath = join(projectPath, `/${scene}/`, `${newId}.${ext}`);
    }
    return newId;
};

// Create image file
const createImageFile = (projectPath, scene, ext, data) => new Promise((resolve, reject) => {
    const directoryPath = join(projectPath, `/${scene}/`);
    createDirectory(directoryPath).then(() => choosePictureId(projectPath, scene, ext).then((id) => {
        const filePath = join(projectPath, `/${scene}/`, `${id}.${ext}`);
        if (existsSync(filePath))
            return reject(new Error('FILE_ALREADY_EXISTS'));
        writeFile(filePath, data, (err) => {
            if (err)
                return reject(err);
            return resolve({
                id, filename: `${id}.${ext}`, scene, path: filePath
            });
        });
    })).catch((err) => {
        reject(err);
    });
});

export const takePicture = async (projectPath, track, ext, beforeFrameId, buffer) => {
    const trackId = parseInt(track, 10);
    const data = await getProjectData(projectPath);
    const file = await createImageFile(projectPath, trackId, ext, buffer);
    if (data.project.scenes[trackId]) {
        const index = beforeFrameId === false ? -1 : data.project.scenes[trackId].pictures.findIndex(f => `${f.id}` === `${beforeFrameId}`);

        const newFrame = {
            id: file.id,
            filename: file.filename,
            deleted: false,
            length: 1
        };

        if (index !== -1) {
            data.project.scenes[trackId].pictures = [...data.project.scenes[trackId].pictures.slice(0, index), newFrame, ...data.project.scenes[trackId].pictures.slice(index)];
        } else {
            data.project.scenes[trackId].pictures = [...data.project.scenes[trackId].pictures, newFrame];
        }

        await projectSave(projectPath, data.project, true);
    }
    return data;
}

export const moveFrame = async (projectPath, track, frameId, beforeFrameId) => {
    const trackId = parseInt(track, 10);
    const data = await getProjectData(projectPath);

    if (data.project.scenes[trackId]) {
        const index = beforeFrameId === false ? -1 : data.project.scenes[trackId].pictures.findIndex(f => `${f.id}` === `${beforeFrameId}`);
        const frame = data.project.scenes[trackId].pictures.find(f => `${f.id}` === `${frameId}`);
        if (frame) {
            if (index != -1) {
                data.project.scenes[trackId].pictures = [
                    ...data.project.scenes[trackId].pictures.slice(0, index).filter(f => `${f.id}` !== `${frameId}`),
                    frame,
                    ...data.project.scenes[trackId].pictures.slice(index).filter(f => `${f.id}` !== `${frameId}`)
                ];
            } else {
                data.project.scenes[trackId].pictures = [
                    ...data.project.scenes[trackId].pictures.filter(f => `${f.id}` !== `${frameId}`),
                    frame,
                ];
            }
            await projectSave(projectPath, data.project, true);
        }
    }
    return data;
}



/*
// Project selector
export const projectSelector = () => new Promise((resolve) => {
    Electron.remote.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
            name: 'Eagle Animation Project',
            extensions: [PROJECT_FILE_EXTENSION]
        }]
    }, (paths) => {
        if (paths && paths.length)
            return resolve(dirname(paths[0]));
        return resolve(false);
    });
});
*/