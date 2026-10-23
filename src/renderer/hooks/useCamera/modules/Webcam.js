import isFirefox from '@braintree/browser-detection/is-firefox';

// Tried in order when the requested resolution refuses to start: some UVC cameras
// advertise a top mode (often their photo mode) their firmware cannot stream
const FALLBACK_RESOLUTIONS = [
  [4000, 3000],
  [3840, 2160],
  [2560, 1440],
  [1920, 1080],
  [1280, 720],
  [640, 480],
];

// Errors meaning "that mode did not start", worth retrying with a smaller one
const RETRYABLE_STREAM_ERRORS = ['AbortError', 'TimeoutError', 'NotReadableError', 'TrackStartError', 'OverconstrainedError', 'ConstraintNotSatisfiedError'];

// Budget for one attempt, from getUserMedia to the first frame. getUserMedia alone
// can hang ~10s on a mode the firmware cannot start, so we don't wait for it
const STREAM_ATTEMPT_TIMEOUT = 5000;

const stopStream = (stream) => {
  stream?.getTracks?.()?.forEach((track) => {
    track.stop();
    track.enabled = false;
  });
};

// Opens a stream and waits for its first frame, the only real proof the mode works:
// some cameras accept the constraints then never deliver anything. Whatever is still
// pending once the budget is spent gets released, so a dead mode doesn't keep the
// device busy for the next try.
const openStream = (constraints) =>
  new Promise((resolve, reject) => {
    let stream = null;
    let video = null;
    let settled = false;

    const timeout = setTimeout(() => {
      settled = true;
      stopStream(stream);
      if (video) {
        video.srcObject = null;
      }
      const err = new Error('CAMERA_STREAM_TIMEOUT');
      err.name = 'TimeoutError';
      reject(err);
    }, STREAM_ATTEMPT_TIMEOUT);

    navigator.mediaDevices.getUserMedia({ video: constraints, audio: false }).then(
      (opened) => {
        stream = opened;
        // Arrived after we gave up on it
        if (settled) {
          stopStream(stream);
          return;
        }

        // Internal video element used only for capture fallback
        video = document.createElement('video');
        video.muted = true;
        video.srcObject = stream;
        video.addEventListener(
          'canplay',
          () => {
            settled = true;
            clearTimeout(timeout);
            video.play();
            resolve({ stream, video });
          },
          { once: true }
        );
      },
      (err) => {
        clearTimeout(timeout);
        reject(err);
      }
    );
  });

// The attempts to make, best first: each size as a native mode (`exact`) before
// asking the browser to scale. `exact` says straight away when the camera has no
// such mode, where a plain constraint is never refused and costs a whole timeout.
const buildAttempts = (width, height) => {
  const target = width && height ? [width, height] : null;
  const smaller = FALLBACK_RESOLUTIONS.filter(([w, h]) => !target || w * h < target[0] * target[1]);
  // No target means "give me your best mode", which only makes sense unconstrained
  const attempts = target
    ? [
        { size: target, exact: true },
        { size: target, exact: false },
      ]
    : [{ size: null, exact: false }];
  for (const size of smaller) {
    attempts.push({ size, exact: true }, { size, exact: false });
  }

  return attempts;
};

class Webcam {
  constructor(deviceId = null) {
    this.stream = false;
    this.deviceId = deviceId;
    this.setStream = null;
    this._captureVideo = null;
    this.width = false;
    this.height = false;
    this._failedSizes = new Set();
  }

  get id() {
    return this?.deviceId || null;
  }

  _buildConstraints(size, exact = false) {
    const [width, height] = size || [];
    const deviceId = this.deviceId ? { exact: this.deviceId } : undefined;

    if (exact) {
      return { deviceId, width: { exact: width }, height: { exact: height } };
    }

    return {
      deviceId,
      ...(isFirefox()
        ? {
            width: { min: 1, ideal: width || 1920, max: 99999 },
            height: { min: 1, ideal: height || 1080, max: 99999 },
          }
        : {
            width: width || 99999,
            height: height || 99999,
            ...(!width && !height ? { frameRate: { min: 1, ideal: 15, max: 60 } } : {}),
          }),
    };
  }

  // Requested size first, then smaller ones, so a camera whose top mode cannot start
  // still gets a working stream instead of none at all
  async initStream(width = undefined, height = undefined) {
    let lastError = null;

    for (const { size, exact } of buildAttempts(width, height)) {
      try {
        const { stream, video } = await openStream(this._buildConstraints(size, exact));
        this.stream = stream;
        this._captureVideo = video;
        this.width = video.videoWidth;
        this.height = video.videoHeight;
        this._failedSizes.delete(`${this.width}×${this.height}`);
        if (this.setStream) {
          this.setStream('video', this.stream);
        }
        return;
      } catch (err) {
        lastError = err;

        // Not a native mode: the scaled attempt right after still has a chance
        if (exact && RETRYABLE_STREAM_ERRORS.includes(err?.name)) {
          continue;
        }

        if (size) {
          this._failedSizes.add(`${size[0]}×${size[1]}`);
        }
        if (!RETRYABLE_STREAM_ERRORS.includes(err?.name)) {
          break;
        }
        console.warn(`📷 Resolution ${size ? size.join('×') : 'max'} did not start (${err.name}), trying a lower one`);
      }
    }

    throw lastError || new Error('CAMERA_STREAM_UNAVAILABLE');
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
      // The list is built from the width/height maxima, which can cross into modes
      // the camera doesn't actually have: drop the ones we already saw fail
      if (this._failedSizes.has(`${width}×${height}`)) {
        continue;
      }
      if (width <= widthCapabilities.max && width >= widthCapabilities.min && height <= heightCapabilities.max && height >= heightCapabilities.min) {
        allowedResolutions.push(resolution);
      }
    }

    return allowedResolutions;
  }

  // Changing the resolution through applyConstraints asks the driver to restart the
  // source. On a mode the camera doesn't have, it fails with "Source failed to
  // restart" and leaves the track dead for good — every later call then fails too,
  // whatever the resolution. Reopening the stream is the only reliable way.
  async _applyResolution(value) {
    const [width, height] = `${value}`.split('×').map((e) => parseInt(e, 10));
    if (!width || !height) {
      return;
    }

    const previous = [this.width, this.height];
    this._release();

    try {
      await this.initStream(width, height);
    } catch (err) {
      console.error('📷 Resolution change failed, restoring the previous one', err);
      await this.initStream(...previous);
      throw err;
    }
  }

  async applyCapability(key, value) {
    console.log(`📷 Set ${key}=${value}`);

    if (key === 'video_stream_format') {
      return this._applyResolution(value);
    }

    if (!this?.stream?.getVideoTracks?.()?.[0]) {
      return null;
    }

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

    // Let the caller know when the camera refused the value, so a broken setting
    // doesn't get stored and replayed at every launch
    await mediaStreamTrack.applyConstraints({ advanced: toApply });

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

    // Start on the stored resolution when there is one: asking for the max mode
    // costs a long timeout on cameras whose top mode cannot stream
    const [width, height] = `${settings?.video_stream_format || ''}`.split('×').map((e) => parseInt(e, 10));

    await this.initStream(Number.isFinite(width) ? width : undefined, Number.isFinite(height) ? height : undefined);

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

  // Frees the device, most webcams only allow one open stream at a time
  _release() {
    stopStream(this.stream);
    this.stream = null;

    if (this._captureVideo) {
      this._captureVideo.pause();
      this._captureVideo.srcObject = null;
      this._captureVideo = null;
    }
  }

  async disconnect() {
    this._release();

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
