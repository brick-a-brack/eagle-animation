import { readFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';

import { APP_NAME, VERSION } from '../config';

/*
    This file contains Brickfilms.com endpoints that are used to send the brickfilm by email
    for Brickfilm Workshop organized by Brick à Brack.
    You must have a API key to use this feature, it can be configured in Eagle Animation settings
*/

export const UPLOAD_RETRIES = 3; // Infinity
const CHUNK_SIZE = 64 * 1024;

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const retry = async (callback, options = {}) => {
  const { retries, delay, onAttempt = () => {}, onError = () => {} } = options;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      onAttempt(attempt);
      const result = await callback();
      return result;
    } catch (err) {
      await onError(err, attempt);
      if (attempt === retries) {
        throw err;
      }
    }
    await wait(delay * attempt);
  }
};

// fetch() can't report upload progress, so the body is written by chunks through node:http(s)
const putWithProgress = (endpoint, headers, body, onProgress) =>
  new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, { method: 'PUT', headers: { ...headers, 'Content-Length': body.length } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => resolve({ status: res.statusCode, statusText: res.statusMessage, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);

    let written = 0;
    let flushed = 0;
    const writeNext = () => {
      while (written < body.length) {
        const chunk = body.subarray(written, written + CHUNK_SIZE);
        written += chunk.length;
        const canContinue = req.write(chunk, () => {
          flushed += chunk.length;
          onProgress(flushed, body.length);
        });
        if (!canContinue) {
          req.once('drain', writeNext);
          return;
        }
      }
      req.end();
    };
    writeNext();
  });

export const uploadFile = async ({ sendMethod, endpoint, apiKey, code, email, fileExtension, filePath, onProgress = () => {}, onAttempt = () => {}, onError = () => {} }) => {
  // Prepare file data
  const fileBuffer = await readFile(filePath);
  const fileBlob = new Blob([fileBuffer]);

  // Prepare form data
  const form = new FormData();
  form.append('mode', sendMethod);
  form.append('code', code || '');
  form.append('email', email || '');
  form.append('fileExtension', fileExtension);
  form.append('file', fileBlob, `video.${fileExtension}`);

  // Serialize multipart body once to know its exact size
  const serialized = new Response(form);
  const contentType = serialized.headers.get('content-type');
  const body = Buffer.from(await serialized.arrayBuffer());

  // Send HTTP call with retry
  const res = await retry(
    async () => {
      onProgress(0, body.length);
      const r = await putWithProgress(
        endpoint,
        {
          'Content-Type': contentType,
          Authorization: `Bearer ${apiKey.trim()}`,
          'X-App-Name': APP_NAME,
          'X-App-Version': VERSION,
        },
        body,
        onProgress
      );

      // Error handling
      if (r.status < 200 || r.status >= 300) {
        const err = new Error(`Upload failed: ${r.status} ${r.statusText}${r.text ? ' - ' + r.text : ''}`);
        err.status = r.status;
        err.statusText = r.statusText;
        err.body = r.text;
        throw err;
      }

      // Return JSON or raw text based on content response type
      const ct = r.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        return JSON.parse(r.text);
      }
      return r.text;
    },
    {
      retries: UPLOAD_RETRIES,
      delay: 2000,
      onAttempt,
      onError,
    }
  );

  return res;
};
