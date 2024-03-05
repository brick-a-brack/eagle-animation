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
        if (!dom || !src) {
            return;
        }

        const ctx = dom.getContext('2d');
        const img = new Image();
        img.addEventListener('error', () => {
            ctx.clearRect(0, 0, dom.width, dom.height);
        });
        img.addEventListener('load', function () {
            dom.width = this.naturalWidth;
            dom.height = this.naturalHeight;
            ctx.drawImage(
                img,
                0,
                0,
                img.naturalWidth,
                img.naturalHeight,
                0,
                0,
                img.naturalWidth,
                img.naturalHeight,
            );
        }, false);
        img.src = src;
    }

    initPreview() {
        return new Promise(async (resolve) => { // eslint-disable-line no-async-promise-executor
            resolve(true);

            // TODO: ADD EA Interface for that
            window.IPC.stream('LIVE_VIEW_DATA', (evt, args) => {
                this._drawLivePreview(this.video, args.data);
            });
        });
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

    async connect({ imageDOM } = { imageDOM: false }, settings = {}) {
        this.video = imageDOM;
        this.settings = settings;
        await window.EA('CONNECT_NATIVE_CAMERA', { camera_id: this.context.id });
        return this.initPreview();
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
