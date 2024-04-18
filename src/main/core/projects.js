import { randomUUID } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { format, join } from 'node:path';

import { mkdirp } from 'mkdirp';

import { DEFAULT_FPS, PROJECT_FILE, VERSION } from '../../config';
import { time } from './utils';

const exists = async (path) => {
  const info = await stat(path).catch(() => null);
  return !!info;
};

// Generate empty project
export const generateProjectObject = (name) => ({
  title: name,
  version: VERSION,
  creation: time(),
  updated: time(),
  deleted: false,
  scenes: [
    {
      title: 'SHOT #1',
      framerate: DEFAULT_FPS,
      pictures: [],
    },
  ],
});

// Read the project.json file in a specified directory
export const getProjectData = async (path) => {
  const file = format({ dir: path, base: PROJECT_FILE });
  const data = await readFile(file, 'utf8');
  const project = JSON.parse(data);
  return { project, _path: path, _file: file };
};

// List all projects in a directory
export const getProjectsList = async (path) => {
  try {
    const dirs = await readdir(path);
    const stats = await Promise.all(dirs.map((f) => stat(join(path, f))));

    const projects = [];
    for (let i = 0; i < dirs.length; i++) {
      if (stats[i].isDirectory()) {
        projects.push(getProjectData(join(path, dirs[i])).catch(() => null));
      }
    }

    const fetchedProjects = await Promise.all(projects);
    return fetchedProjects.filter((p) => p && p.project.deleted !== true) || [];
  } catch (err) {
    return [];
  }
};

// Rename a project
export const renameProject = (path, name) =>
  new Promise((resolve, reject) => {
    getProjectData(path)
      .then((data) =>
        projectSave(path, { ...data.project, title: name }, false).then((dataProject) => {
          resolve(dataProject);
        })
      )
      .catch((err) => {
        reject(err);
      });
  });

// Update scene FPS value
export const updateSceneFPSvalue = async (path, track, fps) => {
  let data = await getProjectData(path);
  const trackId = Number(track);
  if (data.project.scenes[trackId]) {
    data.project.scenes[trackId].framerate = fps;
  }
  await projectSave(path, data.project, true);
  return data;
};

// Delete a project
export const deleteProject = (path) =>
  new Promise((resolve, reject) => {
    getProjectData(path)
      .then((data) =>
        projectSave(path, { ...data.project, deleted: true }, false).then((dataProject) => {
          resolve(dataProject);
        })
      )
      .catch((err) => {
        reject(err);
      });
  });

// Delete a project
export const deleteProjectFrame = async (path, track, pictureId) => {
  let data = await getProjectData(path);
  const trackId = Number(track);
  if (data.project.scenes[trackId]) {
    data.project.scenes[trackId].pictures = data.project.scenes[trackId].pictures.map((p) => (`${p.id}` !== `${pictureId}` ? p : { ...p, deleted: true }));
  }
  await projectSave(path, data.project, true);
  return data;
};

// Apply length offset to a specific frame
export const applyProjectFrameLengthOffset = async (path, track, pictureId, offset) => {
  let data = await getProjectData(path);
  const trackId = Number(track);
  if (data.project.scenes[trackId]) {
    data.project.scenes[trackId].pictures = data.project.scenes[trackId].pictures.map((p) => (`${p.id}` !== `${pictureId}` ? p : { ...p, length: (p.length || 1) + offset || 1 }));
  }
  await projectSave(path, data.project, true);
  return data;
};

// Apply hidden status to a specific frame
export const applyHideFrameStatus = async (path, track, pictureId, hidden) => {
  let data = await getProjectData(path);
  const trackId = Number(track);
  if (data.project.scenes[trackId]) {
    data.project.scenes[trackId].pictures = data.project.scenes[trackId].pictures.map((p) => (`${p.id}` !== `${pictureId}` ? p : { ...p, hidden }));
  }
  await projectSave(path, data.project, true);
  return data;
};

// Project save
export const projectSave = async (path, data, updateTime = true) => {
  const newData = { ...data, updated: time() };
  const file = format({ dir: path, base: PROJECT_FILE });
  await writeFile(
    file,
    JSON.stringify({
      ...data,
      ...(updateTime ? { updated: time() } : {}),
    })
  );
  return { project: newData, _path: path, _file: file };
};

// Project create
export const createProject = async (path, name) => {
  const directoryName = randomUUID();
  const projectPath = join(path, directoryName);
  await mkdirp(projectPath);
  await projectSave(projectPath, generateProjectObject(name));
  return getProjectData(projectPath);
};

// Choose picture id
const choosePictureId = async (projectPath, scene, ext = 'jpg') => {
  const dataOriginal = await getProjectData(projectPath);
  const data = { ...dataOriginal };
  if (!data.project.scenes[scene]) {
    data.project.scenes[scene] = {
      pictures: [],
    };
  }
  let newId = Math.max(0, ...data.project.scenes[scene].pictures.map((e) => e.id));
  let filePath = false;
  while (filePath === false || (await exists(filePath))) {
    newId++;
    filePath = join(projectPath, `/${scene}/`, `${newId}.${ext}`);
  }
  return newId;
};

// Create image file
const createImageFile = async (projectPath, scene, ext, data) => {
  const directoryPath = join(projectPath, `/${scene}/`);
  await mkdirp(directoryPath);
  const id = await choosePictureId(projectPath, scene, ext);
  const filePath = join(projectPath, `/${scene}/`, `${id}.${ext}`);
  if (await exists(filePath)) {
    throw new Error('FILE_ALREADY_EXISTS');
  }
  await writeFile(filePath, data);
  return {
    id,
    filename: `${id}.${ext}`,
    scene,
    path: filePath,
  };
};

export const takePicture = async (projectPath, track, ext, beforeFrameId, buffer) => {
  const trackId = Number(track);
  const data = await getProjectData(projectPath);
  const file = await createImageFile(projectPath, trackId, ext, buffer);
  if (data.project.scenes[trackId]) {
    const index = beforeFrameId === false ? -1 : data.project.scenes[trackId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);

    const newFrame = {
      id: file.id,
      filename: file.filename,
      deleted: false,
      length: 1,
    };

    if (index !== -1) {
      data.project.scenes[trackId].pictures = [...data.project.scenes[trackId].pictures.slice(0, index), newFrame, ...data.project.scenes[trackId].pictures.slice(index)];
    } else {
      data.project.scenes[trackId].pictures = [...data.project.scenes[trackId].pictures, newFrame];
    }

    await projectSave(projectPath, data.project, true);
  }
  return data;
};

export const moveFrame = async (projectPath, track, frameId, beforeFrameId) => {
  const trackId = Number(track);
  const data = await getProjectData(projectPath);

  if (data.project.scenes[trackId]) {
    const index = beforeFrameId === false ? -1 : data.project.scenes[trackId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);
    const frame = data.project.scenes[trackId].pictures.find((f) => `${f.id}` === `${frameId}`);
    if (frame) {
      if (index != -1) {
        data.project.scenes[trackId].pictures = [
          ...data.project.scenes[trackId].pictures.slice(0, index).filter((f) => `${f.id}` !== `${frameId}`),
          frame,
          ...data.project.scenes[trackId].pictures.slice(index).filter((f) => `${f.id}` !== `${frameId}`),
        ];
      } else {
        data.project.scenes[trackId].pictures = [...data.project.scenes[trackId].pictures.filter((f) => `${f.id}` !== `${frameId}`), frame];
      }
      await projectSave(projectPath, data.project, true);
    }
  }
  return data;
};

/*
// Project selector
export const projectSelector = () => new Promise((resolve) => {
    Electron.remote.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{
            name: 'Eagle Animation Project',
            extensions: [PROJECT_FILE_EXTENSION]
        }]
    }, (paths) => {
        if (paths && paths.length)
            return resolve(dirname(paths[0]));
        return resolve(false);
    });
});
*/
