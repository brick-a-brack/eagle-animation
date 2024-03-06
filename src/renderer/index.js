import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import App from './App';
import { BUILD } from './config';
import actions from './web-actions';

console.log('Build', BUILD);

window.EA = (action, data) => {

  // IPC (Electron backend)
  if (typeof window.IPC !== 'undefined') {
    console.log('📣 IPC', action, data);
    return window.IPC.call(action, data);
  }

  // Web (Web browser backend)
  if (actions[action]){
    return actions[action](data);
  }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<React.StrictMode>
  <App />
</React.StrictMode>);