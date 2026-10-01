import { parseResizeArguments } from '@common/resizer';
import { extensionToMimeType, mimeTypeToExtension } from '@core/frameTypes';
import resizeToFit from 'intrinsic-scale';

import { getFrameBlob } from './actions/frames';

console.log('🥷 Service Worker loaded! (Type=Web)');

// Versioned cache for resized/converted images and metadata. The output for a
// given (frameId + resize params) is immutable — frames are never physically
// mutated on the web (a re-shoot gets a new UUID), so a cached entry never goes
// stale and needs no invalidation. Bump the version to discard everything at
// once if the resize logic ever changes.
const RESIZE_CACHE_NAME = 'ea-resized-v1';

// Bound the number of frames decoded concurrently. Each createImageBitmap on a
// large frame allocates an uncompressed bitmap (width × height × 4 bytes —
// ~33 MB for a 4K frame, ~96 MB for a 24 MP DSLR frame). The browser dispatches
// every visible <img> request at once (a project grid, a 600-frame timeline…),
// so without a gate the Service Worker would decode dozens simultaneously and
// blow past the device's RAM — the out-of-memory crash of issue #584. Limiting
// to a few at a time turns peak memory from O(number of frames) into O(this).
const MAX_CONCURRENT_DECODES = 2;
let activeDecodes = 0;
const decodeQueue = [];
const acquireDecodeSlot = () =>
  new Promise((resolve) => {
    if (activeDecodes < MAX_CONCURRENT_DECODES) {
      activeDecodes++;
      resolve();
    } else {
      decodeQueue.push(resolve);
    }
  });
const releaseDecodeSlot = () => {
  activeDecodes--;
  const next = decodeQueue.shift();
  if (next) {
    activeDecodes++;
    next();
  }
};

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

// Decode the source straight into an ImageBitmap and hand it back for a single
// draw into the (small) output canvas. We deliberately do NOT copy it into a
// full-resolution OffscreenCanvas first: that intermediate copy doubled the
// peak memory of every resize, which on very large frames (4K/DSLR) was a
// primary contributor to the out-of-memory crashes of issue #584. The caller
// closes the bitmap once it has drawn it.
const loadImageToCanvas = async (blob) => {
  const bmp = await createImageBitmap(blob);
  return { width: bmp.width, height: bmp.height, img: bmp };
};

const GetFrameResolution = async (blob) => {
  const bmp = await createImageBitmap(blob);
  const { width, height } = bmp;
  // Release the full-resolution pixels immediately — we only needed the size.
  bmp.close();
  return { width, height };
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
  let isFallback = false;
  try {
    data = await loadImageToCanvas(blob);
  } catch (err) {
    data = await generateFakeFrame(resolution);
    isFallback = true;
  }
  const { width: naturalWidth, height: naturalHeight, img } = data;

  const initialRatio = naturalWidth / naturalHeight;
  const height = (resolution?.height === null && resolution?.width ? Math.round(resolution?.width / initialRatio) : resolution?.height) || naturalHeight;
  const width = (resolution?.width === null && resolution?.height ? Math.round(resolution?.height * initialRatio) : resolution?.width) || naturalWidth;
  const canvas = new OffscreenCanvas(width, height);
  canvas.height = height;
  canvas.width = width;
  const { width: outWidth, height: outHeight, x: outX, y: outY } = resizeToFit(mode, { width: naturalWidth, height: naturalHeight }, { width, height });
  const ctx = canvas.getContext('2d', { alpha: format !== 'jpg' });
  ctx.fillStyle = format !== 'jpg' ? 'rgba(0,0,0,0)' : '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight, outX, outY, outWidth, outHeight);
  // Free the decoded source as soon as it is drawn so its (potentially huge)
  // uncompressed pixels are not held while convertToBlob re-encodes (issue #584).
  // The fallback path returns a plain canvas, which has no close().
  if (typeof img.close === 'function') img.close();
  const out = await canvas.convertToBlob({ type: extensionToMimeType(format || 'png') });
  // isFallback flags the black placeholder produced from a missing/corrupt frame:
  // callers must not cache it, so the frame can still recover once it exists.
  return { blob: out, isFallback };
};

const handlePictureRequest = async (request, url) => {
  try {
    // Parse id and args
    const frameId = url.pathname.split('/api/pictures/')[1].split('.')[0];
    const args = parseResizeArguments(url.searchParams);
    const { w, h, m, q, i, c } = args;
    let { f } = args;

    // If no transformation needed, return original blob (nothing to cache)
    if (!w && !h && !m && !f && !q && !i) {
      const blob = await getFrameBlob(frameId);
      return new Response(blob, { headers: { 'Content-Type': blob?.type } });
    }

    // Serve from the resize cache when caching is enabled (c flag). The request
    // URL already encodes frameId + every resize param, so it is the cache key —
    // a hit skips both the IndexedDB read and the OffscreenCanvas work.
    const cache = c ? await caches.open(RESIZE_CACHE_NAME) : null;
    if (cache) {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }

    // Everything below decodes the full-resolution frame, so it runs behind the
    // concurrency gate to bound peak RAM (see MAX_CONCURRENT_DECODES / #584).
    // The raw passthrough and cache-hit paths above stay ungated — they are
    // cheap and must not queue behind heavy decodes.
    await acquireDecodeSlot();
    try {
      // Get original frame blob
      const blob = await getFrameBlob(frameId);

      // Metadata only
      if (i === 'json') {
        const size = await GetFrameResolution(blob);
        const response = new Response(
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
        if (cache) {
          await cache.put(request, response.clone());
        }
        return response;
      }

      // Format not specified
      if (!f) {
        f = mimeTypeToExtension(blob?.type || 'image/jpeg');
      }

      // Resize and/or convert the image using WebWorker
      const { blob: resizedBlob, isFallback } = await ExportFrame(blob, { width: w, height: h }, f || 'jpg', m || 'cover');

      // Build response
      const response = new Response(resizedBlob, {
        headers: {
          'Content-Type': resizedBlob.type,
          'Cache-Control': 'public, max-age=31536000',
        },
      });

      // Persist real frames only — never the black fallback placeholder
      if (cache && !isFallback) {
        await cache.put(request, response.clone());
      }

      return response;
    } finally {
      releaseDecodeSlot();
    }
  } catch (err) {
    console.error('Service Worker Error:', err);
    return new Response(JSON.stringify({ message: 'Service Worker Error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop stale resize caches from previous versions to reclaim their quota
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('ea-resized-') && key !== RESIZE_CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Catch special routes
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/pictures/')) {
    event.respondWith(handlePictureRequest(event.request, url));
  }
});
