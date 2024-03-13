import { mkdirp } from 'mkdirp';
import { copyFile } from 'fs';
import { dialog } from "electron";

// Timestamp
export const time = () => (Math.floor((new Date().getTime()) / 1000));

// Create a recursive directory
export const createDirectory = async path => {
    await mkdirp(path)
    return true;
};

// Copy file
export const copy = (from, to) => new Promise((resolve, reject) => {
    copyFile(from, to, (err) => {
        if (err)
            return reject(err);
        return resolve(to);
    });
});

// Select an output folder
export const selectFolder = async (title) => {
    const data = await dialog.showOpenDialog({ properties: ['openDirectory'], title });
    return (data.canceled || !data?.filePaths?.[0]) ? null : data?.filePaths?.[0];
}

// Select an output file
export const selectFile = async (name, ext, title, extTitle) => {
    const data = await dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation'],
        defaultPath: `${name}`,
        filters: [{ name: extTitle, extensions: [ext] }],
        title
    });
    return (data.canceled || !data?.filePath) ? null : data?.filePath;
}
