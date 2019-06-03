import {
    readdirSync, statSync, readFile, writeFile, existsSync
} from 'fs';
import { join, dirname, format } from 'path';
import Electron from 'electron';
import { StripChar } from 'stripchar';
import {
    PROJECT_FILE,
    PROJECT_FILE_EXTENSION,
    EA_VERSION,
    DEFAULT_FPS,
    PROJECT_DEFAULT_NAME
} from '../config';
import { time, createDirectory } from './utils';

// Generate empty project
export const generateProjectObject = name => ({
    title: name,
    version: EA_VERSION,
    creation: time(),
    updated: time(),
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
export const getProjectsList = path => new Promise(async (resolve, reject) => {
    try {
        const dirs = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory());
        const projects = [];
        for (let i = 0; i < dirs.length; i++)
            projects.push(getProjectData(join(path, dirs[i])));
        Promise.all(projects).then((data) => {
            resolve(data);
        }).catch(e => reject(e));
    } catch (err) {
        if (err.code === 'ENOENT')
            return resolve([]);
        return reject(err);
    }
});

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

// Rename a project
export const renameProject = (path, name) => new Promise((resolve, reject) => {
    getProjectData(path).then(data => projectSave(path, { ...data.project, title: name }, false).then((dataProject) => {
        resolve(dataProject);
    })).catch((err) => {
        reject(err);
    });
});

// Project create
export const createProject = (path, name) => new Promise((resolve, reject) => {
    const realName = name || PROJECT_DEFAULT_NAME;
    const originalName = `${StripChar.RSExceptUnsAlpNum(realName)}`;
    let finalPath = '';
    for (let i = 0; i < 10000; i++) {
        const directoryName = `${originalName}${(i) ? `-${i}` : ''}`;
        const projectPath = join(path, directoryName);
        if (!existsSync(projectPath)) {
            finalPath = projectPath;
            break;
        }
    }
    createDirectory(finalPath).then(() => projectSave(finalPath, generateProjectObject(name || '')).then((data) => {
        resolve(data);
    })).catch((err) => {
        reject(err);
    });
});

// Choose picture id
export const choosePictureId = (projectPath, scene) => new Promise((resolve) => {
    getProjectData(projectPath).then((dataOriginal) => {
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
            filePath = join(projectPath, `/${scene}/`, `${newId}.jpg`);
        }
        return resolve(newId);
    });
});

// Create image file
export const createImageFile = (projectPath, scene, ext, data) => new Promise((resolve, reject) => {
    const directoryPath = join(projectPath, `/${scene}/`);
    createDirectory(directoryPath).then(() => choosePictureId(projectPath, scene).then((id) => {
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
