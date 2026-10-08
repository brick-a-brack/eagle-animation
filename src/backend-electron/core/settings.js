import { readFile, rename, writeFile } from 'node:fs/promises';
import { format } from 'node:path';

import { DEFAULT_FPS } from '../../config';

const defaultSettings = {
  CAMERA_ID: 0,
  CAPTURE_FRAMES: 1,
  AVERAGING_ENABLED: false,
  AVERAGING_VALUE: 3,
  //LANGUAGE: 'en', // default Handled by front side
  SHORT_PLAY: 20,
  DEFAULT_FPS,
  RATIO_OPACITY: 0.5,
  GRID_OPACITY: 1,
  GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
  GRID_LINES: 3,
  GRID_COLUMNS: 3,
  EVENT_KEY: '',
};

// Get settings
export const getSettings = async (path) => {
  try {
    const file = format({ dir: path, base: 'settings.json' });
    const data = await readFile(file, 'utf8');
    const settings = JSON.parse(data);
    return { ...defaultSettings, ...(settings || {}) };
  } catch (e) {
    return defaultSettings;
  }
};

let settingsQueue = Promise.resolve();

// Settings save
export const saveSettings = (path, data) => {
  settingsQueue = settingsQueue
    .catch(() => {})
    .then(async () => {
      try {
        const file = format({ dir: path, base: 'settings.json' });
        const temporaryFile = format({ dir: path, base: 'settings.json.tmp' });
        await writeFile(temporaryFile, JSON.stringify({ ...data }));
        await rename(temporaryFile, file);
        return { ...defaultSettings, ...(data || {}) };
      } catch (e) {
        return defaultSettings;
      }
    });
  return settingsQueue;
};

const getCameraSettingsFile = (path) => format({ dir: path, base: 'camera-settings.json' });

const getAllCameraSettings = async (path) => {
  try {
    const data = await readFile(getCameraSettingsFile(path), 'utf8');
    return JSON.parse(data) || {};
  } catch (e) {
    return {};
  }
};

export const getCameraSettings = async (path, cameraId) => {
  const allSettings = await getAllCameraSettings(path);
  return allSettings?.[cameraId] || {};
};

let cameraSettingsQueue = Promise.resolve();

export const saveCameraSettings = (path, cameraId, settings) => {
  cameraSettingsQueue = cameraSettingsQueue
    .catch(() => {})
    .then(async () => {
      const allSettings = await getAllCameraSettings(path);
      const temporaryFile = `${getCameraSettingsFile(path)}.tmp`;
      await writeFile(temporaryFile, JSON.stringify({ ...allSettings, [cameraId]: settings || {} }));
      await rename(temporaryFile, getCameraSettingsFile(path));
      return settings || {};
    });
  return cameraSettingsQueue;
};
