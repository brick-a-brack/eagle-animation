export * from '../config';

// App device: ELECTRON | WEB
export const DEVICE = !document ? null : window.IPC ? 'ELECTRON' : 'WEB';

// Is the app running in development mode
export const IS_DEV = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1') || window.location.host.includes(':');

// Revision hash
export const REVISION = (IS_DEV ? 'local' : import.meta.env.VITE_COMMIT_HASH) || 'unknown';

// Computes build tag
export const BUILD = `${DEVICE.toLowerCase()}-${REVISION.substring(0, 7)}`;

// Letters to generate a code
export const ALLOWED_LETTERS = 'ABCDEFGHJKLMNPQRTVWXYZ0123456789'; // ISOU removed
