import { extensionToMimeType } from '@core/frameTypes';
import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

class BlobFramesDatabase extends Dexie {
  constructor() {
    console.log('Initializing BlobFramesDatabase');
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
        console.log('BlobFramesDatabase migration');
        // Migrate frame by frame in small batches: loading every buffer at once
        // (toArray()) would pull the whole image library into RAM and crash the
        // tab on large projects (see issue #584).
        const MIGRATION_BATCH_SIZE = 4;
        const source = tx.table('frames');
        const target = tx.table('framesById');
        // primaryKeys() only reads the ids, not the buffers, so it stays cheap.
        const keys = await source.toCollection().primaryKeys();
        for (let i = 0; i < keys.length; i += MIGRATION_BATCH_SIZE) {
          const batch = await source.bulkGet(keys.slice(i, i + MIGRATION_BATCH_SIZE));
          await target.bulkPut(
            batch.filter(Boolean).map((frame) => ({
              buffer: frame?.buffer || frame?.blob,
              extension: frame?.extension,
              id: frame?.id ? String(frame.id) : uuidv4(),
            }))
          );
        }
        console.log('BlobFramesDatabase migration ended');
      });
    // Drop the useless indexes on `buffer` and `extension`: frames are only ever
    // read/written by their primary key `id`, so indexing them wasted storage —
    // the `buffer` index in particular duplicated every full image blob into the
    // index, bloating IndexedDB and worsening the memory pressure of issue #584.
    // The primary key is unchanged, so Dexie re-indexes existing rows automatically.
    this.version(4).stores({
      framesById: 'id',
    });
    console.log('Initializing BlobFramesDatabase done');
  }
}

const db = new BlobFramesDatabase();
const openedDb = db.open();
const framesTable = () => db.table('framesById');

export const createFrame = async (buffer, extension) => {
  await openedDb;
  const id = uuidv4();
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
