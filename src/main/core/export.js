import { readFile, writeFile } from 'node:fs/promises';
import { format, join } from 'node:path';

import { mkdirp } from 'mkdirp';
import { rimraf } from 'rimraf';
import { v4 as uuidv4 } from 'uuid';

import { getFFmpegArgs, parseFFmpegLogs } from '../../common/ffmpeg';
import { ffmpeg } from './ffmpeg';
import { getProjectData } from './projects';

export const exportProjectScene = async (projectPath, scene, frames, filePath, format, opts = {}, onProgress = () => {}) => {
  const project = await getProjectData(projectPath);
  const directoryPath = join(projectPath, `/.tmp-${uuidv4()}/`);
  await mkdirp(directoryPath);
  for (const frame of frames) {
    await writeFile(join(directoryPath, `frame-${frame.index.toString().padStart(6, '0')}.${frame.extension}`), frame.buffer);
  }

  const fps = opts?.framerate || project.project.scenes[scene].framerate;
  const args = getFFmpegArgs(format, filePath, fps, opts);

  const handleData = (data) => {
    parseFFmpegLogs(data, frames.length || 0, opts.customOutputFramerate ? opts.customOutputFramerateNumber : undefined, onProgress);
  };
  await ffmpeg(args, directoryPath, handleData);
  await rimraf(directoryPath);
};

// Sync list
export const getSyncList = async (path) => {
  try {
    const file = format({ dir: path, base: 'sync.json' });
    const data = await readFile(file, 'utf8');
    const sync = JSON.parse(data);
    return [...sync];
  } catch (e) {
    return [];
  }
};

// Save sync list
export const saveSyncList = async (path, data) => {
  try {
    const file = format({ dir: path, base: 'sync.json' });
    await writeFile(file, JSON.stringify([...data]));
    return [...data];
  } catch (e) {
    return [];
  }
};
