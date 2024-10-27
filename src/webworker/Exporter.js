import resizeToFit from 'intrinsic-scale';

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

export const loadImageBitmap = async (link) => {
  const resp = await fetch(link);
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

export const GetFrameResolution = async (link) => {
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
