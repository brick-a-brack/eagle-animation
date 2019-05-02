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

// Timestamp
export const time = () => (Math.floor((new Date().getTime()) / 1000));

// Datetime patch
Object.defineProperty(Date.prototype, 'YYYYMMDDHHMM', {
    value: function() {
        function pad2(n) {  // always returns a string
            return (n < 10 ? '0' : '') + n;
        }

        return this.getFullYear() +
               pad2(this.getMonth() + 1) + 
               pad2(this.getDate()) +
               pad2(this.getHours()) +
               pad2(this.getMinutes())
    }
});