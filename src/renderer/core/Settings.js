import { currentLanguage } from "../i18n";

export const DEFAULT_SETTINGS = {
    CAMERA_ID: 0, // ok
    FORCE_QUALITY: false, // ok
    CAPTURE_FRAMES: 1, // ok
    AVERAGING_ENABLED: false, // ok
    AVERAGING_VALUE: 3, // ok
    LANGUAGE: currentLanguage(), // ok
    SHORT_PLAY: 20, // ok
    RATIO_OPACITY: 1,
    GRID_OPACITY: 1, // ok
    GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS // ok
    GRID_LINES: 3, // ok
    GRID_COLUMNS: 3, // ok
    EVENT_KEY: '',
};