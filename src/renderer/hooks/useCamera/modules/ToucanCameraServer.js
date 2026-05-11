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
const getToken = () => {
  if (TOUCAN_CAMERA_SERVER_URL) {
    const url = new URL(TOUCAN_CAMERA_SERVER_URL);
    return url.searchParams.get('token');
  }
  return TOUCAN_CAMERA_SERVER_CONFIG?.token || 'unknown';
};

// Generate auth header for API requests
const getAuthHeader = () => {
  if (getToken()) {
    return { authorization: `Bearer ${getToken()}` };
  }
  return {};
};

// Generate API URL from window global config
const getApiUrl = () => {
  if (TOUCAN_CAMERA_SERVER_URL) {
    const url = new URL(TOUCAN_CAMERA_SERVER_URL);
    return `${url.protocol}//${url.host}/`;
  }
  const port = TOUCAN_CAMERA_SERVER_CONFIG?.port || '8080';
  return `http://127.0.0.1:${port}/`;
};

class ToucanCameraServer {
  constructor(deviceId = null) {
    this.deviceId = deviceId;
  }

  get id() {
    return this?.deviceId || null;
  }

  async canResetCapabilities() {
    return false;
  }

  async resetCapabilities() {
    return null;
  }

  async applyCapability(key, value) {
    console.log('Apply capability', key, value);

    await fetch(`${getApiUrl()}cameras/${this.deviceId}/parameters`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: key, value: `${value}` }),
    });

    return null;
  }

  async getCapabilities() {
    const capabilities = await fetch(`${getApiUrl()}cameras/${this.deviceId}/parameters`, {
      method: 'GET',
      headers: {
        ...getAuthHeader(),
      },
    }).then((res) => res.json());

    return capabilities.map((capability) => {
  
      console.log('Capability', capability);

      const id = capability?.type || 'unknown';
      const kind = capability?.kind?.toUpperCase() || 'UNKNOWN';
      const currentValue = capability?.current || null;

      return {
        id,
        type: kind,
        ...(['RANGE'].includes(kind)
          ? {
              min: capability.min,
              max: capability.max,
              step: capability.step,
            }
          : {}),
        ...(['SELECT', 'RANGE_SELECT'].includes(kind)
          ? {
              values: (capability?.options || []).map((e) => ({
                label: e.label,
                value: e.value,
              })),
            }
          : {}),
        value: kind === 'RANGE' ? Number(currentValue) : currentValue,
        canReset: false,
        disabled: capability?.disabled || false,
      };
    });
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}) {
    this.imageDOM = imageDOM;
    this.videoDOM = videoDOM;

    // Disable video stream
    videoDOM.src = '';
    imageDOM.src = '';

    await fetch(`${getApiUrl()}cameras/${this.deviceId}/connect`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
      },
    });

    imageDOM.src = `${getApiUrl()}cameras/${this.deviceId}/liveview?token=${getToken()}`;

    return true;
  }

  async takePicture() {
    const request = await fetch(`${getApiUrl()}cameras/${this.deviceId}/capture`, {
      method: 'POST', // TODO: Strange? Should be GET, need to investigate more on TCS side
      headers: {
        ...getAuthHeader(),
      },
    });

    const capturedFrame = await request.arrayBuffer();

    return { type: request.headers.get('Content-Type'), buffer: capturedFrame };
  }

  async disconnect() {
    this.imageDOM.src = '';
    await fetch(`${getApiUrl()}cameras/${this.deviceId}/disconnect`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
      },
    });
  }
}

class ToucanCameraServerBrowser {
  static async getCameras() {
    try {
      const devices = await fetch(`${getApiUrl()}cameras`, {
        method: 'GET',
        headers: {
          ...getAuthHeader(),
        },
      }).then((res) => res.json());

      return devices.map((device) => ({
        deviceId: device.id,
        label: device.name,
        type: 'WEB',
        module: 'TOUCAN-CAMERA-SERVER',
      }));
    } catch (err) {
      console.error(err);
    }
    return [];
  }
}

export const Camera = ToucanCameraServer;
export const CameraBrowser = ToucanCameraServerBrowser;
