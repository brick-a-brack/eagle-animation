import pLimit from 'p-limit';
import { v4 as uuidv4 } from 'uuid';

const createWorker = () => {
  return new Worker(new URL('../../webworker/Worker.js', import.meta.url), {
    type: 'module',
  });
};

const NB_WEB_WORKERS = 10;
const WEB_WORKER_GC_TASKS = 10;

// Workers states
let SharedWorkerNext = 0;
let SharedWorkerActivity = new Array(NB_WEB_WORKERS).fill(null);
let SharedWorkerNbTasks = new Array(NB_WEB_WORKERS).fill(null);
let SharedWorkerLimit = new Array(NB_WEB_WORKERS).fill(null).map(() => pLimit(1));
const SharedWorkers = new Array(NB_WEB_WORKERS).fill(null).map(() => createWorker());

// Periodically flush overused
setInterval(() => {
  for (const key in SharedWorkerActivity) {
    if (SharedWorkerActivity[key] === 0 && SharedWorkerNbTasks[key] > WEB_WORKER_GC_TASKS) {
      console.log('🧹 Flush worker to avoid memory leak...');
      SharedWorkers[key].terminate();
      SharedWorkers[key] = undefined;
      SharedWorkers[key] = createWorker();
      SharedWorkerNbTasks[key] = 0;
    }
  }
}, 10000);

const sendTaskToWorker = (worker, id, name, args) =>
  new Promise((resolve, reject) => {
    // On event from worker
    const callback = (e) => {
      if (e?.data?.id !== id) {
        return;
      }

      if (e.data.event === 'CALLBACK') {
        args[e.data.index](e.data.data);
      } else if (e.data.event === 'END') {
        worker.removeEventListener('message', callback);
        return resolve(e.data.data);
      } else if (e.data.event === 'ERROR') {
        worker.removeEventListener('message', callback);
        return reject(new Error(e.data.data));
      }
    };

    worker.addEventListener('message', callback);

    worker.postMessage({
      id,
      event: 'LAUNCH',
      name,
      args,
    });
  });

const sendTaskToWorkerThrottle = async (workerId, id, name, args) => {
  return SharedWorkerLimit[workerId](async () => {
    SharedWorkerActivity[workerId]++;
    SharedWorkerNbTasks[workerId]++;
    const data = await sendTaskToWorker(SharedWorkers[workerId], id, name, args);
    SharedWorkerActivity[workerId]--;
    return data;
  });
};

const bindWorkerFunction =
  (name) =>
  async (...props) => {
    // Unique task id and parse args
    const id = uuidv4();
    const args = props.map((e, i) => ({ index: i, type: typeof e, value: typeof e !== 'function' ? e : null }));

    // Init worker
    const workerId = SharedWorkerNext;
    SharedWorkerNext = (SharedWorkerNext + 1) % NB_WEB_WORKERS;

    // Send request
    return sendTaskToWorkerThrottle(workerId, id, name, args);
  };

export const ExportFrame = bindWorkerFunction('ExportFrame');
export const GetFrameResolution = bindWorkerFunction('GetFrameResolution');
