import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

import envPaths from 'env-paths';
import { join } from 'path-browserify';

import { DIRECTORY_NAME } from '../config';

const OLD_PROJECTS_PATH = join(homedir(), DIRECTORY_NAME);
export const PROJECTS_PATH = existsSync(OLD_PROJECTS_PATH) ? OLD_PROJECTS_PATH : envPaths(DIRECTORY_NAME, { suffix: '' }).data;

// Disk cache of the image resizer, filled by the ea:// protocol handler
export const RESIZER_CACHE_PATH = join(PROJECTS_PATH, '.cache');

export * from '../config';
