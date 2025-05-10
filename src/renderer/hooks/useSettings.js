import { useCallback, useEffect, useState } from 'react';

import { currentLanguage, setLanguage } from '@i18n';

const DEFAULT_SETTINGS = {
  PLAY_FROM_BEGINING: false,
  LOOP_SHOW_LIVE: true,
  CAMERA_ID: null,
  FORCE_QUALITY: false,
  CAPTURE_FRAMES: 1,
  AVERAGING_ENABLED: false,
  AVERAGING_VALUE: 3,
  LANGUAGE: currentLanguage(),
  SHORT_PLAY: 20,
  RATIO_OPACITY: 0.5,
  GRID_OPACITY: 1,
  GRID_MODES: ['GRID'], // GRID | CENTER | MARGINS
  GRID_LINES: 3,
  GRID_COLUMNS: 3,
  EVENT_KEY: '',
  SOUNDS: true,
  REVERSE_X: false,
  REVERSE_Y: false,
  LIMIT_NUMBER_OF_FRAMES: 0,
  LIMIT_ACTIVITY_DURATION: 0,
};

function useSettings() {
  const [settings, setSettings] = useState(null);

  // Initial load
  useEffect(() => {
    window.EA('GET_SETTINGS').then((definedSettings) => {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...definedSettings,
      });
    });
  }, []);

  // Refresh action
  const actionRefreshSettings = useCallback(async () => {
    const definedSettings = await window.EA('GET_SETTINGS');
    setSettings({
      ...DEFAULT_SETTINGS,
      ...definedSettings,
    });
  });

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

    setSettings(computedNewSettings);
    await window.EA('SAVE_SETTINGS', { settings: computedNewSettings });
  });

  return {
    settings,
    actions: {
      setSettings: actionSetSettings,
      refreshSettings: actionRefreshSettings,
    },
  };
}

export default useSettings;
