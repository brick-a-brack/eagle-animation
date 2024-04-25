import './i18n';

import { Buffer } from 'buffer';
import React from 'react';
import { createRoot } from 'react-dom/client';

import { Actions as WebActions, addEventListener } from './actions';
import App from './App';
import { BUILD } from './config';

globalThis.Buffer = Buffer;

console.log('🚀 Build', BUILD);

window.EA = async (action, data) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    console.log('📣 IPC', action, data);
    const cb = await window.IPC.call(action, data);
    if (cb) {
      console.log(cb);
    }
    return cb;
  }

  // Web (Web browser backend)
  if (WebActions[action]) {
    return WebActions[action](null, data);
  }
};

window.EAEvents = (name, callback = () => {}) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    if (typeof callback !== 'undefined') {
      window.IPC.stream(name, callback);
    }
  }

  // Web (Web browser backend)
  if (typeof addEventListener !== 'undefined') {
    addEventListener(name, callback);
  }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
