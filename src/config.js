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