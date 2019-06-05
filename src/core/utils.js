import mkdirp from 'mkdirp';
import Electron from 'electron';
import { copyFile } from 'fs';

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
