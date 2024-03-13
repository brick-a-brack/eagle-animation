import React from 'react';
import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer'

import './i18n';
import App from './App';
import { BUILD } from './config';

globalThis.Buffer = Buffer

console.log('Build', BUILD);

window.EA = (action, data) => {
  console.log('📣 IPC', action, data);
  return window.IPC.call(action, data);
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<React.StrictMode>
  <App />
</React.StrictMode>);