import { parseResizeArguments } from '@common/resizer';
import resizeToFit from 'intrinsic-scale';

import { getFrameBlob } from './actions/frames';

console.log('🥷 Service Worker loaded! (Type=Web)');

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

const loadImageToCanvas = async (blob) => {
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return { width, height, img: canvas };
};

const GetFrameResolution = async (blob) => {
  const bmp = await createImageBitmap(blob);
  return { width: bmp.width, height: bmp.height };
};

const ExportFrame = async (
  blob,
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
    data = await loadImageToCanvas(blob);
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

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Catch special routes
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/pictures/')) {
    event.respondWith(
      (async () => {
        try {
          // Parse id and args
          const frameId = url.pathname.split('/api/pictures/')[1].split('/')[0];
          const { w, h, m, f, q, i } = parseResizeArguments(url.searchParams);

          // Get original frame blob
          const blob = await getFrameBlob(frameId);

          // If no transformation needed, return original blob
          if (!w && !h && !m && !f && !q && !i) {
            return new Response(blob, { headers: { 'Content-Type': blob.type } });
          }

          // Metadata only
          if (i === 'json') {
            const size = await GetFrameResolution(blob);
            return new Response(
              JSON.stringify({
                width: size.width,
                height: size.height,
              }),
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'public, max-age=31536000',
                },
              }
            );
          }

          // Resize and/or convert the image using WebWorker
          const resizedBlob = await ExportFrame(blob, { width: w, height: h }, f || 'jpg', m || 'cover');

          // Return request
          return new Response(resizedBlob, {
            headers: {
              'Content-Type': resizedBlob.type,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        } catch (err) {
          console.error('Service Worker Error:', err);
          return new Response(JSON.stringify({ message: 'Service Worker Error' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      })()
    );
  }
});
