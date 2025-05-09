export const isBlink = (v = null) => /Chrome\/[0-9.]+/.test(v || window?.navigator?.userAgent);
