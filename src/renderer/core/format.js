// Format a size (in bytes) as a human readable string (e.g. "0 B", "1.5 MB", "1.02 GB")
export const formatFileSize = (bytes) => {
  const total = Math.max(0, Number(bytes) || 0);
  if (total === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(total) / Math.log(k)), sizes.length - 1);
  return `${Math.round((total / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};

// Format a duration (in seconds) as a compact human readable string (e.g. "1m 57s", "2h 3m", "12s")
export const formatDuration = (seconds, t) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const args = { hours: h, minutes: m, seconds: s };

  if (h > 0) {
    return t('{{hours}}h{{minutes}}', args);
  }
  if (m > 0) {
    return t('{{minutes}}m', args);
  }
  return t('{{seconds}}s', args);
};

// Format a duration (in seconds) as a timecode (e.g. "00:12", "01:57", "1:02:03")
export const formatTimecode = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
};

const RELATIVE_UNITS = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
];

// Format an epoch timestamp (in seconds) as a localized relative time (e.g. "3 days ago")
export const formatRelativeTime = (timestamp, locale = 'en') => {
  if (!timestamp) {
    return '';
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const diff = timestamp - nowSeconds; // negative for past

  let formatter;
  try {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  } catch (err) {
    formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  }

  const absDiff = Math.abs(diff);
  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (absDiff >= seconds) {
      return formatter.format(Math.round(diff / seconds), unit);
    }
  }
  return formatter.format(Math.round(diff), 'second');
};
