import { readFile, writeFile } from "fs";
import { format } from "path";

const defaultSettings = {
    CAMERA_ID: 0,
    CAPTURE_FRAMES: 1,
    AVERAGING_ENABLED: false,
    AVERAGING_VALUE: 3,
    //LANGUAGE: 'en', // default Handled by front side
    SHORT_PLAY: 20,
    RATIO_OPACITY: 1,
    GRID_OPACITY: 1,
    GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
    GRID_LINES: 3,
    GRID_COLUMNS: 3,
    EVENT_KEY: '',
}

export const getSettings = path => new Promise((resolve, reject) => {
    const file = format({ dir: path, base: 'settings.json' });
    readFile(file, (err, data) => {
        if (err)
            return resolve(defaultSettings);
        try {
            const settings = JSON.parse(data.toString('utf8'));
            return resolve({ ...defaultSettings, ...(settings || {}) });
        } catch (e) {
            return resolve(defaultSettings);
        }
    });
});

// Project save
export const saveSettings = (path, data) => new Promise((resolve, reject) => {
    const file = format({ dir: path, base: 'settings.json' });
    writeFile(file, JSON.stringify({
        ...data,
    }), (err) => {
        if (err) {
            return resolve(defaultSettings);
        }
        return resolve({ ...defaultSettings, ...(data || {}) });
    });
});

// External settings
// \Common Files\LogiShrd\SharedBin\LogiDPPApp.exe