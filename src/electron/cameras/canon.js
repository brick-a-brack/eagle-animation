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

        // Live mode
        //this.liveModeEnabled = false;
        //this.liveModeClock = null;
    }

    async connect(liveModeCallback = null) {
        // Save live mode callback
        this.liveModeCallback = liveModeCallback;

        // Create persistent connection
        this.canonCamera.connect(true);

        // Set properties
        this.canonCamera.setProperties(
            {
                [CameraProperty.ID.SaveTo]: Option.SaveTo.Host,
                //[CameraProperty.ID.SaveTo]: Option.SaveTo.Camera,
                [CameraProperty.ID.ImageQuality]: ImageQuality.ID.LargeJPEGFine,
                [CameraProperty.ID.WhiteBalance]: Option.WhiteBalance.Fluorescent
            }
        );

        // Catch events
        this.canonCamera.setEventHandler((eventName, event) => {
            if (event.file && [Camera.EventName.FileCreate, Camera.EventName.DownloadRequest].includes(eventName)) {
                this.lastFrame = `${event.file.downloadToString()}`;
            }
        });

        // Init live mode 
        /*if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
            const setLiveMode = () => {
                if (this.liveModeEnabled) {
                    this.canonCamera.startLiveView();
                } else {
                    this.canonCamera.stopLiveView();
                }
            }
            setLiveMode();
            this.liveModeClock = setInterval(setLiveMode, 5000);
        }*/

        // Fetch live mode picture
        if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
            this.canonCamera.startLiveView();
            setInterval(() => {
                try {
                    this.canonCamera.startLiveView();
                    const image = this.canonCamera.getLiveViewImage();
                    if (image) {
                        this.liveModeCallback(image.getDataURL());
                    }
                } catch (e) { }
            }, 100);
        }

//---------------------------TEST








//-------------------------






    }

    async disconnect() {
        if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
            this.canonCamera.stopLiveView();
        }

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
                if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
                    this.canonCamera.stopLiveView();
                }
            } catch (e1) {

            }

            try {
                this.canonCamera.takePicture();

            } catch (err) {
                clearInterval(clock);
                this.lastFrame = null;
                reject(err);
            }

            try {
                if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
                    this.canonCamera.startLiveView();
                }
            } catch (e1) {

            }
        });
    }
}

export const Camera = CanonCamera;
export const CameraBrowser = CanonCameraBrowser;
