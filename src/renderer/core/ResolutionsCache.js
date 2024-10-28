import Dexie from 'dexie';

import { GetFrameResolution as GetFrameResolutionFromWorker } from './Worker';

class ResolutionCacheDatabase extends Dexie {
  constructor() {
    super('ResolutionCacheDatabase');
    this.version(1).stores({
      resolutions: '++id,[cache_key],resolution',
    });
  }
}

const db = new ResolutionCacheDatabase();

const openedDb = db.open();

let cachedResolutions = {};
let cachedPromises = {};

const getFrameResolution = async (projectId, sceneId, frameId, link) => {
  const cacheKey = `${projectId}_${sceneId}_${frameId}`;

  // Get frame URL from cache
  if (cachedResolutions[cacheKey]) {
    return cachedResolutions[cacheKey];
  }

  // Connect to DB
  await openedDb;

  // Cache resolution and return
  const existingResolution = await db.resolutions.where('[cache_key]').equals([cacheKey]).first();

  // Cache resolution and return
  if (existingResolution) {
    cachedResolutions[cacheKey] = existingResolution.resolution;
    return existingResolution.resolution;
  }

  // Compress/Convert frame
  const resolution = await GetFrameResolutionFromWorker(link).catch(() => ({ width: null, height: null }));

  // Save optimized frame
  await db.resolutions.add({
    resolution,
    cache_key: cacheKey,
  });

  // Create Blob URL and return
  cachedResolutions[cacheKey] = resolution;
  return resolution;
};

export const GetFrameResolution = async (projectId, sceneId, frameId, link) => {
  const cacheKey = `${projectId}_${sceneId}_${frameId}`;
  if (!cachedPromises[cacheKey]) {
    cachedPromises[cacheKey] = getFrameResolution(projectId, sceneId, frameId, link).catch(() => ({ width: null, height: null }));
  }
  return cachedPromises[cacheKey];
};

export const GetFrameResolutions = async (projectId, sceneId, frames) => {
  if (!frames || frames.length === 0) {
    return [];
  }
  const resolutions = await Promise.all(frames.map((frame) => GetFrameResolution(projectId, sceneId, frame.id, frame.link).catch(() => ({ width: null, height: null }))));
  return resolutions;
};
