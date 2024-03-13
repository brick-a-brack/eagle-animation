import Dexie from 'dexie';

class BlobFramesDatabase extends Dexie {
  constructor() {
    super('BlobFramesDatabase');
    this.version(1).stores({
      frames: '++id,blob',
    });
  }
}

const db = new BlobFramesDatabase();

export const createFrame = async (buffer) => {
  await db.open();
  return db.frames.add({ buffer });
};

let cachedUrls = {};

export const getFrameBlobUrl = async (id) => {
  if (cachedUrls[Number(id)]) {
    return cachedUrls[Number(id)];
  }
  await db.open();
  const frame = await db.frames.get(Number(id));
  if (!frame) {
    return null;
  }
  const blob = new Blob([frame.buffer], { type: 'image/jpeg' });
  if (!blob) {
    return null;
  }
  cachedUrls[Number(id)] = URL.createObjectURL(blob);
  return cachedUrls[Number(id)];
};

export const getFrameBlob = async (id) => {
  await db.open();
  const frame = await db.frames.get(Number(id));
  if (!frame) {
    return null;
  }
  const blob = new Blob([frame.buffer], { type: 'image/jpeg' });
  if (!blob) {
    return null;
  }
  return blob;
};
