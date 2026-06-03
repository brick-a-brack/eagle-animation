import { readFile, writeFile } from 'node:fs/promises';
import { format } from 'node:path';

const defaultSettings = {
  CAMERA_ID: 0,
  CAPTURE_FRAMES: 1,
  AVERAGING_ENABLED: false,
  AVERAGING_VALUE: 3,
  //LANGUAGE: 'en', // default Handled by front side
  SHORT_PLAY: 20,
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

// Settings save
export const saveSettings = async (path, data) => {
  try {
    const file = format({ dir: path, base: 'settings.json' });
    await writeFile(file, JSON.stringify({ ...data }));
    return { ...defaultSettings, ...(data || {}) };
  } catch (e) {
    return defaultSettings;
  }
};
