import { v4 as uuidv4 } from 'uuid';

const createWorker = () => {
  return new Worker(new URL('../../webworker/worker.js', import.meta.url), {
    type: 'module',
  });
};

let cachedBlobUrls = {};

const SharedWorker = createWorker();

const bindWorkerFunction =
  (name, shared = false) =>
  async (...props) =>
    new Promise((resolve, reject) => {
      // Unique task id and parse args
      const id = uuidv4();
      const args = props.map((e, i) => ({ index: i, type: typeof e, value: typeof e !== 'function' ? e : null }));

      // Init worker
      const worker = shared ? SharedWorker : createWorker();

      // On event from worker
      worker.onmessage = (e) => {
        if (e?.data?.id !== id && e.data.event !== 'FETCH') {
          return;
        }

        if (e.data.event === 'CALLBACK') {
          props[e.data.index](e.data.data);
        } else if (e.data.event === 'END') {
          resolve(e.data.data);
          if (shared === false) {
            worker.terminate();
          }
        } else if (e.data.event === 'ERROR') {
          reject(new Error(e.data.data));
          if (shared === false) {
            worker.terminate();
          }
        } else if (e.data.event === 'FETCH') {
          (async (lnk) => {
            if (cachedBlobUrls[lnk]) {
              return worker.postMessage({
                id,
                event: 'FETCH_CALLBACK',
                blobLink: cachedBlobUrls[lnk],
                link: lnk,
              });
            }
            const resp = await fetch(lnk);
            if (!resp.ok) {
              return worker.postMessage({
                id,
                event: 'FETCH_CALLBACK',
                error: 'Network error',
              });
            }
            const blob = await resp.blob();
            cachedBlobUrls[lnk] = URL.createObjectURL(blob);
            worker.postMessage({
              id,
              event: 'FETCH_CALLBACK',
              blobLink: cachedBlobUrls[lnk],
              link: lnk,
            });
          })(e.data.data.link);
        }
      };

      worker.postMessage({
        id,
        event: 'LAUNCH',
        name,
        args,
      });
    });

export const ExportFrames = bindWorkerFunction('ExportFrames', false);
export const ExtractFramesResolutions = bindWorkerFunction('ExtractFramesResolutions', true);
export const ExportFrame = bindWorkerFunction('ExportFrame', true);
