export * from '../config';

if (typeof document !== 'undefined' && document.URL.includes('utm_source=pwa')) {
  sessionStorage.setItem('isPWA', '1');
}

// App device: ELECTRON | WINDOWS | ANDROID | PWA | WEB
export const DEVICE = !document
  ? null
  : window.IPC
    ? 'ELECTRON'
    : document.URL.includes('ms-appx-web:///')
      ? 'WINDOWS'
      : !document.URL.includes('http://') && !document.URL.includes('https://')
        ? 'ANDROID'
        : sessionStorage.getItem('isPWA')
          ? 'PWA'
          : 'WEB';
export const REVISION = import.meta.env.VITE_COMMIT_HASH || 'local';

// Computes build tag
export const BUILD = `${DEVICE.toLowerCase()}-${REVISION.substring(0, 7)}`;

// Letters to generate a code
export const ALLOWED_LETTERS = 'ABCDEFGHJKLMNOPQRTUVWXYZ0123456789';
