

import { ExportFrames, floorResolution, floorResolutionValue, GetBestResolution } from './Exporter';

console.log('TOTO');

onmessage = (e) => {
  if (e.data.event === 'LAUNCH') {
    if (e.data.name === 'ExportFrames') {
      ExportFrames(e.data.args[0], e.data.args[1], (e) => {
        console.log('callback', e)
        postMessage({ event: 'CALLBACK', name: 'onProgress', data: e });
      })
        .then((data) => {
          postMessage({ event: 'END', name: 'ExportFrames', data });
        })
        .catch((err) => {
          console.log('err', err)
          postMessage({ event: 'ERROR', name: 'ExportFrames', data: err.message });
        });
    }
  }
};
