import { min } from 'lodash';

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
    return null;
  }

  async getCapabilities() {
    const capabilities = await fetch(`${TOUCAN_CAMERA_SERVER_URL}cameras/${this.deviceId}/parameters`, {
      method: 'GET',
    }).then((res) => res.json());

    console.log(capabilities);

    return capabilities.map((capability) => {
      const id = Object.keys(EAGLE_TOUCAN_PARAMETERS_MAPPING).find((key) => EAGLE_TOUCAN_PARAMETERS_MAPPING[key] === capability.type) || capability.type;

      // No options, use range
      if (capability.options.length === 0) {
        return {
          id,
          type: 'RANGE',
          min: capability.min,
          max: capability.max,
          step: capability.step,
          value: capability?.current || null,
          canReset: false,
        };
      }

      // TODO handle RANGE_SELECT // Improve server type definition

      return {
        id,
        type: 'SELECT',
        values: (capability?.options || []).map((e) => ({
          label: e.label,
          value: e.value,
        })),
        value: capability?.current || null,
        canReset: false,
      };
    });

    return [];
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
