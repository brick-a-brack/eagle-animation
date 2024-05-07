import json from '../package.json';

// Config
export const APP_NAME = 'eagle-animation';
export const VERSION = json.version;

// Local storage keys
export const LS_PREFIX = 'ea_';
export const LS_LANGUAGE = `${LS_PREFIX}language`;
export const LS_SETTINGS = `${LS_PREFIX}settings`;
export const LS_PERMISSIONS = `${LS_PREFIX}permissions`;

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
  },
  {
    value: 'fr',
    label: 'Français',
  },
  {
    value: 'de',
    label: 'Deutsch',
  },
  {
    value: 'es',
    label: 'Español',
  },
  {
    value: 'it',
    label: 'Italiano',
  },
  {
    value: 'pl',
    label: 'Polski',
  },
  {
    value: 'pt',
    label: 'Português',
  },
  {
    value: 'eo',
    label: 'Esperanto',
  },
  {
    value: 'bg',
    label: 'Български',
  },
  {
    value: 'cs',
    label: 'Čeština',
  },
  {
    value: 'da',
    label: 'Dansk',
  },
  {
    value: 'et',
    label: 'Eesti',
  },
  {
    value: 'el',
    label: 'Ελληνικά',
  },
  {
    value: 'ga',
    label: 'Gaeilge',
  },
  {
    value: 'hr',
    label: 'Hrvatski',
  },
  {
    value: 'lv',
    label: 'Latviešu valoda',
  },
  {
    value: 'hu',
    label: 'Magyar',
  },
  {
    value: 'mt',
    label: 'Malti',
  },
  {
    value: 'nl',
    label: 'Nederlands',
  },
  {
    value: 'ro',
    label: 'Română',
  },
  {
    value: 'sk',
    label: 'Slovenčina',
  },
  {
    value: 'sl',
    label: 'Slovenščina',
  },
  {
    value: 'fi',
    label: 'Suomi',
  },
  {
    value: 'sv',
    label: 'Svenska',
  },
  {
    value: 'uk',
    label: 'Українська',
  },
  {
    value: 'ru',
    label: 'Русский',
  },
];

// Allowed languages
export const ALLOWED_LANGUAGES = ['en', 'fr', 'de', 'es', 'it', 'pt', 'pl', 'eo', 'bg', 'cs', 'da', 'et', 'el', 'ga', 'hr', 'lv', 'hu', 'mt', 'nl', 'ro', 'sk', 'sl', 'fi', 'sv', 'uk', 'ru'];
export const DEFAULT_LANGUAGE = 'en';

// Partner API url
export const PARTNER_API = 'https://api.brickfilms.com/';
