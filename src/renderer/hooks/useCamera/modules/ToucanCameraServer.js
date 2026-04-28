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
    return [];
  }

  async connect({ videoDOM, imageDOM } = { videoDOM: false, imageDOM: false }, settings = {}, onBinded = () => {}) {
    await fetch(`http://127.0.0.1:8080/cameras/${this.deviceId}/connect`, {
      method: 'PUT',
    });

this.imageDOM = imageDOM;
this.videoDOM = videoDOM;

    // Reset preview canvas size for preview
    imageDOM.width = 0;
    imageDOM.height = 0;
    imageDOM.style.opacity = 0;

    imageDOM.src = `http://127.0.0.1:8080/cameras/${this.deviceId}/liveview`;

    imageDOM.width = imageDOM.naturalWidth;
    imageDOM.height = imageDOM.naturalHeight;
    imageDOM.style.opacity = 1;



    videoDOM.src = '';
    videoDOM.width = 0;
    videoDOM.height = 0;
    videoDOM.style.opacity = 0;


    if (typeof onBinded === 'function') {
      onBinded();
    }

    return true;
  }

  async takePicture() {
    return { type: 'image/jpeg', buffer: null };
  }

  async disconnect() {
    await fetch(`http://127.0.0.1:8080/cameras/${this.deviceId}/disconnect`, {
      method: 'PUT',
    });

    this.imageDOM.style.opacity = 0;
    this.imageDOM.src = null;
  }
}

class ToucanCameraServerBrowser {
  static async getCameras() {
    try {
      const devices = await fetch('http://127.0.0.1:8080/cameras').then((res) => res.json());
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
