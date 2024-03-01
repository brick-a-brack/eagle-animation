import {
    Camera as InternalCamera, CameraBrowser as InternalCameraBrowser, CameraProperty, ImageQuality, Option, watchCameras
} from '@dimensional/napi-canon-cameras';

// Allow event listing
watchCameras();

const cameraBrowser = new InternalCameraBrowser();

const MODULE_ID = 'EDSDK';

class CanonCameraBrowser {
    static async getCameras() {
        try {
            const data = await cameraBrowser.getCameras();
            return [...data].map(camera => ({
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
    }

    async connect() {
        this.canonCamera.connect(true);
        this.canonCamera.setProperties(
            {
                [CameraProperty.ID.SaveTo]: Option.SaveTo.Host,
                //[CameraProperty.ID.SaveTo]: Option.SaveTo.Camera,
                [CameraProperty.ID.ImageQuality]: ImageQuality.ID.LargeJPEGFine,
                [CameraProperty.ID.WhiteBalance]: Option.WhiteBalance.Fluorescent
            }
        );
        this.canonCamera.setEventHandler((eventName, event) => {
            if (event.file && [Camera.EventName.FileCreate, Camera.EventName.DownloadRequest].includes(eventName)) {
                this.lastFrame = `${event.file.downloadToString()}`;
            }
        });
    }

    async disconnect() {
        this.canonCamera.disconnect();
    }

    takePicture() {
        return new Promise((resolve, reject) => {
            const clock = setInterval(() => {
                if (this.lastFrame !== null) {
                    clearInterval(clock);
                    resolve(Buffer.from(this.lastFrame, 'base64'));
                    this.lastFrame = null;
                }
            }, 100)

            try {
                this.canonCamera.takePicture();

            } catch (err) {
                clearInterval(clock);
                this.lastFrame = null;
                reject(err);
            }
        });
    }
}

export const Camera = CanonCamera;
export const CameraBrowser = CanonCameraBrowser;
