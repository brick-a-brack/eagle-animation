import { homedir } from 'os';
import { join } from 'path';

// Internal app name
export const APP_NAME = 'eagle-animation';

// Eagle Animation directory name
export const DIRECTORY_NAME = 'EagleAnimation';

// Project file name
export const PROJECT_FILE_NAME = 'project';

// Project file extension
export const PROJECT_FILE_EXTENSION = 'eagleanimation';

// Full project filename
export const PROJECT_FILE = `${PROJECT_FILE_NAME}.${PROJECT_FILE_EXTENSION}`;

// Default project name
export const PROJECT_DEFAULT_NAME = 'Untitled';

// Path to store Eagle Animation files
export const DEFAULT_PATH = join(homedir(), DIRECTORY_NAME);

// Default FPS
export const DEFAULT_FPS = 12;

// EA Version
export const EA_VERSION = '1.1.0';

// Github link
export const CONTRIBUTE_LINK = 'https://github.com/brick-a-brack/eagle-animation';

// Sentry DSN
export const SENTRY_DSN = 'https://750d3c23387f46b8922dee52580eb607@sentry.io/1458572';

// Google Analytics
export const GOOGLE_ANALYTICS = 'UA-129453289-2';
