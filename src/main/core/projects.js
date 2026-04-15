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
  let project = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const data = await readFile(file, 'utf8');
    try {
      project = JSON.parse(data);
      break;
    } catch (err) {} // eslint-disable-line no-empty
    await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
  }
  if (!project) {
    throw new Error('FAILED_TO_LOAD_PROJECT');
  }
  const id = path.replaceAll('\\', '/').split('/').pop();
  return { project, _path: path, _file: file, _id: id };
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
    return fetchedProjects.filter((p) => p && p.project?.deleted !== true) || [];
  } catch (err) {
    return [];
  }
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
    filename: `${id}.${ext}`,
    scene,
    path: filePath,
  };
};

// Create picture object
export const savePicture = async (projectPath, track, ext, buffer) => {
  const trackId = Number(track);
  const file = await createImageFile(projectPath, trackId, ext, buffer);
  return {
    filename: file.filename,
    deleted: false,
    length: 1,
  };
};
