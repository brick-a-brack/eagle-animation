import { DEFAULT_FPS, PARTNER_API } from '@config-web';
import { currentLanguage, setLanguage } from '@i18n';
import { useCallback, useEffect, useState } from 'react';

const DEFAULT_SETTINGS = {
  PLAY_FROM_BEGINING: false,
  LOOP_SHOW_LIVE: true,
  SKIP_HIDDEN_FRAMES: false,
  CAMERA_ID: null,
  CAPTURE_FRAMES: 1,
  AVERAGING_ENABLED: false,
  AVERAGING_VALUE: 3,
  LANGUAGE: currentLanguage(),
  SHORT_PLAY: 20,
  DEFAULT_FPS,
  RATIO_OPACITY: 0.5,
  GRID_OPACITY: 1,
  GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
  GRID_LINES: 3,
  GRID_COLUMNS: 3,
  SOUNDS: true,
  REVERSE_X: false,
  REVERSE_Y: false,
  LIMIT_NUMBER_OF_FRAMES: 0,
  LIMIT_ACTIVITY_DURATION: 0,
  EVENT_MODE_ENABLED: false,
  EVENT_KEY: '',
  EVENT_API: PARTNER_API,
  TOUCAN_CAMERA_SERVER_DISABLED: false,
  TOUCAN_CAMERA_SERVER_EXPOSE: false,
  TELEMETRY_ENABLED: true,
  TOURS_COMPLETED: [], // Keys of the guided tours the user has already seen
};

// Settings are shared process-wide: several components call useSettings() at the
// same time (a view, a form, useToucanCameraServer…) and they must all see a write
// made through any one of them. Without this, an instance kept the value it loaded
// at mount and silently went stale.
let CURRENT_SETTINGS = null;
let SETTINGS_LISTENERS = [];

const broadcastSettings = (settings) => {
  CURRENT_SETTINGS = settings;
  window.setTelemetryEnabled?.(settings.TELEMETRY_ENABLED !== false);
  SETTINGS_LISTENERS.forEach((listener) => listener(settings));
};

function useSettings() {
  const [settings, setSettings] = useState(CURRENT_SETTINGS);

  // Subscribe to writes made by any other instance
  useEffect(() => {
    SETTINGS_LISTENERS.push(setSettings);
    return () => {
      SETTINGS_LISTENERS = SETTINGS_LISTENERS.filter((listener) => listener !== setSettings);
    };
  }, []);

  // Initial load
  useEffect(() => {
    window.EA('GET_SETTINGS').then((definedSettings) => {
      broadcastSettings({ ...DEFAULT_SETTINGS, ...definedSettings });
    });
  }, []);

  // Refresh action
  const actionRefreshSettings = useCallback(async () => {
    const definedSettings = await window.EA('GET_SETTINGS');
    broadcastSettings({ ...DEFAULT_SETTINGS, ...definedSettings });
  }, []);

  // Set action
  const actionSetSettings = useCallback(async (newSettings) => {
    // Compute settings object
    const definedSettings = await window.EA('GET_SETTINGS');
    let computedNewSettings = {
      ...DEFAULT_SETTINGS,
      ...definedSettings,
      ...newSettings,
    };
    if (computedNewSettings.GRID_MODES.length === 0) {
      computedNewSettings.GRID_MODES = ['GRID'];
    }

    // Update language
    if (computedNewSettings.LANGUAGE) {
      setLanguage(computedNewSettings.LANGUAGE);
    }

    broadcastSettings(computedNewSettings);
    await window.EA('SAVE_SETTINGS', { settings: computedNewSettings });
  }, []);

  return {
    settings,
    actions: {
      setSettings: actionSetSettings,
      refreshSettings: actionRefreshSettings,
    },
  };
}

export default useSettings;
