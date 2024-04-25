class NativeProxy {
  constructor(deviceId = null, context = {}) {
    this.context = context;
    this.deviceId = deviceId;
    this.video = null;
    this.settings = null;
  }

  get id() {
    return this?.context?.id || null;
  }

  _drawLivePreview(dom, src) {
    return new Promise((resolve) => {
      if (!dom || !src) {
        return resolve(false);
      }

      const ctx = dom.getContext('2d');
      const img = new Image();
      img.addEventListener('error', () => {
        ctx.clearRect(0, 0, dom.width, dom.height);
        resolve(true);
      });
      img.addEventListener(
        'load',
        function () {
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

  async initPreview() {
    window.EAEvents('LIVE_VIEW_DATA', (evt, args) => {
      this._drawLivePreview(this.video, args.data);
    });
    return true;
  }

  async canResetCapabilities() {
    return false;
  }

  async resetCapabilities() {
    return window.EA('RESET_CAPABILITIES_NATIVE_CAMERA', { camera_id: this.context.id });
  }

  async applyCapability(key, value = null) {
    window.EA('APPLY_CAPABILITY_NATIVE_CAMERA', { camera_id: this.context.id, key, value });
    return null;
  }

  async getCapabilities() {
    return window.EA('GET_CAPABILITIES_NATIVE_CAMERA', { camera_id: this.context.id });
  }

  async connect({ imageDOM } = { imageDOM: false }, settings = {}, onBinded = () => {}) {
    this.video = imageDOM;
    this.settings = settings;
     window.EA('CONNECT_NATIVE_CAMERA', { camera_id: this.context.id });
     this.initPreview();
    if (typeof onBinded === 'function') {
      onBinded();
    }
    return true;
  }

  async batteryStatus() {
    return window.EA('GET_BATTERY_STATUS_NATIVE_CAMERA', { camera_id: this.context.id });
  }

  async takePicture() {
    const data = await window.EA('TAKE_PICTURE_NATIVE_CAMERA', { camera_id: this.context.id });
    return data;
  }

  async disconnect() {
    await window.EA('DISCONNECT_NATIVE_CAMERA', { camera_id: this.context.id });
  }
}

class NativeProxyBrowser {
  static async getCameras() {
    try {
      const cameras = await window.EA('LIST_NATIVE_CAMERAS');
      return cameras;
    } catch (err) {
      console.error(err);
    }
    return [];
  }
}

export const Camera = NativeProxy;
export const CameraBrowser = NativeProxyBrowser;
