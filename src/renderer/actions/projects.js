import { DEFAULT_FPS, VERSION } from '@config-web';
import Dexie from 'dexie';

class ProjectsDatabase extends Dexie {
  constructor() {
    super('ProjectDatabase');
    this.version(1).stores({
      projects: '++id,project',
    });
  }
}

const db = new ProjectsDatabase();
const openedDb = db.open();

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
  await openedDb;
  return db.projects.add({ project: generateProjectObject(name) });
};

export const getAllProjects = async () => {
  await openedDb;
  const projects = await db.projects.toArray();
  return projects.filter((e) => e.project.deleted === false);
};

export const getProject = async (id) => {
  await openedDb;
  const project = await db.projects.get(Number(id));
  return project || null;
};

export const deleteProject = async (id) => {
  await openedDb;
  const data = await db.projects.get(Number(id));
  db.projects.update(Number(id), { project: { ...data.project, deleted: true } });
};

export const saveProject = async (projectId, data) => {
  await openedDb;
  return db.projects.update(Number(projectId), { project: { ...(data?.project || {}) } });
};
