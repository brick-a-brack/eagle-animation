import { TOUCAN_CAMERA_SERVER_AVAILABLE } from '@config-web';
import { getToucanCameraServerConfig, refreshToucanCameraServerConfig, setToucanCameraServerConfig, stopToucanCameraServer } from '@core/toucanCameraServer';
import { useCallback, useEffect, useRef, useState } from 'react';

import useSettings from './useSettings';

// Short pairing token, meant to be read out loud or typed on another device:
// digits and uppercase letters only, no lowercase to avoid case confusion.
export const TOKEN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const TOKEN_LENGTH = 6;

const generateToken = () => {
  const values = new Uint32Array(TOKEN_LENGTH);
  crypto.getRandomValues(values);
  let token = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) {
    token += TOKEN_ALPHABET[values[i] % TOKEN_ALPHABET.length];
  }
  return token;
};

// Module level, not component state: the hook is mounted and unmounted as the user
// navigates, and a token regenerated on every mount would restart the server and
// invalidate what was already shared with other devices.
let TOUCAN_CAMERA_SERVER_TOKEN = null;

const getCurrentToken = () => {
  if (!TOUCAN_CAMERA_SERVER_TOKEN) {
    TOUCAN_CAMERA_SERVER_TOKEN = generateToken();
  }
  return TOUCAN_CAMERA_SERVER_TOKEN;
};

/**
 * Drives the local Toucan Camera Server from the renderer.
 *
 * Pushes the sharing settings to the backend, which starts or restarts the server
 * as needed — nothing is launched before this runs. The resulting config is kept in
 * the core module too, so getToucanCameraServerUrl() / getToucanCameraServerHeaders()
 * stay in sync for the camera and peers calls.
 *
 * Every call is a no-op when the platform has no camera server, or when the user
 * turned it off with TOUCAN_CAMERA_SERVER_DISABLED — in which case the binary is
 * never launched at all, since this hook is its only entry point.
 *
 * Meant to be mounted once, high in the tree.
 */
function useToucanCameraServer() {
  const { settings } = useSettings();
  const [config, setConfig] = useState(getToucanCameraServerConfig());
  const [isLoading, setIsLoading] = useState(TOUCAN_CAMERA_SERVER_AVAILABLE);

  const isSettingsReady = !!settings;
  const expose = !!settings?.TOUCAN_CAMERA_SERVER_EXPOSE;
  const background = !!settings?.TOUCAN_CAMERA_SERVER_BACKGROUND;
  const isEnabled = TOUCAN_CAMERA_SERVER_AVAILABLE && !settings?.TOUCAN_CAMERA_SERVER_DISABLED;

  // Read through a ref so the actions stay stable across renders
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  // Action set config — unspecified options keep their current value
  const actionSet = useCallback(async (options = {}) => {
    if (!isEnabledRef.current) {
      return getToucanCameraServerConfig();
    }

    const current = getToucanCameraServerConfig();
    setIsLoading(true);

    try {
      const newConfig = await setToucanCameraServerConfig({
        expose: options.expose ?? current?.expose ?? false,
        background: options.background ?? current?.background ?? false,
        token: options.token ?? getCurrentToken(),
      });
      setConfig(newConfig);
      return newConfig;
    } catch (err) {
      console.error(err);
      return getToucanCameraServerConfig();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Action rotate token — issues a new pairing token and restarts the server with it,
  // which revokes every link and peer still using the previous one
  const actionRotateToken = useCallback(async () => {
    TOUCAN_CAMERA_SERVER_TOKEN = generateToken();
    return actionSet({ token: TOUCAN_CAMERA_SERVER_TOKEN });
  }, [actionSet]);

  // Action stop — guarded on availability only, never on isEnabled: stopping is
  // precisely what has to run once the user disables the camera server.
  const actionStop = useCallback(async () => {
    if (!TOUCAN_CAMERA_SERVER_AVAILABLE) {
      return getToucanCameraServerConfig();
    }

    setIsLoading(true);
    try {
      const newConfig = await stopToucanCameraServer();
      setConfig(newConfig);
      return newConfig;
    } catch (err) {
      console.error(err);
      return getToucanCameraServerConfig();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Action refresh config — the server may have restarted on its own
  const actionRefresh = useCallback(async () => {
    if (!isEnabledRef.current) {
      return getToucanCameraServerConfig();
    }
    const newConfig = await refreshToucanCameraServerConfig();
    setConfig(newConfig);
    return newConfig;
  }, []);

  // Apply the settings, and re-apply them whenever they change
  useEffect(() => {
    if (!isSettingsReady) {
      return;
    }
    if (!isEnabled) {
      // Turned off while a server was running: shut it down instead of leaking it
      actionStop();
      return;
    }
    actionSet({ expose, background });
  }, [isSettingsReady, isEnabled, expose, background, actionSet, actionStop]);

  return {
    config,
    isAvailable: isEnabled,
    isLoading,
    actions: {
      set: actionSet,
      stop: actionStop,
      refresh: actionRefresh,
      rotateToken: actionRotateToken,
    },
  };
}

export default useToucanCameraServer;
