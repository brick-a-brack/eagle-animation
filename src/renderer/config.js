export * from '../config';

if (typeof document !== 'undefined' && document.URL.includes('utm_source=pwa')) {
    sessionStorage.setItem('isPWA', '1');
}

// App device: ELECTRON | WINDOWS | ANDROID | PWA | WEB
export const DEVICE = !document ? null : window.isElectron ? 'ELECTRON' : (document.URL.includes('ms-appx-web:///')) ? 'WINDOWS' : (!document.URL.includes('http://') && !document.URL.includes('https://')) ? 'ANDROID' : sessionStorage.getItem('isPWA') ? 'PWA' : 'WEB';
export const REVISION = process.env.COMMIT_HASH || 'local';
export const PUBLIC_URL = process.env.PUBLIC_URL || '';

// Localhost detection
export const IS_LOCALHOST = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Computes build tag
export const BUILD = `${DEVICE.toLowerCase()}-${REVISION.substring(0, 7)}`;
