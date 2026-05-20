import { Camera as CameraAPI } from 'web-gphoto2';

const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const retry = async (func, { retries = 0, delay = 0 }) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await func();
      return data;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
    }
    await wait(delay);
  }
};

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
    if (key === 'image_quality') {
      console.log(`📷 Set imageformat=${value}`);
      await retry(() => this.CameraInstance.setConfigValue('imageformat', value), { retries: 5, delay: 50 });
    }

    if (key === 'aperture') {
      console.log(`📷 Set aperture=${value}`);
      await retry(() => this.CameraInstance.setConfigValue('aperture', value), { retries: 5, delay: 50 });
    }

    if (key === 'white_balance') {
      console.log(`📷 Set whitebalance=${value}`);
      await retry(() => this.CameraInstance.setConfigValue('whitebalance', value), { retries: 5, delay: 50 });
    }

    if (key === 'shutter_speed') {
      console.log(`📷 Set shutterspeed=${value}`);
      await retry(() => this.CameraInstance.setConfigValue('shutterspeed', value), { retries: 5, delay: 50 });
    }

    if (key === 'iso') {
      console.log(`📷 Set iso=${value}`);
      await retry(() => this.CameraInstance.setConfigValue('iso', value), { retries: 5, delay: 50 });
    }

    if (key === 'iso_auto') {
      const iso = this?.config?.children?.imgsettings?.children?.iso || null;
      const newValue = iso?.choices?.find((e) => !!(e?.toLowerCase() === 'auto') === !!value);
      console.log(`📷 Set iso=${newValue}`);
      await retry(() => this.CameraInstance.setConfigValue('iso', newValue), { retries: 5, delay: 50 });
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
    const imagequality = this?.config?.children?.imgsettings?.children?.imageformat || null;

    const allowedCapabilities = [
      ...(imagequality && imagequality?.choices?.length > 1
        ? [
            {
              id: 'image_quality',
              type: 'SELECT',
              values: (imagequality?.choices || [])
                .filter((e) => !e.split(' ').some((z) => z.toLowerCase() === 'raw'))
                .map((e) => ({
                  label: e,
                  value: e,
                })),
              value: imagequality?.value,
              canReset: false,
            },
          ]
        : []),

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

    // Set default drive mode
    try {
      const driveMode = this?.config?.children?.capturesettings?.children?.drivemode || null;
      if (driveMode) {
        const newValue = driveMode?.choices?.find((e) => e?.toLowerCase() === 'single') || driveMode?.choices?.[0] || null;
        if (newValue !== null) {
          console.log(`📷 Set drivemode=${newValue}`);
          await retry(() => this.CameraInstance.setConfigValue('drivemode', newValue), { retries: 5, delay: 50 });
        }
      }
    } catch (err) {
      console.warn(err);
    }

    // Set default aspect ratio
    try {
      const aspectRatio = this?.config?.children?.capturesettings?.children?.aspectratio || null;
      if (aspectRatio) {
        const newValue = aspectRatio?.choices?.find((e) => e?.toLowerCase() === '3:2') || aspectRatio?.choices?.[0] || null;
        if (newValue !== null) {
          console.log(`📷 Set aspectratio=${newValue}`);
          await retry(() => this.CameraInstance.setConfigValue('aspectratio', newValue), { retries: 5, delay: 50 });
        }
      }
    } catch (err) {
      console.warn(err);
    }

    // Set default live view size
    try {
      const liveViewSize = this?.config?.children?.capturesettings?.children?.liveviewsize || null;
      if (liveViewSize) {
        const newValue = liveViewSize?.choices?.find((e) => e?.toLowerCase() === 'large') || liveViewSize?.choices?.[0] || null;
        if (newValue !== null) {
          console.log(`📷 Set liveviewsize=${newValue}`);
          await retry(() => this.CameraInstance.setConfigValue('liveviewsize', newValue), { retries: 5, delay: 50 });
        }
      }
    } catch (err) {
      console.warn(err);
    }

    // Set storage to RAM
    try {
      const captureTarget = this?.config?.children?.settings?.children?.capturetarget || null;
      if (captureTarget) {
        const newValue = captureTarget?.choices?.find((e) => e?.toLowerCase().includes('ram')) || captureTarget?.choices?.[0] || null;
        if (newValue !== null) {
          console.log(`📷 Set capturetarget=${newValue}`);
          await retry(() => this.CameraInstance.setConfigValue('capturetarget', newValue), { retries: 5, delay: 50 });
        }
      }
    } catch (err) {
      console.warn(err);
    }

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
