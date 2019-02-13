import mkdirp from 'mkdirp'
import Electron from 'electron'

// Recursively create directory
export const createDirectory = (path) => {
    return new Promise((resolve, reject) => {
        mkdirp(path, (err) => {
            if (err)
                return reject(err)
            return resolve(true)
        })
    })
}

// Directory selector
export const directorySelector = () => {
    return new Promise((resolve, reject) => {
        Electron.remote.dialog.showOpenDialog({ properties: ['openDirectory'] }, (paths) => {
            if (paths && paths.length)
                return resolve(paths[0])
            return resolve(false)
        })
    })
}
