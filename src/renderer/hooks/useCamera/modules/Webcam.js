import isFirefox from '@braintree/browser-detection/is-firefox';

class Webcam {
  constructor(deviceId = null) {
    this.stream = false;
    this.deviceId = deviceId;
    this.setStream = null;
    this._captureVideo = null;
    this.width = false;
    this.height = false;
  }

  get id() {
    return this?.deviceId || null;
  }

  initStream(width = undefined, height = undefined) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      this.stream = await navigator.mediaDevices
        .getUserMedia({
          video: {
            deviceId: this.deviceId ? { exact: this.deviceId } : undefined,
            ...(isFirefox()
              ? {
                  width: { min: 1, ideal: 1920, max: 99999 },
                  height: { min: 1, ideal: 1080, max: 99999 },
                }
              : {
                  width: width || 99999,
                  height: height || 99999,
                  ...(!width && !height ? { frameRate: { min: 1, ideal: 15, max: 60 } } : {}),
                }),
          },
          audio: false,
        })
        .catch(reject);

      // Internal video element used only for capture fallback
      this._captureVideo = document.createElement('video');
      this._captureVideo.muted = true;
      this._captureVideo.srcObject = this.stream;
      this._captureVideo.addEventListener('canplay', () => {
        this._captureVideo.play();
        this.width = this._captureVideo.videoWidth;
        this.height = this._captureVideo.videoHeight;
        if (this.setStream) {
          this.setStream('video', this.stream);
        }
        resolve();
      });
    });
  }

  _listResolutions(capabilities) {
    const allowedResolutions = [];
    const heightCapabilities = capabilities.height || {};
    const widthCapabilities = capabilities.width || {};

    const list = [
      ...new Set([
        `${widthCapabilities.max}×${heightCapabilities.max}`,
        '7680×4320',
        '3840×2160',
        '2560×1440',
        '2304×1536',
        '2304×1296',
        '1920×1080',
        '1600×896',
        '1280×720',
        '960×720',
        '1024×576',
        '800×600',
        '864×480',
        '800×448',
        '640×480',

        // The following resolutions are not supported by Firefox (Lowest is 640×480) but can be proposed by Chromium browsers
        ...(!isFirefox() ? ['640×360', '432×240', '352×288', '320×240', '320×180', '176×144', '160×120', '160×90'] : []),
      ]),
    ].map((e) => e.split('×').map((e) => parseInt(e, 10)));

    for (const resolution of list) {
      const [width, height] = resolution;
      if (width <= widthCapabilities.max && width >= widthCapabilities.min && height <= heightCapabilities.max && height >= heightCapabilities.min) {
        allowedResolutions.push(resolution);
      }
    }

    return allowedResolutions;
  }

  async applyCapability(key, value) {
    console.log(`📷 Set ${key}=${value}`);

    const settings = this?.stream?.getVideoTracks()?.[0]?.getSettings() || {};
    const mediaStreamTrack = this.stream.getVideoTracks()[0];
    const capabilities = this?.stream?.getVideoTracks()?.[0] && typeof this.stream.getVideoTracks()[0].getCapabilities === 'function' ? this.stream.getVideoTracks()[0].getCapabilities() : {};

    const keyNames = {
      focus_auto: 'focusMode',
      focus: 'focusDistance',
      brightness: 'brightness',
      contrast: 'contrast',
      saturation: 'saturation',
      sharpness: 'sharpness',
      white_balance_auto: 'whiteBalanceMode',
      white_balance: 'colorTemperature',
      exposure_auto: 'exposureMode',
      gain: 'exposureCompensation',
      exposure: 'exposureTime',
      zoom: 'zoom',
      tilt: 'tilt',
      pan: 'pan',
      iso: 'iso',
    };

    const cap = keyNames[key] || null;
    const parsedValue = ['focus_auto', 'white_balance_auto', 'exposure_auto'].includes(key) ? (value ? 'continuous' : 'manual') : value;

    const toApply = [
      {
        ...(key === 'video_stream_format'
          ? {
              width: parseInt(value.split('×')[0], 10),
              height: parseInt(value.split('×')[1], 10),
              frameRate: { min: 1, ideal: 15, max: 60 },
              resizeMode: 'crop-and-scale',
            }
          : {}),
        ...(cap === 'focusMode' ? { focusDistance: settings.focusDistance } : {}),
        ...(cap === 'focusDistance' ? { focusMode: settings.focusMode } : {}),
        ...(cap === 'exposureTime'
          ? {
              exposureMode: settings.exposureMode,
              exposureCompensation: settings.exposureCompensation,
            }
          : {}),
        //...(cap === 'exposureCompensation' ? { exposureCompensation: settings.exposureCompensation } : {}),
        ...(cap === 'exposureMode'
          ? {
              ...(capabilities.exposureCompensation ? { exposureCompensation: settings.exposureCompensation } : {}),
              ...(capabilities.exposureTime ? { exposureTime: settings.exposureTime } : {}),
              ...(capabilities.iso ? { iso: settings.iso } : {}),
            }
          : {}),
        ...(cap === 'whiteBalanceMode'
          ? {
              ...(capabilities.colorTemperature ? { colorTemperature: settings.colorTemperature } : {}),
            }
          : {}),
        ...(cap === 'zoom'
          ? {
              ...(capabilities.pan ? { pan: settings.pan } : {}),
              ...(capabilities.tilt ? { tilt: settings.tilt } : {}),
            }
          : {}),
        [cap]: parsedValue,
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
    if (!this?.stream) {
      return [];
    }

    const settings = this?.stream?.getVideoTracks()?.[0]?.getSettings() || {};
    const capabilities = this?.stream?.getVideoTracks()?.[0] && typeof this.stream.getVideoTracks()[0].getCapabilities === 'function' ? this.stream.getVideoTracks()[0].getCapabilities() : {};

    const allowedCapabilities = [
      {
        id: 'video_stream_format',
        type: 'SELECT',
        values: this._listResolutions(capabilities).map((e) => ({ label: `${e[0]}×${e[1]}`, value: `${e[0]}×${e[1]}` })) || [
          { label: `${settings.width}×${settings.height}`, value: `${settings.width}×${settings.height}` },
        ],
        value: `${settings.width}×${settings.height}`,
        canReset: false,
      },
      ...(capabilities.focusMode
        ? [
            {
              id: 'focus_auto',
              type: 'BOOLEAN',
              values: capabilities.focusMode.map((e) => ({ label: e, value: e })),
              value: settings.focusMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.focusDistance
        ? [
            {
              id: 'focus',
              type: 'RANGE',
              ...capabilities.focusDistance,
              value: settings.focusDistance,
              canReset: true,
              disabled: settings.focusMode !== 'manual',
            },
          ]
        : []),

      ...(capabilities.brightness
        ? [
            {
              id: 'brightness',
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
              id: 'contrast',
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
              id: 'saturation',
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
              id: 'sharpness',
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
              id: 'white_balance_auto',
              type: 'BOOLEAN',
              value: settings.whiteBalanceMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.colorTemperature
        ? [
            {
              id: 'white_balance',
              type: 'RANGE',
              ...capabilities.colorTemperature,
              value: settings.colorTemperature,
              canReset: true,
              disabled: settings.whiteBalanceMode !== 'manual',
            },
          ]
        : []),

      ...(capabilities.exposureMode
        ? [
            {
              id: 'exposure_auto',
              type: 'BOOLEAN',
              value: settings.exposureMode === 'continuous',
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.exposureCompensation
        ? [
            {
              id: 'gain',
              type: 'RANGE',
              ...capabilities.exposureCompensation,
              value: settings.exposureCompensation,
              canReset: true,
              disabled: settings.exposureMode !== 'manual',
            },
          ]
        : []),

      ...(capabilities.iso
        ? [
            {
              id: 'iso',
              type: 'RANGE',
              ...capabilities.iso,
              value: settings.iso,
              canReset: true,
              disabled: settings.exposureMode !== 'manual',
            },
          ]
        : []),

      ...(capabilities.exposureTime
        ? [
            {
              id: 'exposure',
              type: 'RANGE',
              ...capabilities.exposureTime,
              value: settings.exposureTime,
              canReset: true,
              disabled: settings.exposureMode !== 'manual',
            },
          ]
        : []),

      ...(capabilities.zoom
        ? [
            {
              id: 'zoom',
              type: 'RANGE',
              ...capabilities.zoom,
              value: settings.zoom,
              canReset: true,
            },
          ]
        : []),

      ...(capabilities.zoom && capabilities.tilt
        ? [
            {
              id: 'tilt',
              type: 'RANGE',
              ...capabilities.tilt,
              value: settings.tilt,
              canReset: true,
              disabled: settings.zoom === capabilities?.zoom?.min,
            },
          ]
        : []),

      ...(capabilities.zoom && capabilities.pan
        ? [
            {
              id: 'pan',
              type: 'RANGE',
              ...capabilities.pan,
              value: settings.pan,
              canReset: true,
              disabled: settings.zoom === capabilities?.zoom?.min,
            },
          ]
        : []),
    ];

    return allowedCapabilities;
  }

  async connect({ setStream } = {}, settings = {}) {
    this.setStream = setStream;
    this.settings = settings;

    await this.initStream();

    return true;
  }

  async takePicture() {
    if (!this.stream) {
      console.error('[Camera]', 'Not correctly initialized!');
      return;
    }

    if (typeof ImageCapture !== 'undefined') {
      const imageCapture = new ImageCapture(this.stream.getVideoTracks()[0]);
      const arrBuffer = await imageCapture
        .takePhoto({})
        .then((blob) => blob.arrayBuffer())
        .catch(() => null);

      if (arrBuffer) {
        return { type: 'image/png', buffer: arrBuffer };
      }

      const bitmap = await imageCapture.grabFrame({}).catch(() => null);
      if (!bitmap) {
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { alpha: false });
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
      return { type: 'image/png', buffer: canvas };
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = this._captureVideo.videoWidth;
      canvas.height = this._captureVideo.videoHeight;
      const context = canvas.getContext('2d', { alpha: false });
      context.drawImage(this._captureVideo, 0, 0, canvas.width, canvas.height);
      return { type: 'image/png', buffer: canvas };
    }
  }

  async disconnect() {
    // Stop the capture tracks first…
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      this.stream = null;
    }

    // Clear object
    if (this._captureVideo) {
      this._captureVideo.pause();
      this._captureVideo.srcObject = null;
      this._captureVideo = null;
    }

    // Release the display element owned by PreviewStream too.
    if (this.setStream) {
      this.setStream(null);
      this.setStream = null;
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
