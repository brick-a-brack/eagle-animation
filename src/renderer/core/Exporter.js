import resizeToFit from 'intrinsic-scale';

import { Buffer } from 'buffer';

const generateFakeFrame = (resolution, format) =>
  new Promise((resolve) => {
    //const canvas = document.createElement('canvas');
    const height = resolution?.height || 1;
    const width = resolution?.width || 1;
    const canvas = new OffscreenCanvas(width, height);
    canvas.height = height;
    canvas.width = width;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        return resolve(blob);
      },
      `image/${(format || 'png').replace('jpg', 'jpeg')}`,
      1
    );
  });

export const loadImageToCanvas = async (link) => {
  const resp = await fetch(link);
  if (!resp.ok) {
    throw 'network error';
  }
  const blob = await resp.blob();
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  //const imgObj = ctx.getImageData(0, 0, width, height);
  return { width, height, img: canvas };
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
  // loaded and, depending on the case, returned

  const { width: naturalWidth, height: naturalHeight, img } = await loadImageToCanvas(link);

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
  console.log('YOLOOOO')

return canvas.convertToBlob(  { type:`image/${(format || 'png').replace('jpg', 'jpeg')}` });
};

const GetFrameResolution = async (link) => {
  const resp = await fetch(link);
  if (!resp.ok) {
    throw 'network error';
  }
  const blob = await resp.blob();
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  return { width, height };
};

export const GetBestResolution = async (frames, ratio = null) => {
  if (!frames || frames.length === 0) {
    return null;
  }
  const resolutions = await Promise.all(frames.filter((frame) => !frame.deleted && !frame.hidden).map((frame) => GetFrameResolution(frame.link)));
  let outputResolution = null;
  for (const resolution of resolutions) {
    if (!resolution) {
      continue;
    }
    if (!outputResolution || resolution.height > outputResolution.height) {
      outputResolution = resolution;
    }
  }
  if (ratio !== null) {
    const containedResolution = resizeToFit('contain', { width: ratio, height: 1 }, outputResolution);
    return { width: containedResolution.width, height: containedResolution.height };
  }

  return outputResolution;
};

export const floorResolutionValue = (v) => (v ? (Math.floor(v) % 2 !== 0 ? Math.floor(v) + 1 : Math.floor(v)) : v);
export const floorResolution = (v) => (v ? { width: v.width ? floorResolutionValue(v.width) : v.width, height: v.height ? floorResolutionValue(v.height) : v.height } : v);

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

console.log('frameBlob', frameBlob)

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
