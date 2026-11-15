import { join } from 'node:path';

import { UPLOAD_RETRIES, uploadFile } from './api';
import { getSyncList, saveSyncList } from './export';

const PROGRESS_THROTTLE_MS = 200;

// Live upload state, not persisted: { [fileName]: { status, attempt, uploadedBytes, totalBytes } }
const liveState = {};
let isSyncing = false;
let syncRequested = false;

// Re-read the list before saving so items appended during an upload are not lost
const updateSyncItem = async (path, fileName, patch, send) => {
  const list = await getSyncList(path);
  await saveSyncList(
    path,
    list.map((item) => (item.fileName === fileName ? { ...item, ...patch } : item))
  );
  send('SYNC_LIST_UPDATED', { fileName });
};

const withLiveState = (item) => ({
  retries: 0,
  maxAttempts: UPLOAD_RETRIES,
  ...item,
  ...(item.isUploaded ? {} : liveState[item.fileName] || {}),
});

export const getSyncListWithState = async (path) => {
  const list = await getSyncList(path);
  return list.map(withLiveState);
};

const syncItem = async (path, item, send) => {
  const { fileName } = item;
  let retries = item.retries || 0;
  let lastProgressAt = 0;

  const emit = (state, force = false) => {
    liveState[fileName] = { ...liveState[fileName], ...state };
    const now = Date.now();
    if (force || now - lastProgressAt >= PROGRESS_THROTTLE_MS) {
      lastProgressAt = now;
      send('SYNC_PROGRESS', { fileName, retries, maxAttempts: UPLOAD_RETRIES, ...liveState[fileName] });
    }
  };

  try {
    console.log(`☁️ Sync start ${item.publicCode} (${item.apiKey})`);
    await uploadFile({
      sendMethod: item.sendMethod,
      endpoint: item.apiEndpoint,
      apiKey: item.apiKey,
      code: item.publicCode,
      email: item.email,
      fileExtension: item.fileExtension,
      filePath: join(path, '/.sync/', fileName),
      onAttempt: (attempt) => emit({ status: 'uploading', attempt, uploadedBytes: 0, error: null }, true),
      onProgress: (uploadedBytes, totalBytes) => emit({ uploadedBytes, totalBytes }, uploadedBytes === totalBytes),
      onError: async (err, attempt) => {
        retries += 1;
        const error = err?.message || String(err);
        emit({ status: attempt < UPLOAD_RETRIES ? 'retrying' : 'error', error }, true);
        await updateSyncItem(path, fileName, { retries, lastError: error }, send);
      },
    });
    delete liveState[fileName];
    send('SYNC_PROGRESS', { fileName, retries, isUploaded: true, status: 'uploaded' });
    await updateSyncItem(path, fileName, { isUploaded: true, lastError: null }, send);
    console.log(`✅ Sync finished ${item.publicCode} (${item.apiKey})`);
  } catch (err) {
    console.log(`❌ Sync failed ${item.publicCode} (${item.apiKey})`, err);
  }
};

export const runSync = async (path, send = () => {}) => {
  // Calls during a running sync are merged into one extra pass
  if (isSyncing) {
    syncRequested = true;
    return;
  }
  isSyncing = true;
  try {
    do {
      syncRequested = false;
      const list = await getSyncList(path);
      for (const item of list.filter((e) => !e.isUploaded)) {
        await syncItem(path, item, send);
      }
    } while (syncRequested);
  } finally {
    isSyncing = false;
  }
};
