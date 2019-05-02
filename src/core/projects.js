import { readdirSync, statSync, readFile, writeFile, existsSync } from 'fs'
import { join, dirname, format } from 'path'
import Electron from 'electron'
import { StripChar } from 'stripchar';
import { PROJECT_FILE, PROJECT_FILE_EXTENSION, EA_VERSION, DEFAULT_FPS } from '../config'
import { time, createDirectory } from './utils';

// Read the project.json file in a specified directory
export const getProjectData = (path) => {
    return new Promise((resolve, reject) => {
        const file = format({ dir: path, base: PROJECT_FILE })
        readFile(file, (err, data) => {
            if (err)
                return (reject(err))
            try {
                const project = JSON.parse(data.toString('utf8'))
                return resolve({ project, _path: path, _file: file })
            }
            catch (e) {
                return reject(e)
            }
        })
    })
}

// List all projects in a directory
export const getProjectsList = (path) => {
    return new Promise(async (resolve, reject) => {
        try {
            const dirs = readdirSync(path).filter(f => statSync(join(path, f)).isDirectory())
            let projects = []
            for (let i = 0; i < dirs.length; i++) {
                try {
                    let data = await getProjectData(join(path, dirs[i]))
                    projects.push(data)
                }
                catch (err) { }
            }
            return resolve(projects)
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return resolve([])
            }
            return reject(err)
        }
    });
}

// Project selector
export const projectSelector = () => {
    return new Promise((resolve, reject) => {
        Electron.remote.dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Eagle Animation Project', extensions: [PROJECT_FILE_EXTENSION] }] }, (paths) => {
            if (paths && paths.length)
                return resolve(dirname(paths[0]))
            return resolve(false)
        })
    })
}

// Project save 
export const projectSave = (path, data) => {
    return new Promise((resolve, reject) => {
        const newData = { ...data, updated: time() }
        const file = format({ dir: path, base: PROJECT_FILE });
        writeFile(file, JSON.stringify({ ...data, updated: time() }), (err) => {
            if (err)
                return reject(err)
            return resolve({ project: newData, _path: path, _file: file })
        });
    })
}

// Rename a project
export const renameProject = (path, name) => new Promise((resolve, reject) => {
    getProjectData(path).then((data) => {
        return projectSave(path, { ...data.project, title: name }).then(data => {
            resolve(data);
        })
    }).catch(err => {
        reject(err)
    })
})

// Project create
export const createProject = (path, name) => new Promise((resolve, reject) => {
    const dirname = StripChar.RSExceptUnsAlpNum(name) + '-' + (new Date()).YYYYMMDDHHMM();
    const projectPath = join(path, dirname)
    if (existsSync(projectPath))
        return reject('DIR_ALREADY_CREATED');
    createDirectory(projectPath).then(() => {
        return projectSave(projectPath, generateProjectObject(name)).then(data => {
            resolve(data);
        })
    }).catch(err => {
        reject(err)
    })
})

// Generate empty project
export const generateProjectObject = (name) => ({
    title: name,
    version: EA_VERSION,
    creation: time(),
    updated: time(),
    scenes: [
        {
            title: "SHOT #1",
            framerate: DEFAULT_FPS,
            pictures: []
        }
    ]
})