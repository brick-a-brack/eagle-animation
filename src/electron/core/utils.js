import mkdirp from "mkdirp";
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
export const selectFolder = async () => {
    const data = await dialog.showOpenDialog({ properties: ['openDirectory'], title:'TODO - Export frames' });
    return  (data.canceled || !data?.filePaths?.[0]) ? null : data?.filePaths?.[0];
}

// Select an output file
export const selectFile = async (name, ext) => {
    const data = await dialog.showSaveDialog({
        properties: ['showOverwriteConfirmation'],
        filters: [{
            name: name || 'Unknown',
            extensions: [ext]
        }],
         title:'TODO - Export video'
    });
    return (data.canceled || !data?.filePath) ? null : data?.filePath;
}
