class BirdCameraServer {
  constructor(deviceId = null) {
    this.deviceId = deviceId;
    /*this.stream = false;
    this.video = false;
    this.width = false;
    this.height = false;*/
  }

  get id() {
    return this?.deviceId || null;
  }

  initPreview() {
    /* // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
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
        .catch(reject);

      //console.log('[CAMERA]', 'Init', this.video, this.stream);
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

        //console.log('[CAMERA]', 'Ready');
      }
    });*/
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
    return [];
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}, onBinded = () => {}) {
    await fetch(`http://127.0.0.1:8080/cameras/${this.deviceId}/connect`, {
      method: 'PUT',
    });
    /*
    this.video = videoDOM;
    this.settings = settings;

    // Reset preview canvas size for preview
    imageDOM.width = 0;
    imageDOM.height = 0;

    await this.initPreview();

    imageDOM.width = 0;
    imageDOM.height = 0;

    if (typeof onBinded === 'function') {
      onBinded();
    }
*/
    return true;
  }

  async takePicture() {
    return { type: 'image/jpeg', buffer: null };
  }

  async disconnect() {
    await fetch(`http://127.0.0.1:8080/cameras/${this.deviceId}/disconnect`, {
      method: 'PUT',
    });

    /*if (this.video) {
      this.video.src = null;
      this.video.srcObject = null;
      if (typeof this.video?.stop === 'function') {
        this.video.stop();
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
    }*/
  }
}

class BirdCameraServerBrowser {
  static async getCameras() {
    try {
      const devices = await fetch('http://127.0.0.1:8080/cameras').then((res) => res.json());
      return devices.map((device) => ({
        id: device.id,
        label: device.label,
        type: 'WEB',
        module: 'BIRD_CAMERA_SERVER',
      }));
    } catch (err) {
      console.error(err);
    }
    return [];
  }
}

export const Camera = BirdCameraServer;
export const CameraBrowser = BirdCameraServerBrowser;
