import './i18n';

import { Buffer } from 'buffer';
import posthog from 'posthog-js';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { BUILD, POSTHOG_HOST, POSTHOG_TOKEN } from './config';

// Catch alt key to avoid to open menu
window.addEventListener('keydown', (e) => {
  if (e.altKey) {
    e.preventDefault();
  }
});

try {
  if (POSTHOG_TOKEN) {
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      person_profiles: 'always',
      autocapture: false,
      disable_session_recording: true,
    });
  }
} catch (err) { } // eslint-disable-line no-empty

window.track = (eventName, data = {}) => {
  try {
    if (POSTHOG_TOKEN) {
      posthog.capture(eventName, data);
    }
  } catch (err) { } // eslint-disable-line no-empty
};

window.trackException = (error) => {
  try {
    if (POSTHOG_TOKEN) {
      posthog.captureException(error);
    }
  } catch (err) { } // eslint-disable-line no-empty
};

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

window.EAEvents = (name, callback = () => { }) => {
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

// Add service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Web (Web browser backend)
    if (typeof window.IPC === 'undefined') {
      navigator.serviceWorker.register('./sw-web.js', {
        type: 'module',
      });
    }
  });
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
