import Dexie from 'dexie';

import { ExportFrame } from './Worker';

class BlobFramesDatabase extends Dexie {
  constructor() {
    super('OptimizedFramesDatabase');
    this.version(1).stores({
      frames: '++id,[project_id+track_id+frame_id+type],blob',
    });
  }
}

const db = new BlobFramesDatabase();

const TYPES = {
  thumbnail: { width: 160, height: 160, mode: 'cover' },
  preview: { width: null, height: 720, mode: 'contain' },
};

const openedDb = db.open();

let cachedBlobUrls = {};

const optimizeFrame = async (projectId, trackId, frameId, type, link) => {
  const infos = TYPES[type] || null;

  if (!infos) {
    return null;
  }

  // Get frame URL from cache
  if (cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`]) {
    return cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`];
  }

  // Connect to DB
  await openedDb;

  // Get frame
  const existingFrame = await db.frames
    .where('[project_id+track_id+frame_id+type]')
    .equals([`${projectId}`, `${trackId}`, `${frameId}`, `${type}`])
    .first();

  // Create Blob URL and return
  if (existingFrame) {
    cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`] = URL.createObjectURL(existingFrame.blob);
    return cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`];
  }

  // Compress/Convert frame
  const blob = await ExportFrame(link, { width: infos.width, height: infos.height }, 'jpg', infos.mode);

  // Save optimized frame
  await db.frames.add({
    blob,
    project_id: `${projectId}`,
    track_id: `${trackId}`,
    frame_id: `${frameId}`,
    type: `${type}`,
  });

  // Create Blob URL and return
  cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`] = URL.createObjectURL(blob);
  return cachedBlobUrls[`${projectId}_${trackId}_${frameId}_${type}`];
};

let cachedOptimizePromises = {};

const CachedOptimizeFrame = async (projectId, trackId, frameId, type, link) => {
  if (!cachedOptimizePromises[`${projectId}_${trackId}_${frameId}_${type}_${link}`]) {
    cachedOptimizePromises[`${projectId}_${trackId}_${frameId}_${type}_${link}`] = optimizeFrame(projectId, trackId, frameId, type, link);
  }
  return cachedOptimizePromises[`${projectId}_${trackId}_${frameId}_${type}_${link}`];
};

export const OptimizeFrame = CachedOptimizeFrame;
