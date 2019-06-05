import mkdirp from 'mkdirp';
import Electron from 'electron';
import ua from 'universal-analytics'
import { copyFile } from 'fs';
import { GOOGLE_ANALYTICS } from '../config'

// Recursively create directory
export const createDirectory = path => new Promise((resolve, reject) => {
    mkdirp(path, (err) => {
        if (err)
            return reject(err);
        return resolve(true);
    });
});

// Directory selector
export const directorySelector = () => new Promise((resolve) => {
    Electron.remote.dialog.showOpenDialog({ properties: ['openDirectory'] }, (paths) => {
        if (paths && paths.length)
            return resolve(paths[0]);
        return resolve(false);
    });
});

// Timestamp
export const time = () => (Math.floor((new Date().getTime()) / 1000));

// Open link
export const openLink = (link) => {
    Electron.remote.shell.openExternal(link);
};

// Copy file
export const copy = (from, to) => new Promise((resolve, reject) => {
    copyFile(from, to, (err) => {
        if (err)
            return reject(err);
        return resolve(to);
    });
});

// Play a sound
export const playSound = (file, volume = 1) => {
    if (volume === 0)
        return;
    const audio = new Audio(file);
    audio.volume = volume;
    audio.play();
};

let _GA = false;
export const gaInit = () => {
    if (GOOGLE_ANALYTICS && _GA === false) {
        _GA = ua(GOOGLE_ANALYTICS);
        _GA.pageview('/').send();
    }
    return _GA;
}

export const gaTrack = (event = false) => {
    gaInit();
    if (_GA && event)
        _GA.event("Events", event).send();
}