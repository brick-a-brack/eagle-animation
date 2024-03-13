import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';

import './i18n';
import App from './App';
import { BUILD } from './config';

import WebActions from './actions';

globalThis.Buffer = Buffer;

console.log('Build', BUILD);

window.EA = async (action, data) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    console.log('📣 IPC', action, data);
    const cb = await window.IPC.call(action, data);
    console.log(cb);
    return cb;
  }

  // Web (Web browser backend)
  if (WebActions[action]) {
    return WebActions[action](null, data);
  }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
