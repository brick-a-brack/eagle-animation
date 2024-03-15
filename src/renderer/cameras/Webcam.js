import { isFirefox } from '@braintree/browser-detection';

class Webcam {
  constructor(deviceId = null) {
    this.stream = false;
    this.deviceId = deviceId;
    this.video = false;
    this.width = false;
    this.height = false;
  }

  get id() {
    return this?.context?.id || null;
  }

  initPreview() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      // Get preview stream
      this.stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: this.deviceId ? { exact: this.deviceId } : undefined,

            ...(isFirefox()
              ? {
                  width: { min: 640, ideal: 1920, max: 99999 },
                  height: { min: 480, ideal: 1080, max: 99999 },
                }
              : {
                  width: 99999, // Force to get the best quality available (Chromium only)
                  height: 99999, // Force to get the best quality available (Chromium only)
                  frameRate: this.settings?.forceMaxQuality ? undefined : 15,
                }),
          },
          audio: false,
        })
        .catch((err) => console.error('failed', err));

      console.log('[CAMERA]', 'Init', this.video, this.stream);
      window.__DEBUG_DEVICE = this.stream;

      // Launch preview
      if (this.video) {
        this.video.srcObject = this.stream;
        this.video.addEventListener('canplay', () => {
          this.video.play();
          this.width = this.video.videoWidth;
          this.height = this.video.videoHeight;
          resolve();
        });

        console.log('[CAMERA]', 'Ready');
      }
    });
  }

  async canResetCapabilities() {
    const capabilities = await this.getCapabilities();
    return capabilities.length > 0;
  }

  async resetCapabilities() {
    const mediaStreamTrack = this.stream.getVideoTracks()[0];
    await mediaStreamTrack
      .applyConstraints({
        advanced: [
          {
            brightness: 128,
            contrast: 128,
            colorTemperature: 2200,
            exposureCompensation: 0,
            exposureMode: 'continuous',
            exposureTime: 625,
            focusDistance: 0,
            focusMode: 'continuous',
            pan: 0,
            saturation: 128,
            sharpness: 128,
            tilt: 0,
            whiteBalanceMode: 'continuous',
            zoom: 100,
          },
        ],
      })
      .catch(console.error);
    return null;
  }

  async applyCapability(key, value) {
    const settings = this?.stream?.getVideoTracks()?.[0]?.getSettings() || {};
    const mediaStreamTrack = this.stream.getVideoTracks()[0];

    const keyNames = {
      FOCUS_MODE: 'focusMode',
      FOCUS_DISTANCE: 'focusDistance',
      BRIGHTNESS: 'brightness',
      CONTRAST: 'contrast',
      SATURATION: 'saturation',
      SHARPNESS: 'sharpness',
      WHITE_BALANCE_MODE: 'whiteBalanceMode',
      COLOR_TEMPERATURE: 'colorTemperature',
      EXPOSURE_MODE: 'exposureMode',
      EXPOSURE_COMPENSATION: 'exposureCompensation',
      EXPOSURE_TIME: 'exposureTime',
      ZOOM: 'zoom',
      ZOOM_POSITION_Y: 'tilt',
      ZOOM_POSITION_X: 'pan',
    };

    const cap = keyNames[key] || null;
    const parsedValue = ['FOCUS_MODE', 'WHITE_BALANCE_MODE', 'EXPOSURE_MODE'].includes(key) ? (value ? 'continuous' : 'manual') : value;

    const toApply = [
      {
        [cap]: parsedValue,
        ...(cap === 'focusMode' ? { focusDistance: settings.focusDistance } : {}),
        ...(cap === 'exposureMode'
          ? {
              exposureCompensation: settings.exposureCompensation,
              exposureTime: settings.exposureTime,
            }
          : {}),
        ...(cap === 'whiteBalanceMode' ? { colorTemperature: settings.colorTemperature } : {}),
        ...(cap === 'zoom' ? { pan: settings.pan, tilt: settings.tilt } : {}),
      },
    ];

    //console.log('[CAMERA]', 'Apply setting', cap, value);
    await mediaStreamTrack
      .applyConstraints({
        advanced: toApply,
      })
      .catch(console.error);

    return null;
  }

  async getCapabilities() {
    const settings = this?.stream?.getVideoTracks()?.[0]?.getSettings() || {};
    const capabilities = this?.stream?.getVideoTracks()?.[0] && typeof this.stream.getVideoTracks()[0].getCapabilities === 'function' ? this.stream.getVideoTracks()[0].getCapabilities() : [];

    const allowedCapabilities = [
      ...(capabilities.focusMode
        ? [
            {
              id: 'FOCUS_MODE',
              type: 'SWITCH',
              values: capabilities.focusMode.map((e) => ({ label: e, value: e })),
              value: settings.focusMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.focusDistance && settings.focusMode === 'manual'
        ? [
            {
              id: 'FOCUS_DISTANCE',
              type: 'RANGE',
              ...capabilities.focusDistance,
              value: settings.focusDistance,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.brightness
        ? [
            {
              id: 'BRIGHTNESS',
              type: 'RANGE',
              ...capabilities.brightness,
              value: settings.brightness,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.contrast
        ? [
            {
              id: 'CONTRAST',
              type: 'RANGE',
              ...capabilities.contrast,
              value: settings.contrast,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.saturation
        ? [
            {
              id: 'SATURATION',
              type: 'RANGE',
              ...capabilities.saturation,
              value: settings.saturation,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.sharpness
        ? [
            {
              id: 'SHARPNESS',
              type: 'RANGE',
              ...capabilities.sharpness,
              value: settings.sharpness,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.whiteBalanceMode
        ? [
            {
              id: 'WHITE_BALANCE_MODE',
              type: 'SWITCH',
              value: settings.whiteBalanceMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.colorTemperature && settings.whiteBalanceMode === 'manual'
        ? [
            {
              id: 'COLOR_TEMPERATURE',
              type: 'RANGE',
              ...capabilities.colorTemperature,
              value: settings.colorTemperature,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.exposureMode
        ? [
            {
              id: 'EXPOSURE_MODE',
              type: 'SWITCH',
              value: settings.exposureMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.exposureCompensation && settings.exposureMode === 'manual'
        ? [
            {
              id: 'EXPOSURE_COMPENSATION',
              type: 'RANGE',
              ...capabilities.exposureCompensation,
              value: settings.exposureCompensation,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.exposureTime && settings.exposureMode === 'manual'
        ? [
            {
              id: 'EXPOSURE_TIME',
              type: 'RANGE',
              ...capabilities.exposureTime,
              value: settings.exposureTime,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.zoom
        ? [
            {
              id: 'ZOOM',
              type: 'RANGE',
              ...capabilities.zoom,
              value: settings.zoom,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.zoom && capabilities.tilt && settings.zoom > capabilities?.zoom?.min
        ? [
            {
              id: 'ZOOM_POSITION_Y',
              type: 'RANGE',
              ...capabilities.tilt,
              value: settings.tilt,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.zoom && capabilities.pan && settings.zoom > capabilities?.zoom?.min
        ? [
            {
              id: 'ZOOM_POSITION_X',
              type: 'RANGE',
              ...capabilities.pan,
              value: settings.pan,
              canReset: true,
            },
          ]
        : []),
    ];

    return allowedCapabilities;
  }

  connect({ videoDOM } = { videoDOM: false }, settings = {}) {
    this.video = videoDOM;
    this.settings = settings;
    return this.initPreview();
  }

  async batteryStatus() {
    return null;
  }

  async takePicture() {
    if (!this.stream) {
      console.error('[Camera]', 'Not correctly initialized!');
      return;
    }

    if (typeof ImageCapture !== 'undefined') {
      const imageCapture = new ImageCapture(this.stream.getVideoTracks()[0]);
      const bitmap =
        (await imageCapture
          .takePhoto({})
          .then((blob) => createImageBitmap(blob))
          .catch(() => null)) || (await imageCapture.grabFrame({}).catch(() => null));

      if (!bitmap) {
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { alpha: false });
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
      //const context = canvas.getContext("bitmaprenderer");
      //context?.transferFromImageBitmap(bitmap);
      return canvas;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      const context = canvas.getContext('2d', { alpha: false });
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      return canvas;
    }
  }

  async disconnect() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    }
  }
}

class WebcamBrowser {
  static async getCameras() {
    try {
      const streams = await navigator.mediaDevices.enumerateDevices();
      return streams
        .filter((stream) => stream.kind === 'videoinput')
        .map((stream) => ({
          deviceId: stream.deviceId,
          type: 'WEB',
          module: 'WEBCAM',
          label: stream.label || 'Untitled',
        }));
    } catch (err) {
      console.error(err);
    }
    return [];
  }
}

export const Camera = Webcam;
export const CameraBrowser = WebcamBrowser;
