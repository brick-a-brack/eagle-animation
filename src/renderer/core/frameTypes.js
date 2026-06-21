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
  if (parsedMime === 'audio/mpeg' || parsedMime === 'audio/mp3') {
    return 'mp3';
  }
  if (parsedMime === 'audio/wav' || parsedMime === 'audio/x-wav' || parsedMime === 'audio/wave') {
    return 'wav';
  }
  if (parsedMime === 'audio/ogg' || parsedMime === 'application/ogg') {
    return 'ogg';
  }
  if (parsedMime === 'audio/aac') {
    return 'aac';
  }
  if (parsedMime === 'audio/mp4' || parsedMime === 'audio/x-m4a' || parsedMime === 'audio/m4a') {
    return 'm4a';
  }
  if (parsedMime === 'audio/flac' || parsedMime === 'audio/x-flac') {
    return 'flac';
  }
  if (parsedMime === 'audio/webm') {
    return 'weba';
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
  if (parsedExt === 'mp3') {
    return 'audio/mpeg';
  }
  if (parsedExt === 'wav') {
    return 'audio/wav';
  }
  if (parsedExt === 'ogg') {
    return 'audio/ogg';
  }
  if (parsedExt === 'aac') {
    return 'audio/aac';
  }
  if (parsedExt === 'm4a') {
    return 'audio/mp4';
  }
  if (parsedExt === 'flac') {
    return 'audio/flac';
  }
  if (parsedExt === 'weba') {
    return 'audio/webm';
  }
  return 'application/octet-stream';
};
