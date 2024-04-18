import resizeToFit from 'intrinsic-scale';

const generateFakeFrame = (resolution, format) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const height = resolution?.height || 1;
    const width = resolution?.width || 1;
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

const ExportFrame = (
  link,
  resolution = null, // {width, height}
  format = null, // png | jpg | webp
  mode = 'cover' // cover | contain
) =>
  new Promise((resolve) => {
    // Note: We could have directly returned the blob content here if
    // there were no changes to be made, but the case of corrupted
    // images would not have been handled. This is why all images are
    // loaded and, depending on the case, returned

    const imgObj = new Image();
    imgObj.onerror = () => {
      return resolve(generateFakeFrame(resolution, format));
    };
    imgObj.onload = function () {
      // Shortcut
      if (resolution == null && format === null) {
        return fetch(link)
          .then((e) => resolve(e.blob()))
          .catch(() => resolve(generateFakeFrame(resolution, format)));
      }

      const canvas = document.createElement('canvas');
      const height = resolution?.height || this.naturalHeight;
      const width = resolution?.width || this.naturalWidth;
      canvas.height = height;
      canvas.width = width;
      const { width: outWidth, height: outHeight, x: outX, y: outY } = resizeToFit(mode, { width: this.naturalWidth, height: this.naturalHeight }, { width, height });
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(imgObj, 0, 0, this.naturalWidth, this.naturalHeight, outX, outY, outWidth, outHeight);
      canvas.toBlob(
        (blob) => {
          return resolve(blob);
        },
        `image/${(format || 'png').replace('jpg', 'jpeg')}`,
        1
      );
    };
    imgObj.src = link;
  });

const GetFrameResolution = (link) =>
  new Promise((resolve) => {
    const imgObj = new Image();
    imgObj.onerror = () => {
      return resolve(null);
    };
    imgObj.onload = function () {
      return resolve({ height: this.naturalHeight, width: this.naturalWidth });
    };
    imgObj.src = link;
  });

export const GetResolutions = async (frames) => {
  const resolutions = await Promise.all(frames.filter((frame) => !frame.deleted).map((frame) => GetFrameResolution(frame.link)));
  let outputResolution = null;
  for (const resolution of resolutions) {
    if (!resolution) {
      continue;
    }
    if (!outputResolution || resolution.height > outputResolution.height) {
      outputResolution = resolution;
    }
  }
  return outputResolution;
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

  let resolution = opts.resolution;

  if (!resolution) {
    resolution = await GetResolutions(files);
  }

  // For video export, it's required to fix unpair resolutions
  if (resolution && resolution.width % 2 !== 0) {
    resolution.width += 1;
  }
  if (resolution && resolution.height % 2 !== 0) {
    resolution.height += 1;
  }

  if (!resolution) {
    return [];
  }

  console.log(`🤖 Exporting frames in ${resolution.width}x${resolution.height}`);

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

    frames.push({
      id: file.id,
      extension: computedExtension,
      mimeType: `image/${(computedExtension || 'jpg').replace('jpg', 'jpeg')}`,
      buffer: Buffer.from(await (await ExportFrame(file.link, opts.resolution, computedExtension, 'cover')).arrayBuffer()),
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
