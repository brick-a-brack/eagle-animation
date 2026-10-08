import { TOUCAN_CAMERA_SERVER_AVAILABLE, TOUCAN_CAMERA_SERVER_URL } from '@config-web';
import { EA } from '@core/bindings';

// Last known { hostname, shareHostname, expose, port, token, secure } of the local camera server.
let TOUCAN_CAMERA_SERVER_CONFIG = null;

const parseToucanCameraServerUrlArg = (url, arg = null) => {
  if (!url) {
    return null;
  }

  const urlObj = new URL(url);

  if (arg === 'hostname') {
    return urlObj.hostname;
  }

  if (arg === 'port') {
    return urlObj.port;
  }

  if (arg === 'secure') {
    return urlObj.protocol === 'https:';
  }

  if (urlObj.searchParams.has(arg)) {
    return urlObj.searchParams.get(arg);
  }

  return null;
};

export const setToucanCameraServerConfig = async ({ expose = false, token = null } = {}) => {
  TOUCAN_CAMERA_SERVER_CONFIG = await EA('TOUCAN_CAMERA_SERVER_SET_CONFIG', { expose, token });
  return getToucanCameraServerConfig();
};

const EMPTY_TOUCAN_CAMERA_SERVER_CONFIG = { hostname: null, shareHostname: null, expose: false, port: null, token: null, secure: false, url: null };

export const getToucanCameraServerConfig = () => {
  if (!TOUCAN_CAMERA_SERVER_AVAILABLE) {
    return { ...EMPTY_TOUCAN_CAMERA_SERVER_CONFIG };
  }
  const config = {
    hostname: parseToucanCameraServerUrlArg(TOUCAN_CAMERA_SERVER_URL, 'hostname') || TOUCAN_CAMERA_SERVER_CONFIG?.hostname || null,
    shareHostname: TOUCAN_CAMERA_SERVER_CONFIG?.shareHostname || null,
    expose: TOUCAN_CAMERA_SERVER_CONFIG?.expose || false,
    port: parseToucanCameraServerUrlArg(TOUCAN_CAMERA_SERVER_URL, 'port') || TOUCAN_CAMERA_SERVER_CONFIG?.port || null,
    token: parseToucanCameraServerUrlArg(TOUCAN_CAMERA_SERVER_URL, 'token') || TOUCAN_CAMERA_SERVER_CONFIG?.token || null,
    secure: parseToucanCameraServerUrlArg(TOUCAN_CAMERA_SERVER_URL, 'secure') || false,
  };

  // A forced URL carries its own host and may legitimately omit the port (default
  // 80/443). A local server, on the other hand, only becomes reachable once it has
  // announced its port — until then there is no URL to hand out, and building one
  // anyway produced requests to `http://null/`.
  const isReachable = !!config.hostname && (!!config.port || !!TOUCAN_CAMERA_SERVER_URL);

  return {
    ...config,
    url: isReachable ? `http${config.secure ? 's' : ''}://${config.hostname}${config.port ? `:${config.port}` : ''}/` : null,
  };
};

// Stops the server without preventing a later restart: the next
// setToucanCameraServerConfig() brings it back up.
export const stopToucanCameraServer = async () => {
  TOUCAN_CAMERA_SERVER_CONFIG = await EA('TOUCAN_CAMERA_SERVER_STOP');
  return getToucanCameraServerConfig();
};

export const refreshToucanCameraServerConfig = async () => {
  TOUCAN_CAMERA_SERVER_CONFIG = await EA('TOUCAN_CAMERA_SERVER_GET_CONFIG');
  return getToucanCameraServerConfig();
};

export const getToucanCameraServerUrl = () => getToucanCameraServerConfig()?.url || null;

export const getToucanCameraServerHeaders = () => {
  if (getToucanCameraServerConfig()?.token) {
    return { authorization: `Bearer ${getToucanCameraServerConfig()?.token}` };
  }
  return {};
};
