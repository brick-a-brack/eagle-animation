import { Camera as CameraAPI } from 'web-gphoto2';

const CameraInstance = new CameraAPI();

class WebGPhoto2 {
  constructor() {
    this.getSupportedOps = {
      captureAudio: false,
      captureImage: false,
      capturePreview: false,
      captureVideo: false,
      config: false,
      triggerCapture: false,
    };

    this.config = null;

    this.imageDOM = null;
    this.previewInterval = null;
  }

  get id() {
    return null;
  }

  _drawLivePreview(dom, src) {
    return new Promise((resolve) => {
      if (!dom || !src) {
        return resolve(false);
      }

      const ctx = dom.getContext('2d');
      const img = new Image();
      const parent = this;
      img.addEventListener('error', () => {
        ctx.clearRect(0, 0, dom.width, dom.height);
        resolve(true);
      });
      img.addEventListener(
        'load',
        function () {
          if (!parent.isActive) {
            return;
          }
          if (dom.width !== this.naturalWidth) {
            dom.width = this.naturalWidth;
          }
          if (dom.height !== this.naturalHeight) {
            dom.height = this.naturalHeight;
          }
          ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, img.naturalWidth, img.naturalHeight);
          resolve(true);
        },
        false
      );
      img.src = src;
    });
  }

  initPreview() {
    return new Promise((resolve) => {
      this.isActive = true;
      clearInterval(this.previewInterval);
      this.previewInterval = setInterval(async () => {
        const blob = await CameraInstance.capturePreviewAsBlob();
        this._drawLivePreview(this.imageDOM, URL.createObjectURL(blob)).then(resolve);
      }, 50);
    });
  }

  async canResetCapabilities() {
    return false;
  }

  async resetCapabilities() {
    return null;
  }

  async applyCapability(key, value) {
    if (key === 'APERTURE') {
      await CameraInstance.setConfigValue('aperture', value);
    }

    if (key === 'WHITE_BALANCE') {
      await CameraInstance.setConfigValue('whitebalance', value);
    }

    if (key === 'SHUTTER_SPEED') {
      await CameraInstance.setConfigValue('shutterspeed', value);
    }

    if (key === 'ISO') {
      await CameraInstance.setConfigValue('iso', value);
    }

    return null;
  }

  async getCapabilities() {
    const aperture = this?.config?.children?.capturesettings?.children?.aperture || null;
    const shutterspeed = this?.config?.children?.capturesettings?.children?.shutterspeed || null;
    const iso = this?.config?.children?.imgsettings?.children?.iso || null;
    const whitebalance = this?.config?.children?.imgsettings?.children?.whitebalance || null;

    const allowedCapabilities = [
      ...(aperture && aperture?.choices?.length > 1
        ? [
            {
              id: 'APERTURE',
              type: 'SELECT_RANGE',
              values: (aperture?.choices || []).map((e) => ({
                label: e,
                value: e,
              })),
              value: aperture?.value,
              canReset: false,
            },
          ]
        : []),

      ...(whitebalance && whitebalance?.choices?.length > 1
        ? [
            {
              id: 'WHITE_BALANCE',
              type: 'SELECT',
              values: (whitebalance?.choices || []).map((e) => ({
                label: e,
                value: e,
              })),
              value: whitebalance?.value || null,
              canReset: false,
            },
          ]
        : []),

      ...(shutterspeed && shutterspeed?.choices?.length > 1
        ? [
            {
              id: 'SHUTTER_SPEED',
              type: 'SELECT_RANGE',
              values: (shutterspeed?.choices || [])
                .reverse()
                .filter((e) => e !== 'bulb')
                .map((e) => ({
                  label: e,
                  value: e,
                })),
              value: shutterspeed?.value || null,
              canReset: false,
            },
          ]
        : []),

      ...(iso && iso?.choices?.length > 1
        ? [
            {
              id: 'ISO',
              type: 'SELECT_RANGE',
              values: (iso?.choices || [])
                .filter((e) => e?.toLowerCase() !== 'auto')
                .map((e) => ({
                  label: e,
                  value: e,
                })),
              value: iso?.value || null,
              canReset: false,
            },
          ]
        : []),
    ];

    return allowedCapabilities;
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}, onBinded = () => {}) {
    this.imageDOM = imageDOM;
    this.settings = settings;

    // Reset preview canvas size for preview
    imageDOM.width = 0;
    imageDOM.height = 0;

    videoDOM.pause();
    videoDOM.srcObject = null;

    await CameraAPI.showPicker();
    await CameraInstance.connect();

    this.getSupportedOps = await CameraInstance.getSupportedOps();
    this.config = await CameraInstance.getConfig();

    //console.log('Operations supported by the camera:', await CameraInstance.getSupportedOps());
    //console.log('Current configuration tree:', await CameraInstance.getConfig());

    await this.initPreview();

    if (typeof onBinded === 'function') {
      onBinded();
    }

    return true;
  }

  async takePicture() {
    if (!this?.getSupportedOps?.captureImage || !this?.getSupportedOps?.triggerCapture) {
      throw new Error('Capture image is not supported by this camera');
    }

    const file = await CameraInstance.captureImageAsFile();
    return { type: file.type, buffer: Buffer.from(await file.arrayBuffer()) };
  }

  async disconnect() {
    clearInterval(this.previewInterval);
    this.imageDOM.width = 0;
    this.imageDOM.height = 0;
    this.isActive = false;
  }
}

class WebGPhoto2Browser {
  static async getCameras() {
    return [
      {
        deviceId: 'GPHOTO',
        type: 'WEB',
        module: 'GPHOTO2',
        label: 'Connect an external USB camera',
      },
    ];
  }
}

export const Camera = WebGPhoto2;
export const CameraBrowser = WebGPhoto2Browser;
