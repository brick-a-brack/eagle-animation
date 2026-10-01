import Dexie from 'dexie';

class TemporaryBufferDatabase extends Dexie {
  constructor() {
    super('TemporaryBufferDatabase');
    this.version(1).stores({
      buffers: '++id,[buffer_id],buffer',
    });
    // Drop the useless index on `buffer`: buffers are only looked up by
    // `[buffer_id]` (see getBuffer), so indexing the full ArrayBuffer just
    // duplicated every export buffer into the index for nothing (see issue #584).
    // The primary key is unchanged, so Dexie only calls deleteIndex — no data reload.
    this.version(2).stores({
      buffers: '++id,[buffer_id]',
    });
  }
}

const db = new TemporaryBufferDatabase();
const openedDb = db.open();

export const createBuffer = async (bufferId, buffer) => {
  await openedDb;
  // The renderer hands us a Node Buffer; on the web we only ever store Blobs —
  // IndexedDB persists them more efficiently and safely than raw buffers.
  const blob = new Blob([buffer]);
  return db.buffers.add({ buffer_id: bufferId, blob });
};

export const getBuffer = async (bufferId) => {
  await openedDb;
  const entry = await db.buffers
    .where('[buffer_id]')
    .equals([`${bufferId}`])
    .first();
  // Returns a Blob; every consumer (JSZip, FileSystem API, `new Blob([...])`,
  // WebCodecs, ffmpeg.wasm) accepts a Blob directly.
  return entry?.blob || null;
};

export const flushBuffers = async () => {
  await openedDb;
  db.buffers.clear();
};
