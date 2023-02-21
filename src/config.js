import json from '../package.json';

// Config
export const APP_NAME = 'eagle-animation';
export const VERSION = json.version;

// Local storage keys
export const LS_PREFIX = 'ea_';
export const LS_LANGUAGE = `${LS_PREFIX}language`;

// Eagle Animation files
export const DIRECTORY_NAME = 'EagleAnimation';
export const PROJECT_FILE_NAME = 'project';
export const PROJECT_FILE_EXTENSION = 'eagleanimation';
export const PROJECT_FILE = `${PROJECT_FILE_NAME}.${PROJECT_FILE_EXTENSION}`;

// Default values
export const DEFAULT_FPS = 12;

// Github link
export const CONTRIBUTE_REPOSITORY = process.env.CONTRIBUTE_REPOSITORY;

// Sentry DSN
export const SENTRY_DSN = process.env.SENTRY_DSN;

// Languages
export const LANGUAGES = [{
    value: 'en',
    label: 'English',
    tLabel: t => t('English'),
}, {
    value: 'fr',
    label: 'Français',
    tLabel: t => t('Français'),
}, {
    value: 'de',
    label: 'Deutsh',
    tLabel: t => t('Deutsh'),
}];

// Allowed languages
export const ALLOWED_LANGUAGES = ['en', 'fr', /*'de'*/];
export const DEFAULT_LANGUAGE = 'en';

// Partner API url
export const PARTNER_API = process.env.PARTNER_API_URL;
