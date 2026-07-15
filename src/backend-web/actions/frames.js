import { extensionToMimeType } from '@core/frameTypes';
import { v4 as uuidv4 } from 'uuid';

import { createDbAccessor } from './db';

async function upgrade(db, oldVersion, newVersion, tx) {
  if (!db.objectStoreNames.contains('framesById')) {
    db.createObjectStore('framesById', { keyPath: 'id' });
  }

  // Remove the legacy `frames` store. Older builds copied it into `framesById`
  // but never deleted it, so every image blob was stored twice on disk —
  // doubling IndexedDB usage until the storage quota was exceeded and the app
  // could no longer open (issue #584). Copy anything not yet migrated (a user
  // still on the very old schema), then drop the store to reclaim the space.
  if (db.objectStoreNames.contains('frames')) {
    const target = tx.objectStore('framesById');
    const source = tx.objectStore('frames');
    const alreadyMigrated = (await target.count()) > 0;
    if (!alreadyMigrated) {
      // Stream with a cursor so only one blob is ever held in memory at a time.
      let cursor = await source.openCursor();
      while (cursor) {
        const frame = cursor.value;
        await target.put({
          id: frame?.id != null ? String(frame.id) : uuidv4(),
          buffer: frame?.buffer ?? frame?.blob,
          extension: frame?.extension,
        });
        cursor = await cursor.continue();
      }
    }
    //db.deleteObjectStore('frames');
  }
}

// Upgrade whenever the target store is missing or the duplicated legacy `frames`
// store still exists (issue #584). After the one-time cleanup neither is true.
const getDB = createDbAccessor('BlobFramesDatabase', {
  needsUpgrade: (db) => !db.objectStoreNames.contains('framesById') || db.objectStoreNames.contains('frames'),
  upgrade,
});

export const createFrame = async (buffer, extension) => {
  const db = await getDB();
  const id = uuidv4();
  await db.put('framesById', { id, buffer, extension });
  return id;
};

export const getFrameBlob = async (id) => {
  const db = await getDB();
  const frame = await db.get('framesById', String(id));
  if (!frame) {
    return null;
  }
  return new Blob([frame.buffer], { type: extensionToMimeType(frame?.extension) });
};
