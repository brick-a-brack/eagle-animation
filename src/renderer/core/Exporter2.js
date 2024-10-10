export const ExportFrames = async (
  files = [],
  opts = {
    duplicateFramesCopy: true,
    duplicateFramesAuto: false,
    duplicateFramesAutoNumber: 1,
    forceFileExtension: undefined,
    resolution: null,
  },
  onProgress = () => {}
) =>
  new Promise((resolve, reject) => {
    // Web worker for image manipulation
    const myWorker = new Worker(new URL('worker.mjs', import.meta.url), {
        type: 'module'
      });

    myWorker.onmessage = (e) => {
      console.log('TASK', e);

      if (e.data.event === 'CALLBACK') {
        onProgress(e.data.data);
      } else if (e.data.event === 'END') {
        resolve(e.data.data);
      } else if (e.data.event === 'ERROR') {
        reject(new Error(e.data.message));
      }
    };

    myWorker.postMessage({
      event: 'LAUNCH',
      name: 'ExportFrames',
      args: [files, opts],
    });
  });

/* {
    event: "START" / "END"
    data: xxx
}*/
