import json from '../package.json';

// Config
export const APP_NAME = 'eagle-animation';
export const VERSION = json.version;

// Local storage keys
export const LS_PREFIX = 'ea_';
export const LS_LANGUAGE = `${LS_PREFIX}language`;
export const LS_SETTINGS = `${LS_PREFIX}settings`;

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
export const LANGUAGES = [
  {
    value: 'en',
    label: 'English',
    tLabel: (t) => t('English'),
  },
  {
    value: 'fr',
    label: 'Français',
    tLabel: (t) => t('Français'),
  },
  {
    value: 'de',
    label: 'Deutsch',
    tLabel: (t) => t('Deutsch'),
  },
  {
    value: 'es',
    label: 'Español',
    tLabel: (t) => t('Español'),
  },
  {
    value: 'it',
    label: 'Italiano',
    tLabel: (t) => t('Italiano'),
  },
  {
    value: 'pl',
    label: 'Polski',
    tLabel: (t) => t('Polski'),
  },
  {
    value: 'pt',
    label: 'Português',
    tLabel: (t) => t('Português'),
  },
  {
    value: 'eo',
    label: 'Esperanto',
    tLabel: (t) => t('Esperanto'),
  },
];

// Allowed languages
export const ALLOWED_LANGUAGES = ['en', 'fr', 'de', 'es', 'it', 'pt', 'pl'];
export const DEFAULT_LANGUAGE = 'en';

// Partner API url
export const PARTNER_API = 'https://api.brickfilms.com/';
