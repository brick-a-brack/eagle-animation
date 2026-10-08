import { getToucanCameraServerConfig, getToucanCameraServerHeaders, getToucanCameraServerUrl } from '@core/toucanCameraServer';

// Maximum frames the server accepts for averaging a single capture
const MAX_AVERAGING_FRAMES = 20;

const CONNECT_MAX_ATTEMPTS = 50;
const CONNECT_RETRY_DELAY = 100;

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

class ToucanCameraServer {
  constructor(deviceId = null) {
    this.deviceId = deviceId;
  }

  get id() {
    return this?.deviceId || null;
  }

  // The server bursts and averages the frames itself, no need to merge them in JS
  get supportsFrameAveraging() {
    return true;
  }

  async applyCapability(key, value) {
    console.log(`📷 Set ${key}=${value}`);

    await fetch(`${getToucanCameraServerUrl()}cameras/${this.deviceId}/parameters`, {
      method: 'PUT',
      headers: {
        ...getToucanCameraServerHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: key, value: `${value}` }),
    });

    return null;
  }

  async getCapabilities() {
    const capabilities = await fetch(`${getToucanCameraServerUrl()}cameras/${this.deviceId}/parameters`, {
      method: 'GET',
      headers: {
        ...getToucanCameraServerHeaders(),
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

    let lastError = null;
    for (let attempt = 0; attempt < CONNECT_MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await wait(CONNECT_RETRY_DELAY);
      }

      const res = await fetch(`${getToucanCameraServerUrl()}cameras/${this.deviceId}/connect`, {
        method: 'PUT',
        headers: {
          ...getToucanCameraServerHeaders(),
        },
      }).catch((err) => {
        lastError = err;
        return null;
      });

      if (res?.ok) {
        lastError = null;
        break;
      }
      lastError = res ? new Error(`HTTP ${res.status}`) : lastError;
    }

    if (lastError) {
      console.error(`📷 Camera ${this.deviceId} did not accept connect, opening live view anyway:`, lastError);
    }

    const url = `${getToucanCameraServerUrl()}cameras/${this.deviceId}/liveview?token=${getToucanCameraServerConfig()?.token || 'unknown'}&t=${new Date().getTime()}`;
    if (setStream) {
      setStream('image', url);
    }

    return true;
  }

  async takePicture(nbFramesToTake = 1) {
    const frames = Math.min(Math.max(Number(nbFramesToTake) || 1, 1), MAX_AVERAGING_FRAMES);

    const request = await fetch(`${getToucanCameraServerUrl()}cameras/${this.deviceId}/capture?frames=${frames}`, {
      method: 'POST',
      headers: {
        ...getToucanCameraServerHeaders(),
      },
    });

    if (!request.ok) {
      throw new Error(`Failed to capture picture (HTTP ${request.status})`);
    }

    const capturedFrame = await request.arrayBuffer();

    return { type: request.headers.get('Content-Type'), buffer: capturedFrame };
  }

  async disconnect() {
    this.setStream = null;
    await fetch(`${getToucanCameraServerUrl()}cameras/${this.deviceId}/disconnect`, {
      method: 'PUT',
      headers: {
        ...getToucanCameraServerHeaders(),
      },
    });
  }
}

class ToucanCameraServerBrowser {
  static async getCameras() {
    try {
      const devices = await fetch(`${getToucanCameraServerUrl()}cameras`, {
        method: 'GET',
        headers: {
          ...getToucanCameraServerHeaders(),
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
