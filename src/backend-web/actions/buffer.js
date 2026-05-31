import Dexie from 'dexie';

class TemporaryBufferDatabase extends Dexie {
  constructor() {
    super('TemporaryBufferDatabase');
    this.version(1).stores({
      buffers: '++id,[buffer_id],buffer',
    });
  }
}

const db = new TemporaryBufferDatabase();
const openedDb = db.open();

export const createBuffer = async (bufferId, buffer) => {
  await openedDb;
  return db.buffers.add({ buffer_id: bufferId, buffer });
};

export const getBuffer = async (bufferId) => {
  await openedDb;
  const buffer = await db.buffers
    .where('[buffer_id]')
    .equals([`${bufferId}`])
    .first();
  return buffer.buffer || null;
};

export const flushBuffers = async () => {
  await openedDb;
  db.buffers.clear();
};
