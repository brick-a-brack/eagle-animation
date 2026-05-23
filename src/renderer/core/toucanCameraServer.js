import { DEVICE, TOUCAN_CAMERA_SERVER_URL } from '@config-web';
import { EA, EAEvents } from '@core/bindings';

let TOUCAN_CAMERA_SERVER_CONFIG = null;

if (DEVICE === 'ELECTRON') {
  EA('GET_TOUCAN_CAMERA_SERVER_CONFIG').then((config) => {
    TOUCAN_CAMERA_SERVER_CONFIG = config;
    console.log('🐦 Initial Toucan Camera Server config fetched', TOUCAN_CAMERA_SERVER_CONFIG);
  });

  EAEvents('TOUCAN_CAMERA_SERVER_CONFIG', (_, config) => {
    TOUCAN_CAMERA_SERVER_CONFIG = config;
    console.log('🐦 New Toucan Camera Server config received', TOUCAN_CAMERA_SERVER_CONFIG);
  });
}

// Get token from window global config
export const getToken = () => {
  if (TOUCAN_CAMERA_SERVER_URL) {
    const url = new URL(TOUCAN_CAMERA_SERVER_URL);
    return url.searchParams.get('token');
  }
  return TOUCAN_CAMERA_SERVER_CONFIG?.token || 'unknown';
};

// Generate auth header for API requests
export const getAuthHeader = () => {
  if (getToken()) {
    return { authorization: `Bearer ${getToken()}` };
  }
  return {};
};

// Generate API URL from window global config
export const getApiUrl = () => {
  if (TOUCAN_CAMERA_SERVER_URL) {
    const url = new URL(TOUCAN_CAMERA_SERVER_URL);
    return `${url.protocol}//${url.host}/`;
  }
  const port = TOUCAN_CAMERA_SERVER_CONFIG?.port || '8080';
  return `http://127.0.0.1:${port}/`;
};
