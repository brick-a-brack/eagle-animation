import { extensionToMimeType } from '@core/frameTypes';
import Dexie from 'dexie';

class BlobFramesDatabase extends Dexie {
  constructor() {
    super('BlobFramesDatabase');
    this.version(2).stores({
      frames: '++id,blob,extension',
    });
    this.version(3)
      .stores({
        frames: '++id,blob,extension',
        framesById: 'id,buffer,extension',
      })
      .upgrade(async (tx) => {
        const frames = await tx.table('frames').toArray();
        await tx.table('framesById').bulkPut(
          frames.map((frame) => ({
            buffer: frame?.buffer || frame?.blob,
            extension: frame?.extension,
            id: frame?.id ? String(frame.id) : crypto.randomUUID(),
          }))
        );
      });
  }
}

const db = new BlobFramesDatabase();
const openedDb = db.open();
const framesTable = () => db.table('framesById');

export const createFrame = async (buffer, extension) => {
  await openedDb;
  const id = crypto.randomUUID();
  await framesTable().put({ id, buffer, extension });
  return id;
};

let cachedUrls = {};

export const getFrameBlobUrl = async (id) => {
  const frameId = String(id);

  if (cachedUrls[frameId]) {
    return cachedUrls[frameId];
  }
  await openedDb;
  const frame = await framesTable().get(frameId);
  if (!frame) {
    return null;
  }
  const blob = new Blob([frame.buffer], { type: extensionToMimeType(frame?.extension) });
  if (!blob) {
    return null;
  }
  cachedUrls[frameId] = URL.createObjectURL(blob);
  return cachedUrls[frameId];
};

export const getFrameBlob = async (id) => {
  const frameId = String(id);
  await openedDb;
  const frame = await framesTable().get(frameId);
  if (!frame) {
    return null;
  }
  const blob = new Blob([frame.buffer], { type: extensionToMimeType(frame?.extension) });
  if (!blob) {
    return null;
  }
  return blob;
};
