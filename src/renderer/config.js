export * from '../config';

// App device: ELECTRON | WEB
export const DEVICE = !document ? null : window.IPC ? 'ELECTRON' : 'WEB';

export const REVISION = import.meta.env.VITE_COMMIT_HASH || 'local';

// Computes build tag
export const BUILD = `${DEVICE.toLowerCase()}-${REVISION.substring(0, 7)}`;

// Letters to generate a code
export const ALLOWED_LETTERS = 'ABCDEFGHJKLMNPQRTVWXYZ0123456789'; // ISOU removed
