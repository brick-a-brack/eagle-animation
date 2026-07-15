import { DEFAULT_FPS, VERSION } from '@config-web';
import { v4 as uuidv4 } from 'uuid';

import { createDbAccessor } from './db';

function upgrade(db) {
  if (!db.objectStoreNames.contains('projects')) {
    db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
  }
}

// Existing databases already have the `projects` store, so upgrade only runs for
// a brand-new install (to create it).
const getDB = createDbAccessor('ProjectDatabase', {
  needsUpgrade: (db) => !db.objectStoreNames.contains('projects'),
  upgrade,
});

const time = () => Math.floor(new Date().getTime() / 1000);

export const generateProjectObject = (name) => ({
  title: name,
  version: VERSION,
  creation: time(),
  updated: time(),
  deleted: false,
  favorite: false,
  scenes: [
    {
      id: uuidv4(),
      title: '',
      framerate: DEFAULT_FPS,
      pictures: [],
      deleted: false,
    },
  ],
});

export const createProject = async (name) => {
  const db = await getDB();
  return db.add('projects', { project: generateProjectObject(name) });
};

export const getAllProjects = async () => {
  const db = await getDB();
  const projects = await db.getAll('projects');
  // Guard against malformed rows: a row without a `project` must not throw here,
  // it would take down the whole project list (and the home screen with it).
  return projects.filter((e) => e?.project?.deleted === false);
};

export const getProject = async (id) => {
  const db = await getDB();
  const project = await db.get('projects', Number(id));
  return project || null;
};

export const deleteProject = async (id) => {
  const db = await getDB();
  const data = await db.get('projects', Number(id));
  if (!data) {
    return null;
  }
  return db.put('projects', { ...data, project: { ...data.project, deleted: true } });
};

export const saveProject = async (projectId, data) => {
  const db = await getDB();
  const existing = await db.get('projects', Number(projectId));
  return db.put('projects', { ...(existing || {}), id: Number(projectId), project: { ...(data?.project || {}) } });
};
