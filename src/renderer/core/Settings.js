import { currentLanguage } from "../i18n";

export const DEFAULT_SETTINGS = {
    CAMERA_ID: 0,
    FORCE_QUALITY: false,
    CAPTURE_FRAMES: 1,
    AVERAGING_ENABLED: false,
    AVERAGING_VALUE: 3,
    LANGUAGE: currentLanguage(),
    SHORT_PLAY: 20,
    RATIO_OPACITY: 1, // Not supported yet
    GRID_OPACITY: 1,
    GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
    GRID_LINES: 3,
    GRID_COLUMNS: 3,
    EVENT_KEY: '',
    SOUNDS: true,
};