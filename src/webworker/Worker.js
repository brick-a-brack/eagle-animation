import { ExportFrame, GetFrameResolution } from './Exporter';

const availableFunctions = [
  { id: 'ExportFrame', func: ExportFrame },
  { id: 'GetFrameResolution', func: GetFrameResolution },
];

console.log('🏗️ Worker ready, waiting jobs...');

self.addEventListener('message', (e) => {
  const { event, id, name, args } = e.data || {};
  console.log('👷 Worker task', { event, id, name, args });
  if (event === 'LAUNCH') {
    for (const funcItem of availableFunctions) {
      if (name === funcItem.id) {
        const args2 = args.map((e) =>
          e.type !== 'function'
            ? e.value
            : (data) => {
                postMessage({ id, event: 'CALLBACK', index: e.index, data });
              }
        );

        funcItem
          .func(...args2)
          .then((data) => {
            postMessage({ id, event: 'END', name: funcItem.id, data });
          })
          .catch((err) => {
            postMessage({ id, event: 'ERROR', name: funcItem.id, data: err.message });
          });
      }
    }
  }
});
