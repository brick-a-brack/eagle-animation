import { Camera as InternalCamera, CameraBrowser as InternalCameraBrowser, CameraProperty, ImageQuality, Option, watchCameras } from '@brick-a-brack/napi-canon-cameras';

// Allow event listing
watchCameras();

const cameraBrowser = new InternalCameraBrowser();
const MODULE_ID = 'EDSDK';

class CanonCameraBrowser {
  static async getCameras() {
    try {
      const data = await cameraBrowser.getCameras();
      return [...data].map((camera) => ({
        module: MODULE_ID,
        label: camera.description,
        deviceId: camera.portName,
      }));
    } catch (err) {
      console.error(err);
    }
    return [];
  }
}

class CanonCamera {
  constructor(deviceId, context = {}) {
    this.deviceId = deviceId;
    this.context = context;

    // NAPI Canon camera
    this.canonCamera = new InternalCamera(this.deviceId);

    // Last captured frame
    this.lastFrame = null;

    // Live mode
    this.liveModeEnabled = false;
    this.liveModeClock = null;

    // Catch events
    this.canonCamera.setEventHandler((eventName, event) => {
      if (event.file && [InternalCamera.EventName.FileCreate, InternalCamera.EventName.DownloadRequest].includes(eventName)) {
        this.lastFrame = `${event.file.downloadToString()}`;
      }
    });

    // Camera capabilities
    this.capabilities = [];
  }

  async connect(liveModeCallback = null) {
    // Save live mode callback
    this.liveModeCallback = liveModeCallback;

    // Create persistent connection
    this.canonCamera.connect(true);

    // Set properties
    this.canonCamera.setProperties({
      [CameraProperty.ID.SaveTo]: Option.SaveTo.Host,
      [CameraProperty.ID.ImageQuality]: ImageQuality.ID.LargeJPEGFine,
      [CameraProperty.ID.WhiteBalance]: Option.WhiteBalance.Fluorescent,
      [CameraProperty.ID.AFMode]: Option.AFMode.ManualFocus,
    });

    // Fetch live mode picture
    this.liveModeEnabled = true;
    clearInterval(this.liveModeClock);
    if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
      this.canonCamera.startLiveView();
      this.liveModeClock = setInterval(() => {
        if (this.liveModeEnabled) {
          try {
            const image = this.canonCamera.getLiveViewImage();
            if (image) {
              this.liveModeCallback(image.getDataURL());
            }
          } catch (e) {} // eslint-disable-line no-empty
        }
      }, 100);
    }

    // Fetch capabilities
    this.fetchCapabilities();
  }

  async fetchCapabilities() {
    const tmpCapabilities = [];
    for (const propertyID of Object.values(CameraProperty.ID)) {
      const p = this.canonCamera.getProperty(propertyID);
      if (!p.available) {
        continue;
      }
      try {
        tmpCapabilities.push({ label: p.label, identifier: p.identifier, value: p.value, allowedValues: p.allowedValues });
      } catch (e) {} // eslint-disable-line no-empty
    }
    this.capabilities = tmpCapabilities;
  }

  async batteryStatus() {
    const Battery = this.capabilities.find((c) => c.label === 'BatteryLevel') || null;
    if (!Battery) {
      return null;
    }
    return Battery?.value < 0 || Battery?.value > 100 ? 'AC' : Number(Battery?.value);
  }

  async disconnect() {
    clearInterval(this.liveModeClock);
    if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
      this.canonCamera.stopLiveView();
      this.liveModeEnabled = false;
    }

    this.canonCamera.disconnect();
  }

  async takePicture() {
    this.canonCamera.connect(true);
    this.liveModeEnabled = false;
    return new Promise((resolve, reject) => {
      const clock = setInterval(() => {
        if (this.lastFrame !== null) {
          clearInterval(clock);
          resolve({ type: 'image/jpeg', buffer: Buffer.from(this.lastFrame, 'base64') });
          this.lastFrame = null;
          this.liveModeEnabled = true;
        }
      }, 100);

      try {
        this.canonCamera.takePicture();
      } catch (err) {
        clearInterval(clock);
        this.lastFrame = null;
        this.liveModeEnabled = true;
        reject(err);
      }
    });
  }

  async applyCapability(key, value) {
    if (key === 'APERTURE') {
      this.canonCamera.setProperties({ [CameraProperty.ID.Av]: Number(value) });
    }

    if (key === 'WHITE_BALANCE') {
      this.canonCamera.setProperties({ [CameraProperty.ID.WhiteBalance]: Number(value) });
    }

    if (key === 'SHUTTER_SPEED') {
      this.canonCamera.setProperties({ [CameraProperty.ID.Tv]: Number(value) });
    }

    if (key === 'ISO') {
      this.canonCamera.setProperties({ [CameraProperty.ID.ISOSpeed]: Number(value) });
    }

    return null;
  }

  resetCapabilities() {
    return null;
  }

  getCapabilities() {
    const ShutterSpeed = this.capabilities.find((c) => c.label === 'Tv') || null; // DF 1st line
    const Aperture = this.capabilities.find((c) => c.label === 'Av') || null; // DF 2nd line
    const ISO = this.capabilities.find((c) => c.label === 'ISOSpeed') || null; // DF 3rd line
    const WhiteBalance = this.capabilities.find((c) => c.label === 'WhiteBalance') || null;

    const allowedCapabilities = [
      ...(Aperture
        ? [
            {
              id: 'APERTURE',
              type: 'SELECT_RANGE',
              values: Aperture.allowedValues
                .sort((a, b) => a.aperture - b.aperture)
                .map((e) => ({
                  label: e.label,
                  value: e.value,
                  aperture: e.aperture,
                })),
              value: Aperture.value.value,
              canReset: false,
            },
          ]
        : []),
      ...(WhiteBalance
        ? [
            {
              id: 'WHITE_BALANCE',
              type: 'SELECT',
              values: WhiteBalance.allowedValues
                // .filter(e => e.label.startsWith('WhiteBalance.'))
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((e) => ({
                  label: e.label.replace('WhiteBalance.', ''),
                  value: e.value,
                })),
              value: WhiteBalance.value.label.startsWith('WhiteBalance.') ? WhiteBalance.value.value : null,
              canReset: false,
            },
          ]
        : []),

      ...(ShutterSpeed
        ? [
            {
              id: 'SHUTTER_SPEED',
              type: 'SELECT_RANGE',
              values: ShutterSpeed.allowedValues
                .filter((e) => Boolean(e.seconds))
                .sort((a, b) => a.seconds - b.seconds)
                .map((e) => ({
                  label: e.label,
                  value: e.value,
                  speed: e.seconds,
                })),
              value: ShutterSpeed.value.value || null,
              canReset: false,
            },
          ]
        : []),

      ...(ISO
        ? [
            {
              id: 'ISO',
              type: 'SELECT_RANGE',
              values: ISO.allowedValues
                .filter((e) => e.value > 0)
                .sort((a, b) => a.value - b.value)
                .map((e) => ({
                  label: e.label,
                  value: e.value,
                  sensitivity: e.sensitivity,
                })),
              value: ISO.value.value > 0 ? ISO.value.value : null,
              canReset: false,
            },
          ]
        : []),
    ];

    return allowedCapabilities;
  }
}

export const Camera = CanonCamera;
export const CameraBrowser = CanonCameraBrowser;
