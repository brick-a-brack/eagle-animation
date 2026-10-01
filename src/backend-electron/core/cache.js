import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { session } from 'electron';

import { RESIZER_CACHE_PATH } from '../config';

// Recursively sum the size of every file in a directory. A missing directory
// (nothing cached yet) counts as 0.
const getDirectorySize = async (directory) => {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return 0;
  }

  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) return getDirectorySize(entryPath);
      try {
        const infos = await stat(entryPath);
        return infos.size;
      } catch {
        return 0;
      }
    })
  );

  return sizes.reduce((total, size) => total + size, 0);
};

// Total cache size in bytes: resizer disk cache + Chromium HTTP cache.
// getCacheSize() only reports the HTTP cache, the code and GPU caches it leaves
// out weigh a couple of megabytes at most.
export const getCacheSize = async () => {
  const [resizerSize, chromiumSize] = await Promise.all([getDirectorySize(RESIZER_CACHE_PATH), session.defaultSession.getCacheSize().catch(() => 0)]);
  return resizerSize + chromiumSize;
};

// Wipe the resizer disk cache and every Chromium cache we can reach. Storage
// (localStorage, IndexedDB, cookies) is left untouched on purpose: the app
// language lives in localStorage.
export const clearCache = async () => {
  await Promise.all([
    rm(RESIZER_CACHE_PATH, { recursive: true, force: true }).catch((err) => {
      console.error('Error clearing resizer cache:', err);
    }),
    session.defaultSession.clearCache().catch((err) => {
      console.error('Error clearing Chromium cache:', err);
    }),
    session.defaultSession.clearCodeCaches({ urls: [] }).catch((err) => {
      console.error('Error clearing Chromium code caches:', err);
    }),
  ]);
  return null;
};
