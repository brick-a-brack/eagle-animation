import fs from 'node:fs';
import path from 'node:path';

import FormData from 'form-data';
import fetch from 'node-fetch';

import { APP_NAME, PARTNER_API, VERSION } from '../config';

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

export const uploadFile = async (apiKey, code, fileExtension, filePath) => {
  // Prepare form data
  const form = new FormData();
  form.append('mode', 'code');
  form.append('code', code);
  form.append('fileExtension', fileExtension);
  form.append('file', fs.createReadStream(filePath), { filename: path.basename(filePath) });

  // Prepare headers
  const formHeaders = form.getHeaders();
  formHeaders['Authorization'] = `Bearer ${apiKey.trim()}`;
  formHeaders['X-App-Name'] = APP_NAME;
  formHeaders['X-App-Version'] = VERSION;

  // Try to set Content-Length if available (optional but helpful for some servers)
  const length = await getFormLength(form);
  if (length != null) {
    formHeaders['Content-Length'] = String(length);
  }

  // Send HTTP call with retry
  const res = await retry(
    async () => {
      const r = await fetch(`${PARTNER_API}eagle-animation/task`, {
        method: 'PUT',
        headers: formHeaders,
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

uploadFile('00000000-0000-0000-0000-000000000000', '00000000', 'mp4', 'C:\\Users\\mbaco\\EagleAnimation\\.sync\\D328X2UO.mp4');
