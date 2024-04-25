import { readFile, stat } from 'node:fs/promises';

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

  return callback().catch((err) => {
    onError(err);
    if (retries > 0) {
      return wait(delay).then(() => retry(callback, { ...options, retries: retries - 1 }));
    }
    throw err;
  });
};

export const startUploading = async (key, publicCode, fileExtension, fileSize) => {
  const response = await retry(
    () =>
      fetch(`${PARTNER_API}graphql`, {
        method: 'POST',
        headers: {
          'apollographql-client-name': APP_NAME,
          'apollographql-client-version': VERSION,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `mutation ($input: CreateEventVideoInput!) {
                        createEventVideo(input: $input) {
                    upload {
                      id
                      parts {
                        number
                        url
                      }
                      chunkSize
                    }
                  }
                }`,
          variables: {
            input: {
              key,
              publicCode,
              fileExtension,
              fileSize,
            },
          },
        }),
      }),
    {
      delay: 2000,
      retries: RETRIES,
    }
  );

  const json = await response.json();
  const { data, errors } = json;
  if (!data?.createEventVideo?.upload || errors?.length > 0) {
    throw new Error(errors?.[0]?.message || 'Unknown error');
  }

  return data?.createEventVideo?.upload || null;
};

export const finishUpload = async (session, parts) => {
  const response = await retry(
    () =>
      fetch(`${PARTNER_API}graphql`, {
        method: 'POST',
        headers: {
          'apollographql-client-name': APP_NAME,
          'apollographql-client-version': VERSION,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: `mutation ($input: FinishUploadInput!) {
                  finishUpload(input: $input) {
                    upload {
                      id
                      url
                      path
                    }
                  }
                }`,
          variables: {
            input: {
              uploadId: session.id,
              parts,
            },
          },
        }),
      }),
    {
      delay: 2000,
      retries: RETRIES,
    }
  );

  const { data, errors } = await response.json();
  if (errors && errors.length > 0) {
    throw new Error(errors[0].message);
  }

  return data.finishUpload.upload;
};

export const uploadFile = async (apiKey, publicCode, fileExtension, filePath) => {
  const file = await readFile(filePath);
  const { size: fileSize } = await stat(filePath);
  const session = await startUploading(apiKey, publicCode, fileExtension, fileSize);

  let etags = [];

  for (const currentPart of session.parts) {
    const res = await retry(
      () =>
        fetch(currentPart.url, {
          method: 'PUT',
          body: file.slice((currentPart.number - 1) * session.chunkSize, (currentPart.number - 1) * session.chunkSize + session.chunkSize),
        }),
      {
        retries: RETRIES,
        delay: 2000,
      }
    );

    etags.push({ number: currentPart.number, etag: res.headers?.get('ETag')?.replaceAll('"', '') });
  }

  await finishUpload(session, etags);
};
