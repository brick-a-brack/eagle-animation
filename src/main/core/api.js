import fs from 'node:fs';

import { APP_NAME, VERSION } from '../config';
import { readFile } from 'node:fs/promises';

/*
    This file contains Brickfilms.com endpoints that are used to send the brickfilm by email
    for Brickfilm Workshop organized by Brick à Brack.
    You must have a API key to use this feature, it can be configured in Eagle Animation settings
*/

const RETRIES = 3; // Infinity

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const retry = async (callback, options = {}) => {
  const { retries, delay, onError = () => {} } = options;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await callback();
      return result;
    } catch (err) {
      onError(err);
      if (attempt === retries) {
        throw err;
      }
    }
    await wait(delay * attempt);
  }
};

const getFormLength = (form) => {
  return new Promise((resolve) => {
    form.getLength((err, length) => {
      if (err) {
        return resolve(null);
      }
      return resolve(length);
    });
  });
};

export const uploadFile = async ({ sendMethod, endpoint, apiKey, code, email, fileExtension, filePath }) => {
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

  // Send HTTP call with retry
  const res = await retry(
    async () => {
      const r = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'X-App-Name': APP_NAME,
          'X-App-Version': VERSION,
        },
        body: form,
      });

      // Error handling
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        const err = new Error(`Upload failed: ${r.status} ${r.statusText}${text ? ' - ' + text : ''}`);
        err.status = r.status;
        err.statusText = r.statusText;
        err.body = text;
        throw err;
      }

      // Return JSON or raw text based on content response type
      const ct = r.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return r.json();
      }
      return r.text();
    },
    {
      retries: RETRIES,
      delay: 2000,
    }
  );

  return res;
};
