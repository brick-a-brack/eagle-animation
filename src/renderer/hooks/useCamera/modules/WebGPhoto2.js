import { Camera as CameraAPI } from 'web-gphoto2';

class WebGPhoto2 {
  constructor() {
    this.CameraInstance = new CameraAPI();

    this.getSupportedOps = {
      captureAudio: false,
      captureImage: false,
      capturePreview: false,
      captureVideo: false,
      config: false,
      triggerCapture: false,
    };

    this.lastPreviewUrl = null;

    this.config = null;

    this.imageDOM = null;
    this.previewTimeout = null;
  }

  get id() {
    return null;
  }

  initPreview() {
    this.isActive = true;
    clearTimeout(this.previewTimeout);

    const refreshFrame = async () => {
      const blob = await this.CameraInstance.capturePreviewAsBlob();
      const newUrl = URL.createObjectURL(blob);
      this.imageDOM.src = newUrl;

      if (this.lastPreviewUrl) {
        URL.revokeObjectURL(this.lastPreviewUrl);
      }
      this.lastPreviewUrl = newUrl;
      this.previewTimeout = setTimeout(refreshFrame, 30);
    };

    refreshFrame();
  }

  async applyCapability(key, value) {
    if (key === 'aperture') {
      await this.CameraInstance.setConfigValue('aperture', value);
    }

    if (key === 'white_balance') {
      await this.CameraInstance.setConfigValue('whitebalance', value);
    }

    if (key === 'shutter_speed') {
      await this.CameraInstance.setConfigValue('shutterspeed', value);
    }

    if (key === 'iso') {
      await this.CameraInstance.setConfigValue('iso', value);
    }

    if (key === 'iso_auto') {
      const iso = this?.config?.children?.imgsettings?.children?.iso || null;
      const newValue = iso?.choices?.find((e) => !!(e?.toLowerCase() === 'auto') === !!value);
      await this.CameraInstance.setConfigValue('iso', newValue);
    }

    // Refresh config
    this.config = await this.CameraInstance.getConfig();

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
              id: 'aperture',
              type: 'RANGE_SELECT',
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
              id: 'white_balance',
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
              id: 'shutter_speed',
              type: 'RANGE_SELECT',
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

      ...(iso && iso?.choices?.some((e) => e?.toLowerCase() === 'auto')
        ? [
            {
              id: 'iso_auto',
              type: 'BOOLEAN',
              value: iso?.value?.toLowerCase() === 'auto',
              canReset: false,
            },
          ]
        : []),

      ...(iso && iso?.choices?.length > 1
        ? [
            {
              id: 'iso',
              type: 'RANGE_SELECT',
              values: (iso?.choices || [])
                .filter((e) => e?.toLowerCase() !== 'auto')
                .map((e) => ({
                  label: e,
                  value: e,
                })),
              value: iso?.value || null,
              canReset: false,
              disabled: iso?.value?.toLowerCase() === 'auto',
            },
          ]
        : []),
    ];

    return allowedCapabilities;
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}) {
    this.imageDOM = imageDOM;
    this.settings = settings;

    // Disable video stream
    videoDOM.src = '';
    imageDOM.src = '';

    await CameraAPI.showPicker();
    await this.CameraInstance.connect();

    this.getSupportedOps = await this.CameraInstance.getSupportedOps();
    this.config = await this.CameraInstance.getConfig();

    // console.log('Operations supported by the camera:', await this.CameraInstance.getSupportedOps());
    // console.log('Current configuration tree:', await this.CameraInstance.getConfig());

    await this.initPreview();

    return true;
  }

  async takePicture() {
    if (!this?.getSupportedOps?.captureImage || !this?.getSupportedOps?.triggerCapture) {
      throw new Error('Capture image is not supported by this camera');
    }

    const file = await this.CameraInstance.captureImageAsFile();
    return { type: file.type, buffer: Buffer.from(await file.arrayBuffer()) };
  }

  async disconnect() {
    clearTimeout(this.previewTimeout);
    if (this.imageDOM) {
      this.imageDOM.src = '';
    }
    if (this.videoDOM) {
      this.videoDOM.srcObject = null;
      this.videoDOM.src = '';
    }
    this.isActive = false;

    // Disconnect don't seem to work properly if we want to reconnect, can crash the browser
    // await this.CameraInstance.disconnect();
    // this.CameraInstance = new CameraAPI();
  }
}

class WebGPhoto2Browser {
  static async getCameras() {
    return [
      {
        deviceId: 'GPHOTO',
        module: 'GPHOTO2',
        label: 'Connect an external USB camera',
      },
    ];
  }
}

export const Camera = WebGPhoto2;
export const CameraBrowser = WebGPhoto2Browser;
