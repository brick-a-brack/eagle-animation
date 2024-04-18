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

export const updateSceneFPSValue = async (projectId, trackId, fps) => {
  await db.open();
  let data = await db.projects.get(Number(projectId));
  if (data.project.scenes[trackId]) {
    data.project.scenes[trackId].framerate = Number(fps);
  }
  return db.projects.update(Number(projectId), { project: { ...data.project } });
};

export const updateProjectTitle = async (id, title) => {
  await db.open();
  let data = await db.projects.get(Number(id));
  data.project.title = title;
  return db.projects.update(Number(id), { project: { ...data.project } });
};

export const sceneAddFrame = async (projectId, trackId, ext, beforeFrameId, frameId) => {
  await db.open();
  let data = await db.projects.get(Number(projectId));
  const sceneId = Number(trackId);
  if (data.project.scenes[sceneId]) {
    const index = beforeFrameId === false ? -1 : data.project.scenes[sceneId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);

    const newFrame = {
      id: `${frameId}`,
      filename: `${frameId}.${ext || 'dat'}`,
      deleted: false,
      length: 1,
    };

    if (index !== -1) {
      data.project.scenes[sceneId].pictures = [...data.project.scenes[sceneId].pictures.slice(0, index), newFrame, ...data.project.scenes[trackId].pictures.slice(index)];
    } else {
      data.project.scenes[sceneId].pictures = [...data.project.scenes[sceneId].pictures, newFrame];
    }
    return db.projects.update(Number(projectId), { project: { ...data.project } });
  }
  return null;
};

export const applyFrameLengthOffset = async (projectId, trackId, pictureId, offset) => {
  await db.open();
  let data = await db.projects.get(Number(projectId));
  const sceneId = Number(trackId);
  if (data.project.scenes[sceneId]) {
    data.project.scenes[sceneId].pictures = data.project.scenes[sceneId].pictures.map((p) => (`${p.id}` !== `${pictureId}` ? p : { ...p, length: (p.length || 1) + offset || 1 }));
  }
  return db.projects.update(Number(projectId), { project: { ...data.project } });
};

export const deleteProjectFrame = async (projectId, trackId, pictureId) => {
  await db.open();
  let data = await db.projects.get(Number(projectId));
  const sceneId = Number(trackId);
  if (data.project.scenes[sceneId]) {
    data.project.scenes[sceneId].pictures = data.project.scenes[sceneId].pictures.map((p) => (`${p.id}` !== `${pictureId}` ? p : { ...p, deleted: true }));
  }
  return db.projects.update(Number(projectId), { project: { ...data.project } });
};

export const moveFrame = async (projectId, trackId, frameId, beforeFrameId) => {
  await db.open();
  let data = await db.projects.get(Number(projectId));
  const sceneId = Number(trackId);
  if (data.project.scenes[sceneId]) {
    const index = beforeFrameId === false ? -1 : data.project.scenes[sceneId].pictures.findIndex((f) => `${f.id}` === `${beforeFrameId}`);
    const frame = data.project.scenes[sceneId].pictures.find((f) => `${f.id}` === `${frameId}`);
    if (frame) {
      if (index != -1) {
        data.project.scenes[sceneId].pictures = [
          ...data.project.scenes[sceneId].pictures.slice(0, index).filter((f) => `${f.id}` !== `${frameId}`),
          frame,
          ...data.project.scenes[sceneId].pictures.slice(index).filter((f) => `${f.id}` !== `${frameId}`),
        ];
      } else {
        data.project.scenes[sceneId].pictures = [...data.project.scenes[sceneId].pictures.filter((f) => `${f.id}` !== `${frameId}`), frame];
      }
      return db.projects.update(Number(projectId), { project: { ...data.project } });
    }
  }
  return null;
};
