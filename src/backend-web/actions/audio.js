import Dexie from 'dexie';

class AudioDatabase extends Dexie {
  constructor() {
    super('AudioDatabase');
    this.version(1).stores({
      audio: 'id,buffer,extension',
    });
  }
}

const db = new AudioDatabase();
const openedDb = db.open();
const audioTable = () => db.table('audio');

// Store an imported audio file. The row key (`id`) is the chunk `src`, so that
// lookups mirror the Electron filesystem (where `src` is the filename).
export const createAudio = async (buffer, extension) => {
  await openedDb;
  const src = `${crypto.randomUUID()}.${extension}`;
  await audioTable().put({ id: src, buffer, extension });
  return src;
};

export const getAudioBuffer = async (src) => {
  await openedDb;
  const row = await audioTable().get(String(src));
  return row?.buffer || null;
};
