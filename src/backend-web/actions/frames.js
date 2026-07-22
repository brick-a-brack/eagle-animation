import { extensionToMimeType } from '@core/frameTypes';
import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// One-shot migration: rewrite every legacy `buffer` frame as a `Blob` frame, in
// small batches so we never pull the whole image library into RAM at once (same
// reasoning as the v3 migration / issue #584). Rows already stored as a Blob are
// kept as-is, so a DB whose conversion was interrupted still finishes cleanly.
const migrateBuffersToBlobs = async (tx) => {
  const MIGRATION_BATCH_SIZE = 4;
  const table = tx.table('framesById');
  const keys = await table.toCollection().primaryKeys();
  for (let i = 0; i < keys.length; i += MIGRATION_BATCH_SIZE) {
    const batch = await table.bulkGet(keys.slice(i, i + MIGRATION_BATCH_SIZE));
    await table.bulkPut(
      batch.filter(Boolean).map((frame) => ({
        id: frame.id,
        extension: frame.extension,
        blob: frame.blob instanceof Blob ? frame.blob : new Blob([frame.buffer], { type: extensionToMimeType(frame.extension) }),
      }))
    );
  }
};

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
      });
    // Drop the useless indexes on `buffer` and `extension`: frames are only ever
    // read/written by their primary key `id`, so indexing them wasted storage —
    // the `buffer` index in particular duplicated every full image blob into the
    // index, bloating IndexedDB and worsening the memory pressure of issue #584.
    // The primary key is unchanged, so Dexie re-indexes existing rows automatically.
    this.version(4).stores({
      framesById: 'id',
    });
    this.version(5).stores({
      framesById: 'id',
    });
    // Store frames as Blobs instead of raw buffers (Uint8Array/ArrayBuffer):
    // browsers persist Blobs as out-of-line file references instead of
    // structured-cloning the bytes into the record, which is cheaper and avoids
    // the known IndexedDB issues with large binary buffers. Schema (indexes) is
    // unchanged; the upgrade just converts every frame from a buffer to a Blob.
    this.version(6)
      .stores({
        framesById: 'id',
      })
      .upgrade(migrateBuffersToBlobs);
  }
}

const db = new BlobFramesDatabase();
const openedDb = db.open();
const framesTable = () => db.table('framesById');

export const createFrame = async (buffer, extension) => {
  await openedDb;
  const id = uuidv4();
  const blob = new Blob([buffer], { type: extensionToMimeType(extension) });
  await framesTable().put({ id, blob, extension });
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
  if (!frame?.blob) {
    return null;
  }
  cachedUrls[frameId] = URL.createObjectURL(frame.blob);
  return cachedUrls[frameId];
};

export const getFrameBlob = async (id) => {
  const frameId = String(id);
  await openedDb;
  const frame = await framesTable().get(frameId);
  return frame?.blob || null;
};
