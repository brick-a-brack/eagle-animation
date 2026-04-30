import './i18n';

import { Buffer } from 'buffer';
import posthog from 'posthog-js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BUILD, IS_DEV, POSTHOG_HOST, POSTHOG_TOKEN, VERSION } from './config';
import { EA, EAEvents } from '@core/bindings';

// Bind global objects for actions
window.EA = EA;
window.EAEvents = EAEvents;

// Catch alt key to avoid to open menu
window.addEventListener('keydown', (e) => {
  if (e.altKey) {
    e.preventDefault();
  }
});

try {
  if (!IS_DEV && POSTHOG_TOKEN) {
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      person_profiles: 'always',
      autocapture: false,
      disable_session_recording: true,
    });

    posthog.register({
      app_version: VERSION,
      app_build: BUILD,
    });
  }
} catch (err) { } // eslint-disable-line no-empty

window.track = (eventName, data = {}) => {
  try {
    if (!IS_DEV && POSTHOG_TOKEN) {
      console.log(`📊 Tracking event: ${eventName}`, data);
      posthog.capture(eventName, data);
    }
  } catch (err) { } // eslint-disable-line no-empty
};

window.trackException = (error) => {
  try {
    if (!IS_DEV && POSTHOG_TOKEN) {
      console.log(`📊 Tracking exception:`, error);
      posthog.captureException(error);
    }
  } catch (err) { } // eslint-disable-line no-empty
};

globalThis.Buffer = Buffer;

console.log('🚀 Build', BUILD);

// Add service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Web (Web browser backend)
    if (typeof window.IPC === 'undefined') {
      navigator.serviceWorker.register('./sw.js', {
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
