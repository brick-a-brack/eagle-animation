import { format, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { rimraf } from 'rimraf';
import { readFile, writeFile } from 'fs';

import { getProjectData } from './projects';
import { createDirectory, copy } from './utils';
import { generate } from './ffmpeg';

export const normalizePictures = async (projectPath, scene, outputPath, opts = {}) => {
  const project = await getProjectData(projectPath);
  const frames = project?.project?.scenes?.[scene]?.pictures?.filter((e) => !e.deleted) || [];

  const getNumberOfFrames = (frame, index) => {
    if (opts.duplicateFramesAuto && opts.duplicateFramesAutoNumber && (index === 0 || index === frames.length - 1)) {
      return Number(opts.duplicateFramesAutoNumber) + frame.length - 1;
    }
    return opts.duplicateFramesCopy ? frame.length : 1;
  };

  const files = frames?.reduce((acc, e, i) => [...acc, ...Array(getNumberOfFrames(e, i)).fill(e)], []);
  await createDirectory(outputPath);
  for (let i = 0; i < files.length; i++) {
    await copy(join(projectPath, `/${scene}/`, files[i].filename), join(outputPath, `frame-${i.toString().padStart(6, '0')}.jpg`));
  }
};

export const exportProjectScene = async (projectPath, scene, filePath, format, opts = {}) => {
  const project = await getProjectData(projectPath);
  const directoryPath = join(projectPath, `/.tmp-${uuidv4()}/`);
  await normalizePictures(projectPath, scene, directoryPath, opts);
  await generate(1920, 1080, directoryPath, format, filePath, opts?.framerate || project.project.scenes[scene].framerate, opts);
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
