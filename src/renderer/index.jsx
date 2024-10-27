import './i18n';

import { Buffer } from 'buffer';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { BUILD } from './config';

globalThis.Buffer = Buffer;

console.log('🚀 Build', BUILD);

window.EA = async (action, data) => {
  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    return window.IPC.call(action, data);
  }

  // Web (Web browser backend)
  if (typeof window.IPC === 'undefined') {
    return import('./actions').then(({ Actions: WebActions }) => {
      if (WebActions[action]) {
        return WebActions[action](null, data);
      }
    });
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
  if (typeof window.IPC === 'undefined') {
    import('./actions').then(({ addEventListener }) => {
      addEventListener(name, callback);
    });
  }
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
