export const mimeTypeToExtension = (mimeType) => {
  const parsedMime = `${mimeType}`.toLowerCase().trim();
  if (parsedMime === 'image/jpeg' || parsedMime === 'image/jpg') {
    return 'jpg';
  }
  if (parsedMime === 'image/png') {
    return 'png';
  }
  if (parsedMime === 'image/webp') {
    return 'webp';
  }
  if (parsedMime === 'image/avif') {
    return 'avif';
  }
  if (parsedMime === 'image/svg') {
    return 'svg';
  }
  return 'dat';
};

export const extensionToMimeType = (ext) => {
  const parsedExt = `${ext}`.toLowerCase().trim();
  if (parsedExt === 'jpg' || parsedExt === 'jpeg') {
    return 'image/jpeg';
  }
  if (parsedExt === 'png') {
    return 'image/png';
  }
  if (parsedExt === 'webp') {
    return 'image/webp';
  }
  if (parsedExt === 'avif') {
    return 'image/avif';
  }
  if (parsedExt === 'svg') {
    return 'image/svg';
  }
  return 'application/octet-stream';
};
