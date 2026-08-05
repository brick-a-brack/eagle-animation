import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import url from 'node:url';

import { net } from 'electron';
import sharp from 'sharp';

import { parseResizeArguments } from '../../common/resizer';
import { PROJECTS_PATH } from '../config';

const getUniqueCacheKey = ({ w, h, m, q, i, f, path }) => {
  let key = '';
  if (path) key += `${path}_`;
  if (w) key += `w${w}_`;
  if (h) key += `h${h}_`;
  if (m) key += `m${m}_`;
  if (q) key += `q${q}_`;
  if (i) key += `i${i}_`;
  if (f) key += `f${f}_`;
  return createHash('sha256').update(key).digest('hex');
};

const getCachePath = (cacheKey) => join(PROJECTS_PATH, '.cache', cacheKey.slice(0, 2), `${cacheKey.slice(2)}.bin`);

const encodeCachedImage = (mimeType, data) => {
  const mimeTypeBuffer = Buffer.from(mimeType, 'utf8');
  const header = Buffer.allocUnsafe(4);
  header.writeUInt32BE(mimeTypeBuffer.length, 0);
  return Buffer.concat([header, mimeTypeBuffer, data]);
};

const decodeCachedImage = (buffer) => {
  if (buffer.length < 4) return null;

  const mimeTypeLength = buffer.readUInt32BE(0);
  const mimeTypeEnd = 4 + mimeTypeLength;
  if (buffer.length < mimeTypeEnd) return null;

  const mimeType = buffer.subarray(4, mimeTypeEnd).toString('utf8');
  if (!mimeType) return null;

  const data = buffer.subarray(mimeTypeEnd);
  if (!data.length) return null;

  return { mimeType, data };
};

const pathExists = (filePath) =>
  stat(filePath)
    .then(() => true)
    .catch(() => false);

// Encode a Sharp instance to the requested format (defaults to JPEG).
const encodeImage = async (img, f, quality) => {
  if (f === 'png') return { data: await img.png({ quality }).toBuffer(), mimeType: 'image/png' };
  if (f === 'webp') return { data: await img.webp({ quality }).toBuffer(), mimeType: 'image/webp' };
  if (f === 'avif') return { data: await img.avif({ quality }).toBuffer(), mimeType: 'image/avif' };
  return { data: await img.jpeg({ quality }).toBuffer(), mimeType: 'image/jpeg' };
};

// Solid black placeholder, used when the source file cannot be decoded
// (missing, truncated or unsupported image format).
const createBlackImage = (width, height) =>
  sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

const writeCacheFile = async (cacheKey, mimeType, data) => {
  try {
    await mkdir(join(PROJECTS_PATH, '.cache', cacheKey.slice(0, 2)), { recursive: true });
    const cachedFile = getCachePath(cacheKey);
    await writeFile(cachedFile, encodeCachedImage(mimeType, data));
  } catch (err) {
    console.error('Error writing cache file:', err);
  }
};

export const ImageRoute = async (request) => {
  // Parse URL and parameters
  const urlObj = new URL(request.url);

  // Get disk path
  const filePath = request.url.slice('ea://api/pictures/'.length).split('?')[0];
  const diskPath = `${PROJECTS_PATH}/${filePath}`;

  // Options
  const args = parseResizeArguments(urlObj.searchParams);
  const { w, h, m, q, i, c } = args;
  let { f } = args;

  // Get cache key
  const cacheKey = getUniqueCacheKey({ ...args, path: filePath });
  const cachedFile = getCachePath(cacheKey);

  // No changes needed
  if (!w && !h && !f && !q && !m && !i) {
    return net.fetch(url.pathToFileURL(diskPath).toString());
  }

  // Use cached data if available
  if (c && (await pathExists(cachedFile))) {
    const cachedBuffer = await readFile(cachedFile);
    const cachedImage = decodeCachedImage(cachedBuffer);
    if (cachedImage) {
      return new Response(cachedImage.data, {
        headers: {
          'content-type': cachedImage.mimeType,
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  }

  try {
    // Create a Sharp instance
    const inputBuf = await readFile(diskPath);
    let img = sharp(inputBuf);

    // Metadata only
    if (i === 'json') {
      // Get image metadata
      const size = await img.metadata();
      const infos = JSON.stringify({
        width: size.width,
        height: size.height,
      });

      // Write to disk cache
      if (c) {
        await writeCacheFile(cacheKey, 'application/json', Buffer.from(infos, 'utf8'));
      }

      // Send data
      return new Response(infos, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // Resize
    if (w || h) {
      img = img.resize(w ? parseInt(w, 10) : null, h ? parseInt(h, 10) : null, {
        fit: m === 'cover' ? 'cover' : 'contain',
        withoutEnlargement: false,
      });
    }

    // Determine previous format to reuse it
    if (!f) {
      const meta = await img.metadata();
      if (['png', 'webp', 'avif'].includes(meta?.format)) {
        f = meta?.format;
      }
    }

    // Format conversion
    const quality = q ? parseInt(q, 10) : 80;
    const { data: outputBuffer, mimeType } = await encodeImage(img, f, quality);

    // Write to disk cache
    if (c) {
      await writeCacheFile(cacheKey, mimeType, outputBuffer);
    }

    return new Response(outputBuffer, {
      headers: {
        'content-type': mimeType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (err) {
    // Don't log the expected "unsupported image format" case: it happens for
    // files still being written and would flood the logs. Log anything else.
    if (!`${err?.message || ''}`.includes('unsupported image format')) {
      console.error('ea handler error', err);
    }

    // The source file could not be decoded (missing, truncated or unsupported
    // format). Serve a black placeholder so the app keeps working instead of a
    // broken image. Not cached, so it self-heals once the file becomes valid.
    const width = w ? parseInt(w, 10) : 1280;
    const height = h ? parseInt(h, 10) : 720;

    if (i === 'json') {
      return new Response(JSON.stringify({ width, height }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    try {
      const quality = q ? parseInt(q, 10) : 80;
      const { data, mimeType } = await encodeImage(createBlackImage(width, height), f, quality);
      return new Response(data, {
        headers: { 'content-type': mimeType, 'Cache-Control': 'no-store' },
      });
    } catch (fallbackErr) {
      console.error('ea handler fallback error', fallbackErr);
      return new Response(null, { status: 500 });
    }
  }
};
