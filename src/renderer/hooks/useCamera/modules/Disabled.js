import i18n from '@i18n';

// Dummy camera backend: streams a static black screen and refuses to capture.
// Useful to keep working on a project (playback, editing, export) without any
// camera plugged in, or to explicitly turn the live view off.

const PREVIEW_WIDTH = 1920;
const PREVIEW_HEIGHT = 1080;
const PREVIEW_FONT_SIZE = 72;

const buildBlackScreen = () => {
  const canvas = document.createElement('canvas');
  canvas.width = PREVIEW_WIDTH;
  canvas.height = PREVIEW_HEIGHT;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${PREVIEW_FONT_SIZE}px 'Open Sans', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(i18n.t('Camera disabled'), canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/png');
};

class Disabled {
  constructor(deviceId = null) {
    this.deviceId = deviceId;
    this.setStream = null;
    this.settings = {};
  }

  get id() {
    return this?.deviceId || null;
  }

  // No setting can be applied on a disabled camera
  async applyCapability() {
    return null;
  }

  async getCapabilities() {
    return [];
  }

  async connect({ setStream } = {}, settings = {}) {
    this.setStream = setStream;
    this.settings = settings;

    // A single static frame is enough, the preview never changes
    if (this.setStream) {
      this.setStream('image', buildBlackScreen());
    }

    return true;
  }

  async takePicture() {
    throw new Error('CAMERA_DISABLED');
  }

  async disconnect() {
    if (this.setStream) {
      this.setStream(null);
      this.setStream = null;
    }
  }
}

class DisabledBrowser {
  static async getCameras() {
    return [
      {
        deviceId: 'DISABLED',
        module: 'DISABLED',
        label: i18n.t('Disabled'),
      },
    ];
  }
}

export const Camera = Disabled;
export const CameraBrowser = DisabledBrowser;
