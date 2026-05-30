import { getApiUrl, getAuthHeader, getToken } from '@core/toucanCameraServer';

class ToucanCameraServer {
  constructor(deviceId = null) {
    this.deviceId = deviceId;
  }

  get id() {
    return this?.deviceId || null;
  }

  async applyCapability(key, value) {
    console.log(`📷 Set ${key}=${value}`);

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
    })
      .then((res) => res.json())
      .catch(() => []);

    return (Array.isArray(capabilities) ? capabilities : []).map((capability) => {
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

  async connect({ setStream } = {} /*, settings = {} */) {
    this.setStream = setStream;

    await fetch(`${getApiUrl()}cameras/${this.deviceId}/connect`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
      },
    });

    const url = `${getApiUrl()}cameras/${this.deviceId}/liveview?token=${getToken()}&t=${new Date().getTime()}`;
    if (setStream) {
      setStream('image', url);
    }

    return true;
  }

  async takePicture() {
    const request = await fetch(`${getApiUrl()}cameras/${this.deviceId}/capture`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
    });

    const capturedFrame = await request.arrayBuffer();

    return { type: request.headers.get('Content-Type'), buffer: capturedFrame };
  }

  async disconnect() {
    this.setStream = null;
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
