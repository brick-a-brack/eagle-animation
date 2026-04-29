const TOUCAN_CAMERA_SERVER_URL = 'http://127.0.0.1:8080/';

const EAGLE_TOUCAN_PARAMETERS_MAPPING = {
  VIDEO_FORMAT: 'video_format', // Not supported yet by Eagle
  BRIGHTNESS: 'brightness',
  CONTRAST: 'contrast',
  SATURATION: 'saturation',
  SHARPNESS: 'sharpness',
  ZOOM: 'zoom',
  ZOOM_POSITION_Y: 'tilt',
  ZOOM_POSITION_X: 'pan',
  FOCUS_MODE: 'focus_mode',
  FOCUS_DISTANCE: 'focus',
  EXPOSURE_MODE: 'exposure_mode',
  EXPOSURE_TIME: 'exposure',
  EXPOSURE_COMPENSATION: 'backlight_compensation',
  WHITE_BALANCE_MODE: 'white_balance_mode',
  WHITE_BALANCE: 'white_balance',
  COLOR_TEMPERATURE: 'colorTemperature',
  GAIN: 'gain', // Not supported yet by Eagle
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

    await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: EAGLE_TOUCAN_PARAMETERS_MAPPING[key], value: `${value}` }),
    });

    return null;
  }

  async getCapabilities() {
    const capabilities = await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/parameters`, {
      method: 'GET',
    }).then((res) => res.json());

    console.log(capabilities);

    return capabilities.map((capability) => {
      const id = Object.keys(EAGLE_TOUCAN_PARAMETERS_MAPPING).find((key) => EAGLE_TOUCAN_PARAMETERS_MAPPING[key] === capability.type) || capability.type;

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
      };
    });
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}) {
    this.imageDOM = imageDOM;
    this.videoDOM = videoDOM;

    // Disable video stream
    videoDOM.src = '';
    imageDOM.src = '';

    await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/connect`, {
      method: 'PUT',
    });

    imageDOM.src = `${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/liveview`;

    return true;
  }

  async takePicture() {
    return { type: 'image/jpeg', buffer: null };
  }

  async disconnect() {
    this.imageDOM.src = '';
    await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/disconnect`, {
      method: 'PUT',
    });
  }
}

class ToucanCameraServerBrowser {
  static async getCameras() {
    try {
      const devices = await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras`).then((res) => res.json());
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
