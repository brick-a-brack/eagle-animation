import { createDbAccessor } from './db';

// Scratch storage for export buffers, cleared after every export run. Because it
// holds no durable user data, the upgrade simply (re)sets the store to a plain
// `buffer_id`-keyed shape instead of migrating the old Dexie layout.
function upgrade(db) {
  if (db.objectStoreNames.contains('buffers')) {
    db.deleteObjectStore('buffers');
  }
  db.createObjectStore('buffers', { keyPath: 'buffer_id' });
}

// Upgrade when the store is missing, or still carries the old Dexie shape
// (auto-increment `id` keyPath) instead of our `buffer_id` keyPath.
const getDB = createDbAccessor('TemporaryBufferDatabase', {
  needsUpgrade: (db) => {
    if (!db.objectStoreNames.contains('buffers')) {
      return true;
    }
    try {
      return db.transaction('buffers').store.keyPath !== 'buffer_id';
    } catch {
      return true;
    }
  },
  upgrade,
});

export const createBuffer = async (bufferId, buffer) => {
  const db = await getDB();
  return db.put('buffers', { buffer_id: `${bufferId}`, buffer });
};

export const getBuffer = async (bufferId) => {
  const db = await getDB();
  const record = await db.get('buffers', `${bufferId}`);
  return record?.buffer ?? null;
};

export const flushBuffers = async () => {
  const db = await getDB();
  return db.clear('buffers');
};
