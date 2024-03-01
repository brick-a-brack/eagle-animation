import {
    Camera as InternalCamera,
    CameraBrowser as InternalCameraBrowser,
    CameraProperty,
    ImageQuality,
    Option,
    watchCameras,
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
        this.canonCamera.setProperties(
            {
                [CameraProperty.ID.SaveTo]: Option.SaveTo.Host,
                //[CameraProperty.ID.SaveTo]: Option.SaveTo.Camera,
                [CameraProperty.ID.ImageQuality]: ImageQuality.ID.LargeJPEGFine,
                [CameraProperty.ID.WhiteBalance]: Option.WhiteBalance.Fluorescent,
                [CameraProperty.ID.AFMode]: Option.AFMode.ManualFocus,
            }
        );

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
                    } catch (e) { } // eslint-disable-line no-empty
                }
            }, 100);
        }

        // Fetch capabilities
        this.capabilities = [];
        for (const propertyID of Object.values(CameraProperty.ID)) {
            const p = this.canonCamera.getProperty(propertyID);
            if (!p.available) {
                continue;
            }
            try {
                //const value = p.value;
                this.capabilities.push(p);
            } catch (e) { } // eslint-disable-line no-empty
        }
    }

    async disconnect() {
        clearInterval(this.liveModeClock);
        if (this.canonCamera.getProperty(CameraProperty.ID.Evf_Mode).available) {
            this.canonCamera.stopLiveView();
            this.liveModeEnabled = false;
        }

        this.canonCamera.disconnect();
    }

    takePicture() {
        this.liveModeEnabled = false;
        return new Promise((resolve, reject) => {
            const clock = setInterval(() => {
                if (this.lastFrame !== null) {
                    clearInterval(clock);
                    resolve(Buffer.from(this.lastFrame, 'base64'));
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

    applyCapability(key, value) {
        // Focus mode
        if (key === 'focusMode' && this.capabilities.some(c => c.label === 'AFMode')) {
            this.canonCamera.setProperties({
                [CameraProperty.ID.AFMode]: value === 'continuous' ? Option.AFMode.AIFocus : Option.AFMode.ManualFocus,
            });
        }

        // TODO

        return null;
    }

    resetCapabilities() {
        // TODO
    }

    getCapabilities() {
        const AFMode = this.capabilities.find(c => c.label === 'AFMode');

        const allowedCapabilities = [
            // Focus mode
            ...(AFMode ? [
                { id: 'focusMode', type: 'SWITCH', value: AFMode.value.label === 'AFMode.ManualFocus' ? 'manual' : 'continuous' },
            ] : []),

            /*
                'focusMode',
                'focusDistance',
                'brightness',
                'contrast',
             
                'saturation',
                'sharpness',
          
                'whiteBalanceMode',
                'colorTemperature',
                'exposureMode',
                'exposureCompensation',
                'exposureTime',
                'zoom',
                'tilt',
                'pan'*/
        ];

        return allowedCapabilities;
    }
}

export const Camera = CanonCamera;
export const CameraBrowser = CanonCameraBrowser;
