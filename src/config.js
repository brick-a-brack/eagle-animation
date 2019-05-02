import { homedir } from 'os';
import { join } from 'path';

// Eagle Animation directory name
export const DIRECTORY_NAME = 'EagleAnimation'

// Project file name
export const PROJECT_FILE_NAME = 'project'

// Project file extension
export const PROJECT_FILE_EXTENSION = 'eagleanimation'

// Full project filename
export const PROJECT_FILE = `${PROJECT_FILE_NAME}.${PROJECT_FILE_EXTENSION}`

// Path to store Eagle Animation files
export const DEFAULT_PATH = join(homedir(), DIRECTORY_NAME)

// Default FPS
export const DEFAULT_FPS = 15;

// EA Version
export const EA_VERSION = '1.0.0-indev';