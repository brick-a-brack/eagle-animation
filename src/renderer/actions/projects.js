import Dexie from 'dexie';

import { DEFAULT_FPS, VERSION } from '../config';

class ProjectsDatabase extends Dexie {
  constructor() {
    super('ProjectDatabase');
    this.version(1).stores({
      projects: '++id,project',
    });
  }
}

const db = new ProjectsDatabase();

const time = () => Math.floor(new Date().getTime() / 1000);

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

export const createProject = async (name) => {
  await db.open();
  return db.projects.add({ project: generateProjectObject(name) });
};

export const getAllProjects = async () => {
  await db.open();
  const projects = await db.projects.toArray();
  return projects.filter((e) => e.project.deleted === false);
};

export const getProject = async (id) => {
  await db.open();
  const project = await db.projects.get(Number(id));
  return project || null;
};

export const deleteProject = async (id) => {
  await db.open();
  const data = await db.projects.get(Number(id));
  db.projects.update(Number(id), { project: { ...data.project, deleted: true } });
};

export const saveProject = async (projectId, data) => {
  await db.open();
  return db.projects.update(Number(projectId), { project: { ...(data?.project || {}) } });
};
