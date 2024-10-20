import { Buffer } from 'buffer';
import resizeToFit from 'intrinsic-scale';

import { floorResolution, floorResolutionValue } from '../common/resolution';

const generateFakeFrame = async (resolution) => {
  const height = resolution?.height || 1;
  const width = resolution?.width || 1;
  const canvas = new OffscreenCanvas(width, height);
  canvas.height = height;
  canvas.width = width;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  return { width, height, img: canvas };
};

export const getBlobLink = (link) =>
  new Promise((resolve, reject) => {
    const handler = (e) => {
      if (e.data.event !== 'FETCH_CALLBACK') {
        return;
      }
      if (e.data.error) {
        removeEventListener('message', handler);
        return reject(e.data.error);
      }
      if (e.data.link === link) {
        removeEventListener('message', handler);
        return resolve(e.data.blobLink);
      }
    }
    addEventListener('message', handler);
    postMessage({ id: null, event: 'FETCH', data: { link } });
  });

export const loadImageBitmap = async (link) => {
  // It's not possible to load local file from web worker using electron
  // We ask the main thread to load the image and return the blob url
  const usableLink = !link.startsWith('blob:') ? await getBlobLink(link) : link;
  const resp = await fetch(usableLink);
  if (!resp.ok) {
    throw new Error('Network error');
  }
  const blob = await resp.blob();
  return createImageBitmap(blob);
};

export const loadImageToCanvas = async (link) => {
  const bmp = await loadImageBitmap(link);
  const { width, height } = bmp;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return { width, height, img: canvas };
};

const GetFrameResolution = async (link) => {
  const bmp = await loadImageBitmap(link);
  return { width: bmp.width, height: bmp.height };
};

export const ExportFrame = async (
  link,
  resolution = null, // {width, height}
  format = null, // png | jpg | webp
  mode = 'cover' // cover | contain
) => {
  // Note: We could have directly returned the blob content here if
  // there were no changes to be made, but the case of corrupted
  // images would not have been handled. This is why all images are
  // loaded and, depending on the case, return the frame or an empty one

  let data = null;
  try {
    data = await loadImageToCanvas(link);
  } catch (err) {
    data = await generateFakeFrame(resolution);
  }
  const { width: naturalWidth, height: naturalHeight, img } = data;

  const initialRatio = naturalWidth / naturalHeight;
  const height = (resolution?.height === null && resolution?.width ? Math.round(resolution?.width / initialRatio) : resolution?.height) || naturalHeight;
  const width = (resolution?.width === null && resolution?.height ? Math.round(resolution?.height * initialRatio) : resolution?.width) || naturalWidth;
  const canvas = new OffscreenCanvas(width, height);
  canvas.height = height;
  canvas.width = width;
  const { width: outWidth, height: outHeight, x: outX, y: outY } = resizeToFit(mode, { width: naturalWidth, height: naturalHeight }, { width, height });
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight, outX, outY, outWidth, outHeight);
  return canvas.convertToBlob({ type: `image/${(format || 'png').replace('jpg', 'jpeg')}` });
};

export const ExtractFramesResolutions = async (frames) => {
  if (!frames || frames.length === 0) {
    return [];
  }
  const resolutions = await Promise.all(frames.map((frame) => GetFrameResolution(frame.link).catch(() => null)));
  return resolutions;
};

export const ExportFrames = async (
  files = [],
  opts = {
    duplicateFramesCopy: true,
    duplicateFramesAuto: false,
    duplicateFramesAutoNumber: 1,
    forceFileExtension: undefined,
    resolution: null,
  },
  onProgress = () => {}
) => {
  const frames = [];

  const resolution = floorResolution(opts.resolution);

  console.log(`🤖 Exporting frames in ${resolution ? `${resolution.width || '(auto)'}x${resolution.height}` : 'original'}`);

  // Update progress
  if (typeof onProgress === 'function') {
    onProgress(0);
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.deleted || file.hidden) {
      continue;
    }
    const targetExtension = file.filename.split('.').pop() || 'jpg';
    const computedExtension = (typeof opts.forceFileExtension !== 'undefined' ? opts.forceFileExtension : targetExtension) || targetExtension;

    // If needed we calc the width based on frame ratio and defined height
    let copiedResolution = structuredClone(resolution);
    if (copiedResolution && !copiedResolution.width) {
      const frameResolution = await GetFrameResolution(file.link);
      copiedResolution.width = floorResolutionValue((copiedResolution.height * frameResolution.width) / frameResolution.height) || copiedResolution.height;
    }

    const frameBlob = await ExportFrame(file.link, copiedResolution, typeof opts.forceFileExtension !== 'undefined' ? computedExtension : undefined, 'cover');

    console.log('frameBlob', frameBlob);

    frames.push({
      id: file.id,
      length: file.length || 1,
      extension: computedExtension,
      mimeType: `image/${(computedExtension || 'jpg').replace('jpg', 'jpeg')}`,
      buffer: Buffer.from(await frameBlob.arrayBuffer()),
    });

    // Update progress
    if (typeof onProgress === 'function') {
      onProgress((i + 1) / files.length);
    }
  }

  // Update progress
  if (typeof onProgress === 'function') {
    onProgress(1);
  }

  const getNumberOfFrames = (frame, index) => {
    if (opts.duplicateFramesAuto && opts.duplicateFramesAutoNumber && (index === 0 || index === frames.length - 1)) {
      return Number(opts.duplicateFramesAutoNumber) + frame.length - 1;
    }
    return opts.duplicateFramesCopy ? frame.length : 1;
  };

  return frames?.reduce((acc, e, i) => [...acc, ...Array(getNumberOfFrames(e, i)).fill(e)], []).map((e, i) => ({ ...e, index: i }));
};
