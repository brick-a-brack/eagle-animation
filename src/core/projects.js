
import { readdirSync, statSync, readFile, writeFile } from 'fs'
import { join, format } from 'path'
import Electron from 'electron'
import { PROJECT_FILE, PROJECT_FILE_EXTENSION } from '../config'

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
                return resolve(paths[0])
            return resolve(false)
        })
    })
}

// Project save 
export const projectSave = (path, data) => {
    return new Promise((resolve, reject) => {
        writeFile(format({ dir: path, base: PROJECT_FILE }), JSON.stringify(data), (err) => {
            if (err)
                return reject(err)
            return resolve(data)
        });
    })
}