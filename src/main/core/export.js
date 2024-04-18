import { readFile } from 'fs';
import { writeFile } from 'fs/promises';
import { mkdirp } from 'mkdirp';
import { format, join } from 'path';
import { rimraf } from 'rimraf';
import { v4 as uuidv4 } from 'uuid';

import { ffmpeg } from './ffmpeg';
import { getProjectData } from './projects';
import { getFFmpegArgs, parseFFmpegLogs } from '../../common/ffmpeg';

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
export const getSyncList = (path) =>
  new Promise((resolve) => {
    const file = format({ dir: path, base: 'sync.json' });
    readFile(file, (err, data) => {
      if (err) return resolve([]);
      try {
        const sync = JSON.parse(data.toString('utf8'));
        return resolve([...sync]);
      } catch (e) {
        return resolve([]);
      }
    });
  });

// Save sync list
export const saveSyncList = (path, data) =>
  new Promise((resolve) => {
    const file = format({ dir: path, base: 'sync.json' });
    writeFile(file, JSON.stringify([...data]), (err) => {
      if (err) {
        return resolve([]);
      }
      return resolve([...data]);
    });
  });
