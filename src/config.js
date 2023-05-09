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
export const CONTRIBUTE_REPOSITORY = 'brick-a-brack/eagle-animation';

// Sentry DSN
export const SENTRY_DSN = 'https://750d3c23387f46b8922dee52580eb607@sentry.io/1458572';

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
export const ALLOWED_LANGUAGES = ['en', 'fr', 'de'];
export const DEFAULT_LANGUAGE = 'en';

// Partner API url
export const PARTNER_API = 'https://api.brickfilms.com/';
